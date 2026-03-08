/**
 * BUSINESS layer: validation helpers.
 * Used by UI layer; no fetch, no DOM.
 */

import { toast } from "sonner";

export const USER_FORM_ERRORS = {
  fullName: null,
  email: null,
  password: null,
  permissions: null,
};

const TOAST_OPTS = { position: "top-center" };

/**
 * Validates admin/rop/sales-manager add form. Focuses field and shows toast on error.
 * @param {HTMLFormElement} form
 * @param {{ fullName?: string, email?: string, password?: string, permissions?: unknown[] }} result
 * @param {(errors: typeof USER_FORM_ERRORS) => void} [setErrors] optional setter for inline errors
 * @returns {boolean} true if valid
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
