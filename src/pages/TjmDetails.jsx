/**
 * @file TJM tafsilot sahifasi — asosiy orchestrator.
 * @module pages/TjmDetails
 *
 * Barcha state, effect va biznes logika shu sahifada.
 * UI esa sub-komponentlarga delegatsiya qilingan:
 *   - TjmFilterBar  — filter paneli, blok tanlash, statistika
 *   - TjmFloorGrid  — qavat/xona grid vizualizatsiyasi
 *   - HomeDetails   — xona tafsilot paneli (mavjud widget)
 */

import { useAppStore } from "@/entities/session/model";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { useProjectStructure } from "@/shared/hooks/use-project-structure";
import { formatNumber } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import GeneralError from "@/widgets/error/GeneralError";
import HomeDetails from "@/widgets/HomeDetails";
import LoadTransition from "@/widgets/loading/LoadTransition";
import LogoLoader from "@/widgets/loading/LogoLoader";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  buildDefaultFilters,
  buildFilterSearchPatch,
  buildSearch,
  cloneFilters,
  isRangeActive,
  normalizeBounds,
  normalizeFilters,
  parseFiltersFromSearch,
  serializeFilterState,
} from "./tjm-details/lib/filter-utils";
import TjmFilterBar from "./tjm-details/ui/TjmFilterBar";
import TjmFloorGrid from "./tjm-details/ui/TjmFloorGrid";
import TjmRoomsTable from "./tjm-details/ui/TjmRoomsTable";
import TjmVisualGrid from "./tjm-details/ui/TjmVisualGrid";

const VIEW_OPTIONS = [
  { value: "shaxmatka", label: "Shaxmatka" },
  { value: "shaxmatka-plus", label: "Shaxmatka+" },
  { value: "vizual", label: "Vizual" },
  { value: "jadval", label: "Jadval" },
];

const VIEW_OPTION_VALUES = VIEW_OPTIONS.map((option) => option.value);

