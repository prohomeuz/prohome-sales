import { formatPassportNumberDisplay } from "@/shared/lib/passport";

const NAME_REGEX = /^[\p{L}\p{M}'`\u2019\-\s]+$/u;
const PASSPORT_REGEX = /^[A-Z]{2}\s\d{7}$/;

function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "").trim())) return null;

  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function isFutureDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() > today.getTime();
}

function hasValidName(value) {
  return NAME_REGEX.test(String(value ?? "").trim());
}

/**
 * Sotish/bron formasi uchun client-side validatsiya.
 * @param {{
 *   actionCode: string,
 *   statusForm: object,
 *   phoneRegex: RegExp,
 *   minInstallments: number,
 *   maxInstallments: number,
 *   totalPriceSom?: number,
 * }} params
 * @returns {Record<string, string>}
 */
export function validateStatusFormFields({
  actionCode,
  statusForm,
  phoneRegex,
  minInstallments,
  maxInstallments,
  totalPriceSom = 0,
}) {
  const nextErrors = {};
  const firstName = String(statusForm.firstName ?? "").trim();
  const lastName = String(statusForm.lastName ?? "").trim();
  const middleName = String(statusForm.middleName ?? "").trim();
  const phone = String(statusForm.phone ?? "").replace(/[^\d+]/g, "");
  const installments = Number(String(statusForm.installments ?? "").replace(/\D/g, ""));
  const birthDate = parseIsoDate(statusForm.birthDate);
  const passportIssuedDate = parseIsoDate(statusForm.passportIssuedDate);
  const passportNumber = formatPassportNumberDisplay(statusForm.passportNumber);
  const address = String(statusForm.address ?? "").trim();
  const issuedBy = String(statusForm.passportIssuedBy ?? "").trim();
  const downPayment = Number(String(statusForm.downPayment ?? "").replace(/\D/g, "")) || 0;

  if (actionCode === "SOLD" || actionCode === "RESERVED") {
    if (!firstName) {
      nextErrors.firstName = "Mijoz ismini kiriting!";
    } else if (firstName.length < 2) {
      nextErrors.firstName = "Ism kamida 2 harfdan iborat bo'lsin!";
    } else if (!hasValidName(firstName)) {
      nextErrors.firstName = "Ismda faqat harflar bo'lsin!";
    }

    if (!lastName) {
      nextErrors.lastName = "Mijoz familiyasini kiriting!";
    } else if (lastName.length < 2) {
      nextErrors.lastName = "Familiya kamida 2 harfdan iborat bo'lsin!";
    } else if (!hasValidName(lastName)) {
      nextErrors.lastName = "Familiyada faqat harflar bo'lsin!";
    }

    if (middleName && !hasValidName(middleName)) {
      nextErrors.middleName = "Otasining ismida faqat harflar bo'lsin!";
    }

    if (!phone) {
      nextErrors.phone = "Telefon raqamini kiriting!";
    } else if (!phoneRegex.test(phone)) {
      nextErrors.phone = "Telefon +998xxxxxxxxx formatda bo'lsin!";
    }

    if (!String(statusForm.installments ?? "").trim()) {
      nextErrors.installments = "Muddatni kiriting!";
    } else if (!Number.isFinite(installments)) {
      nextErrors.installments = "Muddatni to'g'ri kiriting!";
    } else if (
      installments < minInstallments ||
      installments > maxInstallments
    ) {
      nextErrors.installments = `Muddat ${minInstallments}-${maxInstallments} oy oralig'ida bo'lsin!`;
    }

    if (totalPriceSom > 0 && downPayment > totalPriceSom) {
      nextErrors.downPayment =
        "Boshlang'ich to'lov umumiy summadan katta bo'lmasin!";
    }
  }

  if (actionCode === "SOLD") {
    if (!birthDate) {
      nextErrors.birthDate = "Tug'ilgan sanani to'g'ri kiriting!";
    } else if (isFutureDate(birthDate)) {
      nextErrors.birthDate = "Tug'ilgan sana kelajak bo'lmasin!";
    }

    if (!passportNumber) {
      nextErrors.passportNumber = "Passport raqamini kiriting!";
    } else if (!PASSPORT_REGEX.test(passportNumber)) {
      nextErrors.passportNumber = "Masalan: AC 2521090 ko'rinishida yozing!";
    }

    if (!issuedBy) {
      nextErrors.passportIssuedBy = "Kim tomonidan berilganini kiriting!";
    } else if (issuedBy.length < 8) {
      nextErrors.passportIssuedBy = "Ma'lumotni to'liqroq kiriting!";
    }

    if (!passportIssuedDate) {
      nextErrors.passportIssuedDate = "Passport berilgan sanani kiriting!";
    } else if (isFutureDate(passportIssuedDate)) {
      nextErrors.passportIssuedDate = "Berilgan sana kelajak bo'lmasin!";
    } else if (birthDate && passportIssuedDate < birthDate) {
      nextErrors.passportIssuedDate =
        "Berilgan sana tug'ilgan sanadan oldin bo'lmaydi!";
    }

    if (!address) {
      nextErrors.address = "Manzilni kiriting!";
    } else if (address.length < 10) {
      nextErrors.address = "Manzilni to'liqroq yozing!";
    }
  }

  if (actionCode === "NOT" && !String(statusForm.description ?? "").trim()) {
    nextErrors.description = "Nima uchun sotuv to'xtatilganini yozing!";
  }

  return nextErrors;
}
