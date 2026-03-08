import { memo, useCallback, useEffect, useRef, useState } from "react";

const W = 14;
const H = 36;
const G = 2;

const MiniMapScroll = memo(function MiniMapScroll({ voronka, scrollRef }) {
  const pardaRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });
  const [hasScroll, setHasScroll] = useState(false);

  const visible = voronka.filter((v) => !v.collapsed);
  const totalW = visible.length * (W + G);

  const update = useCallback(() => {
    const el = scrollRef?.current;
    const parda = pardaRef.current;
    setHasScroll(!!el && el.scrollWidth > el.clientWidth + 4);
    if (!el || !parda || !totalW) return;
    const ratio = el.scrollLeft / (el.scrollWidth - el.clientWidth || 1);
    const vis = Math.min(1, el.clientWidth / (el.scrollWidth || 1));
    const pw = Math.max(W, totalW * vis);
    const px = ratio * (totalW - pw);
    parda.style.width = `${pw}px`;
    parda.style.transform = `translateX(${Math.max(0, px)}px)`;
  }, [scrollRef, totalW]);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, [scrollRef, update]);

  function onDown(e) {
    drag.current = { active: true, startX: e.clientX, startScroll: scrollRef?.current?.scrollLeft ?? 0 };
    e.preventDefault();
    e.stopPropagation();
  }

  useEffect(() => {
    function onMove(e) {
      if (!drag.current.active) return;
      const el = scrollRef?.current;
      const parda = pardaRef.current;
      if (!el || !parda) return;
      const pw = parda.clientWidth;
      const dx = e.clientX - drag.current.startX;
      const max = el.scrollWidth - el.clientWidth;
      el.scrollLeft = Math.min(max, Math.max(0, drag.current.startScroll + (dx / (totalW - pw || 1)) * max));
    }
    function onUp() { drag.current.active = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [scrollRef, totalW]);

  function scrollTo(idx) {
    const el = scrollRef?.current;
    if (!el) return;
    let off = 0, vi = 0;
    for (const v of voronka) {
      if (v.collapsed) { off += 44 + 4; continue; }
      if (vi++ === idx) break;
      off += 300 + 8;
    }
    el.scrollTo({ left: off, behavior: "smooth" });
  }

  if (!visible.length || !hasScroll) return null;

  return (
    <div className="bg-background/95 fixed right-3 bottom-3 z-50 rounded-md border p-1.5 shadow-sm backdrop-blur-sm">
      <div className="relative flex items-end gap-[2px]" style={{ height: H }}>
        {visible.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => scrollTo(i)}
            title={v.status}
            className="bg-muted shrink-0 rounded-[3px] transition-opacity hover:opacity-70"
            style={{ width: W, height: H }}
          />
        ))}
        <div
          ref={pardaRef}
          onMouseDown={onDown}
          className="border-primary/50 bg-primary/15 absolute inset-y-0 left-0 cursor-grab rounded-[3px] border active:cursor-grabbing"
          style={{ minWidth: W }}
        />
      </div>
    </div>
  );
});

export default MiniMapScroll;
