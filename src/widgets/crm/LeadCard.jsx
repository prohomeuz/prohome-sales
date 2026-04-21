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
import { ArrowDown, ArrowUp, Trash2, Building2, Pencil } from "lucide-react";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import { toast } from "sonner";

export const LeadCard = React.memo(
  ({
    lead,
    deleteLead,
    onEditLead,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false,
  }) => {
    const canDeleteLead = useCrmStore((state) => state.leadDeleteSupported);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const handleDelete = async () => {
      const result = await deleteLead(lead.id);
      if (result?.success) {
        setDeleteConfirmOpen(false);
        toast.success("Lead arxivga o'tkazildi");
        return;
      }

      toast.error(result?.error || "Lead arxivga o'tkazilmadi");
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
          className="h-[108px] shrink-0 rounded-xl border-2 border-dashed bg-card opacity-50 shadow-sm ring-2 ring-primary"
        />
      );
    }

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="relative w-full shrink-0 cursor-grab gap-0 overflow-hidden rounded-xl border border-border bg-card px-2.5 py-2 shadow-sm transition-colors hover:border-border/80 active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4
              className="line-clamp-1 text-[13px] leading-tight font-bold text-foreground"
              title={lead.title}
            >
              {lead.title}
            </h4>

            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Building2 className="size-3.5 shrink-0 text-muted-foreground/50" />
              <span className="truncate">{lead.companyName}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted/30 hover:text-primary sm:h-8 sm:w-8"
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
              <AlertDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:h-8 sm:w-8"
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
                <AlertDialogContent className="rounded-2xl border-border/40 shadow-xl">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-red-50 text-red-500">
                      <Trash2 className="size-7" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                      Leadni arxivga o'tkazaymi?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{lead.title}</strong> leadi arxivga o'tadi va
                      asosiy doskada ko'rinmaydi. Kerak bo'lsa keyin qayta
                      tiklash mumkin.
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
                      Arxivga o'tkazish
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/20 pt-1.5">
          <div className="min-w-0 text-[12px] font-black text-primary sm:text-[13px]">
            {(Number(lead.price) || 0).toLocaleString()} so'm
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canMoveUp}
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:pointer-events-none disabled:opacity-35 sm:h-8 sm:w-8"
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
              className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:pointer-events-none disabled:opacity-35 sm:h-8 sm:w-8"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleMove(onMoveDown)}
              aria-label="Leadni pastga tushirish"
            >
              <ArrowDown className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    );
  },
);
