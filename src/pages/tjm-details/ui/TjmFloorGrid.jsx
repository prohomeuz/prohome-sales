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
import { Pencil, Trash2 } from "lucide-react";
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
 *   showRoomCount: boolean,
 *   variant?: "default" | "expanded",
 * }} props
 */
export default function TjmFloorGrid({
  blockLayouts,
  maxFloor,
  basementFloors = 0,
  activeDetailsId,
  hasActiveFilters,
  isFiltering,
  matchedRoomIdSet,
  onRoomClick,
  showRoomCount,
  scale = 1,
  variant = "default",
  onEditBlock,
  onDeleteBlock,
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

  const baseSize = variant === "expanded" ? 40 : 32;
  const baseTileGap = variant === "expanded" ? 10 : 8;
  const baseRowGap = variant === "expanded" ? 6 : 4;
  const baseFontSize = variant === "expanded" ? 13 : 11;

  const tileSize = baseSize * scale;
  const tileGap = baseTileGap * scale;
  const rowGap = baseRowGap * scale;
  const fontSize = baseFontSize * scale;

  return (
    <div
      className={cn(
        "no-scrollbar min-h-0 flex-1 overflow-auto pb-4 [scrollbar-gutter:auto]",
      )}
      style={{
        "--room-tile-size": `${tileSize}px`,
        "--room-tile-gap": `${tileGap}px`,
        "--room-row-gap": `${rowGap}px`,
        "--room-font-size": `${fontSize}px`,
      }}
    >
      {/* Blok sarlavhalari (sticky) */}
      <div className="bg-background sticky top-0 z-30 mb-6 flex w-max min-w-full items-start border-b py-4">
        <div className="w-10 shrink-0 sm:w-11" />
        <div className="flex gap-8 px-2 sm:gap-12 sm:px-3 lg:gap-16 xl:gap-20">
          {blockLayouts.map(({ blockName, widthStyle }) => (
            <div
              key={blockName}
              style={widthStyle}
              className="text-muted-foreground min-w-0 text-xs group/block relative"
            >
              <h3 className="truncate font-medium">{blockName}</h3>
              {/* Edit / Delete — hover paytida ko'rinadi */}
              <div className="absolute -top-1 right-0 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-all duration-200 pointer-events-none group-hover/block:pointer-events-auto">
                {onEditBlock && (
                  <button
                    onClick={() => onEditBlock(blockName)}
                    className="flex items-center justify-center size-6 rounded-md bg-background border border-border/60 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
                    title="Blokni tahrirlash"
                    type="button"
                  >
                    <Pencil className="size-3" />
                  </button>
                )}
                {onDeleteBlock && (
                  <button
                    onClick={() => onDeleteBlock(blockName)}
                    className="flex items-center justify-center size-6 rounded-md bg-background border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/5 transition-all shadow-sm"
                    title="Blokni o'chirish"
                    type="button"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="w-10 shrink-0 sm:w-11" />
      </div>

      {/* Qavat satrlari */}
      <div className="flex w-max min-w-full flex-col gap-[var(--room-row-gap)]">
        {Array.from({ length: maxFloor ?? 0 }, (_, index) => index + 1).map(
          (_, index, arr) => {
            const floorNum = arr.length - index;
            const rowHasActive = blockLayouts.some(({ block }) =>
              (block?.appartment?.[index] ?? []).some(
                (h) => String(h.id) === activeDetailsId,
              )
            );

            return (
              <div
                key={index}
                className={cn(
                  "group relative flex h-[var(--room-tile-size)] w-full cursor-pointer transition-all duration-300",
                  rowHasActive ? "bg-primary/5" : "hover:bg-muted/30",
                )}
              >
                {/* Chap qavat raqami */}
                <div
                  className={cn(
                    "sticky left-0 z-20 flex w-10 items-center justify-center text-center font-bold tracking-tighter sm:w-11 backdrop-blur-sm border-r border-border/50 transition-all duration-300",
                    rowHasActive 
                      ? "bg-primary text-white border-primary shadow-[4px_0_12px_-4px_rgba(var(--primary),0.3)]" 
                      : "bg-background/80 text-muted-foreground/60 group-hover:bg-primary group-hover:text-white group-hover:border-primary",
                  )}
                  style={{ fontSize: "var(--room-font-size)" }}
                >
                  <span
                    className={cn(
                      "transition-all duration-500",
                      rowHasActive
                        ? "scale-110"
                        : "group-hover:scale-150",
                    )}
                  >
                    {floorNum}
                  </span>
                </div>

                {/* Bloklar qatori */}
                <div className="flex gap-8 px-2 sm:gap-12 sm:px-3 lg:gap-16 xl:gap-20">
                  {blockLayouts.map(({ blockName, block, widthStyle }) => {
                    const blockOffset = maxFloor - (block?.floor ?? 0);
                    const blockIndex = index - blockOffset;
                    const floorRooms = blockIndex < 0
                      ? []
                      : block?.appartment?.[blockIndex] ?? [];

                    return (
                      <div
                        key={blockName}
                        style={widthStyle}
                        className="flex gap-2"
                      >
                        {floorRooms.map((h) => {
                          const isActive = String(h.id) === activeDetailsId;
                          const isFilteredOut =
                            hasActiveFilters &&
                            !isFiltering &&
                            !matchedRoomIdSet.has(String(h.id));
                          const tileLabel = showRoomCount
                            ? `${h.room}x`
                            : (h.houseNumber ?? h.room);

                          return (
                            <Tooltip key={h.id}>
                              <TooltipTrigger
                                className="focus-within:outline-none"
                                tabIndex={-1}
                              >
                                <div
                                  onClick={() => onRoomClick(h.id)}
                                  className={cn(
                                    "relative flex shrink-0 items-center justify-center rounded-lg leading-none font-bold transition-all duration-300 cursor-pointer hover:scale-105 hover:z-20 active:scale-95",
                                    "size-[var(--room-tile-size)]",
                                    STATUS_CLASS[h.status] || "bg-muted/30 text-muted-foreground",
                                    "text-white shadow-sm ring-inset ring-black/5",
                                    isActive &&
                                      "z-20 ring-primary shadow-[0_0_25px_-2px_var(--color-primary)] ring-2 ring-offset-2 scale-110",
                                    isFilteredOut && "grayscale-[0.5] opacity-20 scale-90",
                                  )}
                                  style={{ fontSize: "var(--room-font-size)" }}
                                >
                                  {tileLabel}
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
                                    <h4 className="font-bold">Xonalar soni:</h4>
                                    <span className="font-mono">{h.room}x</span>
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
                    );
                  })}
                </div>

                {/* O'ng qavat raqami */}
                <div
                  className={cn(
                    "sticky right-0 z-20 ml-auto flex w-10 shrink-0 items-center justify-center text-center font-bold tracking-tighter sm:w-11 backdrop-blur-sm border-l border-border/50 transition-all duration-300",
                    rowHasActive 
                      ? "bg-primary text-white border-primary shadow-[-4px_0_12px_-4px_rgba(var(--primary),0.3)]" 
                      : "bg-background/80 text-muted-foreground/60 group-hover:bg-primary group-hover:text-white group-hover:border-primary",
                  )}
                  style={{ fontSize: "var(--room-font-size)" }}
                >
                  <span
                    className={cn(
                      "transition-all duration-500",
                      rowHasActive
                        ? "scale-110"
                        : "group-hover:scale-150",
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
