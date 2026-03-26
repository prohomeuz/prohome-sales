/**
 * @file Sotuv shartnomasi template ma'lumotlarini tayyorlash helpers.
 * @module features/contracts/lib/sales-contract-data
 */

const UZ_MONTHS = [
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

const UZ_SMALL = [
  "",
  "bir",
  "ikki",
  "uch",
  "to'rt",
  "besh",
  "olti",
  "yetti",
  "sakkiz",
  "to'qqiz",
];

const UZ_TENS = [
  "",
  "o'n",
  "yigirma",
  "o'ttiz",
  "qirq",
  "ellik",
  "oltmish",
  "yetmish",
  "sakson",
  "to'qson",
];

const UZ_SCALES = ["", "ming", "million", "milliard", "trillion"];

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roundMoney(value, fractionDigits = 2) {
  const factor = 10 ** fractionDigits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function formatSpaceNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";

  return numeric
    .toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/,/g, " ");
}

function formatUsdNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";

  const rounded = roundMoney(numeric, 2);
  const isInteger = Math.abs(rounded - Math.round(rounded)) < 0.000001;

  return rounded
    .toLocaleString("en-US", {
      minimumFractionDigits: isInteger ? 0 : 1,
      maximumFractionDigits: isInteger ? 0 : 2,
    })
    .replace(/,/g, " ");
}

function formatArea(value) {
  const numeric = roundMoney(Number(value) || 0, 2);
  return String(numeric).replace(/\.00$/, "");
}

function formatContractDateText(date) {
  return `${date.getFullYear()} yil "${String(date.getDate()).padStart(2, "0")}" ${
    UZ_MONTHS[date.getMonth()] ?? ""
  }`;
}

function formatChineseDateTop(date) {
  return `${date.getFullYear()}年 ${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}月 ${String(date.getDate()).padStart(2, "0")}日         马尔吉兰市`;
}

function formatChineseDateBottom(date) {
  return `${date.getFullYear()}年 ${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}月 ${String(date.getDate()).padStart(2, "0")}日`;
}

function formatScheduleDate(date) {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join(".");
}

function addMonths(date, count) {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + count);
  return next;
}

function spellUnderThousand(value) {
  const number = Number(value) || 0;
  const parts = [];
  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const ones = number % 10;

  if (hundreds > 0) {
    parts.push(`${UZ_SMALL[hundreds]} yuz`.trim());
  }
  if (tens > 0) {
    parts.push(UZ_TENS[tens]);
  }
  if (ones > 0) {
    parts.push(UZ_SMALL[ones]);
  }

  return parts.join(" ").trim();
}

function numberToUzWords(value) {
  const number = Math.floor(Number(value) || 0);
  if (number <= 0) return "nol";

  const groups = [];
  let current = number;
  let scaleIndex = 0;

  while (current > 0) {
    const chunk = current % 1000;
    if (chunk > 0) {
      const words = spellUnderThousand(chunk);
      const scale = UZ_SCALES[scaleIndex];
      groups.unshift([words, scale].filter(Boolean).join(" "));
    }
    current = Math.floor(current / 1000);
    scaleIndex += 1;
  }

  const result = groups.join(" ").trim();
  return result ? result.charAt(0).toUpperCase() + result.slice(1) : "";
}

function extractPrimaryNumber(value) {
  return String(value ?? "").match(/\d+/)?.[0] ?? sanitizeText(value);
}

function normalizeBlockLabel(block) {
  const numeric = extractPrimaryNumber(block);
  return numeric ? `${numeric}-blok` : sanitizeText(block);
}

function resolvePropertyType(home) {
  const raw =
    home?.propertyType ??
    home?.type ??
    home?.category ??
    home?.purpose ??
    home?.realEstateType ??
    "";
  const normalized = String(raw).toLowerCase();

  if (/(tijorat|commercial|noturar|office|shop|commerce)/.test(normalized)) {
    return {
      uz: "tijorat",
      cn: "商业",
    };
  }

  return {
    uz: "turar-joy",
    cn: "住宅",
  };
}

function buildPaymentSchedule(
  remainingAmount,
  installments,
  contractDate,
  monthlyPaymentSom,
) {
  const rowCount = Math.max(1, Number(installments) || 1);
  const rows = [];
  const preferredPayment = Math.max(0, Math.round(Number(monthlyPaymentSom) || 0));
  let balance = Math.max(Math.round(Number(remainingAmount) || 0), 0);

  for (let index = 0; index < rowCount; index += 1) {
    let payment;

    if (index === rowCount - 1) {
      payment = balance;
    } else if (preferredPayment > 0) {
      payment = Math.min(preferredPayment, balance);
    } else {
      payment = Math.floor(balance / Math.max(rowCount - index, 1));
    }

    balance = Math.max(balance - payment, 0);
    rows.push({
      number: index + 2,
      date: formatScheduleDate(addMonths(contractDate, index)),
      payment: formatSpaceNumber(payment),
      balance: formatSpaceNumber(balance),
    });
  }

  return rows;
}

