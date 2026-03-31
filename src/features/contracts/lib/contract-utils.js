/**
 * @file Shartnomalar sahifasi uchun sof yordamchi funksiyalar.
 * @module features/contracts/lib/contract-utils
 */

/** Backend status qiymatlari: PENDING | SUCCESS | CANCELED */
export const CONTRACT_STATUS = {
  PENDING:  "PENDING",
  SUCCESS:  "SUCCESS",
  CANCELED: "CANCELED",
};

export const CONTRACT_STATUS_LABEL = {
  PENDING:  "Jarayonda",
  SUCCESS:  "Muvaffaqiyatli",
  CANCELED: "Bekor qilingan",
};

export const CONTRACT_STATUS_BADGE_CLASS = {
  PENDING:  "bg-yellow-500 text-white hover:bg-yellow-500",
  SUCCESS:  "bg-green-600 text-white hover:bg-green-600",
  CANCELED: "bg-destructive text-white hover:bg-destructive",
};

export const CONTRACT_STATUS_TABS = [
  { key: "ALL",      label: "Barchasi" },
  { key: "PENDING",  label: "Jarayonda" },
  { key: "SUCCESS",  label: "Muvaffaqiyatli" },
  { key: "CANCELED", label: "Bekor qilingan" },
];

/**
 * Sanani o'zbek formatida { date, time } sifatida qaytaradi.
 * @param {string|number|null} value
 * @returns {{ date: string, time: string }}
 */
export function formatContractDate(value) {
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

/**
 * Jadval satri uchun unikal kalit qaytaradi.
 * @param {object} contract
 * @param {number} index
 * @returns {string}
 */
export function getRowKey(contract, index) {
  return String(
    contract?.id ??
      contract?.contractId ??
      contract?.contractNumber ??
      `${contract?.contractDate ?? "contract"}-${contract?.fullName ?? index}`,
  );
}

/**
 * Shartnoma fayl yo'lini to'liq URL ga aylantiradi.
 * Backend faqat fayl nomini qaytaradi: "1774805171094-779218106.pdf"
 * To'liq URL: VITE_BASE_URL + /api/v1/docs/ + filename
 * @param {string} contractFile
 * @returns {string}
 */
export function resolveContractFileUrl(contractFile) {
  if (!contractFile) return "";
  if (contractFile.startsWith("http")) return contractFile;

  const base = import.meta.env.VITE_BASE_URL ?? window.location.origin;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedFile = contractFile.startsWith("/")
    ? contractFile.slice(1)
    : contractFile;

  // Agar yo'lda allaqachon /api/v1/docs/ bor bo'lsa
  if (normalizedFile.includes("/")) {
    return `${normalizedBase}/${normalizedFile}`;
  }

  // Faqat fayl nomi kelgan holat (asosiy holat)
  return `${normalizedBase}/api/v1/docs/${normalizedFile}`;
}

/**
 * Turli formatdagi summa qiymatlarini raqamga parse qiladi.
 * @param {any} raw
 * @returns {number|null}
 */
function parseAmountValue(raw) {
  if (raw === null || raw === undefined || raw === "") return null;

  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }

  const normalized = String(raw).replace(/[^\d.-]/g, "");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * Shartnomadan summa qiymatini topadi (turli API field nomlari uchun).
 * @param {object} contract
 * @returns {number|null}
 */
export function resolveContractAmount(contract) {
  const candidates = [
    contract?.totalPrice,
    contract?.totalAmount,
    contract?.amount,
    contract?.price,
    contract?.contractAmount,
    contract?.sum,
    contract?.overallPrice,
    contract?.downPayment,
  ];

  for (const candidate of candidates) {
    const value = parseAmountValue(candidate);
    if (value !== null) return value;
  }

  return null;
}

/**
 * Joriy yil uchun keyingi shartnoma raqamini qaytaradi.
 * Format: YYYY0001
 * @param {object[]} contracts
 * @param {Date} [date]
 * @returns {string}
 */
export function getNextContractNumber(contracts, date = new Date()) {
  const year = String(date.getFullYear());
  let maxSequence = 0;

  (contracts ?? []).forEach((contract) => {
    const raw = String(contract?.contractNumber ?? "").trim();
    if (!new RegExp(`^${year}\\d{4}$`).test(raw)) return;

    const sequence = Number(raw.slice(year.length));
    if (Number.isFinite(sequence)) {
      maxSequence = Math.max(maxSequence, sequence);
    }
  });

  return `${year}${String(maxSequence + 1).padStart(4, "0")}`;
}
