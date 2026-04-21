import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/entities/session/model";
import { useProjects } from "@/entities/project/model/use-projects";
import {
  DASHBOARD_PERIODS,
  useDashboardOverview,
} from "@/entities/dashboard/model/use-dashboard-overview";
import { cn, formatNumber } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import GeneralError from "@/widgets/error/GeneralError";
import LoadTransition from "@/widgets/loading/LoadTransition";
import LogoLoader from "@/widgets/loading/LogoLoader";
import {
  Activity,
  Building2,
  CircleDollarSign,
  Layers3,
  RefreshCcw,
  Target,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#65a30d", "#84cc16", "#22c55e", "#0ea5e9", "#f59e0b", "#8b5cf6"];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed.replace(/\s/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/,/g, "");
  } else if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(/,/g, ".");
  }

  normalized = normalized.replace(/[^\d.-]/g, "");
  if (!normalized || normalized === "-" || normalized === ".") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function humanize(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(value) {
  if (value === null || value === undefined) return "---";
  return `${formatNumber(Math.round(value))} UZS`;
}

function formatCompact(value) {
  if (value === null || value === undefined) return "---";
  return formatNumber(Math.round(value));
}

function unwrapPayload(payload) {
  let current = payload;
  const keys = ["data", "items", "results", "result", "rows", "list", "payload"];

  for (let i = 0; i < 5; i += 1) {
    if (Array.isArray(current) || !isObject(current)) return current;

    const nextKey = keys.find((key) => {
      const candidate = current[key];
      return Array.isArray(candidate) || isObject(candidate);
    });

    if (!nextKey) return current;
    current = current[nextKey];
  }

  return current;
}

function findMatchingKey(source, candidates) {
  if (!isObject(source)) return null;

  const entries = Object.keys(source).map((key) => [key, normalizeKey(key)]);
  const normalizedCandidates = candidates.map(normalizeKey).filter(Boolean);

  for (const candidate of normalizedCandidates) {
    const exact = entries.find(([, normalized]) => normalized === candidate);
    if (exact) return exact[0];
  }

  for (const candidate of normalizedCandidates) {
    const partial = entries.find(([, normalized]) => normalized.includes(candidate) || candidate.includes(normalized));
    if (partial) return partial[0];
  }

  return null;
}

function pickNumber(source, candidates) {
  if (!isObject(source)) return null;
  const key = findMatchingKey(source, candidates);
  return key ? toNumber(source[key]) : null;
}

function pickLabel(source, candidates, fallback) {
  if (!isObject(source)) return fallback;
  const key = findMatchingKey(source, candidates);
  if (!key) return fallback;
  const value = source[key];
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function getNumericEntries(source, limit = 6) {
  const raw = unwrapPayload(source);
  if (!isObject(raw)) return [];

  return Object.entries(raw)
    .map(([key, value]) => ({ key, value: toNumber(value) }))
    .filter(({ key, value }) => value !== null && !["id", "projectId", "managerId"].includes(key))
    .slice(0, limit)
    .map(({ key, value }) => ({
      label: humanize(key),
      value,
    }));
}

function normalizeStats(source) {
  const raw = unwrapPayload(source);
  if (!isObject(raw)) {
    return {
      hasData: false,
      totalSalesAmount: null,
      totalEmptyAmount: null,
      totalCustomers: null,
      totalSales: null,
      totalBookings: null,
    };
  }

  const totalSalesAmount = pickNumber(raw, [
    "totalSalesAmount",
    "salesAmount",
    "soldAmount",
    "totalRevenue",
    "revenue",
  ]);
  const totalEmptyAmount = pickNumber(raw, [
    "totalEmptyAmount",
    "emptyAmount",
    "availableAmount",
    "remainingAmount",
  ]);
  const totalCustomers = pickNumber(raw, ["totalCustomers", "customers", "clientCount", "clients"]);
  const totalSales = pickNumber(raw, ["totalSales", "sales", "soldCount", "deals", "closedDeals"]);
  const totalBookings = pickNumber(raw, ["totalBookings", "bookings", "reserved", "bron"]);

  return {
    hasData: [totalSalesAmount, totalEmptyAmount, totalCustomers, totalSales, totalBookings].some(
      (value) => value !== null,
    ),
    totalSalesAmount,
    totalEmptyAmount,
    totalCustomers,
    totalSales,
    totalBookings,
  };
}

function normalizeTrendSeries(source, preferredKeys = []) {
  const raw = unwrapPayload(source);
  const labelCandidates = ["label", "name", "title", "date", "day", "month", "week", "period", "time"];

  if (Array.isArray(raw)) {
    const rows = raw.filter(isObject);
    if (!rows.length) return { items: [], series: [], metrics: [] };

    const labelKey =
      findMatchingKey(rows[0], labelCandidates) ??
      Object.keys(rows[0]).find((key) => typeof rows[0][key] === "string");

    const scores = new Map();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key === labelKey) return;
        if (["id", "projectId", "managerId"].includes(key)) return;
        if (toNumber(row[key]) === null) return;

        const score = preferredKeys.some((candidate) => normalizeKey(key).includes(normalizeKey(candidate))) ? 10 : 1;
        scores.set(key, (scores.get(key) ?? 0) + score);
      });
    });

    const series = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => ({ key, label: humanize(key) }));

    return {
      items: rows.map((row, index) => {
        const item = {
          label: labelKey ? String(row[labelKey] ?? `#${index + 1}`) : `#${index + 1}`,
        };

        series.forEach(({ key }) => {
          item[key] = toNumber(row[key]) ?? 0;
        });

        return item;
      }),
      series,
      metrics: getNumericEntries(raw),
    };
  }

  if (isObject(raw)) {
    const entries = Object.entries(raw)
      .map(([key, value]) => ({ label: humanize(key), value: toNumber(value) }))
      .filter((entry) => entry.value !== null);

    if (!entries.length) return { items: [], series: [], metrics: [] };

    return {
      items: entries.map((entry) => ({ label: entry.label, value: entry.value })),
      series: [{ key: "value", label: "Qiymat" }],
      metrics: entries,
    };
  }

  return { items: [], series: [], metrics: [] };
}

