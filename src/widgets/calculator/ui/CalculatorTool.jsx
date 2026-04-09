/**
 * @file Xona kalkulyatori — asosiy orchestrator.
 * @module widgets/calculator/ui/CalculatorTool
 *
 * Barcha state, effect va biznes logika shu komponentda.
 * UI esa sub-komponentlarga delegatsiya qilingan:
 *   - CalcDrawerHeader  — drawer sarlavhasi (viewer tugmalari)
 *   - CalculatorResultPanel — chap panel (natijalar, galerya)
 *   - CalculatorForm    — o'ng panel (hisoblash formasi)
 *   - StatusActionCards — holat tugmalari
 *   - StatusChangeDialog — holat o'zgartirish dialogi
 *   - BonusDialog       — bonus natija dialogi
 *
 * HomeDetails.jsx tomonidan ishlatiladi.
 */

import { createSaleContractPdfFile } from "@/features/contracts/lib/sales-contract-pdf";
import { useRoomStatus } from "@/features/room-status-change/model/use-room-status";
import { useAppStore } from "@/entities/session/model";
import { apiRequest } from "@/shared/lib/api";
import useSound from "@/shared/hooks/use-sound";
import {
  formatNumber,
  formatNumberWithPercent,
  normalizePeriod,
} from "@/shared/lib/utils";
import { Drawer, DrawerContent } from "@/shared/ui/drawer";
import confetti from "canvas-confetti";
import {
  Bolt,
  CalendarDays,
  CircleDollarSign,
  Coins,
  Grid2X2,
  HandCoins,
} from "lucide-react";
import {
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ACTIONS_BY_STATUS,
  actionButtons,
  DEFAULT_CALC_STATE,
  PDF_SERVICE_URL,
  states,
  STATUS_DIALOG_CLOSE_DELAY,
  UZ_PHONE,
  MIN_INSTALLMENTS,
  MAX_INSTALLMENTS,
} from "../lib/constants";
import {
  closePendingDocumentWindow,
  digitsOnly,
  extractContractFileFromResponse,
  formatCreatedDate,
  formatUzPhoneDisplay,
  getInitialStatusForm,
  getPositiveNumericString,
  normalizePhone,
  openPendingDocumentWindow,
  openExternalDocument,
  resolveContractFileDocUrl,
  resolvePaymentBonus,
  sanitizeFileName,
} from "../lib/helpers";
import { validateStatusFormFields } from "../lib/status-form-validation";
import {
  calculatorReducer,
  createCalculatorInitialState,
} from "../model/calculator-reducer";
import BonusDialog from "./BonusDialog";
import CalcDrawerHeader from "./CalcDrawerHeader";
import CalculatorForm from "./CalculatorForm";
import CalculatorResultPanel from "./CalculatorResultPanel";
import StatusActionCards from "./StatusActionCards";
import StatusChangeDialog from "./StatusChangeDialog";

const LazyGenplanViewerButton = lazy(
  () => import("@/widgets/GenplanViewerButton"),
);
const LazyDiscountViewerSlider = lazy(
  () => import("@/widgets/DiscountViewerSlider"),
);

/**
 * Xona kalkulyatori va holat boshqaruv paneli.
 * @param {{ home: object, projectId?: string|number, onStatusUpdated?: function }} props
 */
