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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { buttonVariants } from "@/shared/ui/button";
import {
  ArrowLeft,
  Banknote,
  Building2,
  ChevronDown,
  Filter,
  Plus,
  Ruler,
  Tag,
  UsersRound,
} from "lucide-react";
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
 *   showRoomCount: boolean,
 *   onShowRoomCountChange: (checked: boolean) => void,
 *   viewMode: string,
 *   viewOptions: Array<{ value: string, label: string }>,
 *   onViewModeChange: (value: string) => void,
 *   onOpenAddBlock: () => void,
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
  showRoomCount,
  onShowRoomCountChange,
  viewMode,
  viewOptions,
  onViewModeChange,
  onOpenAddBlock,
  onBack,
}) {
  const draftSizeRange = draftFilters?.sizeRange ?? rangeBounds.size;
  const draftPriceRange = draftFilters?.priceRange ?? rangeBounds.price;
  const draftFloorRange = draftFilters?.floorRange ?? rangeBounds.floor;
  const segmentedShellClass =
    "border-border/70 bg-background inline-flex h-11 max-w-full items-center rounded-xl border shadow-sm";
  const segmentedTrackClass =
    "bg-muted/40 inline-flex items-center rounded-lg p-0.5";
  const toggleItemClass =
    "data-[state=off]:bg-background/70 min-w-[5.25rem] rounded-md border-0 px-3 py-1 text-xs font-semibold whitespace-nowrap text-muted-foreground shadow-none transition-all hover:bg-background hover:text-foreground data-[state=on]:bg-primary/8 data-[state=on]:text-primary data-[state=on]:ring-1 data-[state=on]:ring-primary/20";
  const tabsItemClass =
    "data-[state=inactive]:bg-background/70 min-w-[5.25rem] rounded-md border-0 px-3 py-1 text-xs font-semibold whitespace-nowrap text-muted-foreground shadow-none transition-all hover:bg-background hover:text-foreground data-[state=active]:bg-primary/8 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/20";

  return (
    <div className="bg-background/95 flex w-full flex-col border-b backdrop-blur-sm">
      {/* Yuqori qator: Orqaga + CurrencyBadge + status legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
        <button
          type="button"
          className={buttonVariants({ size: "sm", variant: "secondary" })}
          onClick={onBack}
        >
          <ArrowLeft />
          <span className="hidden sm:inline">Orqaga</span>
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
          <CurrencyBadge />
          <div className="flex flex-wrap justify-end gap-1">
            {Object.entries(STATUS_CLASS).map(([key, value]) => (
              <Badge 
                key={key} 
                className={cn(
                  "text-white border-none shadow-sm px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-tight uppercase transition-all duration-300 hover:scale-105", 
                  value
                )}
              >
                {STATUS_LABEL[key]}
              </Badge>
            ))}
          </div>
        </div>
      </div>



      {/* Quyi qator: Filter + blok select + statistika */}
      <div className="border-border/60 border-t">
        <div className="flex flex-col gap-2 px-3 py-2 sm:px-5 sm:gap-3 sm:py-3 lg:px-6">

          {/* Qator 1: Filter + Blok + Blok qo'shish */}
          <div className="flex w-full flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={hasActiveFilters ? "default" : "outline"}
              className={cn(
                "justify-start gap-2 rounded-[10px] h-9 sm:h-10 transition-all shrink-0",
                hasActiveFilters && "shadow-[0_0_15px_-3px_rgba(var(--primary),0.4)]"
              )}
              aria-expanded={filterOpen}
              onClick={onToggleFilter}
            >
              <Filter className={cn("size-4 transition-transform", filterOpen && "rotate-180")} />
              <span className="font-semibold text-sm">Filter</span>
              {hasActiveFilters && (
                <span className="bg-background text-primary inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="w-[130px] sm:w-[160px] shrink-0">
              <Select value={selectedBlocks[0] ?? "all"} onValueChange={(v) => onBlocksChange(v === "all" ? [] : [v])}>
                <SelectTrigger className="w-full h-9 sm:h-10 rounded-[10px] bg-background border-border focus:ring-primary/20 text-sm">
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-xl">
                  <SelectItem value="all" className="rounded-lg">Barchasi</SelectItem>
                  {blockOptions.map((blockName) => (
                    <SelectItem key={blockName} value={blockName} className="rounded-lg">
                      {blockName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {onOpenAddBlock && (
              <Button
                type="button"
                variant="outline"
                className="justify-start gap-1.5 rounded-[10px] h-9 sm:h-10 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary shrink-0 text-sm"
                onClick={onOpenAddBlock}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline font-semibold">Blok qo'shish</span>
                <span className="sm:hidden font-semibold">Blok</span>
              </Button>
            )}

            {/* Statistika kartalar — katta ekranlarda bir qatorda */}
            {!!statisticsCards.length && (
              <div className="hidden lg:flex flex-1 items-center gap-2 min-w-0 ml-auto">
                {statisticsCards.map((stat) => (
                  <div
                    key={stat.key}
                    className={cn(
                      "flex h-9 flex-1 items-center justify-between rounded-[10px] border px-3 transition-all duration-300 hover:shadow-sm min-w-0",
                      stat.tone,
                      "border-opacity-40"
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn("size-1.5 rounded-full shrink-0", stat.dot)} />
                      <span className="text-[11px] font-medium truncate">
                        {stat.label}
                      </span>
                    </div>
                    <span className="text-[13px] font-bold pl-2 shrink-0">
                      {formatNumber(stat.value ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statistika kartalar — kichik ekranlarda 2x grid */}
          {!!statisticsCards.length && (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:hidden">
              {statisticsCards.map((stat) => (
                <div
                  key={stat.key}
                  className={cn(
                    "flex h-8 items-center justify-between rounded-[10px] border px-2.5 transition-all",
                    stat.tone,
                    "border-opacity-40"
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={cn("size-1.5 rounded-full shrink-0", stat.dot)} />
                    <span className="text-[10px] font-medium truncate">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold pl-1.5 shrink-0">
                    {formatNumber(stat.value ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Qator 2: Xonadon toggle + View tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                segmentedShellClass,
                "gap-2 px-1 pr-1 pl-2 sm:pl-3 h-9 sm:h-11",
              )}
            >
              <div className="hidden sm:block min-w-[7rem]">
                <p className="text-foreground text-xs font-semibold whitespace-nowrap">
                  {showRoomCount ? "Xonalar soni" : "Xonadon raqami"}
                </p>
              </div>

              <ToggleGroup
                type="single"
                value={showRoomCount ? "room" : "house"}
                onValueChange={(value) => {
                  if (!value) return;
                  onShowRoomCountChange(value === "room");
                }}
                className={segmentedTrackClass}
              >
                <ToggleGroupItem value="house" className={cn(toggleItemClass, "min-w-[4rem] sm:min-w-[5.25rem]")}>
                  Xonadon
                </ToggleGroupItem>
                <ToggleGroupItem value="room" className={cn(toggleItemClass, "min-w-[4rem] sm:min-w-[5.25rem]")}>
                  Xonalar
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className={cn(segmentedShellClass, "px-1 h-9 sm:h-11 overflow-x-auto no-scrollbar")}>
              <Tabs
                value={viewMode}
                onValueChange={onViewModeChange}
                className="flex"
              >
                <TabsList className={segmentedTrackClass}>
                  {viewOptions.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      className={cn(tabsItemClass, "min-w-[3.5rem] sm:min-w-[5.25rem] px-2 sm:px-3")}
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
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
                        disabled={rangeBounds.price[0] === rangeBounds.price[1]}
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
                      disabled={rangeBounds.floor[0] === rangeBounds.floor[1]}
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
