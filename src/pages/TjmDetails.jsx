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
import { buttonVariants } from "@/shared/ui/button";
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

  const [selectedBlock, setSelectedBlock] = useState(() =>
    urlBlock ? urlBlock : "all",
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [matchedRoomIds, setMatchedRoomIds] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);

  const workerRef = useRef(null);
  const filterRequestIdRef = useRef(0);
  const pendingToastRequestIdRef = useRef(null);
  const shouldToastOnNextResultRef = useRef(false);
  const hasActiveFiltersRef = useRef(false);
  const prevBoundsRef = useRef(null);

  const fetchCurrencyUsd = useAppStore((state) => state.fetchCurrencyUsd);
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
    if (selectedBlock === "all") return blocksEntries;
    return blocksEntries.filter(([blockName]) => blockName === selectedBlock);
  }, [blocksEntries, selectedBlock]);

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

  const roomDataset = useMemo(() => {
    if (!home) return [];
    const maxFloor = Number(home.maxFloor ?? 0);
    const dataset = [];
    visibleBlocksEntries.forEach(([, block]) => {
      (block?.appartment ?? []).forEach((floorRooms, index) => {
        const floorNum = maxFloor - index;
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
    let sizeMin = Infinity, sizeMax = -Infinity;
    let priceMin = Infinity, priceMax = -Infinity;
    let floorMin = Infinity, floorMax = -Infinity;

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

  const totalStatistics = home?.totalStatistics ?? null;

  const activeStatistics = useMemo(() => {
    if (!home) return null;
    if (selectedBlock === "all") return totalStatistics;
    return home?.blocks?.[selectedBlock]?.statistics ?? null;
  }, [home, selectedBlock, totalStatistics]);

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

  const statisticsCards = useMemo(() => [
    {
      key: "total",
      label: "Jami",
      value: resolvedStatistics.total,
      tone: "border-slate-200/70 bg-slate-50/70 text-slate-700",
      dot: "bg-slate-500",
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
  ], [resolvedStatistics]);

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
    if (selectedBlock === "all") return;
    if (!blockOptions.includes(selectedBlock)) setSelectedBlock("all");
  }, [blockOptions, selectedBlock]);

  useEffect(() => {
    if (!urlBlock) return;
    const next = blockOptions.includes(urlBlock) ? urlBlock : "all";
    if (selectedBlock !== next) setSelectedBlock(next);
  }, [blockOptions, selectedBlock, urlBlock]);

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
    if (serializeFilterState(filters) === serializeFilterState(normalized)) return;
    setFilters(normalized);
    setDraftFilters(normalized);
  }, [filters, rangeBounds, urlFilters]);

  useEffect(() => {
    const allowedRooms = new Set(roomOptions.map(String));
    setFilters((prev) => ({
      ...prev,
      rooms: (prev.rooms ?? []).filter((room) => allowedRooms.has(String(room))),
    }));
    setDraftFilters((prev) => ({
      ...prev,
      rooms: (prev.rooms ?? []).filter((room) => allowedRooms.has(String(room))),
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

  // --- Handlerlar ---

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

  useEffect(() => {
    if (!searchParams.has("view")) return;
    updateSearch({ view: null }, { replace: true });
  }, [searchParams, updateSearch]);

  const handleActiveHome = useCallback(
    (detailsId) => updateSearch({ details: detailsId }),
    [updateSearch],
  );

  const handleBlockChange = useCallback(
    (value) => {
      setSelectedBlock(value);
      updateSearch(
        { block: value === "all" ? null : value },
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
        <section className="animate-fade-in flex h-full min-h-0 w-full flex-col overflow-hidden">
          <section className="flex h-full min-h-0 w-full flex-col">
            {/* Filter paneli sarlavhasi + statistika */}
            <TjmFilterBar
              filterOpen={filterOpen}
              onToggleFilter={() => setFilterOpen((prev) => !prev)}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              selectedBlock={selectedBlock}
              blockOptions={blockOptions}
              onBlockChange={handleBlockChange}
              statisticsCards={statisticsCards}
              draftFilters={draftFilters}
              onDraftFiltersChange={setDraftFilters}
              rangeBounds={rangeBounds}
              roomOptions={roomOptions}
              onReset={resetFilters}
              onApply={applyFilters}
            />

            {/* Asosiy kontent: shaxmatka + xona tafsiloti */}
            <div className="flex min-h-0 w-full flex-1 overflow-hidden">
              <TjmFloorGrid
                blockLayouts={blockLayouts}
                maxFloor={home.maxFloor ?? 0}
                activeDetailsId={activeDetailsId}
                hasActiveFilters={hasActiveFilters}
                isFiltering={isFiltering}
                matchedRoomIdSet={matchedRoomIdSet}
                onRoomClick={handleActiveHome}
              />

              <HomeDetails onRoomStatusUpdated={updateRoomStatus} />
            </div>
          </section>
        </section>
      )}
    </LoadTransition>
  );
}
