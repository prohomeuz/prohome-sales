/**
 * @file Kompaniya formasi uchun validatsiya.
 * @module features/company-form/lib/validators
 *
 * Bu funksiyalar AddCompany va CompanyDetails sahifalari tomonidan
 * birgalikda ishlatiladi.
 */

import { UZ_PHONE_REGEX } from "@/shared/config/constants";

/**
 * Telefon raqamini +998 bilan normallashtiradi.
 * @param {string} phone
 * @returns {string}
 */
export function formatCompanyPhone(phone) {
  if (!phone) return "";
  const trimmed = phone.trim();
  return trimmed.startsWith("+") ? trimmed : `+998${trimmed}`;
}

/**
 * Kompaniya formasini tekshiradi va xatolar obyektini qaytaradi.
 * @param {object} data - getFormData() natijasi + permissions massivi
 * @returns {{ errors: object, isValid: boolean }}
 */
export function validateCompanyFormData(data) {
  const errors = {
    name: null,
    phoneNumber: null,
    managerName: null,
    description: null,
    permissions: null,
  };

  const name = (data.name ?? "").trim();
  const phone = (data.phoneNumber ?? "").trim();
  const fullPhone = formatCompanyPhone(phone);
  const managerName = (data.managerName ?? "").trim();
  const description = (data.description ?? "").trim();

  if (!name) errors.name = "Kompaniya nomini kiriting!";
  if (!phone) errors.phoneNumber = "Telefon raqamni kiriting!";
  else if (!UZ_PHONE_REGEX.test(fullPhone))
    errors.phoneNumber = "Telefon raqam +998xxxxxxxxx formatda bo'lishi kerak!";
  if (!managerName) errors.managerName = "Boshqaruvchi ismini kiriting!";
  if (!description) errors.description = "Kompaniya uchun izoh yozing!";
  if (!data.permissions?.length)
    errors.permissions = "Kompaniya uchun ruxsatlarni belgilang!";

  return {
    errors,
    isValid: Object.values(errors).every((v) => v === null),
  };
}
