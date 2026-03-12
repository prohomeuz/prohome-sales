import { CircleDollarSign, Download, FileText, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useContracts } from "@/shared/hooks/use-contracts";
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

const PROJECT_ID = 1;
const ALL_STATUS = "ALL";

const STATUS_BADGE_CLASS = {
  SOLD: "bg-red-500 text-white hover:bg-red-500",
  RESERVED: "bg-orange-500 text-white hover:bg-orange-500",
  EMPTY: "bg-green-500 text-white hover:bg-green-500",
  NOT: "bg-slate-400 text-white hover:bg-slate-400",
};

const STATUS_LABEL = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};

const STATUS_TABS = [
  { key: ALL_STATUS, label: "Barchasi" },
  { key: "SOLD", label: "Sotilgan" },
  { key: "RESERVED", label: "Bron qilingan" },
];

function formatContractDate(value) {
  if (!value) {
    return { date: "Sana yo'q", time: "" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "Noma'lum sana", time: "" };
  }

  return {
    date: new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(parsed),
    time: new Intl.DateTimeFormat("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed),
  };
}

function getRowKey(contract, index) {
  return String(
    contract?.id ??
      contract?.contractId ??
      contract?.contractNumber ??
      `${contract?.contractDate ?? "contract"}-${contract?.fullName ?? index}`,
  );
}

function resolveContractFileUrl(contractFile) {
  if (!contractFile) return "";
  if (contractFile.startsWith("http")) return contractFile;

  const base = import.meta.env.VITE_BASE_URL ?? window.location.origin;
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = contractFile.startsWith("/")
    ? contractFile.slice(1)
    : contractFile;

  return new URL(normalizedPath, normalizedBase).href;
}

function parseAmountValue(raw) {
  if (raw === null || raw === undefined || raw === "") return null;

  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }

  const normalized = String(raw).replace(/[^\d.-]/g, "");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveContractAmount(contract) {
  const candidates = [
    contract?.totalPrice,
    contract?.totalAmount,
    contract?.amount,
    contract?.price,
    contract?.contractAmount,
    contract?.sum,
    contract?.overallPrice,
  ];

  for (const candidate of candidates) {
    const value = parseAmountValue(candidate);
    if (value !== null) return value;
  }

  return null;
}

export default function Contracts() {
  const { contracts, error, loading, get } = useContracts(PROJECT_ID);
  const [openingRowKey, setOpeningRowKey] = useState(null);
  const [activeTab, setActiveTab] = useState(ALL_STATUS);
  const { start, complete } = useStableLoadingBar({
    color: "#5ea500",
    height: 3,
  });

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
      total: contracts.length,
      sold: contracts.filter((item) => item?.status === "SOLD").length,
      reserved: contracts.filter((item) => item?.status === "RESERVED").length,
      totalAmount,
      hasAmount,
    };
  }, [contracts]);

  const statusCounts = useMemo(
    () => ({
      [ALL_STATUS]: contracts.length,
      SOLD: contracts.filter((item) => item?.status === "SOLD").length,
      RESERVED: contracts.filter((item) => item?.status === "RESERVED").length,
      EMPTY: contracts.filter((item) => item?.status === "EMPTY").length,
      NOT: contracts.filter((item) => item?.status === "NOT").length,
    }),
    [contracts],
  );

  const filteredContracts = useMemo(
    () =>
      activeTab === ALL_STATUS
        ? contracts
        : contracts.filter((item) => (item?.status ?? "NOT") === activeTab),
    [activeTab, contracts],
  );

  const handleOpenContractFile = useCallback(async (contract, rowKey) => {
    if (!contract?.contractFile) return;

    setOpeningRowKey(rowKey);

    try {
      const res = await apiRequest(resolveContractFileUrl(contract.contractFile));
      if (!res.ok) {
        throw new Error();
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const preview = window.open("", "_blank", "noopener,noreferrer");

      if (preview) {
        preview.location.href = objectUrl;
      } else {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      toast.error("Shartnoma faylini ochib bo'lmadi");
    } finally {
      setOpeningRowKey(null);
    }
  }, []);

  return (
    <LoadTransition
      loading={loading}
      className="h-full"
      loader={
        <LogoLoader
          title="Shartnomalar yuklanmoqda"
          description="Project bo'yicha shartnomalar ro'yxati tayyorlanmoqda."
        />
      }
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error ? (
        <GeneralError />
      ) : (
        <section className="animate-fade-in flex h-full min-h-0 flex-col p-4 sm:p-5 lg:p-6">
          <header className="bg-primary/2 mb-6 flex flex-col gap-4 rounded-xl border p-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/6 text-primary hover:bg-primary/6"
                >
                  <FileText />
                  Project #{PROJECT_ID}
                </Badge>
              </div>

              <div>
                <h2 className="text-2xl font-bold">Shartnomalar</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Backenddan olingan shartnomalar ro'yxati.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Button onClick={get} variant="secondary" size="sm" disabled={loading}>
                <RefreshCcw className={cn(loading && "animate-spin")} />
                Yangilash
              </Button>
            </div>
          </header>

          {contracts.length > 0 ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="border-b px-4 py-4 sm:px-5">
                <div className="grid gap-3 md:grid-cols-3">
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
                          {stats.hasAmount
                            ? `${formatNumber(stats.totalAmount)} UZS`
                            : "---"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gap-0 border-red-200/70 bg-red-50/60 py-0 shadow-none">
                    <CardContent className="p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                        Sotilgan
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                        {stats.sold}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="gap-0 border-orange-200/70 bg-orange-50/70 py-0 shadow-none">
                    <CardContent className="p-4">
                      <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">
                        Bron qilingan
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                        {stats.reserved}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="mt-4"
                >
                  <TabsList>
                    {STATUS_TABS.map((tab) => (
                      <TabsTrigger key={tab.key} value={tab.key}>
                        <Badge
                          variant="outline"
                          className="border-current/10 bg-background/70 px-1.5 py-0 text-[10px]"
                        >
                          {statusCounts[tab.key] ?? 0}
                        </Badge>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {filteredContracts.length > 0 ? (
                <div className="no-scrollbar min-h-0 flex-1 overflow-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="bg-background/95 sticky top-0 z-10 w-14 backdrop-blur-sm">
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
                      {filteredContracts.map((contract, index) => {
                        const rowKey = getRowKey(contract, index);
                        const date = formatContractDate(contract?.contractDate);
                        const status = contract?.status ?? "NOT";
                        const amount = resolveContractAmount(contract);
                        const fullName =
                          contract?.fullName?.trim() || "Mijoz ko'rsatilmagan";
                        const hasFile = Boolean(contract?.contractFile);
                        const isOpening = openingRowKey === rowKey;

                        return (
                          <TableRow key={rowKey}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {index + 1}
                            </TableCell>

                            <TableCell className="min-w-[18rem]">
                              <div className="space-y-1">
                                <p className="font-medium">{fullName}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span>
                                    {hasFile ? "Fayl yuklangan" : "Fayl biriktirilmagan"}
                                  </span>
                                  {amount !== null ? (
                                    <span className="font-mono">
                                      {formatNumber(amount)} UZS
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge className={STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS.NOT}>
                                {STATUS_LABEL[status] ?? status}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{date.date}</p>
                                {date.time ? (
                                  <p className="text-xs text-muted-foreground">
                                    {date.time}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              {hasFile ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={isOpening}
                                  onClick={() =>
                                    handleOpenContractFile(contract, rowKey)
                                  }
                                >
                                  <Download className={cn(isOpening && "animate-bounce")} />
                                  {isOpening ? "Ochilmoqda" : "Ochish"}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Fayl yo'q
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 p-4">
                  <EmptyData text="Tanlangan status bo'yicha shartnoma topilmadi." />
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 rounded-xl border bg-background/70 p-4">
              <EmptyData text="Project bo'yicha hozircha hech qanday shartnoma topilmadi." />
            </div>
          )}
        </section>
      )}
    </LoadTransition>
  );
}
