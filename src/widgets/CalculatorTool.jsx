import { useRoomStatus } from "@/shared/hooks/use-room-status";
import { useRenderPdf } from "@/shared/hooks/use-render-pdf";
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
import { NoiseBackground } from "@/shared/ui/noise-background";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { SparklesText } from "@/shared/ui/sparkles-text";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import confetti from "canvas-confetti";
import {
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
  Grid2X2,
  HandCoins,
  Layers2,
  LoaderCircle,
  Lock,
  MessageSquareText,
  Phone,
  RotateCcw,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useReducer, useRef } from "react";
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
    cardTone:
      "border-sky-500/18 hover:border-sky-500/35 hover:bg-sky-500/4",
    accentTone: "bg-sky-500/85",
    iconTone: "border-sky-500/20 bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
];

const paymentPeriods = [12, 24, 36, 48, 60];
const UZ_PHONE = /^\+998\d{9}$/;
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
  bonus: [],
};

function normalizePhone(raw) {
  return String(raw ?? "").replace(/[^\d+]/g, "");
}

function digitsOnly(raw) {
  return String(raw ?? "").replace(/\D/g, "");
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

function createMultipartPayload(payload) {
  const formData = new FormData();

  Object.entries(payload ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (value instanceof Blob) {
      const fileName =
        typeof value.name === "string" && value.name.trim()
          ? value.name
          : `${key}.pdf`;
      formData.append(key, value, fileName);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
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
        defaults?.calcResult?.months ??
          defaults?.period ??
          customer?.installments ??
          60,
      ) || 60;

    form.firstName = customer.firstName ?? "";
    form.lastName = customer.lastName ?? "";
    form.phone = customer.phone ?? "";
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
    hasCalculated: false,
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
        hasCalculated: true,
      };
    case "SET_SELECTED_STATE":
      return {
        ...state,
        selectedState: action.payload,
        hasCalculated: false,
      };
    case "TOGGLE_DISCOUNT":
      return {
        ...state,
        showDiscount: !state.showDiscount,
        hasCalculated: false,
      };
    case "SET_DISCOUNT_TYPE":
      return {
        ...state,
        discountType: action.payload,
        hasCalculated: false,
      };
    case "SET_PERIOD":
      return {
        ...state,
        period: action.payload,
        hasCalculated: false,
      };
    case "SET_DOWN_PAYMENT":
      return {
        ...state,
        downPayment: action.payload,
        hasCalculated: false,
      };
    case "SET_DISCOUNT":
      return {
        ...state,
        discount: action.payload,
        hasCalculated: false,
      };
    case "SET_GALLERY_SHOW":
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
  const wasOpenRef = useRef(false);
  const { sound } = useSound("/win.mp3");
  const { updateStatus, loading: statusLoading } = useRoomStatus();
  const { renderPdf, loading: pdfLoading } = useRenderPdf();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(
    calculatorReducer,
    undefined,
    createCalculatorInitialState,
  );
  const {
    calcResult,
    hasCalculated,
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
  } = state;
  const activeAction = statusDialogAction ?? statusDialogRenderedAction;
  const ActiveActionIcon = activeAction?.icon;
  const actionInProgress = statusLoading || pdfLoading;
  const actionLocked =
    (home?.canBeSold ?? home?.customer?.canBeSold ?? true) === false;
  const calculationRequired = !hasCalculated;
  const calculationLocked = calculationRequired || calcLoading;
  const isOpen =
    location.search.includes("details=") && location.hash === "#calculator";
  const hasDiscountValue = showDiscount && String(discount ?? "").trim();
  const availableActions = useMemo(() => {
    const allowedCodes = ACTIONS_BY_STATUS[home.status] ?? [];
    return actionButtons.filter((action) => allowedCodes.includes(action.code));
  }, [home.status]);
  const summaryCards = useMemo(() => {
    const resolvedPrice = Number(calcResult.price ?? home.price ?? 0);
    const resolvedSize = Number(calcResult.size ?? home.size ?? 0);
    const totalPrice = resolvedPrice > 0 && resolvedSize > 0
      ? formatNumber(resolvedPrice * resolvedSize)
      : "---";
    const cards = [
      {
        key: "price",
        label: "Umumiy narx",
        value: totalPrice,
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
        value: formatNumber(home.price),
        icon: Coins,
        mono: true,
      },
    );

    return cards;
  }, [calcResult, home.price, home.size]);

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
        dispatch({ type: "SET_CALC_RESULT", payload: data });
        if (data.bonus.length > 0) win();
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
      url.searchParams.append(key, value.replaceAll(/\s+/g, ""));
    });

    calc(url.href);
  }

  function handlePeriod(p) {
    dispatch({ type: "SET_PERIOD", payload: p });
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
          home?.customer?.installments ??
            calcResult.months ??
            period ??
            1,
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

  function buildReservationPdfPayload(payload) {
    const resolvedPrice = Number(calcResult?.price ?? home?.price ?? 0);
    const resolvedSize = Number(calcResult?.size ?? home?.size ?? 0);
    const installments = Math.max(1, Number(payload?.installments ?? 0) || 1);
    const initialPaymentDigits = digitsOnly(payload?.downPayment);
    const initialPaymentValue = Number(initialPaymentDigits || 0);
    const totalPriceValue =
      resolvedPrice > 0 && resolvedSize > 0
        ? Math.round(resolvedPrice * resolvedSize)
        : 0;
    const remainingAmount = Math.max(totalPriceValue - initialPaymentValue, 0);
    const fallbackMonthPayment = Math.round(remainingAmount / installments);
    const monthPaymentValue = Number.isFinite(Number(calcResult?.monthlyPayment))
      ? Number(calcResult?.monthlyPayment ?? 0)
      : fallbackMonthPayment;
    const totalPrice =
      totalPriceValue > 0
        ? formatNumber(totalPriceValue)
        : undefined;
    const pricePerSquareMeter =
      resolvedPrice > 0 ? formatNumber(Math.round(resolvedPrice)) : undefined;
    const conditionKey = calcResult?.state ?? selectedState;

    return {
      totalPrice,
      period: payload?.installments ? `${payload.installments} oy` : undefined,
      size: resolvedSize > 0 ? `${resolvedSize} m²` : undefined,
      state: states[conditionKey] ?? undefined,
      downPayment:
        initialPaymentDigits !== ""
          ? formatNumber(initialPaymentDigits)
          : undefined,
      discount: "",
      pricePerM2: pricePerSquareMeter,
      monthlyPayment: formatNumber(Math.max(0, Math.round(monthPaymentValue))),
      monthPayment: formatNumber(Math.max(0, Math.round(monthPaymentValue))),
    };
  }

  function createReservationPdfFile(blob) {
    return new File([blob], `bron-hujjati-uy-${home.houseNumber}.pdf`, {
      type: blob.type || "application/pdf",
      lastModified: Date.now(),
    });
  }

  function openPdfInNewTab(blob) {
    const objectUrl = URL.createObjectURL(blob);
    const preview = window.open(objectUrl, "_blank", "noopener,noreferrer");

    if (!preview) {
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 60_000);
  }

  function getConfirmedStatusFromResponse(data) {
    const candidates = [
      data?.status,
      data?.data?.status,
      data?.room?.status,
      data?.result?.status,
    ];

    const confirmed = candidates.find((value) =>
      ["SOLD", "RESERVED", "EMPTY", "NOT"].includes(String(value ?? "").toUpperCase()),
    );

    return confirmed ? String(confirmed).toUpperCase() : null;
  }

  function handleStatusAction(action) {
    if (actionLocked) return;

    if (calculationLocked) {
      toast.error("Avval hisoblashni yakunlang.");
      return;
    }

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

  function handleStatusField(field, value) {
    dispatch({ type: "SET_STATUS_FIELD", payload: { field, value } });
  }

  function validateStatusForm(actionCode) {
    const nextErrors = {};

    if (actionCode === "SOLD" || actionCode === "RESERVED") {
      const phone = normalizePhone(statusForm.phone);
      const downPaymentValue = Number(digitsOnly(statusForm.downPayment));
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
      if (!String(statusForm.downPayment ?? "").trim()) {
        nextErrors.downPayment = "Boshlang'ich to'lovni kiriting!";
      } else if (
        !Number.isFinite(downPaymentValue) ||
        downPaymentValue <= 0
      ) {
        nextErrors.downPayment = "Boshlang'ich to'lov 0 dan katta bo'lsin!";
      }
      if (!String(statusForm.installments ?? "").trim()) {
        nextErrors.installments = "Muddatni kiriting!";
      } else if (!Number.isFinite(installments) || installments <= 0) {
        nextErrors.installments = "Muddat 0 dan katta bo'lsin!";
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
    if (calculationLocked) {
      toast.error("Avval hisoblashni yakunlang.");
      return false;
    }

    dispatch({ type: "SET_PENDING_ACTION", payload: action.code });
    const payload = payloadOverride ?? createStatusPayload(action.code);
    let requestPayload = payload;
    let generatedReservationBlob = null;

    if ((payload.status ?? action.code) === "RESERVED") {
      const pdfResult = await renderPdf(buildReservationPdfPayload(payload));

      if (!pdfResult.ok) {
        toast.error(pdfResult.message);
        dispatch({ type: "SET_PENDING_ACTION", payload: null });
        return false;
      }

      generatedReservationBlob = pdfResult.blob;
      payload.contractFile = createReservationPdfFile(pdfResult.blob);
      requestPayload = createMultipartPayload(payload);
    }

    const result = await updateStatus(home.id, requestPayload);
    if (!result.ok) {
      toast.error(result.message);
      dispatch({ type: "SET_PENDING_ACTION", payload: null });
      return false;
    }

    const expectedStatus = String(payload.status ?? action.code).toUpperCase();
    const confirmedStatus = getConfirmedStatusFromResponse(result.data);
    if (confirmedStatus && confirmedStatus !== expectedStatus) {
      toast.error("Status tasdiqlanmadi. Qayta urinib ko'ring.");
      dispatch({ type: "SET_PENDING_ACTION", payload: null });
      return false;
    }

    await Promise.resolve(
      onStatusUpdated?.({
        roomId: home.id,
        nextStatus: payload.status ?? action.code,
        description: payload.description ?? "",
      }),
    );

    if ((payload.status ?? action.code) === "RESERVED" && generatedReservationBlob) {
      openPdfInNewTab(generatedReservationBlob);
    }

    toast.success(
      (payload.status ?? action.code) === "RESERVED"
        ? "Uy bron qilindi."
        : action.successText,
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
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
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
    if (isOpen && !wasOpenRef.current) {
      dispatch({ type: "RESET_FOR_HOME" });
    }

    wasOpenRef.current = isOpen;
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
      <DrawerContent className="h-full min-h-screen overflow-y-auto lg:overflow-hidden">
        <div className="bg-background/95 sticky top-0 z-30 flex justify-end px-4 pb-2 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-6 sm:pt-5 lg:hidden">
          <DrawerClose
            onClick={handleClose}
            className={buttonVariants({
              variant: "secondary",
              size: "icon-sm",
            })}
          >
            <X />
          </DrawerClose>
        </div>

        {/* Close  */}
        <DrawerClose
          onClick={handleClose}
          className={`${buttonVariants({
            variant: "secondary",
            size: "icon-sm",
          })} absolute top-5 right-5 z-20 hidden border shadow lg:inline-flex`}
        >
          <X />
        </DrawerClose>

        <div className="flex min-h-full flex-col gap-6 px-4 pb-6 pt-16 sm:px-6 lg:h-full lg:flex-row lg:gap-8 lg:overflow-hidden lg:px-8 lg:pb-8">
          <div
            className={`no-scrollbar relative w-full overflow-visible lg:min-h-0 lg:h-full lg:w-[64%] lg:flex-1 lg:overflow-y-auto lg:pr-2 ${
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
            <div className="animate-fade-in bg-background/95 sticky top-[4.5rem] z-10 mb-6 w-full rounded-xl border px-4 py-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:top-[4.75rem] sm:mb-8 sm:px-6 sm:py-6 lg:top-2 lg:shadow-none">
              <h3 className="bg-background text-muted-foreground absolute top-0 left-5 flex -translate-y-2/4 gap-2 rounded px-2">
                Oyiga
              </h3>
              <h2 className={"font-mono text-3xl font-bold sm:text-4xl lg:text-5xl"}>
                {formatNumber(calcResult.monthlyPayment)}
              </h2>
            </div>

            <div className="animate-fade-in mb-5">
              {calcResult.bonus.length > 0 && (
                <div className="text-primary-foreground animate-fade-in mb-5 flex w-full flex-col overflow-hidden rounded-xl border-3 border-green-500 sm:flex-row">
                  <div className="flex items-center justify-center bg-green-500 px-4 py-3 text-2xl font-bold sm:text-4xl">
                    Bonus:
                  </div>

                  <div className="grid w-full grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-3 sm:px-6">
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
                      {calcResult.bonus.map((b) => {
                        return (
                          <PhotoView key={b} src={`/bonus/png/${b}.png`}>
                            <div className="flex min-w-0 flex-col items-center gap-2 rounded-lg bg-background/80 p-2">
                              <picture>
                                <source
                                  srcset={`/bonus/avif/${b}.avif`}
                                  type="image/avif"
                                />
                                <img
                                  className="h-24 w-full object-contain"
                                  src={`/bonus/png/${b}.png`}
                                  alt={b}
                                />
                              </picture>
                              <span className="text-foreground text-center text-xs">
                                {uzbekTranslate[b]}
                              </span>
                            </div>
                          </PhotoView>
                        );
                      })}
                    </PhotoProvider>
                  </div>
                </div>
              )}

              {calcResult.totalDiscount ? (
                <NoiseBackground
                  containerClassName="mb-10 w-full rounded-xl p-4"
                  speed={0.4}
                >
                  <div className="bg-background inline-flex w-full flex-col items-start gap-4 rounded-xl p-4 sm:flex-row sm:items-end sm:gap-5">
                    <CircleCheckBig
                      className="text-green-600"
                      width={40}
                      height={40}
                    />
                    <SparklesText className="text-3xl sm:text-4xl lg:text-5xl" sparklesCount={5}>
                      {formatNumber(calcResult.totalDiscount)}
                    </SparklesText>
                    <p>so'm foydadasiz hurmatli mijoz!</p>
                  </div>
                </NoiseBackground>
              ) : null}

              <div
                id="shu"
                className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3"
              >
                {summaryCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div key={card.key} className="bg-primary/2 w-full rounded border p-2">
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
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mb-5">
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
                <PhotoView src={`/gallery/jpg/${home.image}.jpg`}>
                  <picture>
                    <source
                      srcset={`/gallery/avif/${home.image}.avif`}
                      type="image/avif"
                    />
                    <img
                      className="w-full"
                      src={`/gallery/jpg/${home.image}.jpg`}
                      alt={home.image}
                    />
                  </picture>
                </PhotoView>
              </PhotoProvider>
            </div>

            <Alert className="relative mb-10 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <Layers2 className="text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">
                Infra tuzilma
              </AlertTitle>
              <AlertDescription className="mb-3 text-amber-800 dark:text-amber-200">
                Bino maktab, bog'cha, masjid va 10 dan ziyod savdo-sotiq
                do'konlariga judayam yaqin joylashgan.
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Maktab
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Masjid
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Bog'cha
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Do'konlar
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Yonilg'i shaxobchasi
              </AlertDescription>
              <AlertDescription className="flex items-center text-amber-800 dark:text-amber-200">
                <CircleCheckBig size={12} /> Mashina yuvish joyi
              </AlertDescription>
            </Alert>

            {/* Timeline  */}
            <AppartmentTimeLine />
            </LoadTransition>
          </div>

          <div className="no-scrollbar flex w-full flex-col gap-6 overflow-visible lg:h-full lg:w-[36%] lg:min-w-[23rem] lg:max-w-[26rem] lg:overflow-y-auto lg:pl-2">
            <form
              onSubmit={handleCalc}
              className="mx-auto flex w-full flex-col gap-5 rounded-xl border bg-background p-4 sm:p-5"
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
                            handlePeriod(p);
                          }}
                          className={`inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                            period === p
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
                      onChange={(evt) => {
                        const value = normalizePeriod(evt.target.value);
                        handlePeriod(value);
                      }}
                      type="number"
                      min={12}
                      max={240}
                      value={period}
                      placeholder="0"
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

            <div className="rounded-xl border bg-muted/20 p-3">
              {calculationLocked && (
                <div className="mb-3 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sky-950">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background">
                    <Calculator className="size-4 text-sky-700" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Avval hisoblashni yakunlang
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-sky-800">
                      Sotish, bron qilish yoki statusni o'zgartirishdan oldin
                      joriy parametrlar bo'yicha hisoblashni bosing.
                    </p>
                  </div>
                </div>
              )}

              {actionLocked && (
                <div className="mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background">
                    <Lock className="size-4 text-amber-700" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Ushbu uy ustida amal bajara olmaysiz
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-amber-800">
                      Faqat ushbu bron yoki savdo amalini yaratgan foydalanuvchi
                      statusni o'zgartira oladi.
                    </p>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "relative flex flex-col gap-2",
                  calculationLocked && "pointer-events-none select-none",
                )}
              >
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
                        disabled={
                          actionLocked ||
                          calculationLocked ||
                          actionInProgress
                        }
                        onClick={() => handleStatusAction(action)}
                        className={cn(
                          "group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 overflow-hidden rounded-xl border bg-background px-4 py-4 text-left transition-colors duration-200",
                          "hover:bg-accent/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50",
                          cardTone,
                          calculationLocked &&
                            "hover:bg-background",
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

                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:text-foreground">
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
      </DrawerContent>

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
                            handleStatusField("phone", evt.target.value);
                          }}
                          placeholder="+998901234567"
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
                        min={1}
                        value={statusForm.installments}
                        onChange={(evt) => {
                          handleStatusField(
                            "installments",
                            digitsOnly(evt.target.value),
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
                        {hasDiscountValue ? (
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
                        ) : (
                          <div className="bg-muted/40 rounded-xl border px-3 py-3 text-xs">
                            <p className="font-medium">Chegirma berilmagan</p>
                            <p className="text-muted-foreground mt-1 leading-5">
                              Sotish oqimida chegirma mavjud bo'lsa yuboriladi.
                            </p>
                          </div>
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
                      {pdfLoading ? "PDF tayyorlanmoqda..." : "Saqlanmoqda..."}
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