export default function TjmDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    structure: home,
    notFound,
    error,
    loading,
    updateRoomStatus,
    save,
    deleteBlock,
  } = useProjectStructure(id);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const urlFilters = useMemo(
    () => parseFiltersFromSearch(searchParams),
    [searchParams],
  );
  const activeDetailsId = searchParams.get("details");
  const urlBlock = searchParams.get("block");
  const urlView = searchParams.get("view");

  const [selectedBlocks, setSelectedBlocks] = useState(() => {
    const val = searchParams.get("blocks");
    return val ? val.split(",").filter(Boolean) : [];
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [matchedRoomIds, setMatchedRoomIds] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [showRoomCount, setShowRoomCount] = useState(false);

  const [scale, setScale] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // blockName | null
  const workerRef = useRef(null);
  const filterRequestIdRef = useRef(0);
  const pendingToastRequestIdRef = useRef(null);
  const shouldToastOnNextResultRef = useRef(false);
  const hasActiveFiltersRef = useRef(false);
  const prevBoundsRef = useRef(null);

  const fetchCurrencyUsd = useAppStore((state) => state.fetchCurrencyUsd);
  const userRole = useAppStore((state) => state.user?.role);
  const isAdminRole = userRole === "SUPERADMIN" || userRole === "ADMIN";
  const canManageBlocks = isAdminRole && searchParams.get("manage") === "1";
  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

  // --- Memoized hisob-kitoblar ---

  const blocksEntries = useMemo(
    () => Object.entries(home?.blocks ?? {}),
    [home?.blocks],
  );

  const visibleBlocksEntries = useMemo(() => {
    if (!selectedBlocks.length) return blocksEntries;
    return blocksEntries.filter(([blockName]) => selectedBlocks.includes(blockName));
  }, [blocksEntries, selectedBlocks]);

  const roomOptions = useMemo(() => {
    const set = new Set();
    visibleBlocksEntries.forEach(([, block]) => {
      (block?.appartment ?? []).forEach((floorRooms) => {
        (floorRooms ?? []).forEach((room) => {
          if (room?.room !== undefined && room?.room !== null) {
            set.add(String(room.room));
          }
        });
      });
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [visibleBlocksEntries]);

  const blockOptions = useMemo(
    () => blocksEntries.map(([blockName]) => blockName),
    [blocksEntries],
  );

  const visibleMaxFloor = useMemo(() => {
    if (!visibleBlocksEntries.length) return Number(home?.maxFloor ?? 0);
    return Math.max(0, ...visibleBlocksEntries.map(([, block]) => block?.floor ?? 0));
  }, [visibleBlocksEntries, home?.maxFloor]);

  // Er osti qavatlar soni (masalan -1 qavatlar bor bloklar uchun)
  const visibleBasementFloors = useMemo(() => {
    if (!visibleBlocksEntries.length) return 0;
    return Math.max(
      0,
      ...visibleBlocksEntries.map(([, block]) =>
        Math.max(0, (block?.appartment?.length ?? 0) - (block?.floor ?? 0)),
      ),
    );
  }, [visibleBlocksEntries]);

  const roomDataset = useMemo(() => {
    if (!home) return [];
    const dataset = [];
    visibleBlocksEntries.forEach(([, block]) => {
      // block.floor = yuqori qavatlar soni (er osti kiritmaydi)
      const blockFloors = block?.floor ?? 0;
      (block?.appartment ?? []).forEach((floorRooms, index) => {
        const floorNum = blockFloors - index; // er osti uchun: 0, -1, -2...
        (floorRooms ?? []).forEach((room) => {
          if (!room) return;
          dataset.push({
            id: String(room.id),
            room: room.room,
            status: room.status,
            size: room.size,
            price: room.price,
            floor: floorNum,
          });
        });
      });
    });
    return dataset;
  }, [home, visibleBlocksEntries]);

  const rangeBounds = useMemo(() => {
    let sizeMin = Infinity,
      sizeMax = -Infinity;
    let priceMin = Infinity,
      priceMax = -Infinity;
    let floorMin = Infinity,
      floorMax = -Infinity;

    roomDataset.forEach((room) => {
      const size = Number(room?.size);
      if (Number.isFinite(size)) {
        sizeMin = Math.min(sizeMin, size);
        sizeMax = Math.max(sizeMax, size);
      }
      const price = Number(room?.price);
      if (Number.isFinite(price) && Number.isFinite(size)) {
        const totalPrice = price * size;
        priceMin = Math.min(priceMin, totalPrice);
        priceMax = Math.max(priceMax, totalPrice);
      }
      const floor = Number(room?.floor);
      if (Number.isFinite(floor)) {
        floorMin = Math.min(floorMin, floor);
        floorMax = Math.max(floorMax, floor);
      }
    });

    const fallbackFloorMax = Math.max(1, Number(home?.maxFloor ?? 1));
    return {
      size: normalizeBounds(sizeMin, sizeMax),
      price: normalizeBounds(priceMin, priceMax),
      floor:
        Number.isFinite(floorMin) && Number.isFinite(floorMax)
          ? normalizeBounds(floorMin, floorMax)
          : [1, fallbackFloorMax],
    };
  }, [home?.maxFloor, roomDataset]);

  const filterDefaults = useMemo(
    () => buildDefaultFilters(rangeBounds),
    [rangeBounds],
  );

  const [filters, setFilters] = useState(() => filterDefaults);
  const [draftFilters, setDraftFilters] = useState(() => filterDefaults);
  const viewMode = VIEW_OPTION_VALUES.includes(urlView) ? urlView : "shaxmatka";

  const totalStatistics = home?.totalStatistics ?? null;

  const activeStatistics = useMemo(() => {
    if (!home) return null;
    if (!selectedBlocks.length) return totalStatistics;
    return selectedBlocks.reduce(
      (acc, blockName) => {
        const s = home?.blocks?.[blockName]?.statistics ?? {};
        return {
          total: acc.total + (s.total ?? 0),
          totalEmpty: acc.totalEmpty + (s.totalEmpty ?? 0),
          totalReserved: acc.totalReserved + (s.totalReserved ?? 0),
          totalSold: acc.totalSold + (s.totalSold ?? 0),
          totalNot: acc.totalNot + (s.totalNot ?? 0),
        };
      },
      { total: 0, totalEmpty: 0, totalReserved: 0, totalSold: 0, totalNot: 0 },
    );
  }, [home, selectedBlocks, totalStatistics]);

  const resolvedStatistics = activeStatistics ??
    totalStatistics ?? {
      total: 0,
      totalEmpty: 0,
      totalReserved: 0,
      totalSold: 0,
      totalNot: 0,
    };

  const matchedRoomIdSet = useMemo(
    () => new Set(matchedRoomIds),
    [matchedRoomIds],
  );

  const statisticsCards = useMemo(
    () => [
      {
        key: "total",
        label: "Jami",
        value: resolvedStatistics.total,
        tone: "border-border/50 bg-muted/30 text-muted-foreground",
        dot: "bg-muted-foreground",
      },
      {
        key: "totalEmpty",
        label: "Bo'sh",
        value: resolvedStatistics.totalEmpty,
        tone: "border-green-200/70 bg-green-50/70 text-green-700",
        dot: "bg-green-500",
      },
      {
        key: "totalReserved",
        label: "Bron qilingan",
        value: resolvedStatistics.totalReserved,
        tone: "border-orange-200/70 bg-orange-50/70 text-orange-700",
        dot: "bg-orange-400",
      },
      {
        key: "totalSold",
        label: "Sotilgan",
        value: resolvedStatistics.totalSold,
        tone: "border-red-200/70 bg-red-50/70 text-red-700",
        dot: "bg-red-600",
      },
    ],
    [resolvedStatistics],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.rooms.length) count += 1;
    if (filters.statuses.length) count += 1;
    if (isRangeActive(filters.sizeRange, rangeBounds.size)) count += 1;
    if (isRangeActive(filters.priceRange, rangeBounds.price)) count += 1;
    if (isRangeActive(filters.floorRange, rangeBounds.floor)) count += 1;
    return count;
  }, [filters, rangeBounds]);

  const hasActiveFilters = activeFilterCount > 0;

  const blockLayouts = useMemo(
    () =>
      visibleBlocksEntries.map(([blockName, block]) => {
        const maxRooms = Math.max(
          1,
          ...(block?.appartment ?? []).map(
            (floorRooms) => floorRooms?.length ?? 0,
          ),
        );
        return {
          blockName,
          block,
          widthStyle: {
            width: `calc(${maxRooms} * var(--room-tile-size) + ${Math.max(
              maxRooms - 1,
              0,
            )} * var(--room-tile-gap))`,
          },
        };
      }),
    [visibleBlocksEntries],
  );

  const viewRooms = useMemo(() => {
    if (!home) return [];

    const maxFloor = Number(home.maxFloor ?? 0);

    return visibleBlocksEntries.flatMap(([blockName, block]) =>
      (block?.appartment ?? []).flatMap((floorRooms, index) => {
        const floorNumber = maxFloor - index;

        return (floorRooms ?? []).filter(Boolean).map((room) => ({
          ...room,
          blockName,
          floorNumber,
          totalPrice: Number(room.price ?? 0) * Number(room.size ?? 0),
        }));
      }),
    );
  }, [home, visibleBlocksEntries]);

  const filteredViewRooms = useMemo(() => {
    if (!hasActiveFilters || isFiltering) return viewRooms;

    return viewRooms.filter((room) => matchedRoomIdSet.has(String(room.id)));
  }, [hasActiveFilters, isFiltering, matchedRoomIdSet, viewRooms]);

  // --- Effects ---

  useEffect(() => {
    hasActiveFiltersRef.current = hasActiveFilters;
  }, [hasActiveFilters]);

  useEffect(() => {
    if (!id) return;
    fetchCurrencyUsd?.();
  }, [id, fetchCurrencyUsd]);

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);

  useEffect(() => {
    if (!selectedBlocks.length) return;
    const valid = selectedBlocks.filter((b) => blockOptions.includes(b));
    if (valid.length !== selectedBlocks.length) setSelectedBlocks(valid);
  }, [blockOptions, selectedBlocks]);

  useEffect(() => {
    if (!urlBlocks.length) return;
    const valid = urlBlocks.filter((b) => blockOptions.includes(b));
    const cur = JSON.stringify([...selectedBlocks].sort());
    const nxt = JSON.stringify([...valid].sort());
    if (cur !== nxt) setSelectedBlocks(valid);
  }, [blockOptions, urlBlocks]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (filterOpen) setDraftFilters(cloneFilters(filters));
  }, [filterOpen, filters]);

  useEffect(() => {
    if (!urlFilters) {
      const defaults = buildDefaultFilters(rangeBounds);
      if (serializeFilterState(filters) !== serializeFilterState(defaults)) {
        setFilters(defaults);
        setDraftFilters(defaults);
      }
      return;
    }
    const normalized = normalizeFilters(
      urlFilters,
      rangeBounds,
      prevBoundsRef.current,
    );
    if (serializeFilterState(filters) === serializeFilterState(normalized))
      return;
    setFilters(normalized);
    setDraftFilters(normalized);
  }, [filters, rangeBounds, urlFilters]);

  useEffect(() => {
    const allowedRooms = new Set(roomOptions.map(String));
    setFilters((prev) => ({
      ...prev,
      rooms: (prev.rooms ?? []).filter((room) =>
        allowedRooms.has(String(room)),
      ),
    }));
    setDraftFilters((prev) => ({
      ...prev,
      rooms: (prev.rooms ?? []).filter((room) =>
        allowedRooms.has(String(room)),
      ),
    }));
  }, [roomOptions]);

  useEffect(() => {
    const prevBounds = prevBoundsRef.current;
    prevBoundsRef.current = rangeBounds;
    setFilters((prev) => normalizeFilters(prev, rangeBounds, prevBounds));
    setDraftFilters((prev) => normalizeFilters(prev, rangeBounds, prevBounds));
  }, [rangeBounds]);

  // Web Worker setup
  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/tjm-filter.worker.js", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    setWorkerReady(true);

    worker.onmessage = (event) => {
      const payload = event?.data;
      if (!payload || payload.type !== "result") return;
      if (payload.requestId !== filterRequestIdRef.current) return;
      setMatchedRoomIds(
        Array.isArray(payload.matchedIds) ? payload.matchedIds : [],
      );
      setIsFiltering(false);

      if (payload.requestId === pendingToastRequestIdRef.current) {
        pendingToastRequestIdRef.current = null;
        shouldToastOnNextResultRef.current = false;
        if (
          hasActiveFiltersRef.current &&
          Array.isArray(payload.matchedIds) &&
          payload.matchedIds.length === 0
        ) {
          toast.info("Filter bo'yicha natija topilmadi", {
            id: "tjm-filter-empty",
            duration: 2500,
          });
        }
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!workerReady || !workerRef.current) return;
    workerRef.current.postMessage({ type: "dataset", rooms: roomDataset });
  }, [roomDataset, workerReady]);

  useEffect(() => {
    if (!workerReady || !workerRef.current) return;
    const requestId = ++filterRequestIdRef.current;
    setIsFiltering(true);
    if (shouldToastOnNextResultRef.current) {
      pendingToastRequestIdRef.current = requestId;
    }
    workerRef.current.postMessage({ type: "filter", requestId, filters });
  }, [filters, roomDataset, workerReady]);

  // --- Handlers ---
  const handleZoom = (delta) => {
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 0.5), 2);
      return Math.round(next * 10) / 10;
    });
  };

  const onWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const updateSearch = useCallback(
    (patch, options = {}) => {
      navigate(
        {
          pathname: location.pathname,
          search: buildSearch(location.search, patch),
        },
        { replace: options.replace ?? false },
      );
    },
    [location.pathname, location.search, navigate],
  );

  const handleActiveHome = useCallback(
    (detailsId) => {
      if (String(detailsId).startsWith("draft:")) {
        toast.info("Draft xonadon hali saqlanmagan");
        return;
      }

      updateSearch({ details: detailsId });
    },
    [updateSearch],
  );

  const handleBlocksChange = useCallback(
    (blocks) => {
      setSelectedBlocks(blocks);
      updateSearch(
        { blocks: blocks.length ? blocks.join(",") : null },
        { replace: true },
      );
    },
    [updateSearch],
  );

  const handleViewModeChange = useCallback(
    (value) => {
      if (!VIEW_OPTION_VALUES.includes(value)) return;
      updateSearch(
        { view: value === "shaxmatka" ? null : value },
        { replace: true },
      );
    },
    [updateSearch],
  );

  const resetFilters = useCallback(() => {
    shouldToastOnNextResultRef.current = false;
    pendingToastRequestIdRef.current = null;
    const defaults = buildDefaultFilters(rangeBounds);
    setDraftFilters(defaults);
    setFilters(defaults);
    updateSearch(buildFilterSearchPatch(defaults, rangeBounds), {
      replace: true,
    });
  }, [rangeBounds, updateSearch]);

  const applyFilters = useCallback(() => {
    shouldToastOnNextResultRef.current = true;
    const nextFilters = cloneFilters(draftFilters);
    setFilters(nextFilters);
    updateSearch(buildFilterSearchPatch(nextFilters, rangeBounds), {
      replace: true,
    });
    setFilterOpen(false);
  }, [draftFilters, rangeBounds, updateSearch]);

  const handleEditBlock = useCallback(
    (blockName) => {
      navigate(`/tjm/${id}/add-block?manage=1&edit=${encodeURIComponent(blockName)}`);
    },
    [id, navigate],
  );

  const handleDeleteBlock = useCallback((blockName) => {
    setDeleteConfirm(blockName);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm || !home) return;
    const blockName = deleteConfirm;
    setDeleteConfirm(null);

    const loadingToast = toast.loading(`"${blockName}" o'chirilmoqda...`);
    const result = await deleteBlock(blockName);
    toast.dismiss(loadingToast);

    if (result?.ok) {
      toast.success(`"${blockName}" muvaffaqiyatli o'chirildi`);
      handleBlockChange("all");
    } else {
      toast.error(`O'chirishda xatolik: server javob bermadi`);
    }
  }, [deleteConfirm, home, deleteBlock, handleBlockChange]);

  // --- Render ---

  return (
    <LoadTransition
      loading={loading}
      className="h-full"
      loader={
        <LogoLoader
          title="TJM yuklanmoqda"
          description="Shaxmatka va uylar holati tayyorlanmoqda."
        />
      }
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error ? (
        <GeneralError />
      ) : notFound ? (
        <div className="animate-fade-in flex h-full w-full items-center justify-center">
          <div className="tex-center flex w-full max-w-sm flex-col items-center">
            <h3 className="mb-3 text-2xl font-medium">404</h3>
            <p className="text-muted-foreground mb-5">
              Bunday turar joy majmuosi mavjud emas!
            </p>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              to="/tjm"
            >
              <Search /> Mavjud turar joylar
            </Link>
          </div>
        </div>
      ) : !home ? null : (
        <section className="animate-fade-in flex h-full min-h-0 w-full flex-col overflow-hidden relative">
           {/* Sophisticated Background Pattern */}
           <div className="absolute inset-0 z-[-1] pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <section className="flex h-full min-h-0 w-full flex-col relative z-10">
            {/* Filter paneli sarlavhasi + statistika */}
            <TjmFilterBar
              filterOpen={filterOpen}
              onToggleFilter={() => setFilterOpen((prev) => !prev)}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              selectedBlocks={selectedBlocks}
              blockOptions={blockOptions}
              onBlocksChange={handleBlocksChange}
              statisticsCards={statisticsCards}
              draftFilters={draftFilters}
              onDraftFiltersChange={setDraftFilters}
              rangeBounds={rangeBounds}
              roomOptions={roomOptions}
              onReset={resetFilters}
              onApply={applyFilters}
              showRoomCount={showRoomCount}
              onShowRoomCountChange={setShowRoomCount}
              viewMode={viewMode}
              viewOptions={VIEW_OPTIONS}
              onViewModeChange={handleViewModeChange}
              onBack={() => navigate(-1)}
              onOpenAddBlock={canManageBlocks ? () => navigate(`/tjm/${id}/add-block?manage=1`) : null}
            />

            {/* Asosiy kontent: shaxmatka + xona tafsiloti */}
            <div className="flex min-h-0 w-full flex-1 overflow-hidden">
              {viewMode === "vizual" ? (
                <TjmVisualGrid
                  rooms={filteredViewRooms}
                  activeDetailsId={activeDetailsId}
                  onRoomClick={handleActiveHome}
                  showRoomCount={showRoomCount}
                />
              ) : viewMode === "jadval" ? (
                <TjmRoomsTable
                  rooms={filteredViewRooms}
                  activeDetailsId={activeDetailsId}
                  onRoomClick={handleActiveHome}
                />
              ) : (
                <div className="relative flex flex-1 flex-col overflow-hidden bg-background/50">
                  <TjmFloorGrid
                    blockLayouts={blockLayouts}
                    maxFloor={home.maxFloor ?? 0}
                    activeDetailsId={activeDetailsId}
                    hasActiveFilters={hasActiveFilters}
                    isFiltering={isFiltering}
                    matchedRoomIdSet={matchedRoomIdSet}
                    onRoomClick={handleActiveHome}
                    showRoomCount={showRoomCount}
                    scale={scale}
                    onEditBlock={canManageBlocks ? handleEditBlock : null}
                    onDeleteBlock={canManageBlocks ? handleDeleteBlock : null}
                    variant={
                      viewMode === "shaxmatka-plus" ? "expanded" : "default"
                    }
                  />
                </div>
              )}

              <HomeDetails onRoomStatusUpdated={updateRoomStatus} />
            </div>
          </section>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-border/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-center size-12 mx-auto rounded-full bg-destructive/10 border border-destructive/20">
              <svg className="size-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-center text-base font-bold text-foreground mb-1">Blokni o'chirish</h3>
            <p className="text-center text-sm text-muted-foreground mb-5">
              <span className="font-semibold text-foreground">"{deleteConfirm}"</span> bloki va undagi barcha xonadonlar o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeleteConfirm(null)}
              >
                Bekor qilish
              </Button>
              <Button
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white border-none"
                onClick={confirmDelete}
              >
                O'chirish
              </Button>
            </div>
          </div>
        </div>
      )}
    </LoadTransition>
  );
}
