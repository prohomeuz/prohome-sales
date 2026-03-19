/**
 * @file TJM qavat/xona grid vizualizatsiyasi (shaxmatka).
 * @module pages/tjm-details/ui/TjmFloorGrid
 *
 * Har bir qavat va xonani rangli kvadrat sifatida ko'rsatadi.
 * Filtr natijalariga qarab xonalarni dimlashtiradi.
 * Faqat presentational — barcha state props orqali keladi.
 */

import { cn, formatNumber } from "@/shared/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { STATUS_CLASS } from "../lib/constants";

/**
 * @param {{
 *   blockLayouts: Array<{ blockName: string, block: object, widthStyle: object }>,
 *   maxFloor: number,
 *   activeDetailsId: string | null,
 *   hasActiveFilters: boolean,
 *   isFiltering: boolean,
 *   matchedRoomIdSet: Set<string>,
 *   onRoomClick: (id: string | number) => void,
 * }} props
 */
export default function TjmFloorGrid({
  blockLayouts,
  maxFloor,
  activeDetailsId,
  hasActiveFilters,
  isFiltering,
  matchedRoomIdSet,
  onRoomClick,
}) {
  if (!blockLayouts.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-sm text-center">
          <h3 className="text-lg font-semibold">Uylar topilmadi</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Ushbu bloklar uchun ko'rinadigan uy ma'lumotlari hozircha mavjud
            emas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-auto pb-4 [--room-tile-gap:0.5rem] [--room-tile-size:2rem] [scrollbar-gutter:auto] sm:[--room-tile-size:2.25rem]">
      {/* Blok sarlavhalari (sticky) */}
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

      {/* Qavat satrlari */}
      <div className="flex w-max min-w-full flex-col">
        {Array.from({ length: maxFloor ?? 0 }, (_, index) => index + 1).map(
          (_, index, arr) => {
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
                {/* Chap qavat raqami */}
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

                {/* Bloklar qatori */}
                <div className="flex gap-8 px-2 sm:gap-12 sm:px-3 lg:gap-16 xl:gap-20">
                  {blockLayouts.map(({ blockName, block, widthStyle }) =>
                    floorNum <= (block?.floor ?? 0) ? (
                      <div
                        key={blockName}
                        style={widthStyle}
                        className="flex gap-2"
                      >
                        {(block?.appartment?.[index] ?? []).map((h) => {
                          const isActive = String(h.id) === activeDetailsId;
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
                                  onClick={() => onRoomClick(h.id)}
                                  className={cn(
                                    "relative flex size-8 shrink-0 items-center justify-center rounded-md text-sm leading-none font-bold text-primary-foreground transition-[opacity,transform] duration-300 sm:size-9",
                                    STATUS_CLASS[h.status] ?? "",
                                    isActive &&
                                      "ring-destructive ring-offset-background z-10 shadow-[0_10px_24px_-14px_color-mix(in_oklab,var(--destructive)_95%,transparent)] ring-2 ring-offset-2",
                                    isFilteredOut && "scale-[0.96] opacity-30",
                                  )}
                                >
                                  {h.room}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="pointer-events-none">
                                <div className="flex flex-col">
                                  <div className="flex gap-1">
                                    <h4 className="font-bold">Uy raqami:</h4>
                                    <span className="font-mono">
                                      #{h.houseNumber}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <h4 className="font-bold">Narxi:</h4>
                                    <span className="font-mono">
                                      {(h.price * h.size).toFixed(1)}
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
                        })}
                      </div>
                    ) : null,
                  )}
                </div>

                {/* O'ng qavat raqami */}
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
          },
        )}
      </div>
    </div>
  );
}