/**
 * Word template uchun dinamik ma'lumotlarni tayyorlaydi.
 * @param {{
 *   home: object,
 *   form: object,
 *   contractNumber: string,
 *   contractDate?: Date,
 *   currencyRate: number,
 *   resolvedPriceUsd: number,
 *   resolvedSize: number,
 *   monthlyPaymentSom?: number,
 * }} params
 * @returns {object}
 */
export function buildSalesContractTemplateData({
  home,
  form,
  contractNumber,
  contractDate = new Date(),
  currencyRate,
  resolvedPriceUsd,
  resolvedSize,
  monthlyPaymentSom = 0,
}) {
  const size = Number(resolvedSize ?? home?.size ?? 0);
  const pricePerMeterUsd = roundMoney(Number(resolvedPriceUsd ?? home?.price ?? 0), 2);
  const totalUsdRaw = roundMoney(pricePerMeterUsd * size, 2);
  const totalUsdWords = numberToUzWords(Math.round(totalUsdRaw));
  const totalUsdLabel = formatUsdNumber(totalUsdRaw);
  const pricePerMeterUsdLabel = formatUsdNumber(pricePerMeterUsd);
  const totalSom = Math.round(totalUsdRaw * Number(currencyRate || 0));
  const pricePerMeterSom = Math.round(pricePerMeterUsd * Number(currencyRate || 0));
  const downPaymentSom = Number(digitsOnly(form.downPayment)) || 0;
  const remainingSom = Math.max(totalSom - downPaymentSom, 0);
  const installments = Math.max(1, Number(digitsOnly(form.installments)) || 1);
  const shortName = [form.lastName, form.firstName].filter(Boolean).join(" ").trim();
  const fullName = [form.lastName, form.firstName, form.middleName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const propertyType = resolvePropertyType(home);
  const blockNumber = extractPrimaryNumber(home?.block);
  const blockLabel = normalizeBlockLabel(home?.block);
  const floorNumber = extractPrimaryNumber(home?.floorNumber);
  const houseNumber = extractPrimaryNumber(home?.houseNumber);
  const roomCount = extractPrimaryNumber(home?.room);
  const sizeLabel = formatArea(size);

  return {
    contractNumber: sanitizeText(contractNumber),
    contractDateIso: contractDate.toISOString(),
    contractDateText: formatContractDateText(contractDate),
    contractChineseDateTop: formatChineseDateTop(contractDate),
    contractChineseDateBottom: formatChineseDateBottom(contractDate),
    shortName: sanitizeText(shortName),
    fullName: sanitizeText(fullName || shortName),
    birthDate: sanitizeText(form.birthDate),
    passportNumber: sanitizeText(form.passportNumber),
    passportIssuedBy: sanitizeText(form.passportIssuedBy),
    passportIssuedDate: sanitizeText(form.passportIssuedDate),
    phone: sanitizeText(form.phone),
    address: sanitizeText(form.address),
    blockNumber: sanitizeText(blockNumber),
    blockLabel: sanitizeText(blockLabel),
    floorNumber: sanitizeText(floorNumber),
    houseNumber: sanitizeText(houseNumber),
    roomCount: sanitizeText(roomCount),
    sizeLabel: sanitizeText(sizeLabel),
    propertyTypeUz: propertyType.uz,
    propertyTypeCn: propertyType.cn,
    propertyDescriptionUz: `${blockLabel} -sonli uyi, ${floorNumber} - qavati, ${houseNumber} - xonasi, ${roomCount}- xonali maydoni ${sizeLabel}  kvadrat metr bo'lgan (${propertyType.uz}) birlik`,
    propertyDescriptionCn: `${blockNumber}号楼 ${houseNumber} 单元 ${floorNumber} 层 ${roomCount} 房间，面积为 ${sizeLabel} 平方米的 ${propertyType.cn} 单元（以下简称“标的物”）的所有权转移给乙方。`,
    pricePerMeterUsdLabel,
    pricePerMeterSomLabel: formatSpaceNumber(pricePerMeterSom),
    totalUsdLabel,
    totalUsdWords,
    totalSomLabel: formatSpaceNumber(totalSom),
    downPaymentLabel: formatSpaceNumber(downPaymentSom),
    remainingAmountLabel: formatSpaceNumber(remainingSom),
    installments,
    schedule: buildPaymentSchedule(
      remainingSom,
      installments,
      contractDate,
      monthlyPaymentSom,
    ),
  };
}
