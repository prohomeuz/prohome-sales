import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import { useAppStore } from "@/entities/session/model";
import { ColumnContainer } from "./ColumnContainer";
import { LeadCard } from "./LeadCard";
import { LeadDetailsDrawer } from "./LeadDetailsDrawer";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Loader2, PlusCircle, Search, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Filter } from "lucide-react";
import { toast } from "sonner";

export function KanbanBoard() {
  const { user } = useAppStore();
  const columns = useCrmStore((state) => state.columns);
  const leads = useCrmStore((state) => state.leads);
  const isLoading = useCrmStore((state) => state.isLoading);
  const error = useCrmStore((state) => state.error);
  const fetchCrmData = useCrmStore((state) => state.fetchCrmData);
  const addColumn = useCrmStore((state) => state.addColumn);
  const startPolling = useCrmStore((state) => state.startPolling);
  const stopPolling = useCrmStore((state) => state.stopPolling);
  const updateLead = useCrmStore((state) => state.updateLead);
  const filters = useCrmStore((state) => state.filters);
  const setFilters = useCrmStore((state) => state.setFilters);

  useEffect(() => {
    const hasCrmPermission = user?.permission?.CRM === true;

    if (hasCrmPermission) {
      fetchCrmData();
      startPolling();
      return () => stopPolling();
    } else if (user) {
      stopPolling();
      useCrmStore.setState({ error: "permissions denied", isLoading: false });
    }
  }, [fetchCrmData, startPolling, stopPolling, user]);

  const deleteColumn = useCrmStore((state) => state.deleteColumn);
  const updateColumn = useCrmStore((state) => state.updateColumn);
  const addLead = useCrmStore((state) => state.addLead);
  const deleteLead = useCrmStore((state) => state.deleteLead);
  const moveLeadSameColumn = useCrmStore((state) => state.moveLeadSameColumn);
  const previewMoveLeadToDifferentColumn = useCrmStore(
    (state) => state.previewMoveLeadToDifferentColumn,
  );

  const [activeLead, setActiveLead] = useState(null);
  const [activeEditLead, setActiveEditLead] = useState(null);

  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const boardScrollRef = useRef(null);
  const [showLeftBoardShadow, setShowLeftBoardShadow] = useState(false);
  const [showRightBoardShadow, setShowRightBoardShadow] = useState(false);

  useEffect(() => {
    if (!activeEditLead) return;

    const stillExists = leads.some((lead) => lead.id === activeEditLead.id);
    if (!stillExists) {
      setActiveEditLead(null);
    }
  }, [activeEditLead, leads]);

  const activeFilterCount = useMemo(
    () =>
      [filters.phoneQuery, filters.priceMin, filters.priceMax].filter(
        (value) => String(value ?? "").trim() !== "",
      ).length,
    [filters.phoneQuery, filters.priceMin, filters.priceMax],
  );
  const boardEdgeShadowStyle = useMemo(() => {
    const shadows = [];

    if (showLeftBoardShadow) {
      shadows.push("inset 16px 0 20px -20px rgba(148, 163, 184, 0.38)");
    }

    if (showRightBoardShadow) {
      shadows.push("inset -16px 0 20px -20px rgba(148, 163, 184, 0.38)");
    }

    return shadows.length ? { boxShadow: shadows.join(", ") } : undefined;
  }, [showLeftBoardShadow, showRightBoardShadow]);

  // Comprehensive Filtering (Search + Advanced Filters)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const leadPrice = Number(lead.price);
      const hasLeadPrice = Number.isFinite(leadPrice);

      // Qidiruv text
      const query = searchQuery.trim().toLowerCase();
      if (
        query &&
        !lead.title?.toLowerCase().includes(query) &&
        !lead.companyName?.toLowerCase().includes(query)
      ) {
        return false;
      }
      // Telefon filter
      if (
        filters.phoneQuery &&
        !lead.companyName
          ?.toLowerCase()
          .includes(filters.phoneQuery.toLowerCase())
      ) {
        return false;
      }
      // Minimal summa
      if (
        filters.priceMin &&
        (!hasLeadPrice || leadPrice < Number(filters.priceMin))
      ) {
        return false;
      }
      // Maksimal summa
      if (
        filters.priceMax &&
        Number(filters.priceMax) > 0 &&
        (!hasLeadPrice || leadPrice > Number(filters.priceMax))
      ) {
        return false;
      }
      return true;
    });
  }, [leads, searchQuery, filters]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    const result = await addColumn(newColumnTitle.trim());
    if (result?.success) {
      setNewColumnTitle("");
      setIsColumnDialogOpen(false);
      toast.success("Yangi bosqich qo'shildi");
      return;
    }

    toast.error(result?.error || "Bosqich qo'shib bo'lmadi");
  };

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    stopPolling();
    useCrmStore.setState({ error: null, isLoading: true });

    try {
      await fetchCrmData();
      const { error: nextError } = useCrmStore.getState();
      if (!nextError) {
        startPolling();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    const el = boardScrollRef.current;
    if (!el) return;

    const updateBoardShadows = () => {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      setShowLeftBoardShadow(el.scrollLeft > 8);
      setShowRightBoardShadow(
        maxScrollLeft > 8 && el.scrollLeft < maxScrollLeft - 8,
      );
    };

    updateBoardShadows();
    el.addEventListener("scroll", updateBoardShadows, { passive: true });
    window.addEventListener("resize", updateBoardShadows);

    return () => {
      el.removeEventListener("scroll", updateBoardShadows);
      window.removeEventListener("resize", updateBoardShadows);
    };
  }, [columns.length, filteredLeads.length, isLoading]);

  const onDragStart = (event) => {
    if (event.active.data.current?.type === "Lead") {
      setActiveLead(event.active.data.current.lead);
    }
  };

  const onDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveLead = active.data.current?.type === "Lead";
    const isActiveColumn = active.data.current?.type === "Column";
    const isOverLead = over.data.current?.type === "Lead";
    const isOverColumn = over.data.current?.type === "Column";

    if (isActiveColumn) return;
    if (!isActiveLead) return;

    if (isActiveLead && isOverLead) {
      const activeLeadData = leads.find((l) => l.id === activeId);
      const overLeadData = leads.find((l) => l.id === overId);
      if (!activeLeadData || !overLeadData) return;
      if (activeLeadData.columnId === overLeadData.columnId) {
        moveLeadSameColumn(activeId, overId);
      } else {
        previewMoveLeadToDifferentColumn(
          activeId,
          overId,
          overLeadData.columnId,
          false,
        );
      }
    }

    if (isActiveLead && isOverColumn) {
      previewMoveLeadToDifferentColumn(activeId, overId, overId, true);
    }
  };

  const onDragEnd = async (event) => {
    if (!event.over && activeLead) {
      await fetchCrmData();
    }

    if (activeLead && event.over) {
      const { leads: latestLeads } = useCrmStore.getState();
      const movedLead = latestLeads.find((lead) => lead.id === activeLead.id);
      if (movedLead && movedLead.columnId !== activeLead.columnId) {
        const result = await updateLead(movedLead.id, {
          columnId: movedLead.columnId,
        });
        if (!result?.success) {
          toast.error(result?.error || "Lead holatini saqlab bo'lmadi");
          await fetchCrmData();
        }
      }
    }

    setActiveLead(null);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      <LeadDetailsDrawer
        lead={activeEditLead}
        isOpen={!!activeEditLead}
        onClose={() => setActiveEditLead(null)}
      />
      {!error && (
        <div className="border-b border-border/40 bg-card">
          <div className="flex flex-col gap-3 px-3 py-3.5 sm:px-6 sm:py-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="text-xl leading-tight font-semibold tracking-tight text-foreground sm:text-2xl lg:text-[28px]">
                CRM Boshqaruvi
              </h1>
              <p className="mt-1 text-[10px] leading-relaxed font-medium text-muted-foreground sm:text-[11px]">
                Sotuv kanban
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center lg:w-auto lg:flex-nowrap lg:justify-end">
              <InputGroup className="h-11 w-full rounded-xl border-border bg-muted/20 shadow-none transition-all has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-primary/15 sm:flex-1 lg:w-[420px] lg:flex-none">
                <InputGroupAddon
                  align="inline-start"
                  className="pl-3 text-muted-foreground"
                >
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Qidiruv..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-full text-sm placeholder:text-muted-foreground"
                />
                <InputGroupAddon align="inline-end" className="gap-2 pr-1.5">
                  <span
                    aria-hidden="true"
                    className="h-5 w-px rounded-full bg-border"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`relative mr-2 h-8 rounded-lg px-3 text-xs font-bold ${
                          activeFilterCount
                            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        }`}
                      >
                        <Filter className="size-4" />
                        <span>Filtr</span>
                        {activeFilterCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 min-w-5 border-background bg-primary px-1.5 py-0 text-[10px] font-black text-primary-foreground shadow-sm">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[min(20rem,calc(100vw-1rem))] rounded-2xl p-4 sm:p-5"
                      align="end"
                    >
                      <div className="space-y-4">
                        <h4 className="leading-none font-bold text-foreground">
                          Filterlar
                        </h4>
                        <p className="text-muted-foreground text-xs">
                          Doskadagi leadlarni saralash.
                        </p>

                        <div className="grid gap-3 pt-2">
                          <div className="grid gap-1">
                            <Label
                              htmlFor="phoneQ"
                              className="text-xs font-bold text-muted-foreground"
                            >
                              Telefon raqam
                            </Label>
                            <Input
                              id="phoneQ"
                              value={filters.phoneQuery}
                              onChange={(e) =>
                                setFilters({ phoneQuery: e.target.value })
                              }
                              placeholder="Masalan: +998..."
                              className="h-10 rounded-xl text-sm"
                            />
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="grid gap-1">
                              <Label
                                htmlFor="pMin"
                                className="text-xs font-bold text-muted-foreground"
                              >
                                Min. Summa
                              </Label>
                              <Input
                                id="pMin"
                                type="number"
                                value={filters.priceMin}
                                onChange={(e) =>
                                  setFilters({ priceMin: e.target.value })
                                }
                                placeholder="0"
                                className="h-10 rounded-xl text-sm"
                              />
                            </div>
                            <div className="grid gap-1">
                              <Label
                                htmlFor="pMax"
                                className="text-xs font-bold text-muted-foreground"
                              >
                                Max. Summa
                              </Label>
                              <Input
                                id="pMax"
                                type="number"
                                value={filters.priceMax}
                                onChange={(e) =>
                                  setFilters({ priceMax: e.target.value })
                                }
                                placeholder="Cheksiz"
                                className="h-10 rounded-xl text-sm"
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex w-full items-center justify-between border-t pt-3">
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setFilters({
                                  phoneQuery: "",
                                  priceMin: "",
                                  priceMax: "",
                                })
                              }
                              className="h-9 rounded-lg px-3 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              Tozalash
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </InputGroupAddon>
              </InputGroup>

              <Dialog
                open={isColumnDialogOpen}
                onOpenChange={setIsColumnDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="group h-10 w-full shrink-0 justify-center rounded-xl bg-primary px-3.5 text-[13px] font-bold whitespace-nowrap text-primary-foreground shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98] sm:w-auto">
                    <PlusCircle className="size-4 transition-transform group-hover:rotate-90" />
                    <span>Yangi bosqich</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-1rem)] max-w-[425px] rounded-[24px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-foreground">
                      Yangi bosqich qo'shish
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Sotuv voronkasi uchun yangi bosqich (kalonka) nomini
                      kiriting.
                    </p>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="title"
                        className="ml-1 text-sm font-bold text-foreground"
                      >
                        Kalonka nomi
                      </Label>
                      <Input
                        id="title"
                        placeholder="Masalan: Muzokara"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        className="h-12 rounded-xl border-border bg-muted/20 px-4 transition-all focus:bg-background focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsColumnDialogOpen(false)}
                      className="rounded-xl font-bold text-muted-foreground"
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      onClick={handleCreateColumn}
                      className="rounded-xl bg-primary px-8 font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      Saqlash
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}

      <div
        ref={boardScrollRef}
        className="custom-scrollbar relative min-h-0 w-full flex-1 touch-pan-x overflow-x-auto overflow-y-hidden scroll-smooth bg-background transition-shadow duration-200 [scrollbar-gutter:auto]"
        style={boardEdgeShadowStyle}
      >
        {error ? (
          <div className="animate-in fade-in flex h-full flex-col items-center justify-center px-6 text-center duration-500">
            <ShieldAlert className="mb-4 size-20 rounded-full bg-red-500/10 px-3 py-3 text-red-500 opacity-80" />

            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {error.includes("permissions")
                ? "Ruxsat etilmadi"
                : "Xatolik yuz berdi"}
            </h3>

            <p className="text-muted-foreground mb-3 max-w-[280px] text-xs leading-relaxed font-medium">
              {error.includes("permissions")
                ? "Sizda ushbu bo'limni ko'rish imkoniyati yo'q."
                : "Ma'lumotlarni yuklab bo'lmadi. Iltimos, qayta urinib ko'ring."}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="!focus-visible:ring-[1px] h-9 rounded-xl bg-red-50 px-6 text-xs font-bold text-red-600 !ring-red-100 transition-colors hover:bg-red-100 disabled:opacity-70"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Tekshirilmoqda...
                  </>
                ) : (
                  "Qayta urinish"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            collisionDetection={closestCorners}
          >
            <div className="flex h-full w-max snap-x snap-mandatory items-stretch gap-2.5 px-2.5 pt-3 pb-6 sm:gap-4 sm:px-6 sm:pt-4 sm:pb-10 lg:min-w-full lg:gap-0 lg:border-t lg:border-border/40 lg:bg-background lg:px-0 lg:pt-0 lg:pb-0">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-full w-[calc(100vw-1rem)] max-w-[380px] flex-col gap-3 sm:w-[320px] lg:max-w-none lg:gap-4 lg:border-r lg:border-border/40 lg:px-4 lg:pt-4 lg:first:border-l"
                  >
                    <Skeleton className="h-28 w-full rounded-2xl" />
                    <Skeleton className="h-28 w-full rounded-2xl" />
                  </div>
                ))
              ) : (
                <>
                  {columns.map((col) => (
                    <ColumnContainer
                      key={col.id}
                      column={col}
                      leads={filteredLeads.filter(
                        (lead) => lead.columnId === col.id,
                      )}
                      searchQuery={searchQuery}
                      deleteColumn={deleteColumn}
                      updateColumn={updateColumn}
                      addLead={addLead}
                      deleteLead={deleteLead}
                      onEditLead={setActiveEditLead}
                    />
                  ))}

                  {columns.length === 0 && (
                    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border/40 bg-muted/10 px-10 py-20">
                      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-card shadow-sm">
                        <PlusCircle className="size-8 text-muted-foreground/30" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-muted-foreground">
                        Hozircha bosqichlar yo'q
                      </h3>
                      <p className="mb-8 max-w-[240px] text-center text-xs text-muted-foreground">
                        Sotuv jarayonini boshlash uchun birinchi kalonkani
                        qo'shing.
                      </p>
                      <Button
                        onClick={() => setIsColumnDialogOpen(true)}
                        className="rounded-xl bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                      >
                        Bosqich qo'shish
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {"document" in window &&
              createPortal(
                <DragOverlay>
                  {activeLead && (
                    <LeadCard lead={activeLead} deleteLead={deleteLead} />
                  )}
                </DragOverlay>,
                document.body,
              )}
          </DndContext>
        )}
      </div>
    </div>
  );
}
