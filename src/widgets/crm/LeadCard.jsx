import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import {
  ArrowDown,
  ArrowUp,
  Trash2,
  Building2,
  ChevronDown,
  Check,
  Pencil,
} from "lucide-react";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

export const LeadCard = React.memo(({
  lead,
  deleteLead,
  onEditLead,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) => {
  const columns = useCrmStore((state) => state.columns);
  const canDeleteLead = useCrmStore((state) => state.leadDeleteSupported);
  const changeLeadColumn = useCrmStore((state) => state.changeLeadColumn);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleStatusChange = async (newColumnId) => {
    if (newColumnId === lead.columnId) return;
    const result = await changeLeadColumn(lead.id, newColumnId);
    if (result && !result.success) {
      toast.error(result.error || "Lead holatini o'zgartirib bo'lmadi");
      return;
    }

    setStatusOpen(false);
    toast.success("Lead bosqichi yangilandi");
  };

  const handleDelete = async () => {
    const result = await deleteLead(lead.id);
    if (result?.success) {
      setDeleteConfirmOpen(false);
      toast.success("Lead o'chirildi");
      return;
    }

    toast.error(result?.error || "Lead o'chirilmadi");
  };

  const handleMove = (handler) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    handler?.();
  };

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "Lead",
      lead,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[108px] shrink-0 rounded-xl border-2 border-dashed bg-white opacity-50 ring-2 ring-[#65a30d] shadow-sm"
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-full shrink-0 cursor-grab gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white px-2.5 py-2 shadow-[0px_0px_2px_0.1px_#0001] transition-colors hover:border-gray-300 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4
            className="line-clamp-1 text-[13px] leading-tight font-bold text-gray-900"
            title={lead.title}
          >
            {lead.title}
          </h4>

          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-gray-400">
            <Building2 className="size-3.5 shrink-0 text-gray-300" />
            <span className="truncate">{lead.companyName}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-[#65a30d] sm:h-8 sm:w-8"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEditLead?.(lead);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>

          {canDeleteLead && (
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 sm:h-8 sm:w-8"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-gray-100 shadow-xl">
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-red-50 text-red-500">
                    <Trash2 className="size-7" />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Leadni o'chiraymi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{lead.title}</strong> leadi doskadan olib tashlanadi. Bu amalni bekor qilib bo'lmaydi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="rounded-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Bekor qilish
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    className="rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    O'chirish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-50/80 pt-1.5">
        <div className="min-w-0 text-[12px] font-black text-[#65a30d] sm:text-[13px]">
          {(Number(lead.price) || 0).toLocaleString()} so'm
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canMoveUp}
            className="h-7 w-7 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-35 sm:h-8 sm:w-8"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleMove(onMoveUp)}
            aria-label="Leadni yuqoriga ko'tarish"
          >
            <ArrowUp className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canMoveDown}
            className="h-7 w-7 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-35 sm:h-8 sm:w-8"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleMove(onMoveDown)}
            aria-label="Leadni pastga tushirish"
          >
            <ArrowDown className="size-3.5" />
          </Button>

          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-lg px-1.5 text-[10px] font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 sm:h-8 sm:px-2 sm:text-[11px]"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="size-2 rounded-full bg-[#65a30d]" title="Holatni o'zgartirish" />
                <span>Holat</span>
                <ChevronDown className="size-3 text-gray-300" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-48 rounded-xl border-gray-100 p-1 shadow-xl"
              align="end"
              side="top"
            >
              <div className="flex flex-col gap-0.5">
                <span className="px-2 py-1.5 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Holatni o'zgartirish
                </span>
                {columns.map((col) => (
                  <button
                    type="button"
                    key={col.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStatusChange(col.id);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-bold transition-colors",
                      col.id === lead.columnId
                        ? "bg-[#ecfccb] text-[#4d7c0f]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          col.id === lead.columnId ? "bg-[#4d7c0f]" : "bg-gray-200",
                        )}
                      />
                      {col.title}
                    </div>
                    {col.id === lead.columnId && <Check className="size-3" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
});
