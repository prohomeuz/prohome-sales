import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { LeadCard } from "./LeadCard";
import { Button } from "@/shared/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { getColumnColorByTitle } from "./column-colors";

export function ColumnContainer({
  column,
  colorIndex = 0,
  leads,
  deleteColumn,
  addLead,
  deleteLead,
  onEditLead,
  onArchiveLead,
  stretch = false,
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ title: "", price: "", companyName: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const color = getColumnColorByTitle(column.title || column.name, colorIndex);
  const leadsIds = useMemo(() => leads.map((l) => l.id), [leads]);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const style = { transition, transform: CSS.Transform.toString(transform) };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadData.title.trim()) {
      toast.error("Iltimos, ma'lumot kiriting!");
      return;
    }
    setIsSubmitting(true);
    const result = await addLead(column.id, {
      title: newLeadData.title,
      price: Number(newLeadData.price) || 0,
      companyName: newLeadData.companyName || "Noma'lum",
    });
    setIsSubmitting(false);
    if (result?.success) {
      toast.success("Sdelka qo'shildi!");
      setNewLeadData({ title: "", price: "", companyName: "" });
      setIsDialogOpen(false);
    } else if (result?.error) {
      toast.error(result.error);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, borderColor: color.bar }}
        className={cn(
          "opacity-40 border-2 border-dashed rounded-xl self-stretch",
          stretch ? "basis-[240px] min-w-[240px] flex-1" : "w-[272px] shrink-0"
        )}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-white rounded-xl flex flex-col self-stretch shadow-sm border border-gray-200 overflow-hidden",
        stretch ? "basis-[240px] min-w-[240px] flex-1" : "w-[272px] shrink-0"
      )}
    >
      {/* Rang chizig'i */}
      <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: color.bar }} />

      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2.5 shrink-0 cursor-grab active:cursor-grabbing select-none border-b border-gray-100"
        {...attributes}
        {...listeners}
      >
        <span
          className="text-[14px] font-semibold text-gray-900 truncate"
          title={column.title || column.name}
        >
          {column.title || column.name}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className="inline-flex h-5 min-w-[28px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: color.bar }}
          >
            {leads.length > 99 ? "99+" : leads.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              deleteColumn(column.id);
            }}
            className="h-6 w-6 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            title="Bosqichni o'chirish"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {/* Cards — flex-1 + overflow-y-auto = pastga cheksiz scroll */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 px-2 py-2 custom-scrollbar">
        <SortableContext items={leadsIds} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              colorIndex={colorIndex}
              deleteLead={deleteLead}
              onEditLead={onEditLead}
              onArchiveLead={onArchiveLead}
            />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex items-center justify-center py-10 text-gray-300 text-xs font-medium select-none">
            Bo'sh
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 border-t border-gray-50 shrink-0">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-7 flex gap-1 items-center text-gray-300 text-xs font-semibold hover:text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <Plus size={12} />
              Qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Yangi sdelka</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-3 pt-2">
              <div>
                <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ism / Ma'lumot</Label>
                <Input
                  autoFocus
                  placeholder="..."
                  value={newLeadData.title}
                  onChange={(e) => setNewLeadData({ ...newLeadData, title: e.target.value })}
                  className="rounded-xl h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">Telefon / Kontakt</Label>
                <Input
                  placeholder="+998..."
                  value={newLeadData.companyName}
                  onChange={(e) => setNewLeadData({ ...newLeadData, companyName: e.target.value })}
                  className="rounded-xl h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">Summa (so'm)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newLeadData.price}
                  onChange={(e) => setNewLeadData({ ...newLeadData, price: e.target.value })}
                  className="rounded-xl h-10 text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl h-10 text-sm font-bold text-white"
                style={{ backgroundColor: color.bar }}
              >
                {isSubmitting ? (
                  <><Loader2 className="size-4 animate-spin mr-2" />Saqlanmoqda...</>
                ) : "Saqlash"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
