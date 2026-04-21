/**
 * @file Foydalanuvchi formasini validatsiya qilish.
 * @module features/user-crud/lib/user-validators
 *
 * @note toast bu yerda qoldirilgan — features/ qatlami shared/ dan import qila oladi.
 * Agar sof validatsiya kerak bo'lsa, setErrors parametrini ishlating.
 */

import { toast } from "sonner";

/** @type {{ fullName: string|null, email: string|null, password: string|null, permissions: string|null }} */
export const USER_FORM_ERRORS = {
  fullName: null,
  email: null,
  password: null,
  permissions: null,
};

const TOAST_OPTS = { position: "top-center" };

/**
 * Admin/ROP/SalesManager qo'shish formasini validatsiya qiladi.
 * Xato topilsa tegishli fieldga focus qiladi va toast/setErrors orqali xabar beradi.
 *
 * @param {HTMLFormElement} form
 * @param {{ fullName?: string, email?: string, password?: string, permissions?: unknown[] }} result
 * @param {((errors: typeof USER_FORM_ERRORS) => void) | undefined} [setErrors] - Inline xato ko'rsatish uchun
 * @returns {boolean} true — validatsiya muvaffaqiyatli
 */
export function validateUserForm(form, result, setErrors) {
  const next = { ...USER_FORM_ERRORS };
  const fullName = (result.fullName ?? "").trim();
  const email = (result.email ?? "").trim();
  const password = (result.password ?? "").trim();

  if (!fullName) next.fullName = "FISHni kiriting!";
  if (!email) next.email = "Email kiriting!";
  if (!password) next.password = "Parol kiriting!";
  else if (password.length < 6) next.password = "Parol eng kamida 6 ta belgi bo'lishi kerak!";
  if (!result.permissions?.length) next.permissions = "Ruxsatlarni belgilang!";

  if (setErrors) {
    setErrors(next);
    if (next.fullName) form.fullName?.focus();
    else if (next.email) form.email?.focus();
    else if (next.password) form.password?.focus();
  } else {
    if (next.fullName) {
      form.fullName?.focus();
      toast.info(next.fullName, TOAST_OPTS);
    } else if (next.email) {
      form.email?.focus();
      toast.info(next.email, TOAST_OPTS);
    } else if (next.password) {
      form.password?.focus();
      toast.info(next.password, TOAST_OPTS);
    } else if (next.permissions) {
      toast.info(next.permissions, TOAST_OPTS);
    }
  }

  return Object.values(next).every((v) => v === null);
}

/**
 * ROP/foydalanuvchi yangilash formasini validatsiya qiladi.
 * Parol ixtiyoriy — bo'sh bo'lsa tekshirilmaydi.
 *
 * @param {HTMLFormElement} form
 * @param {{ fullName?: string, password?: string, permissions?: unknown[] }} result
 * @param {(errors: typeof USER_FORM_ERRORS) => void} setErrors
 * @returns {boolean}
 */
export function validateUpdateForm(form, result, setErrors) {
  const next = { ...USER_FORM_ERRORS };
  const fullName = (result.fullName ?? "").trim();
  const password = (result.password ?? "").trim();

  if (!fullName) next.fullName = "FISHni kiriting!";
  if (password && password.length < 6) next.password = "Parol eng kamida 6 ta belgi bo'lishi kerak!";
  if (!result.permissions?.length) next.permissions = "Ruxsatlarni belgilang!";

  setErrors(next);
  if (next.fullName) form.fullName?.focus();
  else if (next.password) form.password?.focus();

  return Object.values(next).every((v) => v === null);
}
