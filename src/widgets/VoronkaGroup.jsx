// VoronkaGroup.jsx
// 2+ ketma-ket yopilgan columnlar → bitta compact guruh sifatida ko'rsatiladi.
// Bosilganda ichidagi individual collapsed columnlar ko'rinadi.
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Icons from "lucide-react";
import { memo, useState } from "react";

// ─── Individual collapsed item (expanded view) ────────────────────────────────
function CollapsedItem({
  col,
  leads,
  isDraggingCard,
  onExpand,
  isFirst,
  isLast,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `col-${col.id}` });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: col.status });

  const Icon = Icons[col.icon] ?? Icons.Tag;

  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.25,1,0.5,1)",
    opacity: isDragging ? 0.4 : 1,
    touchAction: "none",
    borderColor: col.color,
    width: 44,
    minHeight: 0,
    height: "100%",
    maxHeight: "100%",
  };

  return (
    <div
      ref={(n) => {
        setNodeRef(n);
        setDropRef(n);
      }}
      style={itemStyle}
      onDoubleClick={() => onExpand(col.id)}
      title={`${col.status} — ochish uchun 2 marta bosing`}
      className={[
        "relative flex cursor-pointer flex-col items-center py-3 select-none",
        "transition-colors duration-300",
        isFirst ? "rounded-l border-l-[3px]" : "",
        isLast ? "rounded-r" : "",
        "bg-background border-y border-r",
        isOver && isDraggingCard ? "bg-rose-200/60" : "",
      ].join(" ")}
    >
      {/* Drag handle */}
      <button
        className="text-muted-foreground mb-1 cursor-grab touch-none text-[10px] active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>

      {/* Lead count */}
      <span className="bg-accent mb-2 inline-flex size-4 items-center justify-center rounded-full text-[9px] font-medium shadow">
        {leads.length}
      </span>

      {/* Icon */}
      <Icon size={12} style={{ color: col.color }} className="mb-1 shrink-0" />

      {/* Vertical text */}
      <span
        className="flex-1 text-[9px] font-bold tracking-widest uppercase"
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          color: col.color,
        }}
      >
        {col.status}
      </span>
    </div>
  );
}

// ─── Compact summary pill ─────────────────────────────────────────────────────
function CompactPill({ columns, leadsMap, colMeta, onClick }) {
  const totalLeads = columns.reduce(
    (s, c) => s + (colMeta?.[c.status]?.total ?? leadsMap[c.status]?.length ?? 0),
    0,
  );

  // Show up to 6 color dots; rest as "+N"
  const dots = columns.slice(0, 6);
  const extra = columns.length - dots.length;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${columns.length} ta yopiq column — ochish uchun bosing`}
      className="bg-background hover:bg-accent group flex h-full min-h-0 cursor-pointer flex-col items-center gap-1.5 rounded border px-2 py-3 transition-colors duration-200 select-none"
      style={{ width: 44 }}
    >
      {/* Color dot stack */}
      <div className="flex flex-col items-center gap-[3px]">
        {dots.map((col) => (
          <span
            key={col.id}
            className="size-2 rounded-full shrink-0"
            style={{ background: col.color }}
          />
        ))}
        {extra > 0 && (
          <span className="text-muted-foreground text-[8px] font-bold">
            +{extra}
          </span>
        )}
      </div>

      {/* Count badge */}
      <span className="bg-accent inline-flex size-5 items-center justify-center rounded-full text-[9px] font-bold shadow">
        {columns.length}
      </span>

      {/* Lead count */}
      <span className="text-muted-foreground text-[8px]">{totalLeads}</span>

      {/* Vertical label */}
      <span
        className="text-muted-foreground group-hover:text-foreground mt-auto text-[8px] font-bold tracking-widest uppercase transition-colors"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        GURUH
      </span>
    </button>
  );
}

// ─── Main VoronkaGroup ────────────────────────────────────────────────────────
const VoronkaGroup = memo(function VoronkaGroup({
  columns,
  leadsMap,
  colMeta,
  isDraggingCard,
  onExpandAll,
}) {
  const [open, setOpen] = useState(false);

  function handleExpand(colId) {
    onExpandAll(colId);
    // If only 1 remaining after expand, the group disappears — reset just in case
  }

  if (!open) {
    return (
      <CompactPill
        columns={columns}
        leadsMap={leadsMap}
        colMeta={colMeta}
        onClick={() => setOpen(true)}
      />
    );
  }

  // Expanded: show individual collapsed items
  return (
    <div
      className="relative flex h-full shrink-0 items-stretch self-stretch"
      style={{
        animation: "groupExpand 220ms cubic-bezier(0.25,1,0.5,1) both",
      }}
    >
      {/* Close / collapse group button */}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="bg-background hover:bg-accent text-muted-foreground hover:text-foreground absolute -top-0.5 left-1/2 z-20 flex size-4 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full border text-[10px] transition-colors"
        title="Guruhni yig'ish"
      >
        ×
      </button>

      {columns.map((col, idx) => (
        <CollapsedItem
          key={col.id}
          col={col}
          leads={leadsMap[col.status] ?? []}
          isDraggingCard={isDraggingCard}
          onExpand={handleExpand}
          isFirst={idx === 0}
          isLast={idx === columns.length - 1}
        />
      ))}
    </div>
  );
});

export default VoronkaGroup;
