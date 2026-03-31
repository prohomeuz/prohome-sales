import {
  CONTRACT_STATUS_BADGE_CLASS,
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_TABS,
  formatContractDate,
  getRowKey,
  resolveContractAmount,
  resolveContractFileUrl,
} from "@/features/contracts/lib/contract-utils";
import { useContracts } from "@/entities/contract/model/use-contracts";
import { useProjects } from "@/entities/project/model/use-projects";
import { useStableLoadingBar } from "@/shared/hooks/use-loading-bar";
import { apiRequest } from "@/shared/lib/api";
import { cn, formatNumber } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import EmptyData from "@/widgets/EmptyData";
import GeneralError from "@/widgets/error/GeneralError";
import LoadTransition from "@/widgets/loading/LoadTransition";
import LogoLoader from "@/widgets/loading/LogoLoader";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileText,
  RefreshCcw,
  Search,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const ALL_STATUS = "ALL";
const PAGE_LIMIT = 20;

export default function Contracts() {
  // --- Loyiha tanlash ---
  const { projects, loading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    if (projects.length > 0 && projectId === null) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  // --- Filterlar ---
  const [activeTab, setActiveTab] = useState(ALL_STATUS);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const searchTimerRef = useRef(null);
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleProjectChange(id) {
    setProjectId(id);
    setPage(1);
  }

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: activeTab !== ALL_STATUS ? activeTab : undefined,
      page,
      limit: PAGE_LIMIT,
    }),
    [search, activeTab, page],
  );

  const { contracts, total, error, loading, get } = useContracts(projectId, filters);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const [openingRowKey, setOpeningRowKey] = useState(null);
  const { start, complete } = useStableLoadingBar({ color: "#5ea500", height: 3 });

  useEffect(() => {
    if (loading) start();
    else complete();
  }, [loading, start, complete]);

  const stats = useMemo(() => {
    const totalAmount = contracts.reduce((sum, item) => {
      const amount = resolveContractAmount(item);
      return amount === null ? sum : sum + amount;
    }, 0);
    const hasAmount = contracts.some((item) => resolveContractAmount(item) !== null);
    return {
      success:  contracts.filter((c) => c?.status === "SUCCESS").length,
      canceled: contracts.filter((c) => c?.status === "CANCELED").length,
      totalAmount,
      hasAmount,
    };
  }, [contracts]);

  const handleOpenContractFile = useCallback(async (contract, rowKey) => {
    const fileUrl = resolveContractFileUrl(contract?.contractFile);
    if (!fileUrl) return;

    setOpeningRowKey(rowKey);
    try {
      const res = await apiRequest(fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Fayl nomini contractFile dan olamiz yoki default
      const fileName =
        contract?.contractFile?.split("/").pop() ??
        `shartnoma-${contract?.contractNumber ?? rowKey}.pdf`;

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    } catch {
      toast.error("Shartnoma faylini yuklab bo'lmadi");
    } finally {
      setOpeningRowKey(null);
    }
  }, []);

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <LoadTransition
      loading={loading && contracts.length === 0}
      className="h-full"
      loader={
        <LogoLoader
          title="Shartnomalar yuklanmoqda"
          description="Loyiha bo'yicha shartnomalar ro'yxati tayyorlanmoqda."
        />
      }
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error ? (
        <GeneralError />
      ) : (
        <section className="animate-fade-in flex h-full min-h-0 flex-col p-4 sm:p-5 lg:p-6">
          {/* ===== Header ===== */}
          <header className="bg-primary/2 mb-5 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="space-y-3">
              {/* Loyiha tugmalari */}
              <div className="flex flex-wrap items-center gap-2">
                {projectsLoading ? (
                  <Badge variant="outline" className="border-primary/20 bg-primary/6 text-primary">
                    <FileText className="size-3" />
                    Yuklanmoqda...
                  </Badge>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProjectChange(p.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        projectId === p.id
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground",
                      )}
                    >
                      <FileText className="size-3" />
                      {p.name ?? `Loyiha #${p.id}`}
                    </button>
                  ))
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold">Shartnomalar</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {selectedProject
                    ? `${selectedProject.name ?? `Loyiha #${selectedProject.id}`} bo'yicha shartnomalar`
                    : "Loyihani tanlang"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {/* Search */}
              <div className="relative">
                <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  placeholder="Mijoz, shartnoma raqami..."
                  className="border-input bg-background placeholder:text-muted-foreground h-8 w-52 rounded-md border pl-8 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setPage(1);
                    }}
                    className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <XCircle className="size-3.5" />
                  </button>
                )}
              </div>

              <Button onClick={() => { setPage(1); get(); }} variant="secondary" size="sm" disabled={loading}>
                <RefreshCcw className={cn(loading && "animate-spin")} />
                Yangilash
              </Button>
            </div>
          </header>

          {/* ===== Stats ===== */}
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Card className="gap-0 border-primary/10 bg-primary/5 py-0 shadow-none">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                  Umumiy summa
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                    <CircleDollarSign className="size-5" />
                  </div>
                  <p className="font-mono text-lg font-semibold tracking-[-0.03em]">
                    {stats.hasAmount ? `${formatNumber(stats.totalAmount)} UZS` : "---"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 border-green-200/70 bg-green-50/70 py-0 shadow-none dark:border-green-900/30 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-green-600" />
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                    Muvaffaqiyatli
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                  {stats.success}
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 border-destructive/20 bg-destructive/5 py-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5">
                  <XCircle className="size-3.5 text-destructive" />
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                    Bekor qilingan
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                  {stats.canceled}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ===== Table ===== */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* Status tabs */}
            <div className="border-b px-4 py-3 sm:px-5">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                  {CONTRACT_STATUS_TABS.map((tab) => (
                    <TabsTrigger key={tab.key} value={tab.key}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {contracts.length > 0 ? (
              <>
                <div className="no-scrollbar min-h-0 flex-1 overflow-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="bg-background/95 sticky top-0 z-10 w-12 backdrop-blur-sm">
                          #
                        </TableHead>
                        <TableHead className="bg-background/95 sticky top-0 z-10 min-w-[18rem] backdrop-blur-sm">
                          Mijoz
                        </TableHead>
                        <TableHead className="bg-background/95 sticky top-0 z-10 min-w-[10rem] backdrop-blur-sm">
                          Holati
                        </TableHead>
                        <TableHead className="bg-background/95 sticky top-0 z-10 min-w-[12rem] backdrop-blur-sm">
                          Sana
                        </TableHead>
                        <TableHead className="bg-background/95 sticky top-0 z-10 min-w-[10rem] text-right backdrop-blur-sm">
                          Fayl
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {contracts.map((contract, index) => {
                        const rowKey = getRowKey(contract, index);
                        const date = formatContractDate(
                          contract?.contractDate ?? contract?.createdAt,
                        );
                        const status = contract?.status ?? "PROCESS";
                        const amount = resolveContractAmount(contract);
                        const fullName =
                          contract?.fullName?.trim() ||
                          [contract?.firstName, contract?.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          "Mijoz ko'rsatilmagan";
                        const contractNumber = contract?.contractNumber?.trim() ?? "";
                        const hasFile = Boolean(contract?.contractFile);
                        const isOpening = openingRowKey === rowKey;

                        return (
                          <TableRow key={rowKey}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {(page - 1) * PAGE_LIMIT + index + 1}
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{fullName}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  {contractNumber && (
                                    <span className="font-mono">№ {contractNumber}</span>
                                  )}
                                  <span>
                                    {hasFile ? "Fayl yuklangan" : "Fayl biriktirilmagan"}
                                  </span>
                                  {amount !== null && (
                                    <span className="font-mono">
                                      {formatNumber(amount)} UZS
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                className={
                                  CONTRACT_STATUS_BADGE_CLASS[status] ??
                                  "bg-secondary text-secondary-foreground"
                                }
                              >
                                {CONTRACT_STATUS_LABEL[status] ?? status}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{date.date}</p>
                                {date.time && (
                                  <p className="text-xs text-muted-foreground">{date.time}</p>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              {hasFile ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={isOpening}
                                  onClick={() => handleOpenContractFile(contract, rowKey)}
                                >
                                  <Download className={cn(isOpening && "animate-bounce")} />
                                  {isOpening ? "Yuklanmoqda" : "Yuklab olish"}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Fayl yo'q</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Jami:{" "}
                      <span className="font-medium text-foreground">{total}</span> ta
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="px-2 text-sm">
                        <span className="font-medium">{page}</span>
                        <span className="text-muted-foreground"> / {totalPages}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-0 flex-1 p-4">
                <EmptyData
                  text={
                    search || activeTab !== ALL_STATUS
                      ? "Filtr bo'yicha shartnoma topilmadi."
                      : "Loyiha bo'yicha hozircha hech qanday shartnoma topilmadi."
                  }
                />
              </div>
            )}
          </div>
        </section>
      )}
    </LoadTransition>
  );
}
