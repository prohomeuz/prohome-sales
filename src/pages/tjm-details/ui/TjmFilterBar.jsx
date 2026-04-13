/**
 * @file TJM filter paneli — qidirish va statistika.
 * @module pages/tjm-details/ui/TjmFilterBar
 *
 * Filter tugmasi, blok tanlash, statistika kartalar va
 * slayder filtrlash panelini o'z ichiga oladi.
 * Barcha state va handlerlar props orqali ota-sahifadan keladi.
 */

import { cn, formatNumber } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import CurrencyBadge from "@/shared/ui/currency-badge";
import { Label } from "@/shared/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Separator } from "@/shared/ui/separator";
import { Slider } from "@/shared/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { buttonVariants } from "@/shared/ui/button";
import {
  ArrowLeft,
  Banknote,
  Building2,
  ChevronDown,
  Filter,
  Ruler,
  Tag,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { STATUS_CLASS, STATUS_LABEL } from "../lib/constants";

/**
 * @param {{
 *   filterOpen: boolean,
 *   onToggleFilter: () => void,
 *   hasActiveFilters: boolean,
 *   activeFilterCount: number,
 *   selectedBlocks: string[],
 *   blockOptions: string[],
 *   onBlocksChange: (blocks: string[]) => void,
 *   statisticsCards: Array<object>,
 *   draftFilters: object,
 *   onDraftFiltersChange: (updater: function) => void,
 *   rangeBounds: { size: number[], price: number[], floor: number[] },
 *   roomOptions: string[],
 *   onReset: () => void,
 *   onApply: () => void,
 * }} props
 */
export default function TjmFilterBar({
  filterOpen,
  onToggleFilter,
  hasActiveFilters,
  activeFilterCount,
  selectedBlocks,
  blockOptions,
  onBlocksChange,
  statisticsCards,
  draftFilters,
  onDraftFiltersChange,
  rangeBounds,
  roomOptions,
  onReset,
  onApply,
}) {
  const draftSizeRange = draftFilters?.sizeRange ?? rangeBounds.size;
  const draftPriceRange = draftFilters?.priceRange ?? rangeBounds.price;
  const draftFloorRange = draftFilters?.floorRange ?? rangeBounds.floor;

  return (
    <div className="bg-background/95 flex w-full flex-col border-b backdrop-blur-sm">
      {/* Yuqori qator: Orqaga + CurrencyBadge + status legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5 lg:px-6">
        <Link
          className={buttonVariants({ size: "sm", variant: "secondary" })}
          to="/tjm"
        >
          <ArrowLeft />
          Orqaga
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <CurrencyBadge />
          <div className="flex flex-wrap justify-end gap-2">
            {Object.entries(STATUS_CLASS).map(([key, value]) => (
              <Badge key={key} className={cn("text-primary-foreground", value)}>
                {STATUS_LABEL[key]}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Quyi qator: Filter + blok select + statistika */}
      <div className="border-border/60 border-t">
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:px-6">
          <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
            <Button
              type="button"
              variant={hasActiveFilters ? "default" : "outline"}
              className="justify-start gap-2 sm:w-auto"
              aria-expanded={filterOpen}
              onClick={onToggleFilter}
            >
              <Filter className="size-4" />
              Filter
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground ml-auto inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold sm:ml-1">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedBlocks.length === 0
                      ? "Barchasi"
                      : selectedBlocks.length === 1
                        ? selectedBlocks[0]
                        : `${selectedBlocks.length} ta blok`}
                  </span>
                  <ChevronDown className="text-muted-foreground ml-2 size-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-2">
                <button
                  type="button"
                  onClick={() => onBlocksChange([])}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    selectedBlocks.length === 0
                      ? "bg-accent font-medium"
                      : "hover:bg-accent",
                  )}
                >
                  <span className="size-4 shrink-0" />
                  Barchasi
                </button>
                {blockOptions.map((blockName) => {
                  const checked = selectedBlocks.includes(blockName);
                  return (
                    <button
                      key={blockName}
                      type="button"
                      onClick={() => {
                        const next = checked
                          ? selectedBlocks.filter((b) => b !== blockName)
                          : [...selectedBlocks, blockName];
                        onBlocksChange(next);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                    >
                      <Checkbox
                        checked={checked}
                        className="pointer-events-none"
                      />
                      {blockName}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>

          {/* Statistika kartalar */}
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

        {/* Slayder filtrlash paneli (accordion) */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,transform] duration-500 ease-in-out",
            filterOpen
              ? "grid-rows-[1fr] opacity-100"
              : "pointer-events-none -translate-y-2 grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden px-4 pb-4 sm:px-5 lg:px-6">
            <div className="bg-background/95 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Filtrlash</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFilter()}
                >
                  Yopish
                </Button>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
                  {/* Xonalar soni */}
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <UsersRound className="text-muted-foreground size-4" />
                      Xonalar soni
                    </Label>
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
                      spacing={0}
                      value={draftFilters.rooms}
                      onValueChange={(value) =>
                        onDraftFiltersChange((prev) => ({
                          ...prev,
                          rooms: value,
                        }))
                      }
                      className="border-border/70 bg-muted/40 grid w-full grid-cols-2 gap-1 rounded-xl border p-1 shadow-none"
                    >
                      {roomOptions.map((room) => (
                        <ToggleGroupItem
                          key={room}
                          value={room}
                          className="text-foreground data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:ring-primary/35 w-full justify-center rounded-lg border-0 bg-transparent text-sm font-medium shadow-none transition-all data-[state=on]:shadow-sm data-[state=on]:ring-1"
                        >
                          {room} xona
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <Tag className="text-muted-foreground size-4" />
                      Status
                    </Label>
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
                      spacing={0}
                      value={draftFilters.statuses}
                      onValueChange={(value) =>
                        onDraftFiltersChange((prev) => ({
                          ...prev,
                          statuses: value,
                        }))
                      }
                      className="border-border/70 bg-muted/40 grid w-full grid-cols-2 gap-1 rounded-xl border p-1 shadow-none sm:grid-cols-4"
                    >
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <ToggleGroupItem
                          key={value}
                          value={value}
                          className="text-foreground data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:ring-primary/35 w-full justify-center gap-2 rounded-lg border-0 bg-transparent text-sm font-medium shadow-none transition-all data-[state=on]:shadow-sm data-[state=on]:ring-1"
                        >
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              STATUS_CLASS[value],
                            )}
                          />
                          {label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>

                <Separator />

                {/* O'lchami va narx slayderlari */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <Ruler className="text-muted-foreground size-4" />
                      O'lchami (m²)
                    </Label>
                    <div className="border-border/60 bg-muted/30 rounded-lg border px-3 py-3">
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>{formatNumber(draftSizeRange[0])} m²</span>
                        <span>{formatNumber(draftSizeRange[1])} m²</span>
                      </div>
                      <Slider
                        min={rangeBounds.size[0]}
                        max={rangeBounds.size[1]}
                        step={0.01}
                        value={draftSizeRange}
                        onValueChange={(value) =>
                          onDraftFiltersChange((prev) => ({
                            ...prev,
                            sizeRange: value,
                          }))
                        }
                        disabled={rangeBounds.size[0] === rangeBounds.size[1]}
                        className="mt-3"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <Banknote className="text-muted-foreground size-4" />
                      Uy narxi (umumiy)
                    </Label>
                    <div className="border-border/60 bg-muted/30 rounded-lg border px-3 py-3">
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>{formatNumber(draftPriceRange[0])} USD</span>
                        <span>{formatNumber(draftPriceRange[1])} USD</span>
                      </div>
                      <Slider
                        min={rangeBounds.price[0]}
                        max={rangeBounds.price[1]}
                        step={1000}
                        value={draftPriceRange}
                        onValueChange={(value) =>
                          onDraftFiltersChange((prev) => ({
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

                {/* Qavat slayderi */}
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="text-muted-foreground size-4" />
                    Qavat
                  </Label>
                  <div className="border-border/60 bg-muted/30 rounded-lg border px-3 py-3">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>{draftFloorRange[0]}-qavat</span>
                      <span>{draftFloorRange[1]}-qavat</span>
                    </div>
                    <Slider
                      min={rangeBounds.floor[0]}
                      max={rangeBounds.floor[1]}
                      step={1}
                      value={draftFloorRange}
                      onValueChange={(value) =>
                        onDraftFiltersChange((prev) => ({
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

                {/* Amallar tugmalari */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={onReset}>
                    Tozalash
                  </Button>
                  <Button type="button" onClick={onApply}>
                    Filterlash
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
