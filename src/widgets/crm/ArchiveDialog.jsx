import { useMemo, useState } from "react";
import { Archive, Search, RotateCcw, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";

const TOAST_OPTS = { position: "top-center" };

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getInfo(lead) {
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
  return lead.title || fullName || "-";
}

function getPhone(lead) {
  return lead.phone || lead.companyName || "-";
}

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   leads: object[],
 *   visibleColumns: object[],
 *   onRestore: (leadId: number, columnId: number) => Promise<void>,
 *   onDelete: (leadId: number) => Promise<void>,
 * }} props
 */
export function ArchiveDialog({ open, onOpenChange, leads, visibleColumns = [], onRestore, onDelete }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        getInfo(l).toLowerCase().includes(q) ||
        getPhone(l).toLowerCase().includes(q)
    );
  }, [leads, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Archive className="size-4 text-gray-400" />
            Arxiv
            <span className="ml-1 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {leads.length} ta
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-300 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ism yoki telefon bo'yicha qidirish..."
              className="h-9 rounded-xl bg-gray-50 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 pb-5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300">
              <Archive className="size-10 mb-2" />
              <p className="text-sm font-medium">Arxiv bo'sh</p>
            </div>
          ) : (
            <div className="space-y-1.5 mt-2">
              {filtered.map((lead) => (
                <ArchiveRow
                  key={lead.id}
                  lead={lead}
                  visibleColumns={visibleColumns}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * @param {{
 *   lead: object,
 *   visibleColumns: object[],
 *   onRestore: Function,
 *   onDelete: Function,
 * }} props
 */
function ArchiveRow({ lead, visibleColumns, onRestore, onDelete }) {
  const [selectedColId, setSelectedColId] = useState(
    visibleColumns[0] ? String(visibleColumns[0].id) : ""
  );
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRestore = async () => {
    if (!selectedColId || !onRestore) return;
    setRestoring(true);
    await onRestore(lead.id, Number(selectedColId));
    setRestoring(false);
    toast.success(`"${getInfo(lead)}" qaytarildi`, TOAST_OPTS);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(lead.id);
    setDeleting(false);
    toast.success(`"${getInfo(lead)}" o'chirildi`, TOAST_OPTS);
  };

  return (
    <div className="group flex items-center justify-between gap-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl px-3 py-2.5">
      {/* Ism + telefon + vaqt */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-gray-900 truncate">{getInfo(lead)}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {getPhone(lead) !== "-" && (
            <span className="text-[12px] text-blue-500 font-medium">{getPhone(lead)}</span>
          )}
          <span className="text-[11px] text-gray-300">{formatDate(lead.createdAt)}</span>
        </div>
      </div>

      {/* Bosqich tanlash + qaytarish tugmasi */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Select value={selectedColId} onValueChange={setSelectedColId}>
          <SelectTrigger className="h-8 w-36 rounded-lg text-xs border-gray-200 bg-gray-50">
            <SelectValue placeholder="Bosqich" />
          </SelectTrigger>
          <SelectContent>
            {visibleColumns.map((col) => (
              <SelectItem key={col.id} value={String(col.id)} className="text-xs">
                {col.title || col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="icon"
          variant="ghost"
          disabled={restoring || !selectedColId}
          onClick={handleRestore}
          className="h-8 w-8 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          title="Qaytarish"
        >
          {restoring ? (
            <span className="size-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          disabled={deleting}
          onClick={handleDelete}
          className="h-8 w-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="O'chirish"
        >
          {deleting ? (
            <span className="size-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
