import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Icons from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lead from "./Lead";

// ─── Collapsed view ───────────────────────────────────────────────────────────
function CollapsedColumn({ voronkaData, leadsCount, setSortRef, transform, transition, isColDrag, setDropRef, isOver, isDraggingCard, onExpand, attributes, listeners }) {
  const Icon = Icons[voronkaData.icon] ?? Icons.Tag;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 220ms cubic-bezier(0.25,1,0.5,1)",
    opacity: isColDrag ? 0.4 : 1,
    touchAction: "none",
    borderColor: voronkaData.color,
    width: 44,
    height: "100%",
    minHeight: 0,
    maxHeight: "100%",
    backgroundColor: isOver && isDraggingCard ? "rgb(253 164 175 / 0.4)" : undefined,
    borderLeftWidth: 3,
  };

  return (
    <div
      ref={(n) => { setSortRef(n); setDropRef(n); }}
      style={style}
      onDoubleClick={onExpand}
      title={`${voronkaData.status} — ochish uchun 2 marta bosing`}
      className="relative flex cursor-pointer flex-col items-center rounded border-y border-r bg-background py-3 transition-colors duration-200 select-none"
    >
      <button
        className="text-muted-foreground mb-2 cursor-grab touch-none text-[10px] active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      <span className="bg-accent mb-2 inline-flex size-5 items-center justify-center rounded-full text-[9px] font-bold shadow">
        {leadsCount}
      </span>
      <Icon size={12} style={{ color: voronkaData.color }} className="mb-1 shrink-0" />
      <span
        className="flex-1 text-[9px] font-bold tracking-widest uppercase"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: voronkaData.color }}
      >
        {voronkaData.status}
      </span>
    </div>
  );
}

