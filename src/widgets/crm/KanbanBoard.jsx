import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import { useAppStore } from "@/entities/session/model";
import { ColumnContainer } from "./ColumnContainer";
import { LeadCard } from "./LeadCard";
import { LeadDetailsDrawer } from "./LeadDetailsDrawer";
import { ArchiveDialog } from "./ArchiveDialog";
import { Button } from "@/shared/ui/button";
import { PlusCircle, ShieldAlert, Filter, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

function isArchiveColumn(col) {
  return col.name === "__crm_hidden_archive__" || col.title === "__crm_hidden_archive__";
}

function moveLeadInDraft(currentLeads, activeId, overId, overType) {
  const activeIdx = currentLeads.findIndex((lead) => lead.id === activeId);
  if (activeIdx === -1) return currentLeads;

  if (overType === "Lead") {
    const overIdx = currentLeads.findIndex((lead) => lead.id === overId);
    if (overIdx === -1) return currentLeads;
    const activeItem = currentLeads[activeIdx];
    const overItem = currentLeads[overIdx];
    const next = [...currentLeads];

    if (activeItem.columnId !== overItem.columnId) {
      next[activeIdx] = { ...activeItem, columnId: overItem.columnId };
    }

    return arrayMove(next, activeIdx, overIdx);
  }

  if (overType === "Column") {
    const activeItem = currentLeads[activeIdx];
    if (activeItem.columnId === overId) return currentLeads;
    const next = [...currentLeads];
    next[activeIdx] = { ...activeItem, columnId: overId };
    return next;
  }

  return currentLeads;
}

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
  const filters = useCrmStore((state) => state.filters);
  const setFilters = useCrmStore((state) => state.setFilters);
  const deleteColumn = useCrmStore((state) => state.deleteColumn);
  const updateColumn = useCrmStore((state) => state.updateColumn);
  const addLead = useCrmStore((state) => state.addLead);
  const deleteLead = useCrmStore((state) => state.deleteLead);
  const updateLead = useCrmStore((state) => state.updateLead);
  const archiveLead = useCrmStore((state) => state.archiveLead);

  // Archive column va visible columnlar
  const archiveColumn = useMemo(() => columns.find(isArchiveColumn), [columns]);
  const visibleColumns = useMemo(() => columns.filter((c) => !isArchiveColumn(c)), [columns]);
  const archivedLeads = useMemo(
    () => (archiveColumn ? leads.filter((l) => l.columnId === archiveColumn.id) : []),
    [archiveColumn, leads]
  );

  // Local leads state during drag
  const [localLeads, setLocalLeads] = useState(null);
  const displayLeads = localLeads !== null ? localLeads : leads;

  useEffect(() => {
    const hasCrmPermission = user?.permission?.CRM === true;
    if (hasCrmPermission) {
      fetchCrmData();
      startPolling();
      return () => stopPolling();
    } else if (user) {
      useCrmStore.setState({ error: "permissions denied" });
    }
  }, [fetchCrmData, startPolling, stopPolling, user]);

  const [activeLead, setActiveLead] = useState(null);
  const [activeEditLead, setActiveEditLead] = useState(null);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const columnsId = useMemo(() => visibleColumns.map((col) => col.id), [visibleColumns]);
  const stretchColumns = visibleColumns.length > 0;
  const visibleStageTitles = useMemo(
    () => visibleColumns.map((col) => col.title || col.name).filter(Boolean),
    [visibleColumns]
  );

  const filteredLeads = useMemo(() => {
    return displayLeads.filter((lead) => {
      // Arxiv leadlarini board da ko'rsatmaymiz
      if (archiveColumn && lead.columnId === archiveColumn.id) return false;
      const query = searchQuery.trim().toLowerCase();
      if (
        query &&
        !lead.title?.toLowerCase().includes(query) &&
        !lead.companyName?.toLowerCase().includes(query)
      )
        return false;
      if (
        filters.phoneQuery &&
        !lead.companyName?.toLowerCase().includes(filters.phoneQuery.toLowerCase())
      )
        return false;
      if (filters.priceMin && Number(lead.price) < Number(filters.priceMin)) return false;
      if (
        filters.priceMax &&
        Number(filters.priceMax) > 0 &&
        Number(lead.price) > Number(filters.priceMax)
      )
        return false;
      return true;
    });
  }, [displayLeads, searchQuery, filters, archiveColumn]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } })
  );

  const collisionDetectionStrategy = (args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    return rectIntersection(args);
  };

  const onDragStart = (event) => {
    if (event.active.data.current?.type === "Lead") {
      setActiveLead(event.active.data.current.lead);
      setLocalLeads([...leads]);
    }
  };

  const onDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;
    if (active.data.current?.type !== "Lead") return;
    const overType = over.data.current?.type;
    if (overType !== "Lead" && overType !== "Column") return;

    setLocalLeads((prev) => {
      const current = prev ?? leads;
      const next = moveLeadInDraft(current, activeId, overId, overType);
      return next === current ? prev : next;
    });
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    let finalLeads = localLeads ?? leads;

    if (active.data.current?.type === "Lead" && over) {
      const overType = over.data.current?.type;
      finalLeads = moveLeadInDraft(finalLeads, active.id, over.id, overType);
    }

    if (finalLeads !== leads) {
      useCrmStore.setState({ leads: finalLeads });
    }

    const original = leads.find((lead) => lead.id === active.id);
    const updated = finalLeads.find((lead) => lead.id === active.id);
    if (original && updated && original.columnId !== updated.columnId) {
      updateLead(active.id, { columnId: updated.columnId });
    }

    setLocalLeads(null);
    setActiveLead(null);
  };

  const boardLeadCount = leads.filter((l) => !archiveColumn || l.columnId !== archiveColumn.id).length;
  const hasActiveFilter = searchQuery || filters.phoneQuery || filters.priceMin || filters.priceMax;

  return (
    <div className="h-[calc(100vh-64px)] sm:h-screen w-full bg-[#f0f2f5] flex flex-col pt-18 sm:pt-0">
      <LeadDetailsDrawer
        lead={activeEditLead}
        isOpen={!!activeEditLead}
        onClose={() => setActiveEditLead(null)}
      />

      <ArchiveDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        leads={archivedLeads}
        stageTitles={visibleStageTitles}
      />

      {!error && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white gap-3 shrink-0">
          <p className="text-sm text-gray-500 font-medium shrink-0">
            Jami <span className="font-bold text-gray-800">{boardLeadCount}</span> ta e'lon
            {hasActiveFilter ? ` (${filteredLeads.length} ko'rsatilmoqda)` : ""}
          </p>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Qidiruv..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-44 text-sm rounded-lg border-gray-200 bg-gray-50"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs ${
                    filters.priceMin || filters.priceMax || filters.phoneQuery
                      ? "border-blue-500 text-blue-600"
                      : "text-gray-400 border-gray-200"
                  }`}
                >
                  <Filter className="size-3.5" />
                  Filtr
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 rounded-xl p-4" align="end">
                <div className="space-y-3">
                  <h4 className="font-bold text-sm">Filterlar</h4>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Telefon</Label>
                    <Input
                      value={filters.phoneQuery}
                      onChange={(e) => setFilters({ phoneQuery: e.target.value })}
                      placeholder="+998..."
                      className="h-9 rounded-lg text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Min summa</Label>
                      <Input
                        type="number"
                        value={filters.priceMin}
                        onChange={(e) => setFilters({ priceMin: e.target.value })}
                        placeholder="0"
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Max summa</Label>
                      <Input
                        type="number"
                        value={filters.priceMax}
                        onChange={(e) => setFilters({ priceMax: e.target.value })}
                        placeholder="∞"
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ phoneQuery: "", priceMin: "", priceMax: "" })}
                    className="h-8 text-xs text-red-500 hover:bg-red-50 rounded-lg w-full"
                  >
                    Tozalash
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Arxiv tugmasi */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveOpen(true)}
              className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              <Archive className="size-3.5" />
              Arxiv
              {archivedLeads.length > 0 && (
                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {archivedLeads.length}
                </span>
              )}
            </Button>

            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <PlusCircle className="size-3.5" />
                  Bosqich
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Yangi bosqich</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Bosqich nomi
                  </Label>
                  <Input
                    placeholder="Masalan: Muzokara"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    className="h-11 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newColumnTitle.trim()) {
                        addColumn(newColumnTitle.trim());
                        setNewColumnTitle("");
                        setIsColumnDialogOpen(false);
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsColumnDialogOpen(false)}
                    className="rounded-xl font-semibold"
                  >
                    Bekor
                  </Button>
                  <Button
                    onClick={() => {
                      if (newColumnTitle.trim()) {
                        addColumn(newColumnTitle.trim());
                        setNewColumnTitle("");
                        setIsColumnDialogOpen(false);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-semibold"
                  >
                    Saqlash
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden scroll-smooth touch-pan-x">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <ShieldAlert className="size-14 text-red-400 mb-3" />
            <h3 className="text-base font-bold text-gray-900">
              {error.includes("permissions") ? "Ruxsat etilmadi" : "Xatolik yuz berdi"}
            </h3>
            <p className="text-sm text-gray-400 max-w-60 mt-1 mb-4">
              {error.includes("permissions")
                ? "Sizda ushbu bo'limni ko'rish imkoniyati yo'q."
                : "Ma'lumotlarni yuklab bo'lmadi."}
            </p>
            {!error.includes("permissions") && (
              <Button
                onClick={() => fetchCrmData()}
                size="sm"
                className="bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold"
              >
                Qayta urinish
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            collisionDetection={collisionDetectionStrategy}
          >
            <div className="flex h-full min-w-full flex-nowrap items-stretch gap-3 px-4 py-4">
              {isLoading && leads.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="basis-[240px] min-w-[240px] flex-1 flex flex-col gap-2">
                    <Skeleton className="h-11 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                ))
              ) : (
                <>
                  <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                    {visibleColumns.map((col, index) => (
                      <ColumnContainer
                        key={col.id}
                        column={col}
                        colorIndex={index}
                        stretch={stretchColumns}
                        leads={filteredLeads.filter((l) => l.columnId === col.id)}
                        deleteColumn={deleteColumn}
                        updateColumn={updateColumn}
                        addLead={addLead}
                        deleteLead={deleteLead}
                        onEditLead={setActiveEditLead}
                        onArchiveLead={archiveLead}
                      />
                    ))}
                  </SortableContext>

                  {visibleColumns.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-w-90 min-h-65 rounded-2xl border-2 border-dashed border-gray-200 bg-white px-10 py-14">
                      <PlusCircle className="size-10 text-gray-200 mb-3" />
                      <h3 className="text-sm font-bold text-gray-400 mb-1">Bosqichlar yo'q</h3>
                      <p className="text-xs text-gray-300 mb-5 text-center">
                        Birinchi kalonkani qo'shing.
                      </p>
                      <Button
                        onClick={() => setIsColumnDialogOpen(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
                      >
                        Qo'shish
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
                    <LeadCard lead={activeLead} deleteLead={deleteLead} colorIndex={0} />
                  )}
                </DragOverlay>,
                document.body
              )}
          </DndContext>
        )}
      </div>
    </div>
  );
}
