/**
 * @file Loyiha bo'ylab ishlatiladigan global konstantalar.
 * Environment variable lar va statik qiymatlar shu yerda yig'iladi.
 */

/** API base URL — barcha so'rovlar uchun */
export const BASE_URL = import.meta.env.VITE_BASE_URL ?? "";

/** Kvartira holatlari */
export const ROOM_STATUS = /** @type {const} */ ({
  EMPTY: "EMPTY",
  SOLD: "SOLD",
  RESERVED: "RESERVED",
  NOT: "NOT",
});

/** Foydalanuvchi rollari */
export const USER_ROLE = /** @type {const} */ ({
  ADMIN: "ADMIN",
  SALES_MANAGER: "SALES_MANAGER",
  ROP: "ROP",
});

/** Valyutalar */
export const CURRENCY = /** @type {const} */ ({
  USD: "USD",
  UZS: "UZS",
});

/** Clipboard ko'chirildi holati vaqti (ms) */
export const COPIED_DURING_MS = 1500;

/** O'zbekiston telefon raqami validatsiya regex (+998XXXXXXXXX) */
export const UZ_PHONE_REGEX = /^\+998\d{9}$/;
