import { useAppStore } from "@/entities/session/model";
import { useRoomStatus } from "@/shared/hooks/use-room-status";
import useSound from "@/shared/hooks/use-sound";
import {
  cn,
  formatNumber,
  formatNumberWithPercent,
  getFormData,
  normalizePeriod,
} from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import CurrencyBadge from "@/shared/ui/currency-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Drawer, DrawerClose, DrawerContent } from "@/shared/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BadgePercent,
  Ban,
  Bolt,
  Calculator,
  CalendarDays,
  CircleCheckBig,
  CircleDollarSign,
  CircleMinus,
  CirclePlus,
  Coins,
  FileText,
  Gift,
  Grid2X2,
  HandCoins,
  Images,
  LoaderCircle,
  Lock,
  MessageSquareText,
  Phone,
  Plane,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppartmentTimeLine from "./AppartmentTimeLine";
import LoadTransition from "./loading/LoadTransition";
import SurfaceLoader from "./loading/SurfaceLoader";

const states = {
  BOX: "Karobka",
  READY: "Ta'mirlangan",
};

const uzbekTranslate = {
  refrigerator: "Muzlatgich",
  "gas-stove": "Gaz plita",
  "washing-machine": "Kir yuvish mashinasi",
  "electric-plate": "Elektr plita",
};

const PAYMENT_BONUS_RULES = [
  {
    key: "full-payment",
    minDownPayment: Infinity,
    discountPerM2: 1_000_000,
    items: ["refrigerator", "washing-machine"],
    qualifier: "100% to'lov",
  },
  {
    key: "120m",
    minDownPayment: 120_000_000,
    discountPerM2: 600_000,
    items: ["refrigerator", "electric-plate"],
    qualifier: "120 000 000 so'm to'lov",
  },
  {
    key: "90m",
    minDownPayment: 90_000_000,
    discountPerM2: 600_000,
    items: ["refrigerator"],
    qualifier: "90 000 000 so'm to'lov",
  },
  {
    key: "60m",
    minDownPayment: 60_000_000,
    discountPerM2: 400_000,
    items: ["washing-machine"],
    qualifier: "60 000 000 so'm to'lov",
  },
  {
    key: "30m",
    minDownPayment: 30_000_000,
    discountPerM2: 200_000,
    items: ["electric-plate"],
    qualifier: "30 000 000 so'm to'lov",
  },
];

const statusBadgeClass = {
  SOLD: "bg-red-500",
  RESERVED: "bg-orange-500",
  EMPTY: "bg-green-500",
  NOT: "bg-slate-400",
};

const statusLabels = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};

const actionButtons = [
  {
    code: "SOLD",
    title: "Sotish",
    description: "Mijoz ma'lumoti bilan sotuvni yakunlash",
    submitLabel: "Sotishni tasdiqlash",
    successText: "Uy muvaffaqiyatli sotildi.",
    icon: BadgeCheck,
    cardTone:
      "border-emerald-500/18 hover:border-emerald-500/35 hover:bg-emerald-500/4",
    accentTone: "bg-emerald-500/85",
    iconTone:
      "border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  {
    code: "RESERVED",
    title: "Bron qilish",
    description: "Uyga vaqtinchalik bron qo'yish",
    submitLabel: "Bronni saqlash",
    successText: "Uy bron holatiga o'tkazildi.",
    icon: CalendarDays,
    cardTone:
      "border-orange-500/24 hover:border-orange-500/45 hover:bg-orange-500/6",
    accentTone: "bg-orange-500",
    iconTone:
      "border-orange-500/25 bg-orange-500/15 text-orange-600 dark:text-orange-300",
  },
  {
    code: "NOT",
    title: "To'xtatish",
    description: "Uyni vaqtincha sotuvdan olib tashlash",
    submitLabel: "Sotuvdan olish",
    successText: "Uy sotilmaydigan holatga o'tkazildi.",
    icon: Ban,
    cardTone:
      "border-slate-400/30 hover:border-slate-500/45 hover:bg-slate-500/4",
    accentTone: "bg-slate-500/75",
    iconTone:
      "border-slate-400/30 bg-slate-500/15 text-slate-600 dark:text-slate-300",
  },
  {
    code: "EMPTY",
    title: "Sotuvga chiqarish",
    description: "Uyni qayta aktiv sotuvga qaytarish",
    submitLabel: "Sotuvga qaytarish",
    successText: "Uy qayta sotuvga chiqarildi.",
    icon: RotateCcw,
    cardTone: "border-sky-500/18 hover:border-sky-500/35 hover:bg-sky-500/4",
    accentTone: "bg-sky-500/85",
    iconTone: "border-sky-500/20 bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
];

const paymentPeriods = [12, 24, 36, 48, 60];
const UZ_PHONE = /^\+998\d{9}$/;
const MIN_INSTALLMENTS = 12;
const MAX_INSTALLMENTS = 240;
const STATUS_DIALOG_CLOSE_DELAY = 220;
const DEFAULT_CALC_STATE = "BOX";
const ACTIONS_BY_STATUS = {
  SOLD: ["EMPTY"],
  RESERVED: ["SOLD", "EMPTY"],
  NOT: ["EMPTY"],
  EMPTY: ["SOLD", "RESERVED", "NOT"],
};
const INITIAL_CALC_RESULT = {
  monthlyPayment: 0,
  downPayment: 0,
  months: 60,
  bonus: false,
  umra: false,
};
const LazyGenplanViewerButton = lazy(() => import("./GenplanViewerButton"));
const LazyDiscountViewerSlider = lazy(() => import("./DiscountViewerSlider"));
const PDF_SERVICE_URL = "https://contract.prohome.uz/bron";
const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentyabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

function formatCreatedDate(date) {
  const d = date instanceof Date ? date : new Date(date ?? Date.now());
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()] ?? "";
  return `${year}-yil ${day}-${month}`;
}

function sanitizeFileName(value) {
  return String(value ?? "bron-hujjat")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 140);
}

function getBonusItemLabel(item) {
  return uzbekTranslate[item] ?? item;
}

function formatBonusItems(items) {
  return items.map(getBonusItemLabel).join(" + ");
}

function resolvePaymentBonus({ downPayment, totalPrice }) {
  const normalizedDownPayment = Number(downPayment) || 0;
  const normalizedTotalPrice = Number(totalPrice) || 0;

  if (normalizedDownPayment <= 0) return null;

  if (
    normalizedTotalPrice > 0 &&
    normalizedDownPayment >= normalizedTotalPrice
  ) {
    const fullPaymentRule = PAYMENT_BONUS_RULES[0];
    return {
      ...fullPaymentRule,
      title: formatBonusItems(fullPaymentRule.items),
    };
  }

  const matchedRule = PAYMENT_BONUS_RULES.find(
    (rule) => normalizedDownPayment >= rule.minDownPayment,
  );

  if (!matchedRule || matchedRule.key === "full-payment") return null;

  return {
    ...matchedRule,
    title: formatBonusItems(matchedRule.items),
  };
}

function extractContractFileFromResponse(data) {
  if (!data || typeof data !== "object") return "";

  const directContractFile = data?.contractFile;
  const nestedDataContractFile = data?.data?.contractFile;
  const roomContractFile = data?.room?.contractFile;
  const resultContractFile = data?.result?.contractFile;

  return (
    directContractFile ??
    nestedDataContractFile ??
    roomContractFile ??
    resultContractFile ??
    ""
  );
}

function resolveContractFileDocUrl(contractFile) {
  if (!contractFile) return "";
  const raw = String(contractFile).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const base = (
    import.meta.env.VITE_BASE_URL ?? window.location.origin
  ).replace(/\/+$/, "");
  const normalizedPath = raw.replace(/^\/+/, "");

  if (normalizedPath.startsWith("api/v1/docs/")) {
    return `${base}/${normalizedPath}`;
  }

  return `${base}/api/v1/docs/${normalizedPath}`;
}

function openExternalDocument(url) {
  if (!url || typeof document === "undefined") return false;

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
}

