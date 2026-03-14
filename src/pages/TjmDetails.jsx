import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { useProjectStructure } from "@/shared/hooks/use-project-structure";
import { cn, formatNumber } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Slider } from "@/shared/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import GeneralError from "@/widgets/error/GeneralError";
import HomeDetails from "@/widgets/HomeDetails";
import LoadTransition from "@/widgets/loading/LoadTransition";
import LogoLoader from "@/widgets/loading/LogoLoader";
import {
  ArrowLeft,
  Banknote,
  Building2,
  Filter,
  Ruler,
  Search,
  Tag,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const STATUS_CLASS = {
  SOLD: "bg-red-600",
  RESERVED: "bg-orange-400",
  EMPTY: "bg-green-500",
  NOT: "bg-slate-400",
};

const STATUS_LABEL = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};

function normalizeBounds(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [0, 0];
  }

  return [Math.min(min, max), Math.max(min, max)];
}

function clampRange(range, bounds) {
  const minBound = Math.min(bounds[0], bounds[1]);
  const maxBound = Math.max(bounds[0], bounds[1]);
  const rawStart = Array.isArray(range) ? range[0] : minBound;
  const rawEnd = Array.isArray(range) ? range[1] : maxBound;
  const start = Number.isFinite(rawStart) ? rawStart : minBound;
  const end = Number.isFinite(rawEnd) ? rawEnd : maxBound;
  const nextStart = Math.max(minBound, Math.min(start, maxBound));
  const nextEnd = Math.max(minBound, Math.min(end, maxBound));

  return nextStart <= nextEnd ? [nextStart, nextEnd] : [nextEnd, nextStart];
}

function isRangeAtBounds(range, bounds) {
  if (!Array.isArray(range)) return false;
  return range[0] === bounds[0] && range[1] === bounds[1];
}

function isRangeActive(range, bounds) {
  if (!Array.isArray(range)) return false;
  return range[0] > bounds[0] || range[1] < bounds[1];
}

function buildDefaultFilters(bounds) {
  return {
    rooms: [],
    statuses: [],
    sizeRange: [...bounds.size],
    priceRange: [...bounds.price],
    floorRange: [...bounds.floor],
  };
}

function cloneFilters(filters) {
  if (!filters) return null;
  return {
    rooms: [...(filters.rooms ?? [])],
    statuses: [...(filters.statuses ?? [])],
    sizeRange: [...(filters.sizeRange ?? [0, 0])],
    priceRange: [...(filters.priceRange ?? [0, 0])],
    floorRange: [...(filters.floorRange ?? [0, 0])],
  };
}

function normalizeFilters(filters, bounds, prevBounds) {
  if (!filters) {
    return buildDefaultFilters(bounds);
  }

  const next = {
    rooms: Array.isArray(filters.rooms) ? filters.rooms : [],
    statuses: Array.isArray(filters.statuses) ? filters.statuses : [],
    sizeRange: clampRange(filters.sizeRange, bounds.size),
    priceRange: clampRange(filters.priceRange, bounds.price),
    floorRange: clampRange(filters.floorRange, bounds.floor),
  };

  if (prevBounds) {
    if (isRangeAtBounds(filters.sizeRange, prevBounds.size)) {
      next.sizeRange = [...bounds.size];
    }
    if (isRangeAtBounds(filters.priceRange, prevBounds.price)) {
      next.priceRange = [...bounds.price];
    }
    if (isRangeAtBounds(filters.floorRange, prevBounds.floor)) {
      next.floorRange = [...bounds.floor];
    }
  }

  return next;
}

const FILTER_QUERY_KEYS = {
  rooms: "f_rooms",
  statuses: "f_status",
  size: "f_size",
  price: "f_price",
  floor: "f_floor",
};

function parseListParam(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseRangeParam(value) {
  if (!value) return undefined;
  const [min, max] = value.split(",");
  if (min === undefined || max === undefined) return undefined;
  const minValue = Number(min);
  const maxValue = Number(max);
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return undefined;
  }
  return [minValue, maxValue];
}