export default function CalculatorTool({ home, projectId, onStatusUpdated }) {
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
    price,
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
  const actionInProgress = statusLoading || contractFileLoading;
  const actionLocked =
    (home?.canBeSold ?? home?.customer?.canBeSold ?? true) === false;
  const isOpen =
    location.search.includes("details=") && location.hash === "#calculator";
  const hasDiscountValue = showDiscount && String(discount ?? "").trim();
  const resolvedPrice = useMemo(() => {
    const numeric = Number(calcResult.price ?? home.price ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [calcResult.price, home.price]);
  const resolvedSize = useMemo(() => {
    const numeric = Number(calcResult.size ?? home.size ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [calcResult.size, home.size]);

  // --- Memoized hisob-kitoblar ---

  const availableActions = useMemo(() => {
    const allowedCodes = ACTIONS_BY_STATUS[home.status] ?? [];
    return actionButtons.filter((action) => allowedCodes.includes(action.code));
  }, [home.status]);

  const paymentBonus = useMemo(() => {
    const usdRate = Number(currencyUsd?.rate);
    const hasUsdRate = Number.isFinite(usdRate) && usdRate > 0;
    const totalSom =
      hasUsdRate && resolvedPrice > 0 && resolvedSize > 0
        ? Math.round(resolvedPrice * resolvedSize * usdRate)
        : 0;
    const resolvedDownPayment = Number(digitsOnly(calcResult.downPayment)) || 0;
    return resolvePaymentBonus({
      downPayment: resolvedDownPayment,
      totalPrice: totalSom,
    });
  }, [calcResult.downPayment, currencyUsd?.rate, resolvedPrice, resolvedSize]);

  const bonusItems = useMemo(() => paymentBonus?.items ?? [], [paymentBonus]);
  const hasUmraBonus = calcResult.umra === true;

  const summaryCards = useMemo(() => {
    const usdRate = Number(currencyUsd?.rate);
    const hasUsdRate = Number.isFinite(usdRate) && usdRate > 0;
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
      cards.push(
        {
          key: "size",
          label: "O'lchami",
          value: (
            <>
              {calcResult.size} m<sup>2</sup>
            </>
          ),
          icon: Grid2X2,
          mono: true,
        },
        {
          key: "state",
          label: "Holati",
          value: states[calcResult.state],
          icon: Bolt,
          mono: false,
        },
      );
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
  }, [
    calcResult,
    currencyUsd?.rate,
    paymentBonus,
    resolvedPrice,
    resolvedSize,
  ]);

  function normalizeCalcApiMessage(message) {
    const raw = Array.isArray(message)
      ? message.join(", ")
      : String(message ?? "");

    return raw
      .trim()
      .replace(/price/g, "Narx")
      .replace(/downPayment/g, "Boshlang'ich to'lov")
      .replace(/months/g, "Muddat")
      .replace(/state/g, "Holat")
      .replace(/discountPerM2/g, "Chegirma")
      .replace(/discountPercent/g, "Chegirma")
      .replace(/discountValue/g, "Chegirma")
      .replace(
        /must be a number conforming to the specified constraints/g,
        "raqam formatida bo'lishi kerak",
      )
      .replace(/must be a positive number/g, "musbat raqam bo'lishi kerak")
      .replace(/([a-z])([A-Z])/g, "$1, $2");
  }

  function resolveDiscountAmountSom({
    discountKey,
    discountValue,
    totalSom,
    size,
  }) {
    const numericValue = Number(digitsOnly(discountValue)) || 0;
    if (!discountKey || numericValue <= 0) return 0;

    if (discountKey === "discountPerM2") {
      return Math.round(numericValue * size);
    }

    if (discountKey === "discountPercent") {
      return Math.round((totalSom * Math.min(numericValue, 100)) / 100);
    }

    return Math.round(numericValue);
  }

  function createCalcRequestContext() {
    const months = Number(normalizePeriod(String(period ?? "")) || "12");
    const normalizedDownPayment = Number(digitsOnly(downPayment)) || 0;
    const requestedPrice = Number(digitsOnly(price)) || 0;
    const discountKey = hasDiscountValue ? discountType : "";
    const discountValue = hasDiscountValue
      ? String(discount ?? "").replace(/\s+/g, "")
      : "";
    const params = new URLSearchParams();

    params.append("state", selectedState);
    params.append("downPayment", String(normalizedDownPayment));
    params.append("months", String(months));

    if (discountKey && discountValue) {
      params.append(discountKey, discountValue);
    }

    return {
      params,
      months,
      requestedPrice,
      selectedState,
      downPayment: normalizedDownPayment,
      discountKey,
      discountValue,
    };
  }

  async function applyPriceOverrideToCalcResult(baseResult, requestContext) {
    if (!(requestContext?.requestedPrice > 0)) {
      return baseResult;
    }

    const currencyRate = await resolveCurrencyRate();
    const size = Number(baseResult?.size ?? home?.size ?? 0);
    const originalPrice = Number(baseResult?.price ?? home?.price ?? 0);
    const safeSize = Number.isFinite(size) && size > 0 ? size : 0;
    const safeOriginalPrice =
      Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : 0;

    const originalTotalSom = Math.round(
      safeOriginalPrice * safeSize * currencyRate,
    );
    const requestedTotalSom = Math.round(
      requestContext.requestedPrice * safeSize * currencyRate,
    );
    const originalDiscountSom = resolveDiscountAmountSom({
      discountKey: requestContext.discountKey,
      discountValue: requestContext.discountValue,
      totalSom: originalTotalSom,
      size: safeSize,
    });
    const requestedDiscountSom = resolveDiscountAmountSom({
      discountKey: requestContext.discountKey,
      discountValue: requestContext.discountValue,
      totalSom: requestedTotalSom,
      size: safeSize,
    });
    const originalRemainingSom = Math.max(
      originalTotalSom - originalDiscountSom - requestContext.downPayment,
      0,
    );
    const requestedRemainingSom = Math.max(
      requestedTotalSom - requestedDiscountSom - requestContext.downPayment,
      0,
    );
    const backendMonthly = Number(baseResult?.monthlyPayment) || 0;
    const ratio =
      originalRemainingSom > 0 && backendMonthly > 0
        ? backendMonthly / originalRemainingSom
        : requestContext.months > 0
          ? 1 / requestContext.months
          : 0;
    const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 0;

    return {
      ...baseResult,
      price: requestContext.requestedPrice,
      size: safeSize || baseResult?.size || home?.size || 0,
      state: requestContext.selectedState,
      downPayment: requestContext.downPayment,
      months: requestContext.months,
      monthlyPayment: Math.max(
        0,
        Math.round(requestedRemainingSom * safeRatio),
      ),
    };
  }

  // --- API ---

  async function calc(url, requestContext) {
    let req;
    dispatch({ type: "SET_CALC_LOADING", payload: true });
    try {
      req = await apiRequest(url);
    } catch {
      toast.error("Tizimda nosozlik!", { position: "bottom-left" });
    }

    if (req) {
      if (req.status === 200) {
        const data = await req.json();
        let nextPayload = data;

        try {
          nextPayload = await applyPriceOverrideToCalcResult(
            data,
            requestContext,
          );
        } catch {
          if (requestContext?.requestedPrice > 0) {
            nextPayload = { ...data, price: requestContext.requestedPrice };
          }
        }

        dispatch({ type: "SET_CALC_RESULT", payload: nextPayload });
      } else {
        let message = "";

        try {
          const errorData = await req.json();
          message = normalizeCalcApiMessage(
            errorData?.message ??
              errorData?.error ??
              errorData?.detail ??
              errorData?.details ??
              "",
          );
        } catch {
          message = "";
        }

        const fallback =
          req.status === 400
            ? "Hisoblash uchun kiritilgan ma'lumotlarni tekshirib ko'ring."
            : "Xatolik yuz berdi qayta urunib ko'ring!";

        toast.error(message || fallback, {
          position: "bottom-left",
        });
      }
    }

    dispatch({ type: "SET_CALC_LOADING", payload: false });
  }

  // --- Handlerlar ---

  function handleClose({ clearDetails = false } = {}) {
    dispatch({ type: "RESET" });
    const params = new URLSearchParams(location.search);
    if (clearDetails) params.delete("details");
    const nextSearch = params.toString();
    const nextUrl = clearDetails
      ? `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`
      : `${location.pathname}${location.search}`;
    navigate(nextUrl, { replace: true });
  }

  function handleCalc(evt) {
    evt.preventDefault();
    const requestContext = createCalcRequestContext();
    calc(
      `/api/v1/room/${home.id}/calculate?${requestContext.params.toString()}`,
      requestContext,
    );
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
    let rawValue = evt.target.value.replace(/\D/g, "");
    dispatch({ type: "SET_DOWN_PAYMENT", payload: formatNumber(rawValue) });
  }

  function handlePrice(evt) {
    const rawValue = evt.target.value.replace(/\D/g, "");
    dispatch({
      type: "SET_PRICE",
      payload: rawValue ? formatNumber(rawValue) : "",
    });
  }

  function handleDiscount(evt) {
    dispatch({
      type: "SET_DISCOUNT",
      payload: formatNumberWithPercent(evt.target.value),
    });
  }

  function getFallbackPaymentValues() {
    const fallbackDownPayment = getPositiveNumericString(
      home?.customer?.downPayment,
      calcResult.downPayment,
      downPayment,
      resolvedPrice * resolvedSize,
      resolvedPrice,
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

  async function resolveCurrencyRate() {
    if (!useAppStore.getState().currencyUsd?.rate) {
      await fetchCurrencyUsd?.();
    }

    const currencyRate = Number(useAppStore.getState().currencyUsd?.rate);
    if (!Number.isFinite(currencyRate) || currencyRate <= 0) {
      throw new Error("Dollar kursi topilmadi.");
    }

    return currencyRate;
  }

  async function resolveNextSalesContractNumber(contractDate) {
    const year = String(contractDate.getFullYear());
    const localKey = `sales_contract_last_seq_${year}`;
    const localLastRaw = Number(window.localStorage.getItem(localKey) ?? 0);
    const localLast = Number.isFinite(localLastRaw)
      ? Math.max(localLastRaw, 0)
      : 0;
    const nextSeq = localLast + 1;
    window.localStorage.setItem(localKey, String(nextSeq));
    return `${year}${String(nextSeq).padStart(4, "0")}`;
  }

  async function createReservedContractFile(payload) {
    const currencyRate = await resolveCurrencyRate();
    const totalUsd =
      resolvedPrice > 0 && resolvedSize > 0 ? resolvedPrice * resolvedSize : 0;
    const totalSom = Math.round(totalUsd * currencyRate);
    const pricePerMetrSom = Math.round(resolvedPrice * currencyRate);
    const downPaymentSom = Number(digitsOnly(payload.downPayment)) || 0;
    const monthlySom = Number(calcResult.monthlyPayment) || 0;
    const customerName = `${payload.firstName} ${payload.lastName}`.trim();
    const fileName = sanitizeFileName(`${customerName || "Mijoz"} bron hujjat`);

    const pdfReqBody = {
      CREATED: formatCreatedDate(new Date()),
      FILE_NAME: fileName,
      ROOM: `${home.room ?? ""}x`,
      BLOCK: String(home.block ?? ""),
      FLOOR: `${home.floorNumber ?? ""}-QAVAT`,
      HOUSE_NUMBER: `No ${home.houseNumber ?? ""} XONADON`,
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
      CLIENT_NAME: customerName,
      CLIENT_PHONE: payload.phone || "",
    };

    const pdfForm = new URLSearchParams();
    Object.entries(pdfReqBody).forEach(([key, value]) => {
      pdfForm.append(key, value ?? "");
    });

    const pdfRes = await fetch(PDF_SERVICE_URL, {
      method: "POST",
      headers: { Accept: "application/pdf" },
      body: pdfForm,
    });

    if (!pdfRes.ok) throw new Error("PDF yaratib bo'lmadi.");

    const pdfBlob = await pdfRes.blob();
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error("PDF bo'sh qaytdi.");
    }

    return new File([pdfBlob], `${fileName}.pdf`, {
      type: "application/pdf",
    });
  }

  async function createSoldContractAssets(payload) {
    const currencyRate = await resolveCurrencyRate();
    const contractDate = new Date();
    const contractNumber = await resolveNextSalesContractNumber(contractDate);
    const pdfBlob = await createSaleContractPdfFile({
      home,
      form: payload,
      contractNumber,
      contractDate,
      currencyRate,
      resolvedPriceUsd: resolvedPrice,
      resolvedSize,
      monthlyPaymentSom: Number(calcResult.monthlyPayment) || 0,
    });

    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error("PDF bo'sh qaytdi.");
    }

    const fileName = sanitizeFileName(`Shartnoma_${contractNumber}`);
    const contractFile = new File([pdfBlob], `${fileName}.pdf`, {
      type: "application/pdf",
    });

    return {
      contractNumber,
      contractDate: contractDate.toISOString(),
      previewUrl: URL.createObjectURL(contractFile),
      contractFile,
    };
  }

  function triggerPdfDownload(url, fileName) {
    if (!url || typeof document === "undefined") return;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    if (home.status === "RESERVED" && action.code === "EMPTY") {
      submitStatusActionV2(action, createDirectStatusPayload("EMPTY"));
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

  function handleStatusField(field, value) {
    dispatch({ type: "SET_STATUS_FIELD", payload: { field, value } });
  }

  function validateStatusForm(actionCode) {
    const usdRate = Number(currencyUsd?.rate);
    const totalPriceSom =
      Number.isFinite(usdRate) &&
      usdRate > 0 &&
      resolvedPrice > 0 &&
      resolvedSize > 0
        ? Math.round(resolvedPrice * resolvedSize * usdRate)
        : 0;
    const nextErrors = validateStatusFormFields({
      actionCode,
      statusForm,
      phoneRegex: UZ_PHONE,
      minInstallments: MIN_INSTALLMENTS,
      maxInstallments: MAX_INSTALLMENTS,
      totalPriceSom,
    });
    dispatch({ type: "SET_STATUS_ERRORS", payload: nextErrors });
    return Object.keys(nextErrors).length === 0;
  }

  function createStatusPayload(actionCode) {
    const isCustomerFlow = actionCode === "SOLD" || actionCode === "RESERVED";
    const fallbackPayment = getFallbackPaymentValues();
    const firstName = statusForm.firstName.trim();
    const lastName = statusForm.lastName.trim();
    const middleName = statusForm.middleName.trim();

    return {
      firstName: isCustomerFlow ? firstName : "",
      lastName: isCustomerFlow ? lastName : "",
      middleName: actionCode === "SOLD" ? middleName : "",
      fullName: isCustomerFlow
        ? [lastName, firstName, actionCode === "SOLD" ? middleName : ""]
            .filter(Boolean)
            .join(" ")
        : "",
      description:
        actionCode === "NOT" || isCustomerFlow
          ? statusForm.description.trim()
          : "",
      phone: isCustomerFlow ? normalizePhone(statusForm.phone) : "",
      birthDate: actionCode === "SOLD" ? statusForm.birthDate.trim() : "",
      passportNumber:
        actionCode === "SOLD" ? statusForm.passportNumber.trim() : "",
      passportIssuedBy:
        actionCode === "SOLD" ? statusForm.passportIssuedBy.trim() : "",
      passportIssuedDate:
        actionCode === "SOLD" ? statusForm.passportIssuedDate.trim() : "",
      address: actionCode === "SOLD" ? statusForm.address.trim() : "",
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
          HOUSE_NUMBER: `No ${home.houseNumber ?? ""} XONADON`,
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
          CLIENT_NAME: customerName,
          CLIENT_PHONE: payload.phone || "",
        };

        const pdfForm = new URLSearchParams();
        Object.entries(pdfReqBody).forEach(([key, value]) => {
          pdfForm.append(key, value ?? "");
        });

        const pdfRes = await fetch(PDF_SERVICE_URL, {
          method: "POST",
          headers: { Accept: "application/pdf" },
          body: pdfForm,
        });

        if (!pdfRes.ok) throw new Error("PDF yaratib bo'lmadi.");

        const pdfBlob = await pdfRes.blob();
        if (!pdfBlob || pdfBlob.size === 0)
          throw new Error("PDF bo'sh qaytdi.");

        const pdfFile = new File([pdfBlob], `${fileName}.pdf`, {
          type: "application/pdf",
        });
        nextPayload = { ...payload, contractFile: pdfFile };
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

  async function submitStatusActionV2(action, payloadOverride) {
    dispatch({ type: "SET_PENDING_ACTION", payload: action.code });
    const payload = payloadOverride ?? createStatusPayload(action.code);
    const nextStatus = payload.status ?? action.code;
    let nextPayload = payload;
    let previewUrl = "";
    const documentWindow =
      nextStatus === "RESERVED" || nextStatus === "SOLD"
        ? openPendingDocumentWindow(
            nextStatus === "SOLD"
              ? "Shartnoma tayyorlanmoqda"
              : "Bron hujjati tayyorlanmoqda",
          )
        : null;

    if (nextStatus === "RESERVED" || nextStatus === "SOLD") {
      setContractFileLoading(true);
      try {
        if (nextStatus === "RESERVED") {
          const contractFile = await createReservedContractFile(payload);
          nextPayload = { ...payload, contractFile };
        } else {
          const soldAssets = await createSoldContractAssets(payload);
          previewUrl = soldAssets.previewUrl;
          nextPayload = {
            ...payload,
            contractNumber: soldAssets.contractNumber,
            contractDate: soldAssets.contractDate,
            contractFile: soldAssets.contractFile,
          };
        }
      } catch (error) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        closePendingDocumentWindow(documentWindow);
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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      closePendingDocumentWindow(documentWindow);
      toast.error(result.message);
      dispatch({ type: "SET_PENDING_ACTION", payload: null });
      return false;
    }

    if (nextStatus === "RESERVED" || nextStatus === "SOLD") {
      const contractFile = extractContractFileFromResponse(result.data);
      const contractFileUrl = resolveContractFileDocUrl(contractFile);
      const shouldPreferPreview = nextStatus === "SOLD" && Boolean(previewUrl);
      const targetUrl = shouldPreferPreview
        ? previewUrl
        : contractFileUrl || previewUrl;

      if (previewUrl) {
        const revokeDelay = shouldPreferPreview
          ? 60_000
          : contractFileUrl
            ? 0
            : 60_000;
        window.setTimeout(() => URL.revokeObjectURL(previewUrl), revokeDelay);
      }

      if (targetUrl) {
        const documentTitle =
          nextStatus === "SOLD"
            ? `Shartnoma_${nextPayload.contractNumber ?? ""}.pdf`.trim()
            : "";
        const opened = openExternalDocument(
          targetUrl,
          documentWindow,
          documentTitle,
        );
        if (!opened) {
          toast.info(
            "Shartnomani ochish uchun brauzerda pop-up ruxsatini yoqing.",
            { position: "bottom-left" },
          );
        }
        if (nextStatus === "SOLD" && previewUrl) {
          const downloadName = `${sanitizeFileName(
            `Shartnoma_${nextPayload.contractNumber ?? ""}`,
          )}.pdf`;
          triggerPdfDownload(previewUrl, downloadName);
        }
      } else {
        closePendingDocumentWindow(documentWindow);
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
      nextStatus === "RESERVED"
        ? "Uy bron qilindi."
        : nextStatus === "SOLD"
          ? "Uy sotildi va shartnoma yaratildi."
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
    await submitStatusActionV2(action);
  }

  function win() {
    const originY = 0.6;
    confetti({ particleCount: 90, spread: 80, origin: { y: originY } });
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

  // --- Viewer handlerlar ---

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
    dispatch({ type: "SET_GALLERY_SHOW", payload: Boolean(visible) });
    if (!visible) setGenplanOpenSignal(0);
  }, []);

  const handleDiscountVisibleChange = useCallback((visible) => {
    dispatch({ type: "SET_GALLERY_SHOW", payload: Boolean(visible) });
    if (!visible) setDiscountOpenSignal(0);
  }, []);

  const handleUmraVisibleChange = useCallback((visible) => {
    dispatch({ type: "SET_GALLERY_SHOW", payload: Boolean(visible) });
    if (!visible) setUmraOpenSignal(0);
  }, []);

  const handleConfidenceVisibleChange = useCallback((visible) => {
    dispatch({ type: "SET_GALLERY_SHOW", payload: Boolean(visible) });
    if (!visible) setConfidenceOpenSignal(0);
  }, []);

  // --- Effects ---

  // D tugmasi bilan chegirmani yashirin ochish
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

  // Uy o'zgarganda state ni reset qilish
  useEffect(() => {
    dispatch({ type: "RESET_FOR_HOME" });
  }, [home.id]);

  // Valyuta kursini olish
  useEffect(() => {
    if (!currencyUsd?.rate) fetchCurrencyUsd?.();
  }, [currencyUsd?.rate, fetchCurrencyUsd]);

  // Bonus animatsiyasi
  useEffect(() => {
    if (!calcVersion || (!paymentBonus && !hasUmraBonus)) return;
    win();
    dispatch({ type: "OPEN_BONUS_DIALOG" });
  }, [calcVersion, hasUmraBonus, paymentBonus]);

  // Drawer yopilganda viewer lar ni reset qilish
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

  // Status dialog yopilgandan keyin reset uchun timer
  useEffect(() => {
    if (statusDialogOpen || !statusDialogRenderedAction) return undefined;
    dialogResetTimerRef.current = window.setTimeout(() => {
      dispatch({ type: "CLEAR_STATUS_DIALOG" });
    }, STATUS_DIALOG_CLOSE_DELAY);
    return () => window.clearTimeout(dialogResetTimerRef.current);
  }, [statusDialogOpen, statusDialogRenderedAction]);

  // --- Render ---

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(v) => {
        if (v === false && galleryShow === false) handleClose();
      }}
      direction="top"
    >
      <DrawerContent
        className={`flex h-full min-h-screen flex-col lg:overflow-hidden ${
          galleryShow ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {/* Sarlavha — Orqaga tugmasi + viewer tugmalari */}
        <CalcDrawerHeader
          onClose={handleClose}
          umraViewerLoaded={umraViewerLoaded}
          umraOpenSignal={umraOpenSignal}
          onOpenUmra={handleOpenUmra}
          onUmraVisibleChange={handleUmraVisibleChange}
          confidenceViewerLoaded={confidenceViewerLoaded}
          confidenceOpenSignal={confidenceOpenSignal}
          onOpenConfidence={handleOpenConfidence}
          onConfidenceVisibleChange={handleConfidenceVisibleChange}
          genplanViewerLoaded={genplanViewerLoaded}
          genplanOpenSignal={genplanOpenSignal}
          onOpenGenplan={handleOpenGenplan}
          onGenplanVisibleChange={handleGenplanVisibleChange}
          LazyGenplanViewerButton={LazyGenplanViewerButton}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-6 px-4 pt-6 pb-6 sm:px-6 lg:flex-row lg:gap-8 lg:overflow-hidden lg:px-8 lg:pb-8">
          {/* Chap panel — natijalar, galerya, timeline */}
          <div
            className={`no-scrollbar relative w-full overflow-visible lg:min-h-0 lg:w-[64%] lg:flex-1 lg:overflow-y-auto lg:pr-2 lg:pb-2 ${
              calcLoading ? "pointer-events-none" : ""
            }`}
          >
            <CalculatorResultPanel
              home={home}
              calcResult={calcResult}
              summaryCards={summaryCards}
              paymentBonus={paymentBonus}
              hasUmraBonus={hasUmraBonus}
              bonusItems={bonusItems}
              calcLoading={calcLoading}
            />
          </div>

          {/* O'ng panel — forma + harakat tugmalari */}
          <div className="no-scrollbar flex w-full flex-col gap-4 lg:min-h-0 lg:w-[36%] lg:overflow-y-auto lg:pb-2">
            <CalculatorForm
              selectedState={selectedState}
              price={price}
              pricePlaceholder="Masalan: 850"
              currentPriceLabel={
                resolvedPrice > 0 ? `${formatNumber(resolvedPrice)} USD` : ""
              }
              downPayment={downPayment}
              period={period}
              showDiscount={showDiscount}
              discountType={discountType}
              discount={discount}
              calcLoading={calcLoading}
              discountViewerLoaded={discountViewerLoaded}
              discountOpenSignal={discountOpenSignal}
              LazyDiscountViewerSlider={LazyDiscountViewerSlider}
              onSubmit={handleCalc}
              onStateChange={(value) =>
                dispatch({ type: "SET_SELECTED_STATE", payload: value })
              }
              onPrice={handlePrice}
              onDownPayment={handleDownPayment}
              onDiscount={handleDiscount}
              onDiscountTypeChange={(value) =>
                dispatch({ type: "SET_DISCOUNT_TYPE", payload: value })
              }
              onPeriod={handlePeriod}
              onPeriodInputChange={handlePeriodInputChange}
              onPeriodInputBlur={handlePeriodInputBlur}
              onOpenDiscountViewer={handleOpenDiscountViewer}
              onDiscountVisibleChange={handleDiscountVisibleChange}
            />

            <StatusActionCards
              availableActions={availableActions}
              actionLocked={actionLocked}
              actionInProgress={actionInProgress}
              pendingAction={pendingAction}
              onAction={handleStatusAction}
            />
          </div>
        </div>
      </DrawerContent>

      {/* Bonus natija dialogi */}
      <BonusDialog
        open={bonusDialogOpen}
        onClose={() => dispatch({ type: "CLOSE_BONUS_DIALOG" })}
        paymentBonus={paymentBonus}
        hasUmraBonus={hasUmraBonus}
      />

      {/* Holat o'zgartirish dialogi */}
      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={(v) => {
          if (!v) dispatch({ type: "CLOSE_STATUS_DIALOG" });
        }}
        onSubmit={handleStatusSubmit}
        activeAction={activeAction}
        home={home}
        resolvedPrice={resolvedPrice}
        resolvedSize={resolvedSize}
        statusForm={statusForm}
        statusErrors={statusErrors}
        hasDiscountValue={hasDiscountValue}
        actionInProgress={actionInProgress}
        pendingAction={pendingAction}
        onFieldChange={handleStatusField}
      />
    </Drawer>
  );
}