// ─── Main Voronka ─────────────────────────────────────────────────────────────
const Voronka = memo(function Voronka({
  leads, voronkaData, isDraggingCard, activeCardStatus,
  highlightedLeadId, onCollapseChange, onVisible, onLoadMore,
  colMeta, onAddLead, onOpenLead,
}) {
  const rootRef = useRef(null);
  const bodyRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Lazy loading via IntersectionObserver
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) onVisible?.(voronkaData.status); },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voronkaData.status]);

  // Scroll-aware header
  const handleBodyScroll = useCallback(() => {
    setIsScrolled((bodyRef.current?.scrollTop ?? 0) > 4);
  }, []);

  const {
    attributes, listeners, setNodeRef: setSortRef,
    transform, transition, isDragging: isColDrag,
  } = useSortable({ id: `col-${voronkaData.id}` });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: voronkaData.status });

  // Expand collapsed column when card dragged over it
  useEffect(() => {
    if (isDraggingCard && isOver && voronkaData.collapsed) {
      onCollapseChange(voronkaData.id, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingCard, isOver]);

  const Icon = Icons[voronkaData.icon] ?? Icons.Tag;
  const meta = colMeta?.[voronkaData.status];
  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);
  const isHighlighted = isDraggingCard && activeCardStatus === voronkaData.status;
  // Use API total when available (covers collapsed columns too)
  const leadsCount = meta?.total ?? leads.length;

  const colStyle = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 220ms cubic-bezier(0.25,1,0.5,1)",
    opacity: isColDrag ? 0.4 : 1,
    touchAction: "none",
    maxHeight: "100%",
  };

  // ── Collapsed rendering ──────────────────────────────────────────────────
  if (voronkaData.collapsed) {
    return (
      <div
        ref={(n) => { setSortRef(n); rootRef.current = n; }}
        style={{ ...colStyle, height: "100%", minHeight: 0, overflow: "hidden" }}
        className="self-stretch"
      >
        <CollapsedColumn
          voronkaData={voronkaData}
          leadsCount={leadsCount}
          setSortRef={() => {}}
          transform={null}
          transition={null}
          isColDrag={isColDrag}
          setDropRef={setDropRef}
          isOver={isOver}
          isDraggingCard={isDraggingCard}
          onExpand={() => onCollapseChange(voronkaData.id, false)}
          attributes={attributes}
          listeners={listeners}
        />
      </div>
    );
  }

  // ── Expanded rendering ───────────────────────────────────────────────────
  return (
    <div
      ref={(n) => { setSortRef(n); rootRef.current = n; }}
      style={{ ...colStyle, width: 300, minWidth: 300, height: "100%" }}
      className="flex flex-col"
    >
      {/* Sticky Header */}
      <div
        onDoubleClick={() => onCollapseChange(voronkaData.id, true)}
        className="sticky top-0 z-10 flex w-full shrink-0 items-center justify-between p-2 font-mono text-xs font-bold tracking-widest uppercase select-none transition-all duration-200"
        style={{
          borderColor: voronkaData.color,
          borderBottomWidth: isScrolled ? 2 : 6,
          borderBottomStyle: "solid",
          backgroundColor: isHighlighted ? "rgb(253 164 175)" : "var(--background)",
          boxShadow: isScrolled ? "0 2px 8px -2px rgb(0 0 0 / 0.12)" : "none",
        }}
        title="Yopish uchun 2 marta bosing"
      >
        <button
          className="text-muted-foreground hover:text-foreground mr-1.5 cursor-grab touch-none transition-colors active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </button>
        <Icon size={12} className="mr-1 shrink-0" style={{ color: voronkaData.color }} />
        <h3 className="flex-1 truncate">{voronkaData.status}</h3>
        <div className="flex items-center gap-1">
          <span className="bg-accent inline-flex size-5 items-center justify-center rounded-full font-medium shadow">
            {leadsCount}
          </span>
          {/* Add lead button */}
          {onAddLead && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddLead(voronkaData.status); }}
              className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-5 items-center justify-center rounded transition-colors"
              title="Yangi mijoz qo'shish"
            >
              <Icons.Plus size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCollapseChange(voronkaData.id, true); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Yopish"
          >
            «
          </button>
        </div>
      </div>

      {/* Cards body */}
      <div
        ref={(n) => { setDropRef(n); bodyRef.current = n; }}
        onScroll={handleBodyScroll}
        className="flex flex-1 flex-col overflow-y-auto"
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <ul
            className="flex flex-col gap-1 p-0.5 transition-colors duration-200"
            style={{
              minHeight: "100%",
              backgroundColor: isHighlighted ? "rgb(253 164 175 / 0.3)" : undefined,
            }}
          >
            {/* Loading skeletons */}
            {meta?.loading && leads.length === 0 &&
              [1, 2, 3].map((i) => (
                <li key={i} className="bg-muted h-14 animate-pulse rounded border" style={{ animationDelay: `${i * 80}ms` }} />
              ))}

            {/* Empty state */}
            {!meta?.loading && leads.length === 0 && (
              <li className="flex flex-col items-center gap-2 py-10 text-center">
                <Icons.Inbox className="text-muted-foreground/30" size={28} />
                <span className="text-muted-foreground text-xs">Bu bosqichda mijoz yo'q</span>
                {onAddLead && (
                  <button
                    type="button"
                    onClick={() => onAddLead(voronkaData.status)}
                    className="text-primary text-xs hover:underline"
                  >
                    + Mijoz qo'shish
                  </button>
                )}
              </li>
            )}

            {/* Lead cards */}
            {leads.map((lead) => (
              <Lead
                key={lead.id}
                data={lead}
                highlighted={highlightedLeadId === lead.id}
                onOpen={onOpenLead}
              />
            ))}

            {/* Invisible drop target extender — keeps full height droppable */}
            <li aria-hidden className="pointer-events-none flex-1" style={{ minHeight: 40 }} />

            {/* Load more */}
            {meta?.hasMore && (
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => onLoadMore?.(voronkaData.status)}
                  disabled={meta.loading}
                  className="text-muted-foreground hover:text-foreground w-full rounded border border-dashed py-1.5 text-xs transition-colors disabled:opacity-50"
                >
                  {meta.loading ? "Yuklanmoqda…" : "Ko'proq yuklash"}
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      </div>
    </div>
  );
});

export default Voronka;
