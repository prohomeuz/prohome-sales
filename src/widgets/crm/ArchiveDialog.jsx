import { useMemo, useState } from "react";
import { Archive, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const TAB_CARGO = "cargo";
const TAB_DRIVER = "driver";
const STATUS_ALL = "__all__";
const STATUS_ARCHIVE = "Arxiv";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "-";
  return `${number.toLocaleString("uz-UZ")} so'm`;
}

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

function getPhone(lead) {
  return lead.phone || lead.companyName || "-";
}

function getInfo(lead) {
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
  return lead.title || fullName || "-";
}

function getRoute(lead) {
  return lead.route || lead.address || lead.city || lead.region || "-";
}

function getStatus(lead) {
  return lead.previousStatusTitle || lead.previousStatus || lead.statusName || STATUS_ARCHIVE;
}

function getLeadType(lead) {
  return normalize(lead.leadType || lead.type || lead.category || "");
}

export function ArchiveDialog({
  open,
  onOpenChange,
  leads,
  stageTitles = [],
}) {
  const [activeTab, setActiveTab] = useState(TAB_CARGO);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusOptions = useMemo(() => {
    const options = new Set([STATUS_ALL, STATUS_ARCHIVE]);
    stageTitles.forEach((title) => {
      const cleaned = String(title || "").trim();
      if (cleaned) options.add(cleaned);
    });
    return Array.from(options);
  }, [stageTitles]);

  const filteredLeads = useMemo(() => {
    const q = normalize(query);
    return leads.filter((lead) => {
      const type = getLeadType(lead);
      const isDriver =
        type.includes("driver") || type.includes("haydovchi") || type.includes("voditel");
      if (activeTab === TAB_DRIVER && !isDriver) return false;
      if (activeTab === TAB_CARGO && isDriver) return false;

      if (statusFilter !== STATUS_ALL && normalize(getStatus(lead)) !== normalize(statusFilter)) {
        return false;
      }

      if (q) {
        const searchable = [
          getInfo(lead),
          getPhone(lead),
          getRoute(lead),
          getStatus(lead),
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      if (showBlacklist && !Boolean(lead.isBlacklisted || lead.blacklist)) return false;

      return true;
    });
  }, [activeTab, leads, query, showBlacklist, statusFilter]);

  const resetFilters = () => {
    setQuery("");
    setStatusFilter(STATUS_ALL);
    setShowBlacklist(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[88vh] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-[#f8f8fb] p-0 sm:max-w-[calc(100%-2rem)]"
      >
        <div className="flex h-full flex-col p-4 sm:p-5">
          <div className="mb-2 flex items-end justify-between gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
              <TabsList className="bg-transparent p-0">
                <TabsTrigger
                  value={TAB_CARGO}
                  className="h-10 rounded-none border-b-2 border-transparent px-0 pr-7 text-base text-gray-700 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                >
                  Yuk leadlari
                </TabsTrigger>
                <TabsTrigger
                  value={TAB_DRIVER}
                  className="h-10 rounded-none border-b-2 border-transparent px-0 text-base text-gray-700 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                >
                  Haydovchi leadlari
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-blue-300 bg-white px-4 text-blue-600 hover:bg-blue-50"
            >
              <Archive className="mr-1.5 size-4" />
              Arxiv
            </Button>
          </div>

          <div className="mb-3 mt-4 flex flex-wrap items-center gap-2">
            <div className="relative w-70 min-w-[250px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Telefon yoki matn bo'yicha qidirish"
                className="h-9 rounded-xl bg-white pl-9 text-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[180px] rounded-xl bg-white text-sm">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent align="start">
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === STATUS_ALL ? "Holat" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 px-1 text-sm text-gray-800">
              <Checkbox
                checked={showBlacklist}
                onCheckedChange={(checked) => setShowBlacklist(Boolean(checked))}
              />
              Qora ro'yxatni chiqarish
            </label>

            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="h-9 rounded-xl bg-white px-4 text-sm"
            >
              <SlidersHorizontal className="mr-1.5 size-4" />
              Tozalash
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-md px-1 py-1 text-sm text-gray-700 hover:text-gray-900"
          >
            <ChevronRight
              className={`size-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
            />
            <SlidersHorizontal className="size-4" />
            Kengaytirilgan filterlar
          </button>

          {showAdvanced && (
            <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-500">
              Qo'shimcha filterlar keyingi bosqichda ulanadi.
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-0 flex-1">
            <TabsContent value={TAB_CARGO} className="min-h-0">
              <ArchiveTable rows={filteredLeads} />
            </TabsContent>
            <TabsContent value={TAB_DRIVER} className="min-h-0">
              <ArchiveTable rows={filteredLeads} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveTable({ rows }) {
  return (
    <div className="min-h-0 h-[calc(100%-4px)] overflow-auto rounded-2xl border border-gray-200 bg-white custom-scrollbar">
      <Table className="text-[13px]">
        <TableHeader className="bg-[#f7f7fb]">
          <TableRow className="hover:bg-[#f7f7fb]">
            <TableHead>Marshrut</TableHead>
            <TableHead>Ma'lumotlar</TableHead>
            <TableHead>Narx</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead>Vaqt</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-[320px]">
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <Archive className="mb-2 size-9 text-gray-300" />
                  <p className="text-sm">No data</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{getRoute(lead)}</TableCell>
                <TableCell className="font-medium text-gray-900">{getInfo(lead)}</TableCell>
                <TableCell>{formatMoney(lead.price)}</TableCell>
                <TableCell>{getPhone(lead)}</TableCell>
                <TableCell>{getStatus(lead)}</TableCell>
                <TableCell>{formatDate(lead.createdAt || lead.updatedAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

