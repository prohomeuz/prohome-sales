import { ArrowLeft, Check, Copy, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants, Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import GeneralError from "@/widgets/error/GeneralError";
import HomeDetails from "@/widgets/HomeDetails";
import LoadTransition from "@/widgets/loading/LoadTransition";
import LogoLoader from "@/widgets/loading/LogoLoader";
import { useProjectStructure } from "@/shared/hooks/use-project-structure";
import { cn, formatNumber } from "@/shared/lib/utils";
import HomeDetails from "@/widgets/HomeDetails";
import { useClipboard } from "../shared/hooks/use-clipboard";

const CURRENCY_URL = `${import.meta.env.VITE_API_CURRENCY}/json/USD/`;

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
  const [currency, setCurrency] = useState(null);
  const {
    structure: home,
    notFound,
    error,
    loading,
    updateRoomStatus,
  } = useProjectStructure(id);
  const { copy, copied } = useClipboard();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const activeDetailsId = searchParams.get("details");
  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });
  const blocksEntries = useMemo(
    () => Object.entries(home?.blocks ?? {}),
    [home?.blocks],
  );
  const blockLayouts = useMemo(
    () =>
      blocksEntries.map(([blockName, block]) => {
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
    [blocksEntries],
  );

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);

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

  useEffect(() => {
    fetch(CURRENCY_URL)
      .then((res) => res.json())
      .then((data) => setCurrency(data[0]));
  }, []);

  function handleCopy() {
    copy(currency.Rate);
  }

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
                  {currency && (
                    <div className="bg-accent relative flex items-center gap-2 rounded border p-2 text-xs font-medium shadow">
                      {currency.Rate} UZS
                      <span
                        className="inline-block size-3 cursor-pointer"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </span>
                    </div>
                  )}

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
                  <div className="bg-background sticky top-0 z-20 mb-6 flex w-max min-w-full items-start border-b py-4">
                    <div className="w-10 shrink-0 sm:w-11" />
                    <div className="flex gap-8 sm:gap-12 lg:gap-16 xl:gap-20">
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

                          <div className="flex gap-8 sm:gap-12 lg:gap-16 xl:gap-20">
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
                                                  "relative flex size-8 shrink-0 items-center justify-center rounded-md text-sm leading-none font-bold text-white transition-all duration-200 sm:size-9",
                                                  STATUS_CLASS[h.status] ?? "",
                                                  isActive &&
                                                    "ring-destructive ring-offset-background z-10 shadow-[0_10px_24px_-14px_rgba(239,68,68,0.95)] ring-2 ring-offset-2",
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