function normalizeCollection(source, config) {
  const raw = unwrapPayload(source);
  const {
    labelCandidates,
    primaryCandidates,
    secondaryCandidates = [],
    tertiaryCandidates = [],
  } = config;

  let rows = [];

  if (Array.isArray(raw)) {
    rows = raw.filter(isObject).map((row, index) => ({ ...row, __rowIndex: index }));
  } else if (isObject(raw)) {
    const numericEntries = Object.entries(raw)
      .map(([key, value]) => ({ key, value: toNumber(value) }))
      .filter((entry) => entry.value !== null);

    if (numericEntries.length) {
      rows = numericEntries.map((entry, index) => ({
        title: humanize(entry.key),
        value: entry.value,
        __rowIndex: index,
      }));
    }
  }

  const normalizedItems = rows
    .map((row, index) => {
      const numericKeys = Object.keys(row).filter((key) => {
        if (["__rowIndex", "id", "projectId"].includes(key)) return false;
        return toNumber(row[key]) !== null;
      });

      const primaryKey = findMatchingKey(row, primaryCandidates) ?? numericKeys[0];
      const secondaryKey = findMatchingKey(row, secondaryCandidates) ?? numericKeys[1];
      const tertiaryKey = findMatchingKey(row, tertiaryCandidates) ?? numericKeys[2];

      return {
        label: pickLabel(row, labelCandidates, row.title ?? `#${index + 1}`),
        primary: primaryKey ? toNumber(row[primaryKey]) : null,
        secondary: secondaryKey && secondaryKey !== primaryKey ? toNumber(row[secondaryKey]) : null,
        tertiary:
          tertiaryKey && tertiaryKey !== primaryKey && tertiaryKey !== secondaryKey
            ? toNumber(row[tertiaryKey])
            : null,
      };
    })
    .filter((item) => item.primary !== null || item.secondary !== null || item.tertiary !== null);

  return {
    items: normalizedItems,
    totals: {
      primary: normalizedItems.reduce((sum, item) => sum + (item.primary ?? 0), 0),
      secondary: normalizedItems.reduce((sum, item) => sum + (item.secondary ?? 0), 0),
      tertiary: normalizedItems.reduce((sum, item) => sum + (item.tertiary ?? 0), 0),
    },
    metrics: getNumericEntries(raw),
  };
}

