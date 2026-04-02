import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useRef, useState } from "react";
import { LeadCard } from "./LeadCard";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import { Button } from "@/shared/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";

export function ColumnContainer({ column, leads, deleteColumn, addLead, deleteLead, updateColumn, onEditLead }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ title: "", price: "", companyName: "" });
  const [formErrors, setFormErrors] = useState({ title: "", price: "", companyName: "" });
  const [showTopEdgeShadow, setShowTopEdgeShadow] = useState(false);
  const [showBottomEdgeShadow, setShowBottomEdgeShadow] = useState(false);
  const scrollAreaRef = useRef(null);
  const canDeleteColumn = !String(column.id).startsWith("stage-");
  const moveLeadByColumnIndex = useCrmStore((state) => state.moveLeadByColumnIndex);

  const leadsIds = useMemo(() => leads.map((l) => l.id), [leads]);
  const columnScrollShadowStyle = useMemo(() => {
    const shadows = [];

    if (showTopEdgeShadow) {
      shadows.push("inset 0 14px 18px -18px rgba(148, 163, 184, 0.32)");
    }

    if (showBottomEdgeShadow) {
      shadows.push("inset 0 -16px 20px -20px rgba(148, 163, 184, 0.34)");
    }

    return shadows.length ? { boxShadow: shadows.join(", ") } : undefined;
  }, [showBottomEdgeShadow, showTopEdgeShadow]);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const updateScrollShadows = () => {
      const maxScrollTop = el.scrollHeight - el.clientHeight;
      setShowTopEdgeShadow(el.scrollTop > 6);
      setShowBottomEdgeShadow(maxScrollTop > 6 && el.scrollTop < maxScrollTop - 6);
    };

    updateScrollShadows();
    el.addEventListener("scroll", updateScrollShadows, { passive: true });
    window.addEventListener("resize", updateScrollShadows);

    return () => {
      el.removeEventListener("scroll", updateScrollShadows);
      window.removeEventListener("resize", updateScrollShadows);
    };
  }, [leads.length]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetLeadForm = () => {
    setNewLeadData({ title: "", price: "", companyName: "" });
    setFormErrors({ title: "", price: "", companyName: "" });
  };

  const handleDialogChange = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      resetLeadForm();
    }
  };

  const handleFieldChange = (field, value) => {
    setNewLeadData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) =>
      prev[field]
        ? {
            ...prev,
            [field]: "",
          }
        : prev,
    );
  };

  const validateLeadForm = () => {
    const nextErrors = { title: "", price: "", companyName: "" };

    if (!newLeadData.title.trim() || newLeadData.title.trim().length < 2) {
      nextErrors.title = "Lead nomi kamida 2 ta belgidan iborat bo'lsin.";
    }

    if (!newLeadData.companyName.trim() || newLeadData.companyName.trim().length < 3) {
      nextErrors.companyName = "Kontakt kamida 3 ta belgidan iborat bo'lsin.";
    }

    if (newLeadData.price === "") {
      nextErrors.price = "Summani kiriting.";
    } else if (Number.isNaN(Number(newLeadData.price))) {
      nextErrors.price = "Summa son ko'rinishida bo'lsin.";
    } else if (Number(newLeadData.price) < 0) {
      nextErrors.price = "Summa manfiy bo'lmasin.";
    }

    setFormErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!validateLeadForm()) {
      toast.error("Lead qo'shish uchun maydonlarni to'g'ri to'ldiring.");
      return;
    }

    setIsSubmitting(true);
    const result = await addLead(column.id, {
      title: newLeadData.title.trim(),
      price: Number(newLeadData.price) || 0,
      companyName: newLeadData.companyName.trim() || "Noma'lum"
    });
    setIsSubmitting(false);

    if (result && result.success) {
      toast.success("Sdelka muvaffaqiyatli qo'shildi!");
      resetLeadForm();
      setIsDialogOpen(false);
    } else if (result && result.error) {
      toast.error(result.error);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex h-full max-h-full min-h-[400px] w-[calc(100vw-1rem)] max-w-[380px] shrink-0 self-stretch flex-col rounded-2xl border border-[#65a30d] border-dashed bg-gray-50 opacity-50 ring-[1px] ring-[#65a30d] sm:w-[320px] lg:max-w-none lg:rounded-none lg:border-x-0 lg:border-y-0 lg:border-r lg:border-dashed lg:bg-transparent lg:ring-0 lg:first:border-l"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex h-full max-h-full min-h-[400px] w-[calc(100vw-1rem)] max-w-[380px] snap-center shrink-0 self-stretch flex-col items-center overflow-hidden rounded-2xl border border-gray-100 bg-white py-2 shadow-sm sm:w-[320px] sm:snap-start lg:max-w-none lg:rounded-none lg:border-0 lg:border-r lg:border-gray-200 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none lg:first:border-l"
    >
      <div className="flex h-11 w-full shrink-0 items-center justify-between border-b border-gray-50 bg-white px-3 sm:h-12 lg:h-auto lg:border-b-0 lg:bg-white lg:pl-4 lg:pr-4 lg:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[13px] font-bold tracking-tight text-gray-800" title={column.title}>
            {column.title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex items-center justify-center rounded-full bg-[#ecfccb] px-2 py-0.5 text-[10px] font-bold text-[#4d7c0f]">
            {leads.length}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              const result = await deleteColumn(column.id);
              if (result?.success) {
                toast.success("Bosqich o'chirildi!");
              } else if (result?.error) {
                toast.error(result.error);
              }
            }}
            disabled={!canDeleteColumn}
            className="h-7 w-7 rounded-lg text-gray-200 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div
        className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-gray-50/10 px-1.5 py-2 transition-[box-shadow] duration-200 lg:bg-transparent lg:pl-4 lg:pr-1 lg:py-0"
        style={columnScrollShadowStyle}
      >
        <div
          ref={scrollAreaRef}
          className="custom-scrollbar [scrollbar-gutter:auto] flex h-full min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden pl-1 pr-2 pb-3 pt-1 lg:pl-0.5 lg:pr-2 lg:pb-4"
        >
          <SortableContext items={leadsIds} strategy={verticalListSortingStrategy}>
            {leads.map((lead, index) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                deleteLead={deleteLead}
                onEditLead={onEditLead}
                canMoveUp={index > 0}
                canMoveDown={index < leads.length - 1}
                onMoveUp={() => moveLeadByColumnIndex(lead.id, "up")}
                onMoveDown={() => moveLeadByColumnIndex(lead.id, "down")}
              />
            ))}
            {leads.length === 0 && (
              <div className="flex flex-1 items-center justify-center py-10 opacity-30 select-none">
                <span className="text-[14px] tracking-[0.1px] text-gray-400">
                  Hozircha bo'sh
                </span>
              </div>
            )}
          </SortableContext>
        </div>
      </div>

      <div className="mt-auto w-full shrink-0 border-t border-gray-100 bg-white px-2 py-1.5 lg:border-t lg:border-gray-200 lg:bg-white lg:pl-3 lg:pr-3 lg:py-2.5">
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-8 w-full items-center gap-1 rounded-lg border border-transparent px-2 text-[11px] font-bold text-gray-400 hover:border-[#588f0b] hover:bg-[#ecfccb]/20 hover:text-[#65a30d]">
              <Plus size={13} />
              Qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-1rem)] max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Yangi sdelka</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-gray-400 uppercase">Ma'lumot</Label>
                <Input
                  id="title"
                  autoFocus
                  placeholder="..."
                  value={newLeadData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  required
                  aria-invalid={!!formErrors.title}
                  className="rounded-xl h-10 text-sm"
                />
                {formErrors.title && (
                  <p className="text-xs font-medium text-red-500">{formErrors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-xs font-bold text-gray-400 uppercase">Kontakt</Label>
                <Input
                  id="companyName"
                  placeholder="..."
                  value={newLeadData.companyName}
                  onChange={(e) => handleFieldChange("companyName", e.target.value)}
                  required
                  aria-invalid={!!formErrors.companyName}
                  className="rounded-xl h-10 text-sm"
                />
                {formErrors.companyName && (
                  <p className="text-xs font-medium text-red-500">{formErrors.companyName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs font-bold text-gray-400 uppercase">Summa (so'm)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={newLeadData.price}
                  onChange={(e) => handleFieldChange("price", e.target.value)}
                  required
                  aria-invalid={!!formErrors.price}
                  className="rounded-xl h-10 text-sm"
                />
                {formErrors.price && (
                  <p className="text-xs font-medium text-red-500">{formErrors.price}</p>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#65a30d] hover:bg-[#4d7c0f] text-white rounded-xl h-10 text-sm font-bold flex gap-2 items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Bajarilmoqda...
                  </>
                ) : (
                  "Saqlash"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
