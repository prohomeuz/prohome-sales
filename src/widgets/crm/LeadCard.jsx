import React, { useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Phone, ChevronDown, Archive } from "lucide-react";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { getColumnColorByTitle } from "./column-colors";

const MENU_ORDER = [
  "Yangi",
  "Qo'ng'iroq qildim",
  "Telefon ko'tarmadi",
  "Qayta qo'ng'iroq",
  "Kelishildi",
  "Spam",
  "Bekor",
];

const STATUS_DOT_BY_TITLE = {
  Yangi: "#1d4ed8",
  "Qo'ng'iroq qildim": "#06b6d4",
  "Telefon ko'tarmadi": "#f59e0b",
  "Qayta qo'ng'iroq": "#7c3aed",
  Kelishildi: "#15803d",
  Spam: "#dc2626",
  Bekor: "#4b5563",
  Arxiv: "#9ca3af",
};

function getColumnTitle(column) {
  return String(column?.title || column?.name || "").trim();
}

export const LeadCard = React.memo(
  ({ lead, deleteLead, onEditLead, onArchiveLead, colorIndex = 0 }) => {
    const columns = useCrmStore((state) => state.columns);
    const moveLeadToDifferentColumn = useCrmStore(
      (state) => state.moveLeadToDifferentColumn
    );
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);

    const currentColIdx = columns.findIndex((c) => c.id === lead.columnId);
    const effectiveIdx = currentColIdx >= 0 ? currentColIdx : colorIndex;
    const currentColumn = currentColIdx >= 0 ? columns[currentColIdx] : null;
    const color = getColumnColorByTitle(getColumnTitle(currentColumn), effectiveIdx);

    const visibleColumns = useMemo(
      () =>
        columns.filter(
          (c) =>
            c.name !== "__crm_hidden_archive__" &&
            c.title !== "__crm_hidden_archive__"
        ),
      [columns]
    );

    const orderedColumns = useMemo(() => {
      const orderMap = new Map(
        MENU_ORDER.map((title, index) => [title, index])
      );

      return [...visibleColumns].sort((a, b) => {
        const titleA = getColumnTitle(a);
        const titleB = getColumnTitle(b);
        const rankA = orderMap.has(titleA) ? orderMap.get(titleA) : MENU_ORDER.length;
        const rankB = orderMap.has(titleB) ? orderMap.get(titleB) : MENU_ORDER.length;

        if (rankA !== rankB) return rankA - rankB;
        return titleA.localeCompare(titleB);
      });
    }, [visibleColumns]);

    const handleStatusChange = (newColumnId) => {
      if (newColumnId === lead.columnId) return;
      moveLeadToDifferentColumn(lead.id, newColumnId, newColumnId, true);
      setStatusMenuOpen(false);
    };

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
      useSortable({
        id: lead.id,
        data: { type: "Lead", lead },
      });

    const style = { transition, transform: CSS.Transform.toString(transform) };

    if (isDragging) {
      return (
        <div
          ref={setNodeRef}
          style={style}
          className="opacity-40 border-2 border-dashed rounded-xl h-20 bg-gray-50"
        />
      );
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="group relative bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm rounded-xl cursor-grab active:cursor-grabbing transition-all duration-100 select-none"
      >
        <div className="px-3 pt-2.5 pb-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-1 flex-1">
              {lead.title || "-"}
            </span>
          </div>

          {lead.note && (
            <p className="text-[11px] text-gray-400 mb-1 line-clamp-1">{lead.note}</p>
          )}
          {lead.price > 0 && (
            <p className="text-[11px] text-gray-400 mb-1">
              {Number(lead.price).toLocaleString()} so'm
            </p>
          )}

          <div className="flex items-center justify-between mt-2 gap-1">
            {lead.companyName ? (
              <div className="flex items-center gap-1 min-w-0">
                <Phone className="size-3 shrink-0" style={{ color: color.bar }} />
                <span className="text-[12px] font-semibold truncate" style={{ color: color.bar }}>
                  {lead.companyName}
                </span>
              </div>
            ) : (
              <div />
            )}

            <div
              className="flex items-center gap-1 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {onArchiveLead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchiveLead(lead.id);
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded text-gray-200 hover:text-gray-500 hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Arxivga yuborish"
                >
                  <Archive className="size-3" />
                </button>
              )}

              <Popover open={statusMenuOpen} onOpenChange={setStatusMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-2xl text-white shadow-sm transition-all hover:brightness-95"
                    style={{ backgroundColor: color.bar }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    title="Holatni o'zgartirish"
                  >
                    <ChevronDown className="size-4 text-white" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-40 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
                  align="end"
                  side="top"
                  sideOffset={8}
                >
                  <div className="flex flex-col gap-0.5">
                    {orderedColumns.map((col, idx) => {
                      const title = getColumnTitle(col);
                      const fallbackColor = getColumnColorByTitle(title, idx).bar;
                      const dotColor = STATUS_DOT_BY_TITLE[title] || fallbackColor;
                      const isActive = col.id === lead.columnId;

                      return (
                        <button
                          key={col.id}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(col.id);
                          }}
                          className={`flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13px] transition-colors ${
                            isActive
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: dotColor }}
                          />
                          <span className="truncate">{title}</span>
                        </button>
                      );
                    })}

                    {onArchiveLead && (
                      <>
                        <div className="my-1 border-t border-gray-100" />
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchiveLead(lead.id);
                            setStatusMenuOpen(false);
                          }}
                          className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: STATUS_DOT_BY_TITLE.Arxiv }}
                          />
                          <span className="truncate">Arxiv</span>
                        </button>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