function normalizePhone(raw) {
  return String(raw ?? "").replace(/[^\d+]/g, "");
}

function digitsOnly(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

function formatUzPhoneDisplay(raw) {
  const digits = digitsOnly(raw);

  if (!digits) return "";

  let local = digits.startsWith("998") ? digits.slice(3) : digits;
  local = local.slice(0, 9);

  const part1 = local.slice(0, 2);
  const part2 = local.slice(2, 5);
  const part3 = local.slice(5, 7);
  const part4 = local.slice(7, 9);

  let result = "+998";

  if (part1) {
    result += ` (${part1}`;
    if (part1.length === 2) result += ")";
  }
  if (part2) result += ` ${part2}`;
  if (part3) result += ` ${part3}`;
  if (part4) result += ` ${part4}`;

  return result;
}

function getPositiveNumericString(...candidates) {
  for (const candidate of candidates) {
    const normalized = digitsOnly(candidate);
    const numeric = Number(normalized);

    if (Number.isFinite(numeric) && numeric > 0) {
      return String(numeric);
    }
  }

  return "1";
}

function createEmptyStatusForm() {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    description: "",
    downPayment: "0",
    installments: "60",
    discountValue: "",
  };
}

function getInitialStatusForm(home, nextStatus, defaults) {
  const form = createEmptyStatusForm();
  const isCustomerFlow = nextStatus === "SOLD" || nextStatus === "RESERVED";
  const customer = home?.customer ?? {};

  if (isCustomerFlow) {
    const currentDownPayment =
      digitsOnly(
        defaults?.calcResult?.downPayment ??
          defaults?.downPayment ??
          customer?.downPayment ??
          0,
      ) || "0";
    const currentInstallments =
      Number(
        defaults?.period ??
          defaults?.calcResult?.months ??
          customer?.installments ??
          60,
      ) || 60;

    form.firstName = customer.firstName ?? "";
    form.lastName = customer.lastName ?? "";
    form.phone = formatUzPhoneDisplay(customer.phone ?? "");
    form.description = home?.description ?? "";
    form.downPayment = formatNumber(currentDownPayment);
    form.installments = String(currentInstallments);
    form.discountValue = String(
      defaults?.discount ?? customer?.discountValue ?? "",
    ).trim();
    return form;
  }

  form.installments = "0";
  if (nextStatus === "NOT") {
    form.description = home?.description ?? "";
  }

  return form;
}

function createCalculatorInitialState() {
  return {
    calcResult: INITIAL_CALC_RESULT,
    calcVersion: 0,
    selectedState: DEFAULT_CALC_STATE,
    showDiscount: false,
    discountType: "discountPerM2",
    period: 60,
    downPayment: "0",
    discount: "",
    galleryShow: false,
    calcLoading: false,
    statusDialogOpen: false,
    statusDialogAction: null,
    statusDialogRenderedAction: null,
    statusForm: createEmptyStatusForm(),
    statusErrors: {},
    pendingAction: null,
    bonusDialogOpen: false,
  };
}

function calculatorReducer(state, action) {
  switch (action.type) {
    case "SET_CALC_LOADING":
      return { ...state, calcLoading: action.payload };
    case "SET_CALC_RESULT":
      return {
        ...state,
        calcResult: action.payload,
        calcVersion: state.calcVersion + 1,
      };
    case "SET_SELECTED_STATE":
      return { ...state, selectedState: action.payload };
    case "TOGGLE_DISCOUNT":
      return { ...state, showDiscount: !state.showDiscount };
    case "SET_DISCOUNT_TYPE":
      return { ...state, discountType: action.payload };
    case "SET_PERIOD":
      return { ...state, period: action.payload };
    case "SET_DOWN_PAYMENT":
      return { ...state, downPayment: action.payload };
    case "SET_DISCOUNT":
      return { ...state, discount: action.payload };
    case "SET_GALLERY_SHOW":
      if (state.galleryShow === action.payload) {
        return state;
      }
      return { ...state, galleryShow: action.payload };
    case "OPEN_STATUS_DIALOG":
      return {
        ...state,
        statusDialogOpen: true,
        statusDialogAction: action.payload.action,
        statusDialogRenderedAction: action.payload.action,
        statusForm: action.payload.form,
        statusErrors: {},
        pendingAction: null,
      };
    case "CLOSE_STATUS_DIALOG":
      return {
        ...state,
        statusDialogOpen: false,
        statusDialogAction: null,
        statusForm: createEmptyStatusForm(),
        statusErrors: {},
        pendingAction: null,
      };
    case "CLEAR_STATUS_DIALOG":
      return {
        ...state,
        statusDialogRenderedAction: null,
        statusForm: createEmptyStatusForm(),
        statusErrors: {},
      };
    case "SET_STATUS_FIELD":
      return {
        ...state,
        statusForm: {
          ...state.statusForm,
          [action.payload.field]: action.payload.value,
        },
        statusErrors: state.statusErrors[action.payload.field]
          ? {
              ...state.statusErrors,
              [action.payload.field]: null,
            }
          : state.statusErrors,
      };
    case "SET_STATUS_ERRORS":
      return { ...state, statusErrors: action.payload };
    case "SET_PENDING_ACTION":
      return { ...state, pendingAction: action.payload };
    case "OPEN_BONUS_DIALOG":
      return { ...state, bonusDialogOpen: true };
    case "CLOSE_BONUS_DIALOG":
      return { ...state, bonusDialogOpen: false };
    case "RESET":
      return {
        ...createCalculatorInitialState(),
        galleryShow: state.galleryShow,
      };
    case "RESET_FOR_HOME":
      return createCalculatorInitialState();
    default:
      return state;
  }
}

