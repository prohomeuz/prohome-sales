/**
 * @file CalculatorTool uchun sof yordamchi funksiyalar.
 * @module widgets/calculator/lib/helpers
 *
 * Barcha funksiyalar sof (pure) — tashqi state/side-effect yo'q.
 */

import { formatNumber } from "@/shared/lib/utils";
import { PAYMENT_BONUS_RULES, UZ_MONTHS } from "./constants";

/**
 * Sanani o'zbek formatida qaytaradi.
 * @param {Date|string|number} [date]
 * @returns {string} Masalan: "2025-yil 14-yanvar"
 */
export function formatCreatedDate(date) {
  const d = date instanceof Date ? date : new Date(date ?? Date.now());
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()] ?? "";
  return `${year}-yil ${day}-${month}`;
}

/**
 * Fayl nomini xavfsiz saqlash uchun tozalaydi.
 * @param {string} [value]
 * @returns {string}
 */
export function sanitizeFileName(value) {
  return String(value ?? "bron-hujjat")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 140);
}

/**
 * Jihoz kalitini o'zbekcha nomga o'giradi.
 * @param {string} item
 * @returns {string}
 */
function getBonusItemLabel(item) {
  const uzbekTranslate = {
    refrigerator: "Muzlatgich",
    "gas-stove": "Gaz plita",
    "washing-machine": "Kir yuvish mashinasi",
    "electric-plate": "Elektr plita",
  };
  return uzbekTranslate[item] ?? item;
}

/**
 * Jihoz ro'yxatini ko'rsatiladigan matn sifatida birlashtiradi.
 * @param {string[]} items
 * @returns {string}
 */
function formatBonusItems(items) {
  return items.map(getBonusItemLabel).join(" + ");
}

/**
 * Boshlang'ich to'lov va umumiy narxga qarab bonus qoidasini qaytaradi.
 * @param {{ downPayment: number|string, totalPrice: number|string }} params
 * @returns {object|null}
 */
export function resolvePaymentBonus({ downPayment, totalPrice }) {
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

/**
 * API javobidan shartnoma fayl yo'lini ajratib oladi.
 * @param {object} data
 * @returns {string}
 */
export function extractContractFileFromResponse(data) {
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

/**
 * Shartnoma fayl yo'lini to'liq URL ga aylantiradi.
 * @param {string} contractFile
 * @returns {string}
 */
export function resolveContractFileDocUrl(contractFile) {
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

/**
 * Yangi tab da hujjat ochadi.
 * @param {string} url
 * @returns {boolean} Muvaffaqiyatli ochildi/ochilmadi
 */
export function openPendingDocumentWindow(title = "Hujjat tayyorlanmoqda") {
  if (typeof window === "undefined") return null;

  const target = window.open("", "_blank");
  if (!target) return null;

  try {
    target.document.title = title;
    target.document.body.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 32px; color: #111827;">
        <h1 style="margin: 0 0 12px; font-size: 18px;">${title}</h1>
        <p style="margin: 0; font-size: 14px; line-height: 1.5;">
          Iltimos, kuting. Hujjat yangi oynada ochiladi.
        </p>
      </div>
    `;
  } catch {
    // Yangi tab ichidagi DOM ga yozib bo'lmasa ham keyin URL ni ochishga harakat qilamiz.
  }

  return target;
}

/**
 * Agar kerak bo'lsa ochilgan bo'sh oynani yopadi.
 * @param {Window|null} target
 */
export function closePendingDocumentWindow(target) {
  if (!target || target.closed) return;

  try {
    target.close();
  } catch {
    // Brauzer cheklovi bo'lsa jim o'tamiz.
  }
}

/**
 * Yangi tab da hujjat ochadi.
 * @param {string} url
 * @param {Window|null} [targetWindow]
 * @param {string} [documentTitle]
 * @returns {boolean} Muvaffaqiyatli ochildi/ochilmadi
 */
export function openExternalDocument(url, targetWindow = null, documentTitle = "") {
  if (!url || typeof document === "undefined") return false;

  const safeTitle = String(documentTitle ?? "").trim();
  const safeUrl = String(url);

  const openInWindow = (target) => {
    if (!target || target.closed) return false;

    try {
      target.location.replace(safeUrl);
      return true;
    } catch {
      return false;
    }
  };

  if (openInWindow(targetWindow)) {
    return true;
  }

  if (safeTitle) {
    const popup = window.open("", "_blank");
    if (openInWindow(popup)) {
      return true;
    }
    if (popup && !popup.closed) {
      try {
        popup.close();
      } catch {
        // popup yopilmasa jim o'tamiz.
      }
    }
  }

  const link = document.createElement("a");
  link.href = safeUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  if (safeTitle) {
    link.download = safeTitle;
  }
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
}

/**
 * Telefon raqamidan faqat raqam va + ni qoldiradi.
 * @param {string} [raw]
 * @returns {string}
 */
export function normalizePhone(raw) {
  return String(raw ?? "").replace(/[^\d+]/g, "");
}

/**
 * Matndan faqat raqamlarni ajratib oladi.
 * @param {string} [raw]
 * @returns {string}
 */
export function digitsOnly(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

/**
 * O'zbek telefon raqamini formatlangan holda ko'rsatadi.
 * Masalan: "+998 (90) 123 45 67"
 * @param {string} raw
 * @returns {string}
 */
export function formatUzPhoneDisplay(raw) {
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

/**
 * Nomzodlar ro'yxatidan musbat sonni qaytaradi.
 * @param {...string} candidates
 * @returns {string}
 */
export function getPositiveNumericString(...candidates) {
  for (const candidate of candidates) {
    const normalized = digitsOnly(candidate);
    const numeric = Number(normalized);

    if (Number.isFinite(numeric) && numeric > 0) {
      return String(numeric);
    }
  }

  return "1";
}

/**
 * Bo'sh status formasi obyektini yaratadi.
 * @returns {object}
 */
export function createEmptyStatusForm() {
  return {
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    birthDate: "",
    passportNumber: "",
    passportIssuedBy: "",
    passportIssuedDate: "",
    address: "",
    description: "",
    downPayment: "0",
    installments: "60",
    discountValue: "",
  };
}

/**
 * Status dialogini ochish uchun boshlang'ich qiymatlarni shakllantiradi.
 * @param {object} home - Xona ma'lumoti
 * @param {string} nextStatus - Yangi holat kodi
 * @param {{ calcResult?, downPayment?, period?, discount? }} [defaults]
 * @returns {object}
 */
export function getInitialStatusForm(home, nextStatus, defaults) {
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
    form.middleName =
      customer.middleName ?? customer.middle_name ?? customer.fatherName ?? "";
    form.phone = formatUzPhoneDisplay(customer.phone ?? "");
    form.birthDate = customer.birthDate ?? customer.birth_date ?? "";
    form.passportNumber =
      customer.passportNumber ?? customer.passport_number ?? "";
    form.passportIssuedBy =
      customer.passportIssuedBy ?? customer.passport_issued_by ?? "";
    form.passportIssuedDate =
      customer.passportIssuedDate ?? customer.passport_issued_date ?? "";
    form.address = customer.address ?? customer.adress ?? "";
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