function parseFiltersFromSearch(searchParams) {
  const roomsRaw = searchParams.get(FILTER_QUERY_KEYS.rooms);
  const statusesRaw = searchParams.get(FILTER_QUERY_KEYS.statuses);
  const sizeRaw = searchParams.get(FILTER_QUERY_KEYS.size);
  const priceRaw = searchParams.get(FILTER_QUERY_KEYS.price);
  const floorRaw = searchParams.get(FILTER_QUERY_KEYS.floor);
  const hasFilters = !!(
    roomsRaw ||
    statusesRaw ||
    sizeRaw ||
    priceRaw ||
    floorRaw
  );

  if (!hasFilters) return null;

  return {
    rooms: parseListParam(roomsRaw),
    statuses: parseListParam(statusesRaw),
    sizeRange: parseRangeParam(sizeRaw),
    priceRange: parseRangeParam(priceRaw),
    floorRange: parseRangeParam(floorRaw),
  };
}

function formatRangeParam(range, decimals) {
  if (!Array.isArray(range)) return null;
  const min = Number(range[0]);
  const max = Number(range[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (decimals !== undefined) {
    return `${min.toFixed(decimals)},${max.toFixed(decimals)}`;
  }
  return `${Math.round(min)},${Math.round(max)}`;
}

function buildFilterSearchPatch(filters, bounds) {
  return {
    [FILTER_QUERY_KEYS.rooms]:
      filters.rooms?.length ? filters.rooms.join(",") : null,
    [FILTER_QUERY_KEYS.statuses]:
      filters.statuses?.length ? filters.statuses.join(",") : null,
    [FILTER_QUERY_KEYS.size]: isRangeActive(filters.sizeRange, bounds.size)
      ? formatRangeParam(filters.sizeRange, 2)
      : null,
    [FILTER_QUERY_KEYS.price]: isRangeActive(filters.priceRange, bounds.price)
      ? formatRangeParam(filters.priceRange)
      : null,
    [FILTER_QUERY_KEYS.floor]: isRangeActive(filters.floorRange, bounds.floor)
      ? formatRangeParam(filters.floorRange)
      : null,
  };
}

function serializeFilterState(filters) {
  const rooms = [...(filters.rooms ?? [])].sort();
  const statuses = [...(filters.statuses ?? [])].sort();
  return JSON.stringify({
    rooms,
    statuses,
    sizeRange: filters.sizeRange ?? [],
    priceRange: filters.priceRange ?? [],
    floorRange: filters.floorRange ?? [],
  });
}

function buildSearch(search, patch) {
  const params = new URLSearchParams(search);

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  const next = params.toString();
  return next ? `?${next}` : "";
}

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
  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });
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

    return Array.from(set, (value) => value).sort(
      (a, b) => Number(a) - Number(b),
    );
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
    let sizeMin = Infinity;
    let sizeMax = -Infinity;
    let priceMin = Infinity;
    let priceMax = -Infinity;
    let floorMin = Infinity;
    let floorMax = -Infinity;

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
  const prevBoundsRef = useRef(rangeBounds);
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
  const draftSizeRange = draftFilters?.sizeRange ?? rangeBounds.size;
  const draftPriceRange = draftFilters?.priceRange ?? rangeBounds.price;
  const draftFloorRange = draftFilters?.floorRange ?? rangeBounds.floor;
  const matchedRoomIdSet = useMemo(
    () => new Set(matchedRoomIds),
    [matchedRoomIds],
  );
  const statisticsCards = useMemo(() => {
    return [
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
    ];
  }, [resolvedStatistics]);
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
  useEffect(() => {
    hasActiveFiltersRef.current = hasActiveFilters;
  }, [hasActiveFilters]);
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

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);
  useEffect(() => {
    if (selectedBlock === "all") return;
    if (!blockOptions.includes(selectedBlock)) {
      setSelectedBlock("all");
    }
  }, [blockOptions, selectedBlock]);
  useEffect(() => {
    if (!urlBlock) return;
    const next = blockOptions.includes(urlBlock) ? urlBlock : "all";
    if (selectedBlock !== next) {
      setSelectedBlock(next);
    }
  }, [blockOptions, selectedBlock, urlBlock]);
  useEffect(() => {
    if (filterOpen) {
      setDraftFilters(cloneFilters(filters));
    }
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
    if (serializeFilterState(filters) === serializeFilterState(normalized)) {
      return;
    }
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
  useEffect(() => {
    const worker = new Worker(
      new URL("../../workers/tjm-filter.worker.js", import.meta.url),
      { type: "module" },
    );

    workerRef.current = worker;
    setWorkerReady(true);

    worker.onmessage = (event) => {
      const payload = event?.data;
      if (!payload || payload.type !== "result") return;
      if (payload.requestId !== filterRequestIdRef.current) return;
      setMatchedRoomIds(Array.isArray(payload.matchedIds) ? payload.matchedIds : []);
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
    workerRef.current.postMessage({
      type: "dataset",
      rooms: roomDataset,
    });
  }, [roomDataset, workerReady]);
  useEffect(() => {
    if (!workerReady || !workerRef.current) return;
    const requestId = ++filterRequestIdRef.current;
    setIsFiltering(true);
    if (shouldToastOnNextResultRef.current) {
      pendingToastRequestIdRef.current = requestId;
    }
    workerRef.current.postMessage({
      type: "filter",
      requestId,
      filters,
    });
  }, [filters, roomDataset, workerReady]);

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
      updateSearch({ block: value === "all" ? null : value }, { replace: true });
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
            <div className="bg-background/95 flex w-full flex-col border-b backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5 lg:px-6">
                <Link
                  className={buttonVariants({
                    size: "sm",
                    variant: "secondary",
                  })}
                  to="/tjm"
                >
                  <ArrowLeft />
                  Orqaga
                </Link>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-12">
                    <div className="ml-auto flex flex-wrap justify-end gap-2">
                      {Object.entries(STATUS_CLASS).map(([key, value]) => (
                        <Badge
                          key={key}
                          className={`text-primary-foreground ${value}`}
                        >
                          {STATUS_LABEL[key]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-border/60 border-t">
              <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:px-6">
                <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
                  <Button
                    type="button"
                    variant={hasActiveFilters ? "default" : "outline"}
                    className="justify-start gap-2 sm:w-auto"
                    aria-expanded={filterOpen}
                    onClick={() => setFilterOpen((prev) => !prev)}
                  >
                    <Filter className="size-4" />
                    Filter
                    {hasActiveFilters && (
                      <span className="bg-primary text-primary-foreground ml-auto inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold sm:ml-1">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>

                  <Select
                    value={selectedBlock}
                    onValueChange={handleBlockChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      {blockOptions.map((blockName) => (
                        <SelectItem key={blockName} value={blockName}>
                          {blockName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!!statisticsCards.length && (
                  <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {statisticsCards.map((stat) => (
                      <div
                        key={stat.key}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs sm:text-sm",
                          stat.tone,
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <span className={cn("size-2 rounded-full", stat.dot)} />
                          <span className="truncate">{stat.label}</span>
                        </span>
                        <span className="font-mono text-sm font-semibold">
                          {formatNumber(stat.value ?? 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity,transform] duration-500 ease-in-out",
                  filterOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "pointer-events-none grid-rows-[0fr] opacity-0 -translate-y-2",
                )}
              >
                <div className="min-h-0 overflow-hidden px-4 pb-4 sm:px-5 lg:px-6">
                  <div className="rounded-xl bg-background/95 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Filtrlash</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterOpen(false)}
                      >
                        Yopish
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-col gap-4">
                      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
                        <div className="flex flex-col gap-2">
                          <Label className="flex items-center gap-2">
                            <UsersRound className="size-4 text-muted-foreground" />
                            Xonalar soni
                          </Label>
                          <ToggleGroup
                            type="multiple"
                            variant="outline"
                            spacing={0}
                            value={draftFilters.rooms}
                            onValueChange={(value) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                rooms: value,
                              }))
                            }
                            className="grid w-full gap-px overflow-hidden rounded-md bg-border/60 p-px [grid-template-columns:repeat(auto-fit,minmax(92px,1fr))]"
                          >
                            {roomOptions.map((room) => (
                              <ToggleGroupItem
                                key={room}
                                value={room}
                                className="w-full justify-center gap-2 rounded-none border-0 bg-background text-xs shadow-none data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:font-semibold data-[state=on]:ring-1 data-[state=on]:ring-primary/40 data-[state=on]:ring-inset"
                              >
                                {room} xona
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label className="flex items-center gap-2">
                            <Tag className="size-4 text-muted-foreground" />
                            Status
                          </Label>
                          <ToggleGroup
                            type="multiple"
                            variant="outline"
                            spacing={0}
                            value={draftFilters.statuses}
                            onValueChange={(value) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                statuses: value,
                              }))
                            }
                            className="grid w-full gap-px overflow-hidden rounded-md bg-border/60 p-px [grid-template-columns:repeat(2,minmax(140px,1fr))] sm:[grid-template-columns:repeat(4,minmax(140px,1fr))]"
                          >
                            {Object.entries(STATUS_LABEL).map(
                              ([value, label]) => (
                                <ToggleGroupItem
                                  key={value}
                                  value={value}
                                  className="w-full justify-center gap-2 rounded-none border-0 bg-background text-xs shadow-none data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:font-semibold data-[state=on]:ring-1 data-[state=on]:ring-primary/40 data-[state=on]:ring-inset"
                                >
                                  <span
                                    className={cn(
                                      "size-2 rounded-full",
                                      STATUS_CLASS[value],
                                    )}
                                  />
                                  {label}
                                </ToggleGroupItem>
                              ),
                            )}
                          </ToggleGroup>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label className="flex items-center gap-2">
                            <Ruler className="size-4 text-muted-foreground" />
                            O'lchami (m²)
                          </Label>
                          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatNumber(draftSizeRange[0])} m²</span>
                              <span>{formatNumber(draftSizeRange[1])} m²</span>
                            </div>
                            <Slider
                              min={rangeBounds.size[0]}
                              max={rangeBounds.size[1]}
                              step={0.01}
                              value={draftSizeRange}
                              onValueChange={(value) =>
                                setDraftFilters((prev) => ({
                                  ...prev,
                                  sizeRange: value,
                                }))
                              }
                              disabled={
                                rangeBounds.size[0] === rangeBounds.size[1]
                              }
                              className="mt-3"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label className="flex items-center gap-2">
                            <Banknote className="size-4 text-muted-foreground" />
                            Uy narxi (umumiy)
                          </Label>
                          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatNumber(draftPriceRange[0])} so'm</span>
                              <span>{formatNumber(draftPriceRange[1])} so'm</span>
                            </div>
                            <Slider
                              min={rangeBounds.price[0]}
                              max={rangeBounds.price[1]}
                              step={1000}
                              value={draftPriceRange}
                              onValueChange={(value) =>
                                setDraftFilters((prev) => ({
                                  ...prev,
                                  priceRange: value,
                                }))
                              }
                              disabled={
                                rangeBounds.price[0] === rangeBounds.price[1]
                              }
                              className="mt-3"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="flex items-center gap-2">
                          <Building2 className="size-4 text-muted-foreground" />
                          Qavat
                        </Label>
                        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{draftFloorRange[0]}-qavat</span>
                            <span>{draftFloorRange[1]}-qavat</span>
                          </div>
                          <Slider
                            min={rangeBounds.floor[0]}
                            max={rangeBounds.floor[1]}
                            step={1}
                            value={draftFloorRange}
                            onValueChange={(value) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                floorRange: value.map((val) => Math.round(val)),
                              }))
                            }
                            disabled={
                              rangeBounds.floor[0] === rangeBounds.floor[1]
                            }
                            className="mt-3"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={resetFilters}
                        >
                          Tozalash
                        </Button>
                        <Button type="button" onClick={applyFilters}>
                          Filterlash
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className="flex min-h-0 w-full flex-1 overflow-hidden">
              {!blockLayouts.length ? (
                <div className="flex flex-1 items-center justify-center px-6 py-12">
                  <div className="max-w-sm text-center">
                    <h3 className="text-lg font-semibold">Uylar topilmadi</h3>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Ushbu bloklar uchun ko‘rinadigan uy ma’lumotlari hozircha
                      mavjud emas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="no-scrollbar min-h-0 flex-1 overflow-auto pb-4 [--room-tile-gap:0.5rem] [--room-tile-size:2rem] sm:[--room-tile-size:2.25rem]">
                  <div className="bg-background sticky top-0 z-30 mb-6 flex w-max min-w-full items-start border-b py-4">
                    <div className="w-10 shrink-0 sm:w-11" />
                    <div className="flex gap-8 px-2 sm:gap-12 sm:px-3 lg:gap-16 xl:gap-20">
                      {blockLayouts.map(({ blockName, widthStyle }) => (
                        <div
                          key={blockName}
                          style={widthStyle}
                          className="text-muted-foreground min-w-0 text-xs"
                        >
                          <h3 className="truncate font-medium">{blockName}</h3>
                        </div>
                      ))}
                    </div>
                    <div className="w-10 shrink-0 sm:w-11" />
                  </div>
                  <div className="flex w-max min-w-full flex-col">
                    {Array.from(
                      { length: home.maxFloor ?? 0 },
                      (_, index) => index + 1,
                    ).map((_, index, arr) => {
                      const floorNum = arr.length - index;
                      const rowHasActive = blockLayouts.some(({ block }) =>
                        (block?.appartment?.[index] ?? []).some(
                          (h) => String(h.id) === activeDetailsId,
                        ),
                      );

                      return (
                        <div
                          key={index}
                          className={cn(
                            "group relative flex h-10 w-full cursor-pointer transition-colors sm:h-11",
                            rowHasActive ? "bg-accent/70" : "hover:bg-accent",
                          )}
                        >
                          <div
                            className={cn(
                              "text-muted-foreground bg-background sticky left-0 z-20 flex w-10 items-center justify-center text-center text-xs sm:w-11",
                              rowHasActive && "bg-primary",
                              !rowHasActive && "group-hover:bg-primary",
                            )}
                          >
                            <span
                              className={cn(
                                "transition-transform",
                                rowHasActive
                                  ? "text-primary-foreground scale-150 font-bold"
                                  : "group-hover:text-primary-foreground group-hover:scale-150 group-hover:font-bold",
                              )}
                            >
                              {floorNum}
                            </span>
                          </div>

                          <div className="flex gap-8 px-2 sm:gap-12 sm:px-3 lg:gap-16 xl:gap-20">
                            {blockLayouts.map(
                              ({ blockName, block, widthStyle }) =>
                                floorNum <= (block?.floor ?? 0) ? (
                                  <div
                                    key={blockName}
                                    style={widthStyle}
                                    className="flex gap-2"
                                  >
                                    {(block?.appartment?.[index] ?? []).map(
                                      (h) => {
                                        const isActive =
                                          String(h.id) === activeDetailsId;
                                        const isFilteredOut =
                                          hasActiveFilters &&
                                          !isFiltering &&
                                          !matchedRoomIdSet.has(String(h.id));
                                        return (
                                          <Tooltip key={h.id}>
                                            <TooltipTrigger
                                              className="focus-within:outline-none"
                                              tabIndex={-1}
                                            >
                                              <div
                                                onClick={() =>
                                                  handleActiveHome(h.id)
                                                }
                                                className={cn(
                                                  "relative flex size-8 shrink-0 items-center justify-center rounded-md text-sm leading-none font-bold text-white transition-[opacity,transform] duration-300 sm:size-9",
                                                  STATUS_CLASS[h.status] ?? "",
                                                  isActive &&
                                                    "ring-destructive ring-offset-background z-10 shadow-[0_10px_24px_-14px_rgba(239,68,68,0.95)] ring-2 ring-offset-2",
                                                  isFilteredOut &&
                                                    "opacity-30 scale-[0.96]",
                                                )}
                                              >
                                                {h.room}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="pointer-events-none">
                                              <div className="flex flex-col">
                                                <div className="flex gap-1">
                                                  <h4 className="font-bold">
                                                    Uy raqami:
                                                  </h4>
                                                  <span className="font-mono">
                                                    #{h.houseNumber}
                                                  </span>
                                                </div>
                                                <div className="flex gap-1">
                                                  <h4 className="font-bold">
                                                    Narxi:
                                                  </h4>
                                                  <span className="font-mono">
                                                    {formatNumber(
                                                      h.price * h.size,
                                                    )}
                                                  </span>
                                                </div>
                                                <div className="flex gap-1">
                                                  <h4 className="font-bold">
                                                    m<sup>2</sup>:
                                                  </h4>
                                                  <span className="font-mono">
                                                    {formatNumber(h.price)}
                                                  </span>
                                                </div>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      },
                                    )}
                                  </div>
                                ) : null,
                            )}
                          </div>

                          <div
                            className={cn(
                              "text-muted-foreground bg-background sticky right-0 z-20 ml-auto flex w-10 shrink-0 items-center justify-center text-center text-xs sm:w-11",
                              rowHasActive && "bg-primary",
                              !rowHasActive && "group-hover:bg-primary",
                            )}
                          >
                            <span
                              className={cn(
                                "transition-transform",
                                rowHasActive
                                  ? "text-primary-foreground scale-150 font-bold"
                                  : "group-hover:text-primary-foreground group-hover:scale-150 group-hover:font-bold",
                              )}
                            >
                              {floorNum}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <HomeDetails onRoomStatusUpdated={updateRoomStatus} />
            </div>
          </section>
        </section>
      )}
    </LoadTransition>
  );
}