export default function CalculatorTool({ home, onStatusUpdated }) {
  const timerRef = useRef();
  const dialogResetTimerRef = useRef();
  const { sound } = useSound("/win.mp3");
  const { updateStatus, loading: statusLoading } = useRoomStatus();
  const fetchCurrencyUsd = useAppStore((state) => state.fetchCurrencyUsd);
  const currencyUsd = useAppStore((state) => state.currencyUsd);
  const location = useLocation();
  const navigate = useNavigate();
  const [contractFileLoading, setContractFileLoading] = useState(false);
  const [genplanViewerLoaded, setGenplanViewerLoaded] = useState(false);
  const [genplanOpenSignal, setGenplanOpenSignal] = useState(0);
  const [umraViewerLoaded, setUmraViewerLoaded] = useState(false);
  const [umraOpenSignal, setUmraOpenSignal] = useState(0);
  const [confidenceViewerLoaded, setConfidenceViewerLoaded] = useState(false);
  const [confidenceOpenSignal, setConfidenceOpenSignal] = useState(0);
  const [discountViewerLoaded, setDiscountViewerLoaded] = useState(false);
  const [discountOpenSignal, setDiscountOpenSignal] = useState(0);
  const [state, dispatch] = useReducer(
    calculatorReducer,
    undefined,
    createCalculatorInitialState,
  );
  const {
    calcResult,
    calcVersion,
    selectedState,
    showDiscount,
    discountType,
    period,
    downPayment,
    discount,
    galleryShow,
    calcLoading,
    statusDialogOpen,
    statusDialogAction,
    statusDialogRenderedAction,
    statusForm,
    statusErrors,
    pendingAction,
    bonusDialogOpen,
  } = state;
  const activeAction = statusDialogAction ?? statusDialogRenderedAction;
  const ActiveActionIcon = activeAction?.icon;
  const actionInProgress = statusLoading || contractFileLoading;
  const actionLocked =
    (home?.canBeSold ?? home?.customer?.canBeSold ?? true) === false;
  const isOpen =
    location.search.includes("details=") && location.hash === "#calculator";
  const hasDiscountValue = showDiscount && String(discount ?? "").trim();
  const availableActions = useMemo(() => {
    const allowedCodes = ACTIONS_BY_STATUS[home.status] ?? [];
    return actionButtons.filter((action) => allowedCodes.includes(action.code));
  }, [home.status]);
  const paymentBonus = useMemo(() => {
    const usdRate = Number(currencyUsd?.rate);
    const hasUsdRate = Number.isFinite(usdRate) && usdRate > 0;
    const resolvedPrice = Number(calcResult.price ?? home.price ?? 0);
    const resolvedSize = Number(calcResult.size ?? home.size ?? 0);
    const totalSom =
      hasUsdRate && resolvedPrice > 0 && resolvedSize > 0
        ? Math.round(resolvedPrice * resolvedSize * usdRate)
        : 0;
    const resolvedDownPayment = Number(digitsOnly(calcResult.downPayment)) || 0;

    return resolvePaymentBonus({
      downPayment: resolvedDownPayment,
      totalPrice: totalSom,
    });
  }, [
    calcResult.downPayment,
    calcResult.price,
    calcResult.size,
    currencyUsd?.rate,
    home.price,
    home.size,
  ]);
  const bonusItems = useMemo(() => paymentBonus?.items ?? [], [paymentBonus]);
  const hasUmraBonus = calcResult.umra === true;
  const summaryCards = useMemo(() => {
    const usdRate = Number(currencyUsd?.rate);
    const hasUsdRate = Number.isFinite(usdRate) && usdRate > 0;
    const resolvedPrice = Number(calcResult.price ?? home.price ?? 0);
    const resolvedSize = Number(calcResult.size ?? home.size ?? 0);
    const totalUsd =
      resolvedPrice > 0 && resolvedSize > 0 ? resolvedPrice * resolvedSize : 0;
    const totalSom = hasUsdRate ? Math.round(totalUsd * usdRate) : 0;
    const metrSom = hasUsdRate ? Math.round(resolvedPrice * usdRate) : 0;
    const bonusDiscountTotal =
      paymentBonus && resolvedSize > 0
        ? paymentBonus.discountPerM2 * resolvedSize
        : 0;
    const metrSomWithBonus =
      paymentBonus && metrSom > 0
        ? Math.max(metrSom - paymentBonus.discountPerM2, 0)
        : 0;
    const totalSomWithBonus =
      paymentBonus && totalSom > 0
        ? Math.max(totalSom - bonusDiscountTotal, 0)
        : 0;
    const cards = [
      {
        key: "price",
        label: "Umumiy narx",
        value:
          totalUsd > 0 ? `${formatNumber(totalUsd.toFixed(1))} USD` : "---",
        subValues:
          hasUsdRate && totalSom > 0
            ? [`= ${formatNumber(totalSom)} so'm`]
            : [],
        icon: CircleDollarSign,
        mono: true,
      },
      {
        key: "months",
        label: "Muddat",
        value: `${calcResult.months} oy`,
        icon: CalendarDays,
        mono: true,
      },
    ];

    if (states[calcResult.state]) {
      cards.push({
        key: "size",
        label: "O'lchami",
        value: (
          <>
            {calcResult.size} m<sup>2</sup>
          </>
        ),
        icon: Grid2X2,
        mono: true,
      });
      cards.push({
        key: "state",
        label: "Holati",
        value: states[calcResult.state],
        icon: Bolt,
        mono: false,
      });
    }

    cards.push(
      {
        key: "down-payment",
        label: "Boshlang'ich to'lov",
        value: formatNumber(calcResult.downPayment),
        icon: HandCoins,
        mono: true,
      },
      {
        key: "price-per-meter",
        label: (
          <>
            M<sup>2</sup>
          </>
        ),
        value: resolvedPrice > 0 ? `${formatNumber(resolvedPrice)} USD` : "---",
        subValues: [
          hasUsdRate && metrSom > 0 ? `= ${formatNumber(metrSom)} so'm` : null,
          paymentBonus
            ? `Chegirma: ${formatNumber(paymentBonus.discountPerM2)} so'm / m²`
            : null,
          bonusDiscountTotal > 0
            ? `Jami chegirma: ${formatNumber(Math.round(bonusDiscountTotal))} so'm`
            : null,
          metrSomWithBonus > 0
            ? `Bonus bilan: ${formatNumber(metrSomWithBonus)} so'm / m²`
            : null,
          totalSomWithBonus > 0
            ? `Jami bonus bilan: ${formatNumber(totalSomWithBonus)} so'm`
            : null,
        ].filter(Boolean),
        icon: Coins,
        mono: true,
      },
    );

    return cards;
  }, [calcResult, currencyUsd?.rate, home.price, home.size, paymentBonus]);

  //   API
  async function calc(url) {
    let req;
    const token = localStorage.getItem("token");
    dispatch({ type: "SET_CALC_LOADING", payload: true });
    try {
      req = await fetch(url, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });
    } catch {
      toast.error("Tizimda nosozlik!", { position: "bottom-left" });
    }

    if (req) {
      if (req.status === 200) {
        const data = await req.json();
        console.log(data);

        dispatch({ type: "SET_CALC_RESULT", payload: data });
      } else if (req.status === 400) {
        toast.error(
          "Boshlang'ich to'lov uyning umumiy summasidan katta bo'lishi mumkin emas!",
          { position: "bottom-left" },
        );
      } else {
        toast.error("Xatolik yuz berdi qayta urunib ko'ring!", {
          position: "bottom-left",
        });
      }
    }

    dispatch({ type: "SET_CALC_LOADING", payload: false });
  }

  function handleClose({ clearDetails = false } = {}) {
    dispatch({ type: "RESET" });
    const params = new URLSearchParams(location.search);
    if (clearDetails) {
      params.delete("details");
    }
    const nextSearch = params.toString();
    const nextUrl = clearDetails
      ? `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`
      : `${location.pathname}${location.search}`;
    navigate(nextUrl, { replace: true });
  }

  function handleChangeDiscountType(value) {
    dispatch({ type: "SET_DISCOUNT_TYPE", payload: value });
  }

  function handleCalc(evt) {
    evt.preventDefault();
    const url = new URL(
      import.meta.env.VITE_BASE_URL + `/api/v1/room/${home.id}/calculate`,
    );
    const formData = getFormData(evt.currentTarget);

    Object.entries(formData).forEach(([key, value]) => {
      const normalizedValue =
        key === "months" ? normalizePeriod(value) || "12" : value;
      url.searchParams.append(key, normalizedValue.replaceAll(/\s+/g, ""));
    });

    calc(url.href);
  }

  function handlePeriod(p) {
    dispatch({ type: "SET_PERIOD", payload: p });
  }

  function handlePeriodInputChange(evt) {
    const digits = String(evt.target.value ?? "")
      .replace(/\D/g, "")
      .slice(0, 3);
    handlePeriod(digits);
  }

  function handlePeriodInputBlur(evt) {
    const normalized = normalizePeriod(evt.target.value);
    handlePeriod(normalized || "12");
  }

  function handleDownPayment(evt) {
    let input = evt.target.value;
    let rawValue = input.replace(/\D/g, "");
    let formattedValue = formatNumber(rawValue);
    dispatch({ type: "SET_DOWN_PAYMENT", payload: formattedValue });
  }

  function handleDiscount(evt) {
    const value = formatNumberWithPercent(evt.target.value);
    dispatch({ type: "SET_DISCOUNT", payload: value });
  }

  function getFallbackPaymentValues() {
    const fallbackDownPayment = getPositiveNumericString(
      home?.customer?.downPayment,
      calcResult.downPayment,
      downPayment,
      Number(home?.price ?? 0) * Number(home?.size ?? 0),
      home?.price,
      1,
    );
    const fallbackInstallments = String(
      Number(
        digitsOnly(
          home?.customer?.installments ?? calcResult.months ?? period ?? 1,
        ),
      ) || 1,
    );

    return {
      downPayment: fallbackDownPayment,
      installments: fallbackInstallments,
    };
  }

  function createDirectStatusPayload(status) {
    const fallbackPayment = getFallbackPaymentValues();

    return {
      status,
      downPayment: fallbackPayment.downPayment,
      installments: fallbackPayment.installments,
      description: home?.description ?? "",
    };
  }

  function handleStatusAction(action) {
    if (actionLocked) return;

    if (home.status === "RESERVED" && action.code === "SOLD") {
      submitStatusAction(action, createDirectStatusPayload("SOLD"));
      return;
    }

    if (home.status === "RESERVED" && action.code === "EMPTY") {
      submitStatusAction(action, createDirectStatusPayload("EMPTY"));
      return;
    }

    dispatch({
      type: "OPEN_STATUS_DIALOG",
      payload: {
        action,
        form: getInitialStatusForm(home, action.code, {
          calcResult,
          downPayment,
          period,
          discount,
        }),
      },
    });
  }

  function handleStatusDialog(nextOpen) {
    if (nextOpen) return;
    dispatch({ type: "CLOSE_STATUS_DIALOG" });
  }

  function handleBonusDialog(nextOpen) {
    if (nextOpen) return;
    dispatch({ type: "CLOSE_BONUS_DIALOG" });
  }

  function handleOpenGenplan() {
    setGenplanViewerLoaded(true);
    setGenplanOpenSignal((prev) => prev + 1);
  }

  function handleOpenUmra() {
    setUmraViewerLoaded(true);
    setUmraOpenSignal((prev) => prev + 1);
  }

  function handleOpenConfidence() {
    setConfidenceViewerLoaded(true);
    setConfidenceOpenSignal((prev) => prev + 1);
  }

  function handleOpenDiscountViewer() {
    setDiscountViewerLoaded(true);
    setDiscountOpenSignal((prev) => prev + 1);
  }

  const handleGenplanVisibleChange = useCallback((visible) => {
    const nextVisible = Boolean(visible);
    dispatch({ type: "SET_GALLERY_SHOW", payload: nextVisible });
    if (!nextVisible) {
      setGenplanOpenSignal(0);
    }
  }, []);

  const handleDiscountVisibleChange = useCallback((visible) => {
    const nextVisible = Boolean(visible);
    dispatch({ type: "SET_GALLERY_SHOW", payload: nextVisible });
    if (!nextVisible) {
      setDiscountOpenSignal(0);
    }
  }, []);

  const handleUmraVisibleChange = useCallback((visible) => {
    const nextVisible = Boolean(visible);
    dispatch({ type: "SET_GALLERY_SHOW", payload: nextVisible });
    if (!nextVisible) {
      setUmraOpenSignal(0);
    }
  }, []);

  const handleConfidenceVisibleChange = useCallback((visible) => {
    const nextVisible = Boolean(visible);
    dispatch({ type: "SET_GALLERY_SHOW", payload: nextVisible });
    if (!nextVisible) {
      setConfidenceOpenSignal(0);
    }
  }, []);

  function handleStatusField(field, value) {
    dispatch({ type: "SET_STATUS_FIELD", payload: { field, value } });
  }

  function validateStatusForm(actionCode) {
    const nextErrors = {};

    if (actionCode === "SOLD" || actionCode === "RESERVED") {
      const phone = normalizePhone(statusForm.phone);
      const installments = Number(digitsOnly(statusForm.installments));

      if (!statusForm.firstName.trim()) {
        nextErrors.firstName = "Mijoz ismini kiriting!";
      }
      if (!statusForm.lastName.trim()) {
        nextErrors.lastName = "Mijoz familiyasini kiriting!";
      }
      if (!phone) {
        nextErrors.phone = "Telefon raqamini kiriting!";
      } else if (!UZ_PHONE.test(phone)) {
        nextErrors.phone = "Telefon +998xxxxxxxxx formatda bo'lsin!";
      }
      // Down payment can be 0 or empty; backend should handle defaults.
      if (!String(statusForm.installments ?? "").trim()) {
        nextErrors.installments = "Muddatni kiriting!";
      } else if (!Number.isFinite(installments)) {
        nextErrors.installments = "Muddatni to'g'ri kiriting!";
      } else if (
        installments < MIN_INSTALLMENTS ||
        installments > MAX_INSTALLMENTS
      ) {
        nextErrors.installments = `Muddat ${MIN_INSTALLMENTS}-${MAX_INSTALLMENTS} oy oralig'ida bo'lsin!`;
      }
    }

    if (actionCode === "NOT" && !statusForm.description.trim()) {
      nextErrors.description = "Nima uchun sotuv to'xtatilganini yozing!";
    }

    dispatch({ type: "SET_STATUS_ERRORS", payload: nextErrors });
    return Object.keys(nextErrors).length === 0;
  }

  function createStatusPayload(actionCode) {
    const isCustomerFlow = actionCode === "SOLD" || actionCode === "RESERVED";
    const fallbackPayment = getFallbackPaymentValues();

    return {
      firstName: isCustomerFlow ? statusForm.firstName.trim() : "",
      lastName: isCustomerFlow ? statusForm.lastName.trim() : "",
      description:
        actionCode === "NOT" || isCustomerFlow
          ? statusForm.description.trim()
          : "",
      phone: isCustomerFlow ? normalizePhone(statusForm.phone) : "",
      status: actionCode,
      downPayment: isCustomerFlow
        ? digitsOnly(statusForm.downPayment) || "0"
        : fallbackPayment.downPayment,
      installments: isCustomerFlow
        ? digitsOnly(statusForm.installments) || "0"
        : fallbackPayment.installments,
      discountValue:
        actionCode === "SOLD" && hasDiscountValue
          ? statusForm.discountValue.trim()
          : "",
    };
  }

  async function submitStatusAction(action, payloadOverride) {
    dispatch({ type: "SET_PENDING_ACTION", payload: action.code });
    const payload = payloadOverride ?? createStatusPayload(action.code);
    const nextStatus = payload.status ?? action.code;
    let nextPayload = payload;

    if (nextStatus === "RESERVED") {
      setContractFileLoading(true);
      try {
        if (!useAppStore.getState().currencyUsd?.rate) {
          await fetchCurrencyUsd?.();
        }

        const currencyRate = Number(useAppStore.getState().currencyUsd?.rate);
        if (!Number.isFinite(currencyRate) || currencyRate <= 0) {
          throw new Error("Dollar kursi topilmadi.");
        }

        const resolvedPrice = Number(calcResult.price ?? home.price ?? 0);
        const resolvedSize = Number(calcResult.size ?? home.size ?? 0);
        const totalUsd =
          resolvedPrice > 0 && resolvedSize > 0
            ? resolvedPrice * resolvedSize
            : 0;
        const totalSom = Math.round(totalUsd * currencyRate);
        const pricePerMetrSom = Math.round(resolvedPrice * currencyRate);
        const downPaymentSom = Number(digitsOnly(payload.downPayment)) || 0;
        const monthlySom = Number(calcResult.monthlyPayment) || 0;

        const customerName = `${payload.firstName} ${payload.lastName}`.trim();
        const fileName = sanitizeFileName(
          `${customerName || "Mijoz"} bron hujjat`,
        );

        const pdfReqBody = {
          CREATED: formatCreatedDate(new Date()),
          FILE_NAME: fileName,
          ROOM: `${home.room ?? ""}x`,
          BLOCK: String(home.block ?? ""),
          FLOOR: `${home.floorNumber ?? ""}-QAVAT`,
          HOUSE_NUMBER: `Nº ${home.houseNumber ?? ""} XONADON`,
          PRICE_PER_METR: formatNumber(pricePerMetrSom),
          MONTHLY_PAYMENT: formatNumber(Math.round(monthlySom)),
          PERIOD: `${payload.installments} oy`,
          SIZE: String(resolvedSize || home.size || ""),
          STATE: states[selectedState] ?? "",
          DOWN_PAYMENT: formatNumber(downPaymentSom),
          TOTAL_PRICE: formatNumber(totalSom),
          "2D": home.image?.[0] ? `${home.image[0]}.png` : "",
          "3D": home.image?.[1] ? `${home.image[1]}.png` : "",
          PLAN: home.image?.[2] ? `${home.image[2]}.png` : "",
        };

        const pdfForm = new URLSearchParams();
        Object.entries(pdfReqBody).forEach(([key, value]) => {
          pdfForm.append(key, value ?? "");
        });

        const pdfRes = await fetch(PDF_SERVICE_URL, {
          method: "POST",
          headers: {
            Accept: "application/pdf",
          },
          body: pdfForm,
        });

        if (!pdfRes.ok) {
          throw new Error("PDF yaratib bo'lmadi.");
        }

        const pdfBlob = await pdfRes.blob();
        if (!pdfBlob || pdfBlob.size === 0) {
          throw new Error("PDF bo'sh qaytdi.");
        }

        const pdfFile = new File([pdfBlob], `${fileName}.pdf`, {
          type: "application/pdf",
        });

        nextPayload = {
          ...payload,
          contractFile: pdfFile,
        };
      } catch (error) {
        toast.error(error?.message || "PDF yaratishda xatolik!", {
          position: "bottom-left",
        });
        dispatch({ type: "SET_PENDING_ACTION", payload: null });
        setContractFileLoading(false);
        return false;
      }
    }

    const result = await updateStatus(home.id, nextPayload);
    setContractFileLoading(false);
    if (!result.ok) {
      toast.error(result.message);
      dispatch({ type: "SET_PENDING_ACTION", payload: null });
      return false;
    }

    if (nextStatus === "RESERVED") {
      const contractFile = extractContractFileFromResponse(result.data);
      const contractFileUrl = resolveContractFileDocUrl(contractFile);

      if (contractFileUrl) {
        const opened = openExternalDocument(contractFileUrl);

        if (!opened) {
          toast.info(
            "Shartnomani ochish uchun brauzerda pop-up ruxsatini yoqing.",
            { position: "bottom-left" },
          );
        }
      }
    }

    await Promise.resolve(
      onStatusUpdated?.({
        roomId: home.id,
        nextStatus,
        description: payload.description ?? "",
      }),
    );

    toast.success(
      nextStatus === "RESERVED" ? "Uy bron qilindi." : action.successText,
    );
    handleClose({ clearDetails: true });
    dispatch({ type: "SET_PENDING_ACTION", payload: null });
    return true;
  }

  async function handleStatusSubmit(evt) {
    evt.preventDefault();

    const action = statusDialogAction;
    if (!action || !validateStatusForm(action.code)) return;

    await submitStatusAction(action);
  }

  function win() {
    const originY = 0.6;
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: originY },
    });
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: originY },
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: originY },
    });
    sound();
  }

  // Discount
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.keyCode === 68 && !timerRef.current) {
        timerRef.current = setTimeout(() => {
          dispatch({ type: "TOGGLE_DISCOUNT" });
          timerRef.current = null;
        }, 2500);
      }
    }

    function handleKeyUp(e) {
      if (e.keyCode === 68) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET_FOR_HOME" });
  }, [home.id]);

  useEffect(() => {
    if (!currencyUsd?.rate) {
      fetchCurrencyUsd?.();
    }
  }, [currencyUsd?.rate, fetchCurrencyUsd]);

  useEffect(() => {
    if (!calcVersion || (!paymentBonus && !hasUmraBonus)) return;
    win();
    dispatch({ type: "OPEN_BONUS_DIALOG" });
  }, [calcVersion, hasUmraBonus, paymentBonus]);

  useEffect(() => {
    if (isOpen) return;
    dispatch({ type: "SET_GALLERY_SHOW", payload: false });
    setGenplanOpenSignal(0);
    setGenplanViewerLoaded(false);
    setUmraOpenSignal(0);
    setUmraViewerLoaded(false);
    setConfidenceOpenSignal(0);
    setConfidenceViewerLoaded(false);
    setDiscountOpenSignal(0);
    setDiscountViewerLoaded(false);
  }, [isOpen]);

  useEffect(() => {
    if (statusDialogOpen || !statusDialogRenderedAction) return undefined;

    dialogResetTimerRef.current = window.setTimeout(() => {
      dispatch({ type: "CLEAR_STATUS_DIALOG" });
    }, STATUS_DIALOG_CLOSE_DELAY);

    return () => {
      window.clearTimeout(dialogResetTimerRef.current);
    };
  }, [statusDialogOpen, statusDialogRenderedAction]);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(v) => {
        if (v === false && galleryShow === false) {
          handleClose();
        }
      }}
      direction={"top"}
    >
      <DrawerContent
        className={cn(
          "flex h-full min-h-screen flex-col lg:overflow-hidden",
          galleryShow ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/90 sticky top-0 z-30 flex items-center justify-between gap-3 px-4 pt-4 pb-2 backdrop-blur sm:px-6 sm:pt-5">
          <DrawerClose
            onClick={handleClose}
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
            })}
          >
            <ArrowLeft />
            Orqaga
          </DrawerClose>

          <div className="flex items-center gap-1 sm:gap-2">
            {umraViewerLoaded ? (
              <Suspense
                fallback={
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled
                    className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
                  >
                    <Plane className="size-4" />
                    Umra safari
                  </Button>
                }
              >
                <LazyGenplanViewerButton
                  title="Umra safari"
                  Icon={Plane}
                  folder="umra"
                  imageIds={[1, 2]}
                  openSignal={umraOpenSignal}
                  onViewerVisibleChange={handleUmraVisibleChange}
                />
              </Suspense>
            ) : (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
                onClick={handleOpenUmra}
              >
                <Plane className="size-4" />
                Umra safari
              </Button>
            )}

            {confidenceViewerLoaded ? (
              <Suspense
                fallback={
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled
                    className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
                  >
                    <ShieldCheck className="size-4" />
                    Ishonch yorlig'i
                  </Button>
                }
              >
                <LazyGenplanViewerButton
                  title="Ishonch yorlig'i"
                  Icon={ShieldCheck}
                  folder="confidence"
                  imageIds={[1, 2]}
                  openSignal={confidenceOpenSignal}
                  onViewerVisibleChange={handleConfidenceVisibleChange}
                />
              </Suspense>
            ) : (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
                onClick={handleOpenConfidence}
              >
                <ShieldCheck className="size-4" />
                Ishonch yorlig'i
              </Button>
            )}

            {genplanViewerLoaded ? (
              <Suspense
                fallback={
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled
                    className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
                  >
                    <Images className="size-4" />
                    Genplan
                  </Button>
                }
              >
                <LazyGenplanViewerButton
                  openSignal={genplanOpenSignal}
                  onViewerVisibleChange={handleGenplanVisibleChange}
                />
              </Suspense>
            ) : (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
                onClick={handleOpenGenplan}
              >
                <Images className="size-4" />
                Genplan
              </Button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 px-4 pt-6 pb-6 sm:px-6 lg:flex-row lg:gap-8 lg:overflow-hidden lg:px-8 lg:pb-8">
          <div
            className={`no-scrollbar relative w-full overflow-visible lg:min-h-0 lg:w-[64%] lg:flex-1 lg:overflow-y-auto lg:pr-2 lg:pb-2 ${
              calcLoading ? "pointer-events-none" : ""
            }`}
          >
            <LoadTransition
              loading={calcLoading}
              hideContentWhileLoading
              className="min-h-full"
              loader={
                <SurfaceLoader
                  title="Hisoblash tayyorlanmoqda"
                  description="To'lov jadvali va natijalar yangilanmoqda."
                />
              }
              loaderClassName="bg-background/72 backdrop-blur-[2px]"
              contentClassName="min-h-full"
            >
              <div className="animate-fade-in bg-background/95 supports-[backdrop-filter]:bg-background/90 sticky top-[4.5rem] z-10 mb-6 w-full rounded-xl border px-4 py-5 shadow-sm backdrop-blur sm:top-[4.75rem] sm:mb-8 sm:px-6 sm:py-6 lg:top-2 lg:shadow-none">
                <h3 className="bg-background text-muted-foreground absolute top-0 left-5 flex -translate-y-2/4 gap-2 rounded px-2">
                  Oyiga
                </h3>
                <h2
                  className={
                    "font-mono text-3xl font-bold sm:text-4xl lg:text-5xl"
                  }
                >
                  {formatNumber(calcResult.monthlyPayment)}
                </h2>
                <div className="mt-4 flex justify-end">
                  <CurrencyBadge className="text-[11px]" />
                </div>
              </div>

              <div
                id="shu"
                className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3"
              >
                {summaryCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.key}
                      className="bg-primary/2 w-full rounded border p-2"
                    >
                      <div className="mb-2 flex items-center gap-1">
                        <Icon />
                        <span className="text-muted-foreground text-xs">
                          {card.label}
                        </span>
                      </div>
                      <h4
                        className={cn(
                          "text-lg font-medium",
                          card.mono ? "font-mono" : "tracking-normal",
                        )}
                      >
                        {card.value}
                      </h4>
                      {Array.isArray(card.subValues) &&
                      card.subValues.length > 0
                        ? card.subValues.map((subValue, index) => (
                            <p
                              key={`${card.key}-${index}`}
                              className={cn(
                                "mt-0.5 text-xs font-medium",
                                index === 0
                                  ? "text-muted-foreground"
                                  : "text-emerald-700",
                              )}
                            >
                              {subValue}
                            </p>
                          ))
                        : null}
                    </div>
                  );
                })}
              </div>

              {hasUmraBonus ? (
                <div className="animate-fade-in mb-5 overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-r from-amber-50 via-white to-yellow-50 shadow-sm">
                  <div className="border-b border-amber-200/80 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                          <Plane className="size-3.5" />
                          Umra imkoniyati
                        </div>
                        <h3 className="text-lg font-semibold text-amber-950 sm:text-xl">
                          2 kishilik Umra safari yutib olish imkoniyati
                        </h3>
                        <p className="mt-1 text-sm text-amber-800">
                          Boshlang&apos;ich to&apos;lovingiz ushbu aksiya
                          shartiga mos keldi. Batafsil ma&apos;lumotni savdo
                          bo&apos;limidan olishingiz mumkin.
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="border-amber-200 bg-amber-100 text-amber-900"
                      >
                        Maxsus aksiya
                      </Badge>
                    </div>
                  </div>

                  <div className="px-4 py-4 sm:px-5">
                    <div className="rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                          <Gift className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-amber-950">
                            Bonusli xarid uchun qo&apos;shimcha imkoniyat
                          </p>
                          <p className="mt-1 text-sm leading-6 text-amber-800">
                            Hisoblash natijasiga ko&apos;ra siz 2 kishilik Umra
                            safari yo&apos;llanmasini yutib olish imkoniyatiga
                            ega bo&apos;ldingiz.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {paymentBonus ? (
                <div className="animate-fade-in mb-5 overflow-hidden rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 shadow-sm">
                  <div className="border-b border-emerald-200/80 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                          <Gift className="size-3.5" />
                          Bonus chiqdi
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-950 sm:text-xl">
                          {paymentBonus.title}
                        </h3>
                        <p className="mt-1 text-sm text-emerald-800">
                          {paymentBonus.qualifier} asosida ushbu sovg'alar
                          taqdim etiladi.
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="border-emerald-200 bg-emerald-100 text-emerald-900"
                      >
                        +{formatNumber(paymentBonus.discountPerM2)}/m
                        <sup>2</sup> chegirma
                      </Badge>
                    </div>
                  </div>

                  <PhotoProvider
                    onVisibleChange={(visible) => {
                      dispatch({
                        type: "SET_GALLERY_SHOW",
                        payload: visible,
                      });
                    }}
                    toolbarRender={({ onScale, scale }) => {
                      return (
                        <div className="mr-5 flex">
                          <div className="group h-11 w-11 p-2.5">
                            <CircleMinus
                              className="cursor-pointer opacity-70 transition-opacity group-hover:opacity-100"
                              onClick={() => {
                                onScale(scale - 1);
                              }}
                            />
                          </div>
                          <div className="group h-11 w-11 p-2.5">
                            <CirclePlus
                              className="cursor-pointer opacity-70 transition-opacity group-hover:opacity-100"
                              onClick={() => {
                                onScale(scale + 1);
                              }}
                            />
                          </div>
                        </div>
                      );
                    }}
                  >
                    <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5">
                      {bonusItems.map((bonusItem) => {
                        const bonusLabel = getBonusItemLabel(bonusItem);

                        return (
                          <PhotoView
                            key={bonusItem}
                            src={`/bonus/png/${bonusItem}.png`}
                          >
                            <button
                              type="button"
                              className="group flex min-w-0 cursor-zoom-in items-center gap-3 rounded-xl border border-emerald-200 bg-white/90 p-3 text-left transition hover:border-emerald-400 hover:shadow-sm"
                            >
                              <picture className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-emerald-50 p-2">
                                <source
                                  srcSet={`/bonus/avif/${bonusItem}.avif`}
                                  type="image/avif"
                                />
                                <img
                                  className="h-full w-full object-contain"
                                  src={`/bonus/png/${bonusItem}.png`}
                                  alt={bonusLabel}
                                />
                              </picture>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-slate-900">
                                  {bonusLabel}
                                </span>
                                <span className="mt-1 block text-xs text-slate-500">
                                  Rasmni kattalashtirish uchun bosing
                                </span>
                              </span>
                            </button>
                          </PhotoView>
                        );
                      })}
                    </div>
                  </PhotoProvider>
                </div>
              ) : null}
              <div className="mb-5 flex">
                <PhotoProvider
                  onVisibleChange={(visible) => {
                    dispatch({ type: "SET_GALLERY_SHOW", payload: visible });
                  }}
                  toolbarRender={({ onScale, scale }) => {
                    return (
                      <div className="mr-5 flex">
                        <div className="group h-11 w-11 p-2.5">
                          <CircleMinus
                            className="cursor-pointer opacity-70 transition-opacity group-hover:opacity-100"
                            onClick={() => {
                              onScale(scale - 1);
                            }}
                          />
                        </div>
                        <div className="group h-11 w-11 p-2.5">
                          <CirclePlus
                            className="cursor-pointer opacity-70 transition-opacity group-hover:opacity-100"
                            onClick={() => {
                              onScale(scale + 1);
                            }}
                          />
                        </div>
                      </div>
                    );
                  }}
                >
                  <PhotoView src={`/gallery/png/${home.image[0]}.png`}>
                    <picture>
                      <source
                        srcset={`/gallery/avif/${home.image[0]}.avif`}
                        type="image/avif"
                      />
                      <img
                        className="object-contain"
                        src={`/gallery/png/${home.image[0]}.png`}
                        alt={home.size}
                      />
                    </picture>
                  </PhotoView>
                  <PhotoView src={`/gallery/png/${home.image[1]}.png`}>
                    <picture>
                      <source
                        srcset={`/gallery/avif/${home.image[1]}.avif`}
                        type="image/avif"
                      />
                      <img
                        className="object-contain"
                        src={`/gallery/png/${home.image[1]}.png`}
                        alt={home.size}
                      />
                    </picture>
                  </PhotoView>
                  <PhotoView src={`/gallery/png/${home.image[2]}.png`}>
                    <picture>
                      <source
                        srcset={`/gallery/avif/${home.image[2]}.avif`}
                        type="image/avif"
                      />
                      <img
                        className="object-contain"
                        src={`/gallery/png/${home.image[2]}.png`}
                        alt={home.size}
                      />
                    </picture>
                  </PhotoView>
                </PhotoProvider>
              </div>

              {/* Ramazon chegirmasi */}
              <Alert className="relative mb-10 border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <AlertTitle className="text-2xl text-blue-900 dark:text-blue-100">
                  Ramazon oyi uchun maxsus chegirma
                </AlertTitle>
                <AlertDescription className="mb-3 text-lg text-blue-800 dark:text-blue-200">
                  Ramazon oyi xaridlari uchun quyidagi texnikalardan biri
                  mutlaqo bepul taqdim qilinadi.
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-blue-800 dark:text-blue-200">
                  <CircleCheckBig size={12} />
                  Muzlatgich
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-blue-800 dark:text-blue-200">
                  <CircleCheckBig size={12} />
                  Konditsioner
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-blue-800 dark:text-blue-200">
                  <CircleCheckBig size={12} />
                  Gaz plita
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-blue-800 dark:text-blue-200">
                  <CircleCheckBig size={12} />
                  Blender
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-blue-800 dark:text-blue-200">
                  <CircleCheckBig size={12} />
                  Chanyutgich
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-blue-800 dark:text-blue-200">
                  <CircleCheckBig size={12} />
                  <strong>50 dan ziyod</strong> xonadon uchun zaruriy texnikalar
                </AlertDescription>
              </Alert>

              {/* Infratuzilma */}
              <Alert className="relative mb-10 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <AlertTitle className="text-2xl text-amber-900 dark:text-amber-100">
                  Infra tuzilma va avfzalliklar
                </AlertTitle>
                <AlertDescription className="mb-3 text-lg text-amber-800 dark:text-amber-200">
                  Bino maktab, bog'cha, bepul avtoturargohlar, o'yingohlar va
                  savdo majmuolariga judayam yaqin joylashgan.
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-amber-800 dark:text-amber-200">
                  <CircleCheckBig size={12} />
                  Kuniga <strong>148 ming</strong> so'm to'lov evaziga xonodon
                  sohibi bo'lish
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-amber-800 dark:text-amber-200">
                  <CircleCheckBig size={12} />
                  <strong>30%</strong> boshlang'ich to'lov qilganlar uchun{" "}
                  <strong>2 kishilik umra safari</strong>
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-amber-800 dark:text-amber-200">
                  <CircleCheckBig size={12} /> <strong>9 ballik</strong>{" "}
                  zilzilagacha chidamli bino
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-amber-800 dark:text-amber-200">
                  <CircleCheckBig size={12} />
                  <strong>Xitoylik</strong> investorlar tomonidan qurilgan
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-amber-800 dark:text-amber-200">
                  <CircleCheckBig size={12} />
                  <strong>Jahon bazor</strong>ining yonginasida
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-amber-800 dark:text-amber-200">
                  <CircleCheckBig size={12} /> <strong>Katta yo'l</strong>ning
                  bo'yida
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-amber-800 dark:text-amber-200">
                  <CircleCheckBig size={12} /> <strong>Zamonaviy</strong> loyiha
                </AlertDescription>
                <AlertDescription className="flex items-center text-base text-amber-800 dark:text-amber-200">
                  <CircleCheckBig size={12} /> <strong>Oila</strong> uchun
                  to'g'ri tanlov
                </AlertDescription>
              </Alert>

              {/* Timeline  */}
              <AppartmentTimeLine />
            </LoadTransition>
          </div>

          <div className="w-full lg:min-h-0 lg:w-[36%] lg:max-w-[26rem] lg:min-w-[23rem] lg:pr-2 lg:pl-2">
            <div className="flex h-full flex-col gap-6 overflow-visible lg:min-h-0 lg:overflow-y-auto lg:pr-3 lg:pb-2">
              <form
                onSubmit={handleCalc}
                className="bg-background mx-auto flex w-full flex-col gap-5 rounded-xl border p-4 sm:p-5"
              >
                {showDiscount && (
                  <div className="py-0">
                    <div className="border-primary animate-fade-in relative rounded-xl border px-4 py-5">
                      <h3 className="bg-primary absolute top-0 left-5 flex -translate-y-2/4 gap-2 rounded p-0.5 px-2 font-bold text-white">
                        <BadgePercent /> Chegirma
                      </h3>
                      <div className="flex w-full flex-col gap-3 sm:flex-row">
                        <Input
                          placeholder="100 yoki 5%"
                          onChange={handleDiscount}
                          value={discount}
                          autoFocus={true}
                          autoComplete="off"
                          name={discountType}
                        />
                        <NativeSelect
                          className={"w-full sm:w-32"}
                          onChange={(evt) => {
                            handleChangeDiscountType(evt.target.value);
                          }}
                          value={discountType}
                          defaultValue={discountType}
                        >
                          <NativeSelectOption value={"discountPerM2"}>
                            m2
                          </NativeSelectOption>
                          <NativeSelectOption value={"discountTotal"}>
                            Summa
                          </NativeSelectOption>
                        </NativeSelect>
                      </div>
                    </div>
                  </div>
                )}
                <RadioGroup
                  name={"state"}
                  value={selectedState}
                  onValueChange={(value) => {
                    dispatch({ type: "SET_SELECTED_STATE", payload: value });
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldLabel htmlFor="box">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Karobka</FieldTitle>
                          <FieldDescription className="text-xs">
                            Uy hech qanday ta'mirsiz, karobka holatida
                            topshiriladi
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="BOX" id="box" />
                      </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor="ready">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Ta'mirlangan</FieldTitle>
                          <FieldDescription className="text-xs">
                            Uy jihozlashga tayyor bo'ladi
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="READY" id="ready" />
                      </Field>
                    </FieldLabel>
                  </div>
                </RadioGroup>
                <div className="grid gap-2">
                  <Label htmlFor="downPayment">Boshlang'ich to'lov</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="downPayment"
                      onChange={handleDownPayment}
                      value={downPayment}
                      name={"downPayment"}
                      placeholder="0"
                      autoComplete="off"
                      autoFocus={true}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>so'm</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <button
                    type="button"
                    onClick={handleOpenDiscountViewer}
                    className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 rounded-sm pt-0.5 text-xs transition-colors"
                  >
                    <BadgePercent className="size-3.5" />
                    Ko'proq to'lang, ko'proq oling
                  </button>
                  {discountViewerLoaded ? (
                    <Suspense fallback={null}>
                      <LazyDiscountViewerSlider
                        openSignal={discountOpenSignal}
                        onViewerVisibleChange={handleDiscountVisibleChange}
                      />
                    </Suspense>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="months">Necha oyga</Label>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-5 gap-2">
                      {paymentPeriods.map((p) => {
                        return (
                          <button
                            type="button"
                            key={p}
                            onClick={() => {
                              handlePeriod(String(p));
                            }}
                            className={`inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                              Number(period) === p
                                ? "border-primary bg-primary text-primary-foreground"
                                : "bg-background hover:bg-accent"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <InputGroup className="w-full">
                      <InputGroupInput
                        id="months"
                        name={"months"}
                        autoComplete="off"
                        onChange={handlePeriodInputChange}
                        onBlur={handlePeriodInputBlur}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={period}
                        placeholder="12"
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>oy</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>
                <Button variant="secondary" disabled={calcLoading}>
                  {calcLoading ? (
                    <>Hisoblanmoqda...</>
                  ) : (
                    <>
                      <Calculator /> Hisoblash
                    </>
                  )}
                </Button>
              </form>

              <div className="bg-muted/20 rounded-xl border p-3">
                {actionLocked && (
                  <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950">
                    <span className="bg-background flex size-8 shrink-0 items-center justify-center rounded-md">
                      <Lock className="size-4 text-amber-700" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Ushbu uy ustida amal bajara olmaysiz
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-amber-800">
                        Faqat ushbu bron yoki savdo amalini yaratgan
                        foydalanuvchi statusni o'zgartira oladi.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {home &&
                    availableActions.map((action) => {
                      const {
                        code,
                        title,
                        description,
                        icon: Icon,
                        cardTone,
                        accentTone,
                        iconTone,
                      } = action;

                      return (
                        <button
                          type="button"
                          key={code}
                          disabled={actionLocked || actionInProgress}
                          onClick={() => handleStatusAction(action)}
                          className={cn(
                            "group bg-background relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 overflow-hidden rounded-xl border px-4 py-4 text-left transition-colors duration-200",
                            "hover:bg-accent/30 disabled:pointer-events-none disabled:opacity-60",
                            cardTone,
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-3 bottom-3 left-0 w-1 rounded-full",
                              accentTone,
                            )}
                          />
                          <span
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-[1.03]",
                              iconTone,
                            )}
                          >
                            <Icon className="size-4.5" />
                          </span>

                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-foreground text-base font-semibold tracking-[-0.01em]">
                              {title}
                            </span>
                            <span className="text-muted-foreground mt-1 text-sm leading-6">
                              {description}
                            </span>
                          </span>

                          <span className="text-muted-foreground group-hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-md transition-colors">
                            {pendingAction === code && actionInProgress ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <ArrowUpRight className="size-4" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>

      <Dialog open={bonusDialogOpen} onOpenChange={handleBonusDialog}>
        <DialogContent className="max-w-[520px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Gift className="size-6" />
            </div>
            <DialogHeader className="items-center gap-2 text-center">
              <DialogTitle className="text-xl sm:text-2xl">
                Bonus qo'lga kiritildi
              </DialogTitle>
              <DialogDescription className="text-sm leading-6">
                {paymentBonus && hasUmraBonus
                  ? `${paymentBonus.qualifier} asosida sovg'a va qo'shimcha Umra imkoniyati taqdim etiladi.`
                  : paymentBonus
                    ? `${paymentBonus.qualifier} asosida ${paymentBonus.title.toLowerCase()} sovg'a sifatida beriladi.`
                    : "Boshlang'ich to'lovingiz maxsus bonus shartiga mos keldi."}
              </DialogDescription>
            </DialogHeader>
            {paymentBonus ? (
              <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Qo'shimcha chegirma: +{formatNumber(paymentBonus.discountPerM2)}
                /m<sup>2</sup>.
              </div>
            ) : null}
            {hasUmraBonus ? (
              <div className="w-full rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-yellow-50 p-4 text-left shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Plane className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-950">
                      2 kishilik Umra safari imkoniyati
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Siz Umra safari yo'llanmasini yutib olish imkoniyatiga ega
                      bo'ldingiz. Batafsil ma'lumotni savdo bo'limidan
                      olishingiz mumkin.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <DialogFooter className="sm:justify-center">
              <Button type="button" onClick={() => handleBonusDialog(false)}>
                Tushunarli
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={handleStatusDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          {activeAction && (
            <form onSubmit={handleStatusSubmit} className="flex flex-col gap-4">
              <DialogHeader className="gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 flex size-11 shrink-0 items-center justify-center rounded-lg border",
                      activeAction.iconTone,
                    )}
                  >
                    {ActiveActionIcon && (
                      <ActiveActionIcon className="size-5" />
                    )}
                  </span>

                  <div className="space-y-1 text-left">
                    <DialogTitle>{activeAction.title}</DialogTitle>
                    <DialogDescription>
                      #{home.houseNumber} uy uchun statusni{" "}
                      <span className="font-medium">
                        {activeAction.title.toLowerCase()}
                      </span>{" "}
                      oqimi.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="bg-primary/5 grid gap-2 rounded-xl border p-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Joriy holat</span>
                  <Badge
                    className={cn(
                      "text-primary-foreground",
                      statusBadgeClass[home.status],
                    )}
                  >
                    {statusLabels[home.status]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Uy raqami</span>
                  <span className="font-mono">#{home.houseNumber}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Umumiy qiymat</span>
                  <span className="font-mono">
                    {formatNumber(home.price * home.size)}
                  </span>
                </div>
              </div>

              {(activeAction.code === "SOLD" ||
                activeAction.code === "RESERVED") && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="status-firstName">Ism*</Label>
                      <Input
                        id="status-firstName"
                        autoFocus
                        value={statusForm.firstName}
                        onChange={(evt) => {
                          handleStatusField("firstName", evt.target.value);
                        }}
                        placeholder="Ali"
                      />
                      {statusErrors.firstName && (
                        <p className="text-destructive text-xs">
                          {statusErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="status-lastName">Familiya*</Label>
                      <Input
                        id="status-lastName"
                        value={statusForm.lastName}
                        onChange={(evt) => {
                          handleStatusField("lastName", evt.target.value);
                        }}
                        placeholder="Valiyev"
                      />
                      {statusErrors.lastName && (
                        <p className="text-destructive text-xs">
                          {statusErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="status-phone">Telefon*</Label>
                      <div className="relative">
                        <Phone className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                          id="status-phone"
                          value={statusForm.phone}
                          onChange={(evt) => {
                            handleStatusField(
                              "phone",
                              formatUzPhoneDisplay(evt.target.value),
                            );
                          }}
                          placeholder="+998 (__) ___ __ __"
                          className="pl-9"
                        />
                      </div>
                      {statusErrors.phone && (
                        <p className="text-destructive text-xs">
                          {statusErrors.phone}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="status-downPayment">
                        Boshlang'ich to'lov
                      </Label>
                      <Input
                        id="status-downPayment"
                        value={statusForm.downPayment}
                        onChange={(evt) => {
                          handleStatusField(
                            "downPayment",
                            formatNumber(digitsOnly(evt.target.value) || 0),
                          );
                        }}
                        placeholder="0"
                      />
                      {statusErrors.downPayment && (
                        <p className="text-destructive text-xs">
                          {statusErrors.downPayment}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "grid gap-4",
                      activeAction.code === "SOLD" ? "sm:grid-cols-2" : "",
                    )}
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="status-installments">Muddat (oy)*</Label>
                      <Input
                        id="status-installments"
                        type="number"
                        min={MIN_INSTALLMENTS}
                        max={MAX_INSTALLMENTS}
                        value={statusForm.installments}
                        onChange={(evt) => {
                          handleStatusField(
                            "installments",
                            normalizePeriod(evt.target.value),
                          );
                        }}
                        placeholder="60"
                      />
                      {statusErrors.installments && (
                        <p className="text-destructive text-xs">
                          {statusErrors.installments}
                        </p>
                      )}
                    </div>

                    {activeAction.code === "SOLD" && (
                      <div className="grid gap-2">
                        {hasDiscountValue && (
                          <>
                            <Label htmlFor="status-discountValue">
                              Chegirma
                            </Label>
                            <Input
                              id="status-discountValue"
                              value={statusForm.discountValue}
                              onChange={(evt) => {
                                handleStatusField(
                                  "discountValue",
                                  formatNumberWithPercent(evt.target.value),
                                );
                              }}
                              placeholder="100 000 yoki 5%"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status-description">Izoh</Label>
                    <div className="relative">
                      <MessageSquareText className="text-muted-foreground absolute top-3 left-3 size-4" />
                      <Textarea
                        id="status-description"
                        value={statusForm.description}
                        onChange={(evt) => {
                          handleStatusField("description", evt.target.value);
                        }}
                        className="min-h-24 pl-9"
                        placeholder="Qo'shimcha qaydlar yoki mijozga oid eslatma..."
                      />
                    </div>
                  </div>
                </>
              )}

              {activeAction.code === "NOT" && (
                <div className="grid gap-2">
                  <Label htmlFor="status-not-description">Sabab*</Label>
                  <div className="relative">
                    <FileText className="text-muted-foreground absolute top-3 left-3 size-4" />
                    <Textarea
                      id="status-not-description"
                      autoFocus
                      value={statusForm.description}
                      onChange={(evt) => {
                        handleStatusField("description", evt.target.value);
                      }}
                      className="min-h-28 pl-9"
                      placeholder="Masalan: namunaviy kvartira, ichki rezerv yoki texnik sababi bor..."
                    />
                  </div>
                  {statusErrors.description && (
                    <p className="text-destructive text-xs">
                      {statusErrors.description}
                    </p>
                  )}
                </div>
              )}

              {activeAction.code === "EMPTY" && (
                <div className="bg-muted/40 flex items-start gap-3 rounded-xl border p-4 text-sm">
                  <span className="bg-background flex size-10 shrink-0 items-center justify-center rounded-xl border">
                    <UserRound className="text-muted-foreground size-4" />
                  </span>
                  <div>
                    <p className="font-medium">
                      Uy yana aktiv sotuvga chiqadi.
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      Ushbu amal bajarilganda uy yana sotuvga chiqadi.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    handleStatusDialog(false);
                  }}
                >
                  Bekor qilish
                </Button>
                <Button disabled={actionInProgress}>
                  {pendingAction === activeAction.code && actionInProgress ? (
                    <>
                      <Spinner />
                      Saqlanmoqda...
                    </>
                  ) : (
                    activeAction.submitLabel
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}
