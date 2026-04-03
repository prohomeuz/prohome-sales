import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/entities/session/model";
import { useProjects } from "@/entities/project/model/use-projects";
import {
  DASHBOARD_PERIODS,
  useDashboardOverview,
} from "@/entities/dashboard/model/use-dashboard-overview";
import { formatNumber } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import GeneralError from "@/widgets/error/GeneralError";
import LoadTransition from "@/widgets/loading/LoadTransition";
import {
  Building2,
  CircleDollarSign,
  Layers3,
  RefreshCcw,
  Target,
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

const CHART_COLORS = ["#65a30d", "#84cc16", "#0ea5e9", "#f59e0b", "#8b5cf6", "#14b8a6"];

const LABEL_TRANSLATIONS = {
  amount: "Summa",
  active: "Faol",
  activecontracts: "Faol shartnomalar",
  activecontractssumma: "Faol shartnomalar summasi",
  available: "Mavjud",
  availableamount: "Mavjud summa",
  booked: "Band qilingan",
  booking: "Band qilish",
  bookings: "Bandlar",
  bron: "Band",
  cash: "Pul",
  cashflow: "Pul oqimi",
  clients: "Mijozlar",
  column: "Ustun",
  count: "Soni",
  customers: "Mijozlar",
  date: "Sana",
  day: "Kun",
  days: "Kun",
  deals: "Bitimlar",
  empty: "Bo'sh",
  emptyamount: "Bo'sh summa",
  expense: "Chiqim",
  floor: "Qavat",
  floors: "Qavatlar",
  floorname: "Qavat",
  free: "Bo'sh",
  fullname: "To'liq ism",
  growth: "O'sish",
  income: "Kirim",
  last7days: "Oxirgi 7 kun",
  last7dayssumma: "Oxirgi 7 kun summasi",
  last30days: "Oxirgi 30 kun",
  last30dayssumma: "Oxirgi 30 kun summasi",
  lead: "Murojaat",
  leadcount: "Murojaatlar soni",
  leads: "Murojaatlar",
  level: "Qavat",
  manager: "Menejer",
  managerid: "Menejer",
  managername: "Menejer",
  month: "Oy",
  name: "Nomi",
  occupied: "Band",
  period: "Davr",
  primary: "Asosiy",
  projectid: "Loyiha",
  remaining: "Qolgan",
  remainingamount: "Qolgan summa",
  reserved: "Zaxira",
  revenue: "Tushum",
  sales: "Sotuv",
  salesamount: "Sotuv summasi",
  secondary: "Ikkinchi",
  sold: "Sotilgan",
  soldamount: "Sotilgan summa",
  soldcount: "Sotilganlar soni",
  summary: "Umumiy",
  stage: "Bosqich",
  stats: "Statistika",
  statistics: "Statistika",
  statisticsindavr: "Davrdagi statistika",
  statistikaindavr: "Davrdagi statistika",
  status: "Holat",
  task: "Vazifa",
  tasks: "Vazifalar",
  tasksindavr: "Davrdagi vazifalar",
  tertiary: "Uchinchi",
  time: "Vaqt",
  title: "Sarlavha",
  total: "Jami",
  today: "Bugun",
  todaysumma: "Bugungi summa",
  totalamount: "Jami summa",
  totalbookings: "Jami bandlar",
  totalcustomers: "Jami mijozlar",
  totalemptyamount: "Qoldiq summa",
  totalrevenue: "Umumiy tushum",
  totalsales: "Jami sotuvlar",
  totalsalesamount: "Umumiy sotuv summasi",
  contract: "Shartnoma",
  contracts: "Shartnomalar",
  summa: "Summa",
  username: "Foydalanuvchi",
  value: "Qiymat",
  voronka: "Voronka",
  week: "Hafta",
};

const PHRASE_TRANSLATIONS = {
  activecontract: "Faol shartnomalar",
  activecontractsumma: "Faol shartnomalar summasi",
  activecontracts: "Faol shartnomalar",
  activecontractssumma: "Faol shartnomalar summasi",
  last30dayssumma: "Oxirgi 30 kun summasi",
  last7dayssumma: "Oxirgi 7 kun summasi",
  statistikaindav: "Davrdagi statistika",
  statistikaindavr: "Davrdagi statistika",
  statisticsindav: "Davrdagi statistika",
  statisticsindavr: "Davrdagi statistika",
  taskindav: "Davrdagi vazifa",
  taskindavr: "Davrdagi vazifa",
  tasksindav: "Davrdagi vazifalar",
  tasksindavr: "Davrdagi vazifalar",
  todaysumma: "Bugungi summa",
  vazifaindav: "Davrdagi vazifa",
  vazifaindavr: "Davrdagi vazifa",
  vazifalarindav: "Davrdagi vazifalar",
  vazifalarindavr: "Davrdagi vazifalar",
};

const STAT_CARD_TONES = {
  lime: {
    cardClass: "border-primary/10 bg-primary/[0.025]",
    iconWrapClass: "border-primary/10 bg-background text-primary",
    iconClass: "text-primary",
  },
  emerald: {
    cardClass: "border-emerald-200/45 bg-emerald-50/35",
    iconWrapClass: "border-emerald-200/50 bg-background text-emerald-600",
    iconClass: "text-emerald-600",
  },
  amber: {
    cardClass: "border-amber-200/45 bg-amber-50/35",
    iconWrapClass: "border-amber-200/50 bg-background text-amber-600",
    iconClass: "text-amber-600",
  },
  sky: {
    cardClass: "border-sky-200/45 bg-sky-50/35",
    iconWrapClass: "border-sky-200/50 bg-background text-sky-600",
    iconClass: "text-sky-600",
  },
};

function isRecord(value) {
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

function unwrapPayload(payload) {
  let current = payload;
  const keys = ["data", "items", "results", "result", "rows", "list", "payload"];

  for (let i = 0; i < 5; i += 1) {
    if (Array.isArray(current) || !isRecord(current)) return current;

    const nextKey = keys.find((key) => {
      const candidate = current[key];
      return Array.isArray(candidate) || isRecord(candidate);
    });

    if (!nextKey) return current;
    current = current[nextKey];
  }

  return current;
}

function findMatchingKey(source, candidates) {
  if (!isRecord(source)) return null;

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
  const key = findMatchingKey(source, candidates);
  return key ? toNumber(source[key]) : null;
}

function pickLabel(source, candidates, fallback) {
  const key = findMatchingKey(source, candidates);
  if (!key) return fallback;
  const value = source[key];
  return value === null || value === undefined || value === "" ? fallback : localizeDisplayLabel(String(value));
}

function humanize(value) {
  const raw = String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return "";

  const normalizedRaw = normalizeKey(raw);
  const exactPhrase = PHRASE_TRANSLATIONS[normalizedRaw];
  if (exactPhrase) return exactPhrase;

  const exact = LABEL_TRANSLATIONS[normalizedRaw];
  if (exact) return exact;

  const translated = raw
    .split(" ")
    .map((part) => {
      const normalized = normalizeKey(part);
      if (!normalized) return part;

      const mapped = LABEL_TRANSLATIONS[normalized];
      if (mapped) return mapped;

      return part.replace(/\b\w/g, (letter) => letter.toUpperCase());
    })
    .join(" ");

  return translated;
}

function localizeDisplayLabel(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  if (!/[A-Za-z]/.test(text)) {
    return text;
  }

  return humanize(text);
}

function formatMoney(value) {
  if (value === null || value === undefined) return "---";
  return `${formatNumber(Math.round(value))} UZS`;
}

function formatCompact(value) {
  if (value === null || value === undefined) return "---";
  return formatNumber(Math.round(value));
}

function AnimatedNumber({ value, formatter = formatCompact, className, duration = 900 }) {
  const [displayValue, setDisplayValue] = useState(() =>
    typeof value === "number" && Number.isFinite(value) ? 0 : null,
  );
  const previousValueRef = useRef(null);

  useEffect(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      previousValueRef.current = null;
      setDisplayValue(null);
      return undefined;
    }

    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      previousValueRef.current = value;
      setDisplayValue(value);
      return undefined;
    }

    const startValue = previousValueRef.current ?? 0;
    const change = value - startValue;

    if (Math.abs(change) < 1) {
      previousValueRef.current = value;
      setDisplayValue(value);
      return undefined;
    }

    let frameId = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + change * eased;

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        previousValueRef.current = value;
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [duration, value]);

  if (value === null || value === undefined || !Number.isFinite(value) || displayValue === null) {
    return <span className={className}>---</span>;
  }

  return <span className={className}>{formatter(displayValue)}</span>;
}

