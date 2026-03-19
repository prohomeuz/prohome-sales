/**
 * @file CalculatorTool uchun barcha konstantalar.
 * @module widgets/calculator/lib/constants
 */

import {
  BadgeCheck,
  Ban,
  CalendarDays,
  RotateCcw,
} from "lucide-react";

/** Xona holatining tarjimasi (display uchun) */
export const states = {
  BOX: "Karobka",
  READY: "Ta'mirlangan",
};

/** Jihozlar nomlarining o'zbekcha tarjimasi */
export const uzbekTranslate = {
  refrigerator: "Muzlatgich",
  "gas-stove": "Gaz plita",
  "washing-machine": "Kir yuvish mashinasi",
  "electric-plate": "Elektr plita",
};

/**
 * To'lov miqdoriga qarab beriluvchi bonus qoidalari.
 * `minDownPayment: Infinity` — 100% to'lovni anglatadi.
 */
export const PAYMENT_BONUS_RULES = [
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

/** Holat badge rang klasslari */
export const statusBadgeClass = {
  SOLD: "bg-red-500",
  RESERVED: "bg-orange-500",
  EMPTY: "bg-green-500",
  NOT: "bg-slate-400",
};

/** Holat uchun o'qiladigan matnlar */
export const statusLabels = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};

/** Har bir holat o'zgarishi uchun tugma konfiguratsiyasi */
export const actionButtons = [
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

/** Tezkor muddat tugmalari uchun qiymatlar */
export const paymentPeriods = [12, 24, 36, 48, 60];

/** O'zbekiston telefon raqami regex (+998XXXXXXXXX) */
export const UZ_PHONE = /^\+998\d{9}$/;

/** Minimal muddat (oy) */
export const MIN_INSTALLMENTS = 12;

/** Maksimal muddat (oy) */
export const MAX_INSTALLMENTS = 240;

/** Status dialog yopilgandan keyin reset uchun kechikish (ms) */
export const STATUS_DIALOG_CLOSE_DELAY = 220;

/** Standart holat — komponent birinchi ochilganda */
export const DEFAULT_CALC_STATE = "BOX";

/**
 * Har bir asosiy holat uchun ruxsat etilgan o'tish holatlari.
 * @type {Record<string, string[]>}
 */
export const ACTIONS_BY_STATUS = {
  SOLD: ["EMPTY"],
  RESERVED: ["SOLD", "EMPTY"],
  NOT: ["EMPTY"],
  EMPTY: ["SOLD", "RESERVED", "NOT"],
};

/** Hisoblash natijasining dastlabki qiymati */
export const INITIAL_CALC_RESULT = {
  monthlyPayment: 0,
  downPayment: 0,
  months: 60,
  bonus: false,
  umra: false,
};

/** Bron hujjat PDF servisi URL */
export const PDF_SERVICE_URL = "https://contract.prohome.uz/bron";

/** O'zbek oylari nomlari (0-indeksdan boshlangan) */
export const UZ_MONTHS = [
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