function DashboardPanel({
  title,
  subtitle,
  badge,
  icon: Icon,
  action,
  children,
  className,
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden rounded-[26px] border-border/40 py-0 shadow-none", className)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-4 border-b border-border/30 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {Icon ? (
                <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
                  <Icon className="size-4.5" />
                </div>
              ) : null}
              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
                {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {badge ? (
              <Badge variant="outline" className="border-primary/20 bg-primary/[0.05] text-primary">
                {badge}
              </Badge>
            ) : null}
            {action}
          </div>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ title, value, hint, icon: Icon, tone = "green" }) {
  const toneClasses = {
    green: "border-primary/15 bg-primary/[0.03] text-primary",
    blue: "border-sky-200/60 bg-sky-50/40 text-sky-600 dark:border-sky-800/30 dark:bg-sky-950/15 dark:text-sky-400",
    amber: "border-amber-200/60 bg-amber-50/40 text-amber-600 dark:border-amber-800/30 dark:bg-amber-950/15 dark:text-amber-400",
    rose: "border-rose-200/60 bg-rose-50/40 text-rose-600 dark:border-rose-800/30 dark:bg-rose-950/15 dark:text-rose-400",
    slate: "border-border bg-muted/[0.06] text-muted-foreground",
  };

  return (
    <Card className={cn("gap-0 rounded-[24px] py-0 shadow-none", toneClasses[tone] ?? toneClasses.green)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">{title}</p>
            <h4 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-[1.75rem]">{value}</h4>
            {hint ? <p className="mt-2 text-xs font-medium text-muted-foreground">{hint}</p> : null}
          </div>
          {Icon ? (
            <div className="flex size-11 items-center justify-center rounded-2xl bg-background/80 shadow-none border border-border/30">
              <Icon className="size-5" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptySection({
  title = "Ma'lumot topilmadi",
  description = "Hozircha bu bo'lim uchun ko'rsatkich kelmadi.",
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[22px] border border-dashed border-border/40 bg-muted/[0.04] px-6 text-center">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function MetricGrid({ metrics, columns = 2 }) {
  if (!metrics.length) return <EmptySection />;

  return (
    <div className={cn("grid gap-3", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-2xl border border-border/30 bg-muted/5 px-4 py-3">
          <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">{metric.label}</p>
          <p className="mt-2 text-lg font-black tracking-tight text-foreground">{formatCompact(metric.value)}</p>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAppStore();
  const { projects, loading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState(null);
  const [period, setPeriod] = useState("last30");

  useEffect(() => {
    if (!projectsLoading && projects.length > 0 && projectId === null) {
      setProjectId(String(projects[0].id));
    }
  }, [projectId, projects, projectsLoading]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(projectId)),
    [projectId, projects],
  );

  const {
    stats,
    floors,
    growth,
    cashflow,
    manager,
    crm,
    sectionErrors,
    loading,
    refreshing,
    error,
    get,
  } = useDashboardOverview({
    projectId,
    period,
    role: user?.role,
  });

  const statsModel = useMemo(() => normalizeStats(stats), [stats]);
  const floorsModel = useMemo(
    () =>
      normalizeCollection(floors, {
        labelCandidates: ["floorName", "floor", "name", "title", "label", "level"],
        primaryCandidates: ["sold", "sales", "occupied", "count", "amount"],
        secondaryCandidates: ["empty", "available", "remaining", "free"],
        tertiaryCandidates: ["booked", "reserved", "booking"],
      }),
    [floors],
  );
  const growthModel = useMemo(
    () => normalizeTrendSeries(growth, ["sales", "amount", "growth", "count"]),
    [growth],
  );
  const cashflowModel = useMemo(
    () => normalizeTrendSeries(cashflow, ["income", "cash", "amount", "expense"]),
    [cashflow],
  );
  const managerModel = useMemo(
    () =>
      normalizeCollection(manager, {
        labelCandidates: ["managerName", "fullName", "name", "manager", "username"],
        primaryCandidates: ["sales", "sold", "deals", "closed", "count"],
        secondaryCandidates: ["leads", "leadCount", "customers", "clients"],
        tertiaryCandidates: ["amount", "totalAmount", "revenue", "salesAmount"],
      }),
    [manager],
  );
  const crmModel = useMemo(
    () =>
      normalizeCollection(crm, {
        labelCandidates: ["stage", "status", "name", "title", "column", "voronka"],
        primaryCandidates: ["count", "leadCount", "leads", "total", "sales"],
        secondaryCandidates: ["amount", "totalAmount", "sum", "summa"],
      }),
    [crm],
  );

  const executiveRole = user?.role !== "SALESMANAGER";
  const summaryCards = useMemo(() => {
    if (statsModel.hasData) {
      return [
        {
          title: "Sotilgan uylar",
          value: formatMoney(statsModel.totalSalesAmount),
          hint: "Tanlangan davrdagi sotuv summasi",
          icon: CircleDollarSign,
          tone: "green",
        },
        {
          title: "Qolgan uylar",
          value: formatMoney(statsModel.totalEmptyAmount),
          hint: "Mavjud fond bo'yicha qoldiq",
          icon: Building2,
          tone: "rose",
        },
        {
          title: "Mijozlar",
          value: formatCompact(statsModel.totalCustomers),
          hint: "Davr ichidagi faol mijozlar",
          icon: Users,
          tone: "blue",
        },
        {
          title: "Sotuvlar",
          value: formatCompact(statsModel.totalSales),
          hint: "Yopilgan bitimlar soni",
          icon: Target,
          tone: "amber",
        },
        {
          title: "Bronlar",
          value: formatCompact(statsModel.totalBookings),
          hint: "Rezerv qilingan obyektlar",
          icon: Activity,
          tone: "slate",
        },
      ];
    }

    return [
      {
        title: "Leadlar",
        value: formatCompact(crmModel.totals.primary),
        hint: "CRM bo'yicha jami lead",
        icon: Users,
        tone: "green",
      },
      {
        title: "Voronka summasi",
        value: formatMoney(crmModel.totals.secondary),
        hint: "Leadlar ichidagi umumiy summa",
        icon: Wallet,
        tone: "blue",
      },
      {
        title: "Sotuvlar",
        value: formatCompact(managerModel.totals.primary),
        hint: "Menejer kesimidagi natija",
        icon: Target,
        tone: "amber",
      },
      {
        title: "Mijozlar",
        value: formatCompact(managerModel.totals.secondary),
        hint: "Menejerlar bo'yicha leadlar",
        icon: UserRound,
        tone: "slate",
      },
      {
        title: "Bosqichlar",
        value: formatCompact(crmModel.items.length),
        hint: "Faol CRM statuslari",
        icon: Layers3,
        tone: "rose",
      },
    ];
  }, [crmModel, managerModel, statsModel]);

  const hasAnySectionData = useMemo(
    () =>
      statsModel.hasData ||
      floorsModel.items.length > 0 ||
      growthModel.items.length > 0 ||
      cashflowModel.items.length > 0 ||
      managerModel.items.length > 0 ||
      crmModel.items.length > 0,
    [
      cashflowModel.items.length,
      crmModel.items.length,
      floorsModel.items.length,
      growthModel.items.length,
      managerModel.items.length,
      statsModel.hasData,
    ],
  );

  const periodLabel = DASHBOARD_PERIODS[period] ?? "Oy";
  const noProjects = !projectsLoading && !loading && !projectId && projects.length === 0;

  return (
    <LoadTransition
      loading={loading && !hasAnySectionData}
      className="h-full"
      loader={
        <LogoLoader
          title="Dashboard yuklanmoqda"
          description="Loyiha bo'yicha asosiy ko'rsatkichlar tayyorlanmoqda."
        />
      }
      loaderClassName="bg-background/92 backdrop-blur-sm"
      contentClassName="h-full"
    >
      {error && !hasAnySectionData ? (
        <GeneralError />
      ) : (
        <section className="animate-fade-in flex h-full min-h-0 flex-col overflow-y-auto bg-background p-4 sm:p-5 lg:p-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
            <header className="relative overflow-hidden rounded-[30px] border border-border/40 bg-card p-5 shadow-none sm:p-6 lg:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(100,200,80,0.06),_transparent_50%)] pointer-events-none" />
              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">Dashboard</Badge>
                    <Badge variant="outline" className="border-primary/20 bg-primary/[0.05] text-primary">
                      {user?.role}
                    </Badge>
                    {selectedProject ? (
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {selectedProject.name ?? `Loyiha #${selectedProject.id}`}
                      </Badge>
                    ) : null}
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    Loyiha ko'rsatkichlari bir joyda
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Sotuvlar, qavatlar, pul oqimi, CRM va menejerlar bo'yicha asosiy holatlarni tanlangan davr kesimida kuzating.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 xl:max-w-[34rem] xl:items-end">
                  <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Select value={projectId ?? ""} onValueChange={setProjectId} disabled={projectsLoading || projects.length === 0}>
                      <SelectTrigger className="h-11 w-full rounded-2xl border-border/40 bg-background px-4 shadow-none">
                        <SelectValue placeholder={projectsLoading ? "Loyihalar yuklanmoqda..." : "Loyihani tanlang"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={String(project.id)}>
                            {project.name ?? `Loyiha #${project.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      className="h-11 rounded-2xl border-border/40 px-4 shadow-none"
                      onClick={() => get({ silent: true })}
                      disabled={!projectId || refreshing}
                    >
                      <RefreshCcw className={cn("size-4", refreshing && "animate-spin")} />
                      Yangilash
                    </Button>
                  </div>

                  <Tabs value={period} onValueChange={setPeriod} className="w-full">
                    <TabsList className="border-border/40 bg-muted/[0.08] grid w-full grid-cols-2 rounded-2xl border p-1 sm:grid-cols-4">
                      {Object.entries(DASHBOARD_PERIODS).map(([key, label]) => (
                        <TabsTrigger key={key} value={key} className="h-9 rounded-xl text-xs font-bold sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-none">
                          {label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </header>

            {noProjects ? (
              <EmptySection
                title="Loyiha topilmadi"
                description="Dashboard ko'rsatish uchun tizimda kamida bitta loyiha bo'lishi kerak."
              />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {summaryCards.map((card) => (
                    <KpiCard
                      key={card.title}
                      title={card.title}
                      value={card.value}
                      hint={card.hint}
                      icon={card.icon}
                      tone={card.tone}
                    />
                  ))}
                </div>

                {executiveRole ? (
                  <>
                    <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
                      <DashboardPanel
                        title="O'sish dinamikasi"
                        subtitle={`${periodLabel} bo'yicha trend`}
                        badge={sectionErrors.growth ? sectionErrors.growth : `${growthModel.items.length || 0} nuqta`}
                        icon={TrendingUp}
                      >
                        {growthModel.items.length > 0 && growthModel.series.length > 0 ? (
                          <div className="space-y-4">
                            <div className="h-[280px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthModel.items} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#65a30d" stopOpacity={0.28} />
                                      <stop offset="95%" stopColor="#65a30d" stopOpacity={0.02} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid vertical={false} stroke="rgba(128,128,128,0.15)" />
                                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgba(128,128,128,0.7)" }} />
                                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgba(128,128,128,0.7)" }} />
                                  <Tooltip
                                    cursor={{ stroke: "#dbe9be", strokeWidth: 1 }}
                                    content={({ active, payload, label }) =>
                                      active && payload?.length ? (
                                        <div className="rounded-2xl border border-border/40 bg-card px-3 py-2 shadow-none">
                                          <p className="text-xs font-bold text-foreground">{label}</p>
                                          {payload.map((entry) => (
                                            <p key={entry.dataKey} className="mt-1 text-xs font-medium text-muted-foreground">
                                              {humanize(entry.dataKey)}: <span className="text-foreground">{formatCompact(entry.value)}</span>
                                            </p>
                                          ))}
                                        </div>
                                      ) : null
                                    }
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey={growthModel.series[0].key}
                                    stroke="#65a30d"
                                    fill="url(#growthFill)"
                                    strokeWidth={3}
                                  />
                                  {growthModel.series[1] ? (
                                    <Line
                                      type="monotone"
                                      dataKey={growthModel.series[1].key}
                                      stroke="#0ea5e9"
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  ) : null}
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>

                            <MetricGrid metrics={growthModel.metrics.slice(0, 4)} />
                          </div>
                        ) : (
                          <EmptySection description="Growth endpointidan chart chizish uchun yetarli data kelmadi." />
                        )}
                      </DashboardPanel>

                      <DashboardPanel
                        title="Pul oqimi"
                        subtitle="Kirim va oqimlar holati"
                        badge={sectionErrors.cashflow ? sectionErrors.cashflow : `${cashflowModel.items.length || 0} nuqta`}
                        icon={Wallet}
                      >
                        {cashflowModel.items.length > 0 && cashflowModel.series.length > 0 ? (
                          <div className="space-y-4">
                            <div className="h-[280px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={cashflowModel.items} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                                  <CartesianGrid vertical={false} stroke="rgba(128,128,128,0.15)" />
                                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgba(128,128,128,0.7)" }} />
                                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgba(128,128,128,0.7)" }} />
                                  <Tooltip
                                    cursor={{ stroke: "#dbe9be", strokeWidth: 1 }}
                                    content={({ active, payload, label }) =>
                                      active && payload?.length ? (
                                        <div className="rounded-2xl border border-border/40 bg-card px-3 py-2 shadow-none">
                                          <p className="text-xs font-bold text-foreground">{label}</p>
                                          {payload.map((entry) => (
                                            <p key={entry.dataKey} className="mt-1 text-xs font-medium text-muted-foreground">
                                              {humanize(entry.dataKey)}: <span className="text-foreground">{formatMoney(entry.value)}</span>
                                            </p>
                                          ))}
                                        </div>
                                      ) : null
                                    }
                                  />
                                  {cashflowModel.series.map((series, index) => (
                                    <Line
                                      key={series.key}
                                      type="monotone"
                                      dataKey={series.key}
                                      stroke={CHART_COLORS[index]}
                                      strokeWidth={2.5}
                                      dot={false}
                                    />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            <MetricGrid metrics={cashflowModel.metrics.slice(0, 4)} />
                          </div>
                        ) : (
                          <EmptySection description="Cashflow endpointi uchun chartga mos seriya topilmadi." />
                        )}
                      </DashboardPanel>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                      <DashboardPanel
                        title="Qavatlar kesimi"
                        subtitle="Sotuv va mavjudlik taqsimoti"
                        badge={sectionErrors.floors ? sectionErrors.floors : `${floorsModel.items.length || 0} qavat`}
                        icon={Layers3}
                      >
                        {floorsModel.items.length > 0 ? (
                          <div className="space-y-4">
                            <div className="h-[280px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={floorsModel.items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid vertical={false} stroke="rgba(128,128,128,0.15)" />
                                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgba(128,128,128,0.7)" }} />
                                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgba(128,128,128,0.7)" }} />
                                  <Tooltip
                                    cursor={{ fill: "rgba(236, 252, 203, 0.24)" }}
                                    content={({ active, payload, label }) =>
                                      active && payload?.length ? (
                                        <div className="rounded-2xl border border-border/40 bg-card px-3 py-2 shadow-none">
                                          <p className="text-xs font-bold text-foreground">{label}</p>
                                          {payload.map((entry) => (
                                            <p key={entry.dataKey} className="mt-1 text-xs font-medium text-muted-foreground">
                                              {humanize(entry.dataKey)}: <span className="text-foreground">{formatCompact(entry.value)}</span>
                                            </p>
                                          ))}
                                        </div>
                                      ) : null
                                    }
                                  />
                                  <Bar dataKey="primary" radius={[8, 8, 0, 0]} fill="#65a30d" />
                                  {floorsModel.items.some((item) => item.secondary !== null) ? (
                                    <Bar dataKey="secondary" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
                                  ) : null}
                                  {floorsModel.items.some((item) => item.tertiary !== null) ? (
                                    <Bar dataKey="tertiary" radius={[8, 8, 0, 0]} fill="#f59e0b" />
                                  ) : null}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl border border-border/30 bg-muted/5 px-4 py-3">
                                <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Asosiy</p>
                                <p className="mt-2 text-lg font-black text-foreground">{formatCompact(floorsModel.totals.primary)}</p>
                              </div>
                              <div className="rounded-2xl border border-border/30 bg-muted/5 px-4 py-3">
                                <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Ikkinchi</p>
                                <p className="mt-2 text-lg font-black text-foreground">{formatCompact(floorsModel.totals.secondary)}</p>
                              </div>
                              <div className="rounded-2xl border border-border/30 bg-muted/5 px-4 py-3">
                                <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Uchinchi</p>
                                <p className="mt-2 text-lg font-black text-foreground">{formatCompact(floorsModel.totals.tertiary)}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <EmptySection description="Floors endpointidan taqsimot ko'rsatkichi topilmadi." />
                        )}
                      </DashboardPanel>

                      <DashboardPanel
                        title="CRM voronkasi"
                        subtitle="Leadlar status bo'yicha"
                        badge={sectionErrors.crm ? sectionErrors.crm : `${crmModel.items.length || 0} bosqich`}
                        icon={Target}
                      >
                        {crmModel.items.length > 0 ? (
                          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                            <div className="h-[260px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Tooltip
                                    content={({ active, payload }) =>
                                      active && payload?.length ? (
                                        <div className="rounded-2xl border border-border/40 bg-card px-3 py-2 shadow-none">
                                          <p className="text-xs font-bold text-foreground">{payload[0].name}</p>
                                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            Leadlar: <span className="text-foreground">{formatCompact(payload[0].value)}</span>
                                          </p>
                                        </div>
                                      ) : null
                                    }
                                  />
                                  <Pie
                                    data={crmModel.items}
                                    dataKey="primary"
                                    nameKey="label"
                                    innerRadius={58}
                                    outerRadius={88}
                                    paddingAngle={4}
                                  >
                                    {crmModel.items.map((entry, index) => (
                                      <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="space-y-3">
                              {crmModel.items.map((item, index) => (
                                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border/30 bg-muted/5 px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="block size-3 rounded-full"
                                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                    />
                                    <div>
                                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.secondary !== null ? formatMoney(item.secondary) : "Summa yo'q"}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-black text-foreground">{formatCompact(item.primary)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <EmptySection description="CRM statistikasi hali shakllanmagan yoki endpointdan data kelmadi." />
                        )}
                      </DashboardPanel>
                    </div>
                  </>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <DashboardPanel
                    title="Menejerlar kesimi"
                    subtitle="Jamoa natijalari"
                    badge={sectionErrors.manager ? sectionErrors.manager : `${managerModel.items.length || 0} yozuv`}
                    icon={UserRound}
                  >
                    {managerModel.items.length > 0 ? (
                      <div className="space-y-3">
                        {managerModel.items.map((item, index) => (
                          <div
                            key={`${item.label}-${index}`}
                            className="flex flex-col gap-3 rounded-[22px] border border-border/30 bg-muted/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-2xl bg-background border border-border/30">
                                  <UserRound className="size-4 text-primary" />
                                </div>
                                <div>
                                  <p className="truncate text-sm font-bold text-foreground">{item.label}</p>
                                  <p className="text-xs text-muted-foreground">Menejer ko'rsatkichlari</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                              <div className="rounded-2xl bg-background border border-border/20 px-3 py-2 text-center">
                                <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Sotuv</p>
                                <p className="mt-1 text-sm font-black text-foreground">{formatCompact(item.primary)}</p>
                              </div>
                              <div className="rounded-2xl bg-background border border-border/20 px-3 py-2 text-center">
                                <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Lead</p>
                                <p className="mt-1 text-sm font-black text-foreground">{formatCompact(item.secondary)}</p>
                              </div>
                              <div className="rounded-2xl bg-background border border-border/20 px-3 py-2 text-center">
                                <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Summa</p>
                                <p className="mt-1 text-sm font-black text-foreground">{formatMoney(item.tertiary)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <MetricGrid metrics={managerModel.metrics} columns={3} />
                    )}
                  </DashboardPanel>

                  <DashboardPanel
                    title="Tez ko'rsatkichlar"
                    subtitle="Umumiy signal va servis holati"
                    badge={selectedProject ? selectedProject.name ?? `Loyiha #${selectedProject.id}` : "Loyiha"}
                    icon={Activity}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-border/30 bg-muted/5 px-4 py-4">
                        <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Davr</p>
                        <p className="mt-2 text-lg font-black text-foreground">{periodLabel}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Tanlangan filter bo'yicha hisoblangan kesim.</p>
                      </div>
                      <div className="rounded-[22px] border border-border/30 bg-muted/5 px-4 py-4">
                        <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Sectionlar</p>
                        <p className="mt-2 text-lg font-black text-foreground">
                          {[
                            executiveRole && statsModel.hasData,
                            executiveRole && growthModel.items.length > 0,
                            executiveRole && cashflowModel.items.length > 0,
                            executiveRole && floorsModel.items.length > 0,
                            managerModel.items.length > 0 || managerModel.metrics.length > 0,
                            crmModel.items.length > 0,
                          ].filter(Boolean).length}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Hozir sahifada ko'rinayotgan faol bloklar soni.</p>
                      </div>
                      <div className="rounded-[22px] border border-border/30 bg-muted/5 px-4 py-4">
                        <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Leadlar</p>
                        <p className="mt-2 text-lg font-black text-foreground">{formatCompact(crmModel.totals.primary)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">CRM bo'yicha umumiy lead oqimi.</p>
                      </div>
                      <div className="rounded-[22px] border border-border/30 bg-muted/5 px-4 py-4">
                        <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Yangilanish</p>
                        <p className="mt-2 text-lg font-black text-foreground">{refreshing ? "Jarayonda" : "Tayyor"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Qo'lda yangilash tugmasi bilan darhol qayta olishingiz mumkin.</p>
                      </div>
                    </div>
                  </DashboardPanel>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </LoadTransition>
  );
}