function getNumericEntries(source, limit = 6) {
  const raw = unwrapPayload(source);
  if (!isRecord(raw)) return [];

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
  if (!isRecord(raw)) {
    return {
      hasData: false,
      totalSalesAmount: null,
      totalEmptyAmount: null,
      totalCustomers: null,
      totalSales: null,
      totalBookings: null,
    };
  }

  const totalSalesAmount = pickNumber(raw, ["totalSalesAmount", "salesAmount", "soldAmount", "totalRevenue", "revenue"]);
  const totalEmptyAmount = pickNumber(raw, ["totalEmptyAmount", "emptyAmount", "availableAmount", "remainingAmount"]);
  const totalCustomers = pickNumber(raw, ["totalCustomers", "customers", "clients", "clientCount"]);
  const totalSales = pickNumber(raw, ["totalSales", "sales", "soldCount", "deals"]);
  const totalBookings = pickNumber(raw, ["totalBookings", "bookings", "bron", "reserved"]);

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

function normalizeSeries(source, preferredKeys = []) {
  const raw = unwrapPayload(source);
  const labelCandidates = ["label", "name", "title", "date", "day", "month", "week", "period", "time"];

  if (Array.isArray(raw)) {
    const rows = raw.filter(isRecord);
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

        const bonus = preferredKeys.some((candidate) => normalizeKey(key).includes(normalizeKey(candidate))) ? 10 : 1;
        scores.set(key, (scores.get(key) ?? 0) + bonus);
      });
    });

    const series = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => ({ key, label: humanize(key) }));

    return {
      items: rows.map((row, index) => {
        const item = {
          label: labelKey ? localizeDisplayLabel(String(row[labelKey] ?? `#${index + 1}`)) : `#${index + 1}`,
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

  if (isRecord(raw)) {
    const items = Object.entries(raw)
      .map(([key, value]) => ({ label: humanize(key), value: toNumber(value) }))
      .filter((item) => item.value !== null);

    return {
      items: items.map((item) => ({ label: item.label, value: item.value })),
      series: items.length ? [{ key: "value", label: "Qiymat" }] : [],
      metrics: items,
    };
  }

  return { items: [], series: [], metrics: [] };
}

function normalizeCollection(source, config) {
  const raw = unwrapPayload(source);
  const { labelCandidates, primaryCandidates, secondaryCandidates = [], tertiaryCandidates = [] } = config;

  let rows = [];

  if (Array.isArray(raw)) {
    rows = raw.filter(isRecord);
  } else if (isRecord(raw)) {
    rows = Object.entries(raw)
      .map(([key, value]) => ({ title: humanize(key), value }))
      .filter((row) => toNumber(row.value) !== null || isRecord(row.value));
  }

  const items = rows
    .map((row, index) => {
      const resolvedRow =
        isRecord(row.value) && !Array.isArray(row.value) ? { ...row.value, title: row.title } : row;

      const numericKeys = Object.keys(resolvedRow).filter((key) => {
        if (["id", "projectId", "managerId"].includes(key)) return false;
        return toNumber(resolvedRow[key]) !== null;
      });

      const primaryKey = findMatchingKey(resolvedRow, primaryCandidates) ?? numericKeys[0];
      const secondaryKey = findMatchingKey(resolvedRow, secondaryCandidates) ?? numericKeys[1];
      const tertiaryKey = findMatchingKey(resolvedRow, tertiaryCandidates) ?? numericKeys[2];

      return {
        label: pickLabel(resolvedRow, labelCandidates, resolvedRow.title ?? `#${index + 1}`),
        primary: primaryKey ? toNumber(resolvedRow[primaryKey]) : null,
        secondary: secondaryKey && secondaryKey !== primaryKey ? toNumber(resolvedRow[secondaryKey]) : null,
        tertiary:
          tertiaryKey && tertiaryKey !== primaryKey && tertiaryKey !== secondaryKey
            ? toNumber(resolvedRow[tertiaryKey])
            : null,
      };
    })
    .filter((item) => item.primary !== null || item.secondary !== null || item.tertiary !== null);

  return {
    items,
    totals: {
      primary: items.reduce((sum, item) => sum + (item.primary ?? 0), 0),
      secondary: items.reduce((sum, item) => sum + (item.secondary ?? 0), 0),
      tertiary: items.reduce((sum, item) => sum + (item.tertiary ?? 0), 0),
    },
    metrics: getNumericEntries(raw),
  };
}

function SectionCard({ title, description, meta, action, children, className }) {
  return (
    <Card
      className={
        className
          ? `gap-0 rounded-[20px] border-border/40 py-0 shadow-none ${className}`
          : "gap-0 rounded-[20px] border-border/40 py-0 shadow-none"
      }
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/30 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {meta ? <p className="text-[11px] text-muted-foreground">{meta}</p> : null}
          {action}
        </div>
      </div>
      <CardContent className="p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

function StatCard({ title, value, hint, formatter = formatCompact, icon: Icon, tone = "lime" }) {
  const styles = STAT_CARD_TONES[tone] ?? STAT_CARD_TONES.lime;

  return (
    <Card className={`gap-0 rounded-[20px] py-0 shadow-none ${styles.cardClass}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex min-h-[116px] flex-col justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {Icon ? (
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-[16px] border ${styles.iconWrapClass}`}
              >
                <Icon className={`size-4 ${styles.iconClass}`} />
              </div>
            ) : null}
            <p className="text-[12px] font-medium text-muted-foreground">{title}</p>
          </div>

          <div>
            <AnimatedNumber
              value={value}
              formatter={formatter}
              className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.75rem]"
            />
            {hint ? <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title = "Ma'lumot topilmadi", description = "Bu bo'lim uchun hozircha ko'rsatkich kelmadi." }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[18px] border border-dashed border-border/40 bg-muted/[0.08] px-5 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function MetricGrid({ metrics, columns = 2 }) {
  if (!metrics.length) return <EmptyState />;

  return (
    <div className={columns === 3 ? "grid gap-2.5 sm:grid-cols-3" : "grid gap-2.5 sm:grid-cols-2"}>
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-[16px] bg-muted/[0.08] px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{metric.label}</p>
          <AnimatedNumber
            value={metric.value}
            formatter={formatCompact}
            className="mt-1.5 text-lg font-semibold tracking-tight"
          />
        </div>
      ))}
    </div>
  );
}

function ChartTooltipCard({ active, payload, label, formatter = formatCompact }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[16px] border border-border/40 bg-background px-3 py-2 shadow-none">
      {label ? <p className="text-xs font-medium">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.dataKey ?? entry.name} className="mt-1 text-xs text-muted-foreground">
          {humanize(entry.name ?? entry.dataKey)}:{" "}
          <span className="font-medium text-foreground">{formatter(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function SectionSkeletonHeader() {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-4 w-56 rounded-full" />
      </div>
      <Skeleton className="h-4 w-16 rounded-full" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="gap-0 rounded-[20px] border-border/40 py-0 shadow-none">
      <CardContent className="p-4 sm:p-5">
        <div className="flex min-h-[116px] flex-col justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-[16px]" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
          <div>
            <Skeleton className="h-8 w-36 rounded-full" />
            <Skeleton className="mt-1.5 h-4 w-32 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSectionSkeleton() {
  return (
    <Card className="gap-0 rounded-[20px] border-border/40 py-0 shadow-none">
      <SectionSkeletonHeader />
      <CardContent className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-[280px] rounded-[18px]" />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Skeleton className="h-[68px] rounded-[16px]" />
          <Skeleton className="h-[68px] rounded-[16px]" />
          <Skeleton className="h-[68px] rounded-[16px]" />
          <Skeleton className="h-[68px] rounded-[16px]" />
        </div>
      </CardContent>
    </Card>
  );
}

function PieSectionSkeleton() {
  return (
    <Card className="gap-0 rounded-[20px] border-border/40 py-0 shadow-none">
      <SectionSkeletonHeader />
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <Skeleton className="h-[260px] rounded-[18px]" />
          <div className="space-y-2">
            <Skeleton className="h-[56px] rounded-[16px]" />
            <Skeleton className="h-[56px] rounded-[16px]" />
            <Skeleton className="h-[56px] rounded-[16px]" />
            <Skeleton className="h-[56px] rounded-[16px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ManagerSectionSkeleton() {
  return (
    <Card className="gap-0 rounded-[20px] border-border/40 py-0 shadow-none">
      <SectionSkeletonHeader />
      <CardContent className="space-y-2.5 p-4 sm:p-5">
        <div className="overflow-hidden rounded-[18px] border border-border/40">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_120px_120px_170px] items-center gap-3 border-b border-border/30 px-3.5 py-3 sm:grid">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="grid gap-3 px-3.5 py-3 [&+&]:border-t [&+&]:border-border/30 sm:grid-cols-[minmax(0,1.4fr)_120px_120px_170px] sm:items-center"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-full sm:hidden" />
              </div>
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardContentSkeleton({ executiveRole }) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {executiveRole ? (
        <>
          <div className="grid gap-3 xl:grid-cols-2">
            <ChartSectionSkeleton />
            <ChartSectionSkeleton />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <ChartSectionSkeleton />
            <PieSectionSkeleton />
          </div>
        </>
      ) : null}

      <ManagerSectionSkeleton />
    </>
  );
}

export default function DashboardPage() {
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
  const growthModel = useMemo(() => normalizeSeries(growth, ["sales", "amount", "growth"]), [growth]);
  const cashflowModel = useMemo(() => normalizeSeries(cashflow, ["income", "cash", "amount", "expense"]), [cashflow]);
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
  const hasAnyData = useMemo(
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
  const showContentSkeleton =
    projectsLoading ||
    refreshing ||
    loading ||
    (!projectId && projects.length > 0);

  const summaryCards = useMemo(() => {
    if (statsModel.hasData) {
      return [
        {
          title: "Sotuv summasi",
          value: statsModel.totalSalesAmount,
          formatter: formatMoney,
          hint: "Tanlangan davr",
          icon: CircleDollarSign,
          tone: "lime",
        },
        {
          title: "Qoldiq summa",
          value: statsModel.totalEmptyAmount,
          formatter: formatMoney,
          hint: "Mavjud fond",
          icon: Building2,
          tone: "sky",
        },
        {
          title: "Mijozlar",
          value: statsModel.totalCustomers,
          formatter: formatCompact,
          hint: "Faol mijozlar",
          icon: Users,
          tone: "emerald",
        },
        {
          title: "Bitimlar",
          value: statsModel.totalSales,
          formatter: formatCompact,
          hint: "Yopilgan savdolar",
          icon: Target,
          tone: "amber",
        },
      ];
    }

    return [
        {
          title: "Murojaatlar",
          value: crmModel.totals.primary,
          formatter: formatCompact,
          hint: "CRM bo'yicha",
          icon: Users,
          tone: "emerald",
        },
        {
          title: "Voronka summasi",
          value: crmModel.totals.secondary,
          formatter: formatMoney,
          hint: "Jami summa",
          icon: Wallet,
          tone: "lime",
        },
        {
          title: "Menejer natijasi",
          value: managerModel.totals.primary,
          formatter: formatCompact,
          hint: "Jamoa bo'yicha",
          icon: UserRound,
          tone: "sky",
        },
        {
          title: "Bosqichlar",
          value: crmModel.items.length,
          formatter: formatCompact,
          hint: "Faol holatlar",
          icon: Layers3,
          tone: "amber",
        },
    ];
  }, [crmModel, managerModel, statsModel]);

  return (
    <LoadTransition
      loading={false}
      className="h-full"
      contentClassName="h-full"
    >
      {error && !hasAnyData ? (
        <GeneralError />
      ) : (
        <section className="flex h-full min-h-0 flex-col overflow-y-auto bg-background p-3 sm:p-5">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            <Card className="gap-0 rounded-[24px] border-border/40 py-0 shadow-none">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {selectedProject
                          ? selectedProject.name ?? `Loyiha #${selectedProject.id}`
                          : projectsLoading
                            ? "Loyihalar yuklanmoqda..."
                            : "Loyiha tanlanmagan"}
                      </span>
                      <span className="hidden sm:inline">/</span>
                      <span>{DASHBOARD_PERIODS[period] ?? "Oy"}</span>
                      <span className="hidden sm:inline">/</span>
                      <span>{refreshing ? "Yangilanmoqda" : "Tayyor"}</span>
                    </div>

                    <div>
                      <h1 className="text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                        Boshqaruv paneli
                      </h1>
                      <p className="mt-1 text-sm text-muted-foreground sm:text-[15px]">
                        Asosiy ko'rsatkichlar va joriy holat.
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full max-w-2xl flex-col gap-2.5 xl:items-end">
                    <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <Select
                        value={projectId ?? undefined}
                        onValueChange={setProjectId}
                        disabled={projectsLoading || projects.length === 0}
                      >
                        <SelectTrigger className="h-10 rounded-[12px] border-border/40 bg-background px-4">
                          <SelectValue placeholder={projectsLoading ? "Loyihalar yuklanmoqda..." : "Loyihani tanlang"} />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={String(project.id)}>
                              {project.name ?? `Loyiha #${project.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        className="h-10 rounded-[12px] border-border/40 px-4 shadow-none"
                        onClick={() => get({ silent: true })}
                        disabled={!projectId || refreshing}
                      >
                        <RefreshCcw className={refreshing ? "size-4 animate-spin" : "size-4"} />
                        Yangilash
                      </Button>
                    </div>

                    <Tabs value={period} onValueChange={setPeriod} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 rounded-[12px] border border-border/40 bg-muted/[0.08] !p-[3px] sm:grid-cols-4">
                        {Object.entries(DASHBOARD_PERIODS).map(([key, label]) => (
                          <TabsTrigger
                            key={key}
                            value={key}
                            className="h-9 rounded-[10px] data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
                          >
                            {label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {projects.length === 0 && !projectsLoading ? (
              <EmptyState
                title="Loyiha topilmadi"
                description="Boshqaruv panelini ko'rsatish uchun tizimda kamida bitta loyiha bo'lishi kerak."
              />
            ) : showContentSkeleton ? (
              <DashboardContentSkeleton executiveRole={executiveRole} />
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map((card) => (
                    <StatCard
                      key={card.title}
                      title={card.title}
                      value={card.value}
                      formatter={card.formatter}
                      hint={card.hint}
                      icon={card.icon}
                      tone={card.tone}
                    />
                  ))}
                </div>

                {executiveRole ? (
                  <>
                    <div className="grid gap-3 xl:grid-cols-2">
                      <SectionCard
                        title="O'sish dinamikasi"
                        description="Davr bo'yicha o'sish"
                        meta={sectionErrors.growth ?? null}
                      >
                        {growthModel.items.length > 0 && growthModel.series.length > 0 ? (
                          <div className="space-y-3">
                            <div className="h-[280px] rounded-[18px] bg-muted/[0.08] p-2.5 sm:p-3">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthModel.items} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="dashboard-growth-fill" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#65a30d" stopOpacity={0.22} />
                                      <stop offset="95%" stopColor="#65a30d" stopOpacity={0.02} />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid vertical={false} stroke="#e5e7eb" />
                                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                  <Tooltip content={(props) => <ChartTooltipCard {...props} />} />
                                  <Area
                                    type="monotone"
                                    dataKey={growthModel.series[0].key}
                                    stroke="#65a30d"
                                    fill="url(#dashboard-growth-fill)"
                                    strokeWidth={2.5}
                                  />
                                  {growthModel.series[1] ? (
                                    <Line type="monotone" dataKey={growthModel.series[1].key} stroke="#0ea5e9" strokeWidth={2} dot={false} />
                                  ) : null}
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <MetricGrid metrics={growthModel.metrics.slice(0, 4)} />
                          </div>
                        ) : (
                          <EmptyState description="O'sish bo'limi uchun yetarli ma'lumot kelmadi." />
                        )}
                      </SectionCard>

                      <SectionCard
                        title="Pul oqimi"
                        description="Kirim va chiqimlar"
                        meta={sectionErrors.cashflow ?? null}
                      >
                        {cashflowModel.items.length > 0 && cashflowModel.series.length > 0 ? (
                          <div className="space-y-3">
                            <div className="h-[280px] rounded-[18px] bg-muted/[0.08] p-2.5 sm:p-3">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={cashflowModel.items} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                                  <CartesianGrid vertical={false} stroke="#e5e7eb" />
                                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                  <Tooltip content={(props) => <ChartTooltipCard {...props} formatter={formatMoney} />} />
                                  {cashflowModel.series.map((series, index) => (
                                    <Line
                                      key={series.key}
                                      type="monotone"
                                      dataKey={series.key}
                                      stroke={CHART_COLORS[index]}
                                      strokeWidth={2.25}
                                      dot={false}
                                    />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <MetricGrid metrics={cashflowModel.metrics.slice(0, 4)} />
                          </div>
                        ) : (
                          <EmptyState description="Pul oqimi bo'limi uchun mos ko'rsatkich topilmadi." />
                        )}
                      </SectionCard>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-2">
                      <SectionCard
                        title="Qavatlar kesimi"
                        description="Sotuv va qoldiq"
                        meta={sectionErrors.floors ?? null}
                      >
                        {floorsModel.items.length > 0 ? (
                          <div className="space-y-3">
                            <div className="h-[280px] rounded-[18px] bg-muted/[0.08] p-2.5 sm:p-3">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={floorsModel.items} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                                  <CartesianGrid vertical={false} stroke="#e5e7eb" />
                                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                                  <Tooltip content={(props) => <ChartTooltipCard {...props} />} />
                                  <Bar dataKey="primary" fill="#65a30d" radius={[6, 6, 0, 0]} />
                                  {floorsModel.items.some((item) => item.secondary !== null) ? (
                                    <Bar dataKey="secondary" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                                  ) : null}
                                  {floorsModel.items.some((item) => item.tertiary !== null) ? (
                                    <Bar dataKey="tertiary" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                  ) : null}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <MetricGrid
                              metrics={[
                                { label: "Sotilgan", value: floorsModel.totals.primary },
                                { label: "Bo'sh", value: floorsModel.totals.secondary },
                                { label: "Band", value: floorsModel.totals.tertiary },
                              ]}
                              columns={3}
                            />
                          </div>
                        ) : (
                          <EmptyState description="Qavatlar bo'limi uchun ko'rsatkich topilmadi." />
                        )}
                      </SectionCard>

                      <SectionCard
                        title="CRM voronkasi"
                        description="Holatlar kesimi"
                        meta={sectionErrors.crm ?? null}
                      >
                        {crmModel.items.length > 0 ? (
                          <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                            <div className="h-[260px] rounded-[18px] bg-muted/[0.08] p-2.5 sm:p-3">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Tooltip content={(props) => <ChartTooltipCard {...props} />} />
                                  <Pie data={crmModel.items} dataKey="primary" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={3}>
                                    {crmModel.items.map((item, index) => (
                                      <Cell key={item.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="overflow-hidden rounded-[18px] border border-border/40 bg-muted/[0.06]">
                              {crmModel.items.map((item, index) => (
                                <div
                                  key={item.label}
                                  className="flex items-center justify-between gap-3 px-3 py-3 [&+&]:border-t [&+&]:border-border/30"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="block size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                    <div>
                                      <p className="text-sm font-medium">{item.label}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.secondary !== null ? (
                                          <AnimatedNumber value={item.secondary} formatter={formatMoney} />
                                        ) : (
                                          "Summa yo'q"
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <AnimatedNumber
                                      value={item.primary}
                                      formatter={formatCompact}
                                      className="text-sm font-semibold"
                                    />
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">ta</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <EmptyState description="CRM statistikasi hali shakllanmagan." />
                        )}
                      </SectionCard>
                    </div>
                  </>
                ) : null}

                <SectionCard
                  title="Menejerlar kesimi"
                  description="Jamoa natijalari"
                  meta={sectionErrors.manager ?? null}
                  action={
                    refreshing ? (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <RefreshCcw className="size-3 animate-spin" />
                        Yangilanmoqda
                      </div>
                    ) : null
                  }
                >
                  {managerModel.items.length > 0 ? (
                    <div className="overflow-hidden rounded-[18px] border border-border/40">
                      <div className="hidden grid-cols-[minmax(0,1.4fr)_120px_120px_170px] items-center gap-3 border-b border-border/30 bg-muted/[0.05] px-3.5 py-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground sm:grid">
                        <p>Menejer</p>
                        <p>Sotuv</p>
                        <p>Murojaat</p>
                        <p>Summa</p>
                      </div>

                      {managerModel.items.map((item, index) => (
                        <div
                          key={`${item.label}-${index}`}
                          className="grid gap-3 px-3.5 py-3 [&+&]:border-t [&+&]:border-border/30 sm:grid-cols-[minmax(0,1.4fr)_120px_120px_170px] sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.label}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">Menejer</p>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:block">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground sm:hidden">Sotuv</p>
                            <AnimatedNumber
                              value={item.primary}
                              formatter={formatCompact}
                              className="text-sm font-medium"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:block">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground sm:hidden">Murojaat</p>
                            <AnimatedNumber
                              value={item.secondary}
                              formatter={formatCompact}
                              className="text-sm font-medium"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:block">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground sm:hidden">Summa</p>
                            <AnimatedNumber
                              value={item.tertiary}
                              formatter={formatMoney}
                              className="text-sm font-medium"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <MetricGrid metrics={managerModel.metrics} columns={3} />
                  )}
                </SectionCard>
              </>
            )}
          </div>
        </section>
      )}
    </LoadTransition>
  );  
}
