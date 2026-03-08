import { Badge } from "@/shared/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { ExternalLink, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SearchModal({ open, onClose, leads, onSelectLead, onOpenLead }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const workerRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../workers/search.js", import.meta.url),
      { type: "module" },
    );
    workerRef.current.onmessage = ({ data }) => {
      setResults(data);
      setSelectedIdx(0);
    };
    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ leads, query });
  }, [query, leads]);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); setSelectedIdx(0); }
  }, [open]);

  useEffect(() => {
    if (!listRef.current || !results.length) return;
    const el = listRef.current.children[selectedIdx];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIdx, results.length]);

  function handleSelect(lead) {
    onSelectLead(lead);
    onClose();
  }

  function handleOpenDetail(e, lead) {
    e.stopPropagation();
    onOpenLead?.(lead);
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const lead = results[selectedIdx]; if (lead) handleSelect(lead); }
    else if (e.key === "Escape") { onClose(); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[540px]">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="sr-only">Qidiruv</DialogTitle>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2" size={15} />
            <Input
              autoFocus
              placeholder="Ism, telefon, manzil, status bo'yicha qidiring…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="rounded-none border-0 border-b pl-9 text-sm focus-visible:ring-0"
            />
          </div>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto" ref={listRef}>
          {query.trim() === "" && (
            <div className="flex flex-col items-center gap-2 py-12">
              <Search className="text-muted-foreground/40" size={32} />
              <p className="text-muted-foreground text-xs">Qidirish uchun yozishni boshlang…</p>
            </div>
          )}

          {query.trim() !== "" && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <Search className="text-muted-foreground/40" size={32} />
              <p className="text-muted-foreground text-xs">Natija topilmadi</p>
              <p className="text-muted-foreground/60 text-[11px]">"{query}" bo'yicha hech narsa yo'q</p>
            </div>
          )}

          {results.map((lead, idx) => (
            <div
              key={lead.id}
              className={[
                "flex w-full items-start gap-2 border-b px-4 py-3 last:border-0 transition-colors",
                idx === selectedIdx ? "bg-accent" : "hover:bg-accent/50",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => handleSelect(lead)}
                className="flex flex-1 flex-col items-start gap-1 text-left min-w-0"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{lead.title}</span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">{lead.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {lead.phone && <span className="text-muted-foreground text-xs">{lead.phone}</span>}
                  {lead.budget != null && (
                    <span className="text-xs font-medium" style={{ color: '#10b981' }}>
                      ${lead.budget.toLocaleString()}
                    </span>
                  )}
                  {lead.address && <span className="text-muted-foreground text-xs truncate">{lead.address}</span>}
                </div>
              </button>

              {/* Detail button */}
              {onOpenLead && (
                <button
                  type="button"
                  onClick={(e) => handleOpenDetail(e, lead)}
                  title="Batafsil ko'rish"
                  className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 rounded p-1 transition-colors hover:bg-background"
                >
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          ))}

          {results.length > 0 && (
            <p className="text-muted-foreground border-t px-4 py-2 text-[10px]">
              {results.length} natija ·{" "}
              <kbd className="rounded border px-1">↑↓</kbd> navigatsiya ·{" "}
              <kbd className="rounded border px-1">Enter</kbd> tanlash
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
