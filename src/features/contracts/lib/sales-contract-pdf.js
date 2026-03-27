import { formatNumber } from "@/shared/lib/utils";

const TEMPLATE_PDF_URL = "/contracts/sales-contract-template.pdf";
const PAGE_OBJECTS = {
  5: 5,
  6: 6,
  7: 7,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
};
const ROW_Y_PAGE_16 = [
  595.85, 577.61, 559.13, 540.86, 522.62, 504.14, 485.9, 467.66, 449.4,
  430.92, 412.68, 394.44, 375.94, 357.7, 339.46, 320.98, 302.74, 284.47,
  265.99, 247.75, 229.51, 211.01, 192.77, 174.53, 156.29, 137.81, 119.54,
  101.3, 82.824,
];
const ROW_Y_PAGE_17 = [
  675.55, 657.31, 639.07, 620.57, 602.33, 584.09, 565.61, 547.34, 529.1,
  510.62, 492.38, 474.14, 455.64, 437.4, 419.16, 400.92, 382.44, 364.18,
  345.94, 327.46, 309.22, 290.95, 272.47, 254.23, 235.99, 217.51, 199.25,
  181.01, 162.53, 144.29, 126.02,
];
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
const CMAP_F3 = String.raw`/CIDInit /ProcSet findresource begin
33 dict begin
begincmap
/CIDSystemInfo
<< /Registry (Adobe)
/Ordering (UCS)
/Supplement 0
>> def
/CMapName /Adobe-Identity-UCS def
/CMapType 2 def
1 begincodespacerange
<0000> <FFFF>
endcodespacerange
2 beginbfrange
<0003> <0004> [<0020> <0041>]
<0011> <0012> <0042>
endbfrange
2 beginbfchar
<0018> <0044>
<001C> <0045>
endbfchar
1 beginbfrange
<0026> <0027> <0046>
endbfrange
5 beginbfchar
<002C> <0048>
<002F> <0049>
<003A> <004A>
<003C> <004B>
<003E> <004C>
endbfchar
1 beginbfrange
<0044> <0045> <004D>
endbfrange
2 beginbfchar
<004B> <004F>
<0057> <0050>
endbfchar
1 beginbfrange
<0059> <005A> <0051>
endbfrange
3 beginbfchar
<005E> <0053>
<0064> <0054>
<0068> <0055>
endbfchar
2 beginbfrange
<0073> <0074> <0056>
<0079> <007A> <0058>
endbfrange
1 beginbfchar
<0102> <0061>
endbfchar
1 beginbfrange
<010F> <0110> <0062>
endbfrange
9 beginbfchar
<011A> <0064>
<011E> <0065>
<0128> <0066>
<0150> <0067>
<015A> <0068>
<015D> <0069>
<0169> <006A>
<016C> <006B>
<016F> <006C>
endbfchar
1 beginbfrange
<0175> <0176> <006D>
endbfrange
2 beginbfchar
<017D> <006F>
<0189> <0070>
endbfchar
1 beginbfrange
<018B> <018C> <0071>
endbfrange
4 beginbfchar
<0190> <0073>
<019A> <0074>
<01B5> <0075>
<01C0> <0076>
endbfchar
1 beginbfrange
<01C6> <01C7> <0078>
endbfrange
2 beginbfchar
<01CC> <007A>
<01ED> <0060>
endbfchar
4 beginbfrange
<0355> <0358> [<002C> <003B> <003A> <002E>]
<035A> <035B> <2018>
<035E> <035F> <201C>
<0368> <0369> [<00AB> <00BB>]
endbfrange
2 beginbfchar
<036C> <002F>
<0372> <002D>
endbfchar
2 beginbfrange
<037E> <037F> <0028>
<0396> <0397> [<0027> <0022>]
endbfrange
2 beginbfchar
<03A8> <0024>
<03B6> <2116>
endbfchar
1 beginbfrange
<03EC> <03F5> <0030>
endbfrange
1 beginbfchar
<0439> <0025>
endbfchar
endcmap
CMapName currentdict /CMap defineresource pop
end
end`;
const CMAP_F5 = String.raw`/CIDInit /ProcSet findresource begin
35 dict begin
begincmap
/CIDSystemInfo
<< /Registry (Adobe)
/Ordering (UCS)
/Supplement 0
>> def
/CMapName /Adobe-Identity-UCS def
/CMapType 2 def
1 begincodespacerange
<0000> <FFFF>
endcodespacerange
2 beginbfrange
<0003> <0004> [<0020> <0041>]
<0011> <0012> <0042>
endbfrange
2 beginbfchar
<0018> <0044>
<001C> <0045>
endbfchar
1 beginbfrange
<0026> <0027> <0046>
endbfrange
4 beginbfchar
<002C> <0048>
<002F> <0049>
<003A> <004A>
<003E> <004C>
endbfchar
1 beginbfrange
<0044> <0045> <004D>
endbfrange
2 beginbfchar
<004B> <004F>
<0057> <0050>
endbfchar
1 beginbfrange
<0059> <005A> <0051>
endbfrange
3 beginbfchar
<005E> <0053>
<0064> <0054>
<0068> <0055>
endbfchar
1 beginbfrange
<0073> <0074> <0056>
endbfrange
2 beginbfchar
<007A> <0059>
<0102> <0061>
endbfchar
1 beginbfrange
<010F> <0110> <0062>
endbfrange
9 beginbfchar
<011A> <0064>
<011E> <0065>
<0128> <0066>
<0150> <0067>
<015A> <0068>
<015D> <0069>
<0169> <006A>
<016C> <006B>
<016F> <006C>
endbfchar
1 beginbfrange
<0175> <0176> <006D>
endbfrange
2 beginbfchar
<017D> <006F>
<0189> <0070>
endbfchar
1 beginbfrange
<018B> <018C> <0071>
endbfrange
4 beginbfchar
<0190> <0073>
<019A> <0074>
<01B5> <0075>
<01C0> <0076>
endbfchar
1 beginbfrange
<01C6> <01C7> <0078>
endbfrange
3 beginbfchar
<01CC> <007A>
<02A4> <0410>
<02AB> <0415>
endbfchar
1 beginbfrange
<02B0> <02B1> <0418>
endbfrange
5 beginbfchar
<02B6> <041A>
<02B8> <041B>
<02BA> <041C>
<02BF> <041F>
<02C1> <0421>
endbfchar
1 beginbfrange
<02C3> <02C4> <0422>
endbfrange
9 beginbfchar
<02C5> <040E>
<02C7> <0424>
<02CB> <0427>
<030C> <0430>
<0310> <0433>
<0326> <043D>
<0328> <043E>
<032C> <0440>
<0355> <002C>
endbfchar
2 beginbfrange
<0357> <0358> [<003A> <002E>]
<035A> <035B> <2018>
endbfrange
1 beginbfchar
<0372> <002D>
endbfchar
3 beginbfrange
<037E> <037F> <0028>
<0396> <0397> [<0027> <0022>]
<03EC> <03F5> <0030>
endbfrange
2 beginbfchar
<043D> <002B>
<0C62> <049A>
endbfchar
endcmap
CMapName currentdict /CMap defineresource pop
end
end`;
const CMAP_F8 = String.raw`/CIDInit /ProcSet findresource begin
14 dict begin
begincmap
/CIDSystemInfo
<< /Registry (Adobe)
/Ordering (UCS)
/Supplement 0
>> def
/CMapName /Adobe-Identity-UCS def
/CMapType 2 def
1 begincodespacerange
<0000> <FFFF>
endcodespacerange
3 beginbfchar
<0003> <0020>
<0005> <0022>
<0011> <002E>
endbfchar
3 beginbfrange
<0013> <0018> <0030>
<001B> <001C> <0038>
<0025> <0028> <0042>
endbfrange
7 beginbfchar
<002B> <0048>
<002D> <004A>
<0030> <004D>
<0032> <004F>
<0038> <0055>
<003A> <0057>
<0044> <0061>
endbfchar
4 beginbfrange
<0047> <004D> <0064>
<004F> <0059> <006C>
<005B> <005C> <0078>
<00B5> <00B6> <2018>
endbfrange
1 beginbfchar
<028B> <2116>
endbfchar
endcmap
CMapName currentdict /CMap defineresource pop
end
end`;

const FONT_REVERSE_MAPS = {
  F3: buildReverseMap(CMAP_F3),
  F5: buildReverseMap(CMAP_F5),
  F8: buildReverseMap(CMAP_F8),
};

let templateBytesPromise = null;
let measureContext = null;

function buildReverseMap(cmapSource) {
  const direct = new Map();
  const lines = cmapSource.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    let match = line.match(/^(\d+)\s+beginbfchar$/);

    if (match) {
      const count = Number(match[1]);
      for (let cursor = 0; cursor < count; cursor += 1) {
        const entry = lines[index + 1 + cursor]
          ?.trim()
          .match(/^<([0-9A-F]+)>\s+<([0-9A-F]+)>$/i);
        if (!entry) continue;
        direct.set(
          String.fromCodePoint(parseInt(entry[2], 16)),
          entry[1].toUpperCase(),
        );
      }
      index += count;
      continue;
    }

    match = line.match(/^(\d+)\s+beginbfrange$/);
    if (!match) continue;

    const count = Number(match[1]);
    for (let cursor = 0; cursor < count; cursor += 1) {
      const entry = lines[index + 1 + cursor]?.trim() ?? "";
      let range = entry.match(
        /^<([0-9A-F]+)>\s+<([0-9A-F]+)>\s+<([0-9A-F]+)>$/i,
      );

      if (range) {
        const start = parseInt(range[1], 16);
        const end = parseInt(range[2], 16);
        const dest = parseInt(range[3], 16);

        for (let code = start; code <= end; code += 1) {
          const source = code.toString(16).toUpperCase().padStart(4, "0");
          const target = String.fromCodePoint(dest + (code - start));
          if (!direct.has(target)) {
            direct.set(target, source);
          }
        }
        continue;
      }

      range = entry.match(
        /^<([0-9A-F]+)>\s+<([0-9A-F]+)>\s+\[(.+)\]$/i,
      );
      if (!range) continue;

      const start = parseInt(range[1], 16);
      const targets = [...range[3].matchAll(/<([0-9A-F]+)>/gi)].map((item) =>
        String.fromCodePoint(parseInt(item[1], 16)),
      );

      targets.forEach((target, offset) => {
        const source = (start + offset)
          .toString(16)
          .toUpperCase()
          .padStart(4, "0");
        if (!direct.has(target)) {
          direct.set(target, source);
        }
      });
    }

    index += count;
  }

  return direct;
}

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roundMoney(value, fractionDigits = 2) {
  const factor = 10 ** fractionDigits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
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

function normalizeBlockLabel(block) {
  const raw = sanitizeText(block);
  if (!raw) return "";

  const numeric = raw.match(/\d+/)?.[0];
  if (numeric) return `${numeric}-blok`;

  const normalized = raw.replace(/blok/gi, "").replace(/-/g, " ").trim();
  return normalized ? `${normalized}-blok` : raw;
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
    return "tijorat";
  }

  return "turar-joy";
}

function getMeasureContext() {
  if (!measureContext) {
    measureContext = document.createElement("canvas").getContext("2d");
  }
  return measureContext;
}

function measureTextWidth(text, fontFamily, fontSize, weight = 400) {
  const context = getMeasureContext();
  context.font = `${weight} ${fontSize}px "${fontFamily}", sans-serif`;
  return context.measureText(sanitizeText(text)).width;
}

function wrapText(text, maxWidth, fontFamily, fontSize, weight = 400) {
  const normalized = sanitizeText(text);
  if (!normalized) return [""];

  const words = normalized.split(" ");
  const lines = [];
  let line = words.shift() ?? "";

  words.forEach((word) => {
    const candidate = `${line} ${word}`.trim();
    if (measureTextWidth(candidate, fontFamily, fontSize, weight) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function fitTextAcrossLineSpecs(
  text,
  lineSpecs,
  fontFamily,
  fontSize,
  weight = 400,
) {
  const words = sanitizeText(text).split(" ").filter(Boolean);
  const lines = [];
  let cursor = 0;
  let overflow = false;

  lineSpecs.forEach((spec, index) => {
    if (!words.length) {
      lines.push("");
      return;
    }

    let line = "";
    while (cursor < words.length) {
      const candidate = line ? `${line} ${words[cursor]}` : words[cursor];
      const width = measureTextWidth(candidate, fontFamily, fontSize, weight);
      if (line && width > spec.maxWidth) break;
      line = candidate;
      cursor += 1;
      if (width > spec.maxWidth) break;
    }

    if (!line && cursor < words.length) {
      line = words[cursor];
      cursor += 1;
    }

    if (index === lineSpecs.length - 1 && cursor < words.length) {
      const remainder = words.slice(cursor).join(" ");
      line = [line, remainder].filter(Boolean).join(" ").trim();
      cursor = words.length;
    }

    if (
      measureTextWidth(line, fontFamily, fontSize, weight) >
      spec.maxWidth + 0.5
    ) {
      overflow = true;
    }

    lines.push(line);
  });

  if (cursor < words.length) {
    overflow = true;
  }

  return { lines, overflow };
}

function resolveLineSpecLayout({
  text,
  lineSpecs,
  fontKey,
  fontSize,
  minFontSize = 8.75,
}) {
  const { family, weight } = fontConfig(fontKey);
  let currentFontSize = fontSize;
  let best = { lines: lineSpecs.map(() => ""), fontSize };

  while (currentFontSize >= minFontSize) {
    const candidate = fitTextAcrossLineSpecs(
      text,
      lineSpecs,
      family,
      currentFontSize,
      weight,
    );

    best = {
      lines: candidate.lines,
      fontSize: currentFontSize,
    };

    if (!candidate.overflow) {
      return best;
    }

    currentFontSize = Math.round((currentFontSize - 0.25) * 100) / 100;
  }

  return best;
}

function resolveParagraphLayout({
  text,
  maxWidth,
  fontKey,
  fontSize,
  lineHeight,
  boxHeight,
  minFontSize = 8.75,
}) {
  const { family, weight } = fontConfig(fontKey);
  let currentFontSize = fontSize;
  let best = {
    lines: [sanitizeText(text)],
    fontSize,
    lineHeight,
  };

  while (currentFontSize >= minFontSize) {
    const scale = currentFontSize / fontSize;
    const candidateLineHeight = lineHeight * scale;
    const candidateLines = wrapText(
      text,
      maxWidth,
      family,
      currentFontSize,
      weight,
    );
    const requiredHeight =
      (candidateLines.length - 1) * candidateLineHeight + currentFontSize + 4;

    best = {
      lines: candidateLines,
      fontSize: currentFontSize,
      lineHeight: candidateLineHeight,
    };

    if (requiredHeight <= boxHeight) {
      return best;
    }

    currentFontSize = Math.round((currentFontSize - 0.25) * 100) / 100;
  }

  return best;
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
      payment,
      balance,
    });
  }

  return rows;
}

function buildContractData({
  home,
  form,
  contractNumber,
  contractDate,
  currencyRate,
  resolvedPriceUsd,
  resolvedSize,
  monthlyPaymentSom,
}) {
  const size = Number(resolvedSize ?? home?.size ?? 0);
  const pricePerMeterUsd = roundMoney(Number(resolvedPriceUsd ?? home?.price ?? 0), 2);
  const totalUsd = roundMoney(pricePerMeterUsd * size, 2);
  const totalSom = Math.round(totalUsd * currencyRate);
  const downPaymentSom = Number(digitsOnly(form.downPayment)) || 0;
  const remainingSom = Math.max(totalSom - downPaymentSom, 0);
  const installments = Math.max(1, Number(digitsOnly(form.installments)) || 1);
  const shortName = [form.lastName, form.firstName].filter(Boolean).join(" ").trim();
  const fullName = [form.lastName, form.firstName, form.middleName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    contractNumber,
    contractDate,
    contractDateText: formatContractDateText(contractDate),
    contractChineseYear: String(contractDate.getFullYear()),
    contractChineseMonth: String(contractDate.getMonth() + 1).padStart(2, "0"),
    contractChineseDay: String(contractDate.getDate()).padStart(2, "0"),
    shortName: sanitizeText(shortName),
    fullName: sanitizeText(fullName || shortName),
    birthDate: sanitizeText(form.birthDate),
    passportNumber: sanitizeText(form.passportNumber),
    passportIssuedBy: sanitizeText(form.passportIssuedBy),
    passportIssuedDate: sanitizeText(form.passportIssuedDate),
    phone: sanitizeText(form.phone),
    address: sanitizeText(form.address),
    blockLabel: normalizeBlockLabel(home?.block),
    floorLabel: String(home?.floorNumber ?? ""),
    houseNumber: String(home?.houseNumber ?? ""),
    roomCount: String(home?.room ?? ""),
    sizeLabel: formatArea(size),
    propertyTypeUz: resolvePropertyType(home),
    pricePerMeterUsdLabel: formatUsdNumber(pricePerMeterUsd),
    totalUsdLabel: formatUsdNumber(totalUsd),
    totalUsdWords: numberToUzWords(totalUsd),
    totalSomLabel: formatNumber(totalSom),
    downPaymentLabel: formatNumber(downPaymentSom),
    remainingAmountLabel: formatNumber(remainingSom),
    installments,
    schedule: buildPaymentSchedule(
      remainingSom,
      installments,
      contractDate,
      monthlyPaymentSom,
    ),
  };
}

function fontConfig(fontKey) {
  switch (fontKey) {
    case "F11":
      return { family: "Times New Roman", weight: 700 };
    case "F12":
      return { family: "Times New Roman", weight: 400 };
    case "F5":
      return { family: "Calibri", weight: 700 };
    case "F8":
      return { family: "Times New Roman", weight: 700 };
    default:
      return { family: "Calibri", weight: 400 };
  }
}

function normalizeEncodableText(text) {
  return sanitizeText(text)
    .replace(/[–—]/g, "-")
    .replace(/[ʻ]/g, "'");
}

function encodePdfHexText(text, fontKey) {
  const reverseMap = FONT_REVERSE_MAPS[fontKey];
  const normalized = normalizeEncodableText(text);
  let encoded = "";

  for (const char of normalized) {
    const code =
      reverseMap?.get(char) ??
      reverseMap?.get(char.toUpperCase()) ??
      reverseMap?.get(char.toLowerCase()) ??
      reverseMap?.get(" ");
    if (!code) continue;
    encoded += code;
  }

  return `<${encoded}>`;
}

function formatNumberToken(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return String(Math.round(numeric * 1000) / 1000).replace(/\.0+$/, "");
}

function createOverlayBuilder() {
  const operations = [];

  function coverRect(x, y, width, height) {
    operations.push(
      `q 1 1 1 rg ${formatNumberToken(x)} ${formatNumberToken(y)} ${formatNumberToken(width)} ${formatNumberToken(height)} re f Q`,
    );
  }

  function drawText({
    fontKey,
    fontSize,
    x,
    y,
    text,
    charSpacing = null,
  }) {
    operations.push("BT");
    operations.push(`/${fontKey} ${formatNumberToken(fontSize)} Tf`);
    operations.push(`${formatNumberToken(x)} ${formatNumberToken(y)} Td`);
    operations.push("0 g");
    operations.push("0 G");
    if (charSpacing !== null) {
      operations.push(`${formatNumberToken(charSpacing)} Tc`);
    }
    operations.push(`[${encodePdfHexText(text, fontKey)}] TJ`);
    operations.push("ET");
  }

  function coverAndDrawLine({
    fontKey,
    fontSize,
    x,
    y,
    text,
    width = null,
    paddingX = 2,
    paddingY = 3,
  }) {
    const { family, weight } = fontConfig(fontKey);
    const measuredWidth =
      width ??
      Math.max(
        measureTextWidth(text, family, fontSize, weight) + paddingX * 2,
        12,
      );
    coverRect(
      x - paddingX,
      y - paddingY,
      measuredWidth,
      fontSize + paddingY * 2 + 2,
    );
    drawText({ fontKey, fontSize, x, y, text });
  }

  function coverWrappedParagraph({
    x,
    y,
    maxWidth,
    fontKey,
    fontSize,
    text,
    lineHeight,
    boxWidth,
    boxHeight,
    minFontSize = 8.75,
  }) {
    coverRect(x - 4, y - boxHeight + 8, boxWidth, boxHeight);
    const layout = resolveParagraphLayout({
      text,
      maxWidth,
      fontKey,
      fontSize,
      lineHeight,
      boxHeight: boxHeight - 8,
      minFontSize,
    });

    layout.lines.forEach((line, index) => {
      drawText({
        fontKey,
        fontSize: layout.fontSize,
        x,
        y: y - index * layout.lineHeight,
        text: line,
      });
    });
  }

  function coverWrappedLines({
    lineSpecs,
    fontKey,
    fontSize,
    text,
    paddingX = 2,
    paddingY = 3,
    minFontSize = 8.75,
  }) {
    const layout = resolveLineSpecLayout({
      text,
      lineSpecs,
      fontKey,
      fontSize,
      minFontSize,
    });

    lineSpecs.forEach((spec, index) => {
      coverRect(
        spec.coverX ?? spec.x - paddingX,
        spec.coverY ?? spec.y - paddingY,
        spec.coverWidth ?? spec.maxWidth + paddingX * 2,
        spec.coverHeight ?? layout.fontSize + paddingY * 2 + 2,
      );

      if (!layout.lines[index]) return;
      drawText({
        fontKey,
        fontSize: layout.fontSize,
        x: spec.x,
        y: spec.y,
        text: layout.lines[index],
      });
    });
  }

  return {
    coverRect,
    drawText,
    coverAndDrawLine,
    coverWrappedParagraph,
    coverWrappedLines,
    build() {
      return operations.join("\n");
    },
  };
}

function buildPage5Overlay(data) {
  const overlay = createOverlayBuilder();

  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 9.12,
    x: 202.39,
    y: 729.58,
    width: 56,
    text: data.contractNumber,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 10.08,
    x: 63,
    y: 694.75,
    width: 28,
    text: data.contractChineseYear,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 10.08,
    x: 103,
    y: 694.75,
    width: 16,
    text: data.contractChineseMonth,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 10.08,
    x: 133,
    y: 694.75,
    width: 16,
    text: data.contractChineseDay,
  });

  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 10.56,
    x: 447.77,
    y: 705.31,
    width: 78,
    text: data.contractNumber,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 10.08,
    x: 308.52,
    y: 661.39,
    width: 170,
    text: data.contractDateText,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 12,
    x: 373.1,
    y: 456.12,
    width: 206,
    text: data.shortName,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 12,
    x: 394.94,
    y: 431.16,
    width: 74,
    text: data.birthDate,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 12,
    x: 398.54,
    y: 405.96,
    width: 114,
    text: data.passportNumber,
  });
  overlay.coverWrappedLines({
    fontKey: "F5",
    fontSize: 12,
    text: data.passportIssuedBy,
    lineSpecs: [
      { x: 451.61, y: 380.98, maxWidth: 118, coverX: 446, coverWidth: 124 },
      { x: 308.52, y: 356.02, maxWidth: 248, coverX: 305, coverWidth: 252 },
    ],
    minFontSize: 10.75,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 12,
    x: 385.34,
    y: 331.06,
    width: 74,
    text: data.passportIssuedDate,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 12,
    x: 349.58,
    y: 281.11,
    width: 208,
    text: data.phone,
  });
  overlay.coverWrappedLines({
    fontKey: "F5",
    fontSize: 10.56,
    text: data.address,
    lineSpecs: [
      { x: 359.18, y: 266.23, maxWidth: 198, coverX: 353, coverWidth: 214 },
      { x: 308.52, y: 253.51, maxWidth: 248, coverX: 305, coverWidth: 252 },
    ],
    minFontSize: 9.5,
  });

  return overlay.build();
}

function buildPage6Overlay(data) {
  const overlay = createOverlayBuilder();
  const propertyText = `"MARG'ILON - CHINA CITY" turar - joy majmuasining ${data.blockLabel} -sonli uyi, ${data.floorLabel} - qavati, ${data.houseNumber} - xonasi, ${data.roomCount} - xonali maydoni ${data.sizeLabel} kvadrat metr bo'lgan (${data.propertyTypeUz}) birlik (bundan buyon "Shartnoma obyekti" deb ataladi) ustidan mulk huquqini Ikkinchi tomonga o'tkazadi.`;

  overlay.coverWrappedParagraph({
    x: 308.52,
    y: 232.15,
    maxWidth: 235,
    fontKey: "F3",
    fontSize: 11.25,
    text: propertyText,
    lineHeight: 19.2,
    boxWidth: 248,
    boxHeight: 126,
    minFontSize: 9.75,
  });

  return overlay.build();
}

function buildPage7Overlay(data) {
  const overlay = createOverlayBuilder();
  const priceText = `2.1.Ikkinchi tomon har bir kvadrat metr uchun ${data.pricePerMeterUsdLabel} (AQSh dollari) miqdorida narxni qabul qiladi,to'lov kuni valyuta kursiga muvofiq tenglashtiriladi; umumiy to'lov ${data.totalUsdLabel} (${data.totalUsdWords}) (AQSh dollari) miqdorida bo'ladi, to'lov kuni valyuta kursiga muvofiq tenglashtiriladi; Ikkinchi tomon investitsiya mablag'ini bank o'tkazmasi yoki naqd pul orqali to'lashi mumkin.`;

  overlay.coverWrappedParagraph({
    x: 308.52,
    y: 311.14,
    maxWidth: 235,
    fontKey: "F3",
    fontSize: 11.25,
    text: priceText,
    lineHeight: 18.2,
    boxWidth: 248,
    boxHeight: 182,
    minFontSize: 9.5,
  });

  return overlay.build();
}

function buildPage15Overlay(data) {
  const overlay = createOverlayBuilder();

  overlay.coverWrappedLines({
    fontKey: "F5",
    fontSize: 12,
    text: data.fullName,
    lineSpecs: [
      { x: 464.57, y: 591.77, maxWidth: 92, coverWidth: 98 },
      { x: 308.52, y: 562.49, maxWidth: 245, coverWidth: 248 },
    ],
    minFontSize: 10.75,
  });
  overlay.coverWrappedLines({
    fontKey: "F5",
    fontSize: 12,
    text: data.address,
    lineSpecs: [
      { x: 396.14, y: 451.08, maxWidth: 156, coverX: 389, coverWidth: 171 },
      { x: 308.52, y: 422.04, maxWidth: 248, coverX: 305, coverWidth: 252 },
    ],
    minFontSize: 10.5,
  });
  overlay.coverAndDrawLine({
    fontKey: "F5",
    fontSize: 12,
    x: 405.02,
    y: 347.86,
    width: 150,
    text: data.contractDateText,
  });

  return overlay.build();
}

function drawScheduleSummary(overlay, data, baseY) {
  overlay.coverAndDrawLine({
    fontKey: "F8",
    fontSize: 9.12,
    x: 316.2,
    y: baseY,
    width: 82,
    paddingY: 1,
    text: data.totalSomLabel,
  });
  overlay.coverAndDrawLine({
    fontKey: "F8",
    fontSize: 9.12,
    x: 316.2,
    y: baseY - 19.68,
    width: 82,
    paddingY: 1,
    text: data.downPaymentLabel,
  });
  overlay.coverAndDrawLine({
    fontKey: "F8",
    fontSize: 9.12,
    x: 316.2,
    y: baseY - 39.14,
    width: 82,
    paddingY: 1,
    text: data.remainingAmountLabel,
  });
}

function drawScheduleRows(overlay, rows, rowYs) {
  rowYs.forEach((y, index) => {
    const row = rows[index];

    overlay.coverRect(62.2, y - 0.6, 12.5, 9.4);
    overlay.coverRect(180.4, y - 0.6, 66, 9.4);
    overlay.coverRect(370.8, y - 0.6, 36, 9.4);
    overlay.coverRect(472.4, y - 0.6, 46, 9.4);

    if (!row) return;

    overlay.drawText({
      fontKey: "F3",
      fontSize: 7.92,
      x: 68.184,
      y,
      text: String(row.number),
    });
    overlay.drawText({
      fontKey: "F3",
      fontSize: 7.92,
      x: 181.51,
      y,
      text: row.date,
    });
    overlay.drawText({
      fontKey: "F3",
      fontSize: 7.92,
      x: 374.54,
      y,
      text: formatNumber(row.payment),
    });
    overlay.drawText({
      fontKey: "F3",
      fontSize: 7.92,
      x: 474.19,
      y,
      text: row.balance > 0 ? formatNumber(row.balance) : "0",
    });
  });
}

function buildPage16Overlay(data) {
  const overlay = createOverlayBuilder();
  const title = `${data.fullName} bilan ${data.contractDateText}da tuzilgan ${data.contractNumber}-sonli shartnomaning to'lov muddati grafigi`;
  const pageRows = data.schedule.slice(0, ROW_Y_PAGE_16.length);

  overlay.coverRect(56, 695, 485, 16);
  overlay.drawText({
    fontKey: "F8",
    fontSize: 7.92,
    x: 71.784,
    y: 702.43,
    text: title,
  });

  drawScheduleSummary(overlay, data, 672.91);
  drawScheduleRows(overlay, pageRows, ROW_Y_PAGE_16);

  return overlay.build();
}

function buildPage17Overlay(data) {
  const overlay = createOverlayBuilder();
  const pageRows = data.schedule.slice(
    ROW_Y_PAGE_16.length,
    ROW_Y_PAGE_16.length + ROW_Y_PAGE_17.length,
  );

  drawScheduleSummary(overlay, data, 752.62);
  drawScheduleRows(overlay, pageRows, ROW_Y_PAGE_17);

  return overlay.build();
}

function buildPage18Overlay(data) {
  const overlay = createOverlayBuilder();
  overlay.coverRect(397, 744.4, 172, 13.2);
  overlay.drawText({
    fontKey: "F8",
    fontSize: 10.8,
    x: 399.4,
    y: 749.74,
    text: data.fullName,
  });
  return overlay.build();
}

function getOverlayByPage(data) {
  return {
    5: buildPage5Overlay(data),
    6: buildPage6Overlay(data),
    7: buildPage7Overlay(data),
    15: buildPage15Overlay(data),
    16: buildPage16Overlay(data),
    17: buildPage17Overlay(data),
    18: buildPage18Overlay(data),
  };
}

async function getTemplatePdfBytes() {
  if (!templateBytesPromise) {
    templateBytesPromise = fetch(TEMPLATE_PDF_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error("Shartnoma template fayli topilmadi.");
      }
      return new Uint8Array(await response.arrayBuffer());
    });
  }

  const bytes = await templateBytesPromise;
  return new Uint8Array(bytes);
}

function decodeLatin1(bytes) {
  const chunkSize = 0x8000;
  let result = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    result += String.fromCharCode(...chunk);
  }

  return result;
}

function concatUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
}

function parseTrailerMeta(pdfText) {
  const startXrefMatch = pdfText.match(/startxref\s+(\d+)\s+%%EOF\s*$/);
  if (!startXrefMatch) {
    throw new Error("Template PDF trailer topilmadi.");
  }

  const lastTrailerIndex = pdfText.lastIndexOf("trailer");
  const trailerText = pdfText.slice(lastTrailerIndex, startXrefMatch.index);
  const size = Number(trailerText.match(/\/Size\s+(\d+)/)?.[1] ?? 0);
  const root = trailerText.match(/\/Root\s+(\d+\s+\d+\s+R)/)?.[1] ?? "1 0 R";
  const info = trailerText.match(/\/Info\s+(\d+\s+\d+\s+R)/)?.[1] ?? "";
  return {
    prevXrefOffset: Number(startXrefMatch[1]),
    size,
    root,
    info,
  };
}

function parseXrefOffsets(pdfText, xrefOffset) {
  const xrefText = pdfText.slice(xrefOffset);
  if (!xrefText.startsWith("xref")) {
    throw new Error("Template PDF xref jadvali topilmadi.");
  }

  const offsets = new Map();
  const lines = xrefText.split(/\r?\n/);
  let index = 1;

  while (index < lines.length) {
    const line = lines[index]?.trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line === "trailer") {
      break;
    }

    const headerMatch = line.match(/^(\d+)\s+(\d+)$/);
    if (!headerMatch) {
      index += 1;
      continue;
    }

    const startObject = Number(headerMatch[1]);
    const count = Number(headerMatch[2]);
    index += 1;

    for (let offsetIndex = 0; offsetIndex < count && index < lines.length; offsetIndex += 1) {
      const entryLine = lines[index];
      const entryMatch = entryLine?.match(/^(\d{10})\s+(\d{5})\s+([nf])/);
      if (entryMatch && entryMatch[3] === "n") {
        offsets.set(startObject + offsetIndex, Number(entryMatch[1]));
      }
      index += 1;
    }
  }

  return offsets;
}

function getObjectBody(pdfText, xrefOffsets, objectNumber) {
  const offset = xrefOffsets.get(objectNumber);
  if (offset === undefined) {
    throw new Error(`PDF object ${objectNumber} offseti topilmadi.`);
  }

  const objectText = pdfText.slice(offset);
  const match = objectText.match(
    new RegExp(
      String.raw`^${objectNumber}\s+\d+\s+obj\r?\n([\s\S]*?)\r?\nendobj`,
    ),
  );

  if (!match) {
    throw new Error(`PDF object ${objectNumber} topilmadi.`);
  }

  return match[1].trim();
}

function replacePageContents(body, originalContentObject, newContentObject) {
  return body.replace(
    new RegExp(String.raw`/Contents\s+${originalContentObject}\s+0\s+R`),
    `/Contents [${originalContentObject} 0 R ${newContentObject} 0 R]`,
  );
}

function buildXrefSections(entries) {
  if (!entries.length) return "";

  const sections = [];
  let start = entries[0].number;
  let buffer = [entries[0]];

  for (let index = 1; index < entries.length; index += 1) {
    const current = entries[index];
    const previous = entries[index - 1];

    if (current.number === previous.number + 1) {
      buffer.push(current);
      continue;
    }

    sections.push({ start, entries: buffer });
    start = current.number;
    buffer = [current];
  }

  sections.push({ start, entries: buffer });

  const lines = ["xref"];
  sections.forEach((section) => {
    lines.push(`${section.start} ${section.entries.length}`);
    section.entries.forEach((entry) => {
      lines.push(`${String(entry.offset).padStart(10, "0")} 00000 n `);
    });
  });

  return lines.join("\n");
}

function buildFullXrefTable(size, originalOffsets, overrideOffsets) {
  const lines = ["xref", `0 ${size}`, "0000000000 65535 f "];

  for (let objectNumber = 1; objectNumber < size; objectNumber += 1) {
    const offset =
      overrideOffsets.get(objectNumber) ?? originalOffsets.get(objectNumber);

    if (offset === undefined) {
      lines.push("0000000000 65535 f ");
      continue;
    }

    lines.push(`${String(offset).padStart(10, "0")} 00000 n `);
  }

  return lines.join("\n");
}

function appendOverlayToTemplate(baseBytes, overlays) {
  const pdfText = decodeLatin1(baseBytes);
  const trailerMeta = parseTrailerMeta(pdfText);
  const xrefOffsets = parseXrefOffsets(pdfText, trailerMeta.prevXrefOffset);
  const encoder = new TextEncoder();
  const objectChunks = [];
  const xrefEntries = [];
  const overrideOffsets = new Map();
  let nextObjectNumber = trailerMeta.size;
  let currentOffset = baseBytes.length;

  Object.entries(overlays).forEach(([pageNumber, streamText]) => {
    const numericPage = Number(pageNumber);
    const pageObjectNumber = PAGE_OBJECTS[numericPage];
    const originalPageBody = getObjectBody(pdfText, xrefOffsets, pageObjectNumber);
    const originalContentObject = Number(
      originalPageBody.match(/\/Contents\s+(\d+)\s+0\s+R/)?.[1] ?? 0,
    );
    const contentObjectNumber = nextObjectNumber;
    nextObjectNumber += 1;

    const streamBytes = encoder.encode(streamText);
    const contentHeader = encoder.encode(
      `${contentObjectNumber} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`,
    );
    const contentFooter = encoder.encode("\nendstream\nendobj\n");
    const contentChunk = concatUint8Arrays([
      contentHeader,
      streamBytes,
      contentFooter,
    ]);
    objectChunks.push(contentChunk);
    xrefEntries.push({ number: contentObjectNumber, offset: currentOffset });
    overrideOffsets.set(contentObjectNumber, currentOffset);
    currentOffset += contentChunk.length;

    const updatedPageBody = replacePageContents(
      originalPageBody,
      originalContentObject,
      contentObjectNumber,
    );
    const pageBytes = encoder.encode(
      `${pageObjectNumber} 0 obj\n${updatedPageBody}\nendobj\n`,
    );
    objectChunks.push(pageBytes);
    xrefEntries.push({ number: pageObjectNumber, offset: currentOffset });
    overrideOffsets.set(pageObjectNumber, currentOffset);
    currentOffset += pageBytes.length;
  });

  xrefEntries.sort((left, right) => left.number - right.number);
  const xrefText = buildFullXrefTable(
    nextObjectNumber,
    xrefOffsets,
    overrideOffsets,
  );
  const trailerText = [
    xrefText,
    "trailer",
    `<< /Size ${nextObjectNumber} /Root ${trailerMeta.root}${
      trailerMeta.info ? ` /Info ${trailerMeta.info}` : ""
    } >>`,
    "startxref",
    String(currentOffset),
    "%%EOF",
  ].join("\n");
  const trailerBytes = encoder.encode(`${trailerText}\n`);

  return new Blob([baseBytes, ...objectChunks, trailerBytes], {
    type: "application/pdf",
  });
}

/**
 * Sotuv shartnomasi uchun PDF fayl yaratadi.
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
 */
export async function createSaleContractPdfFile({
  home,
  form,
  contractNumber,
  contractDate = new Date(),
  currencyRate,
  resolvedPriceUsd,
  resolvedSize,
  monthlyPaymentSom = 0,
}) {
  const data = buildContractData({
    home,
    form,
    contractNumber,
    contractDate,
    currencyRate,
    resolvedPriceUsd,
    resolvedSize,
    monthlyPaymentSom,
  });
  const templateBytes = await getTemplatePdfBytes();
  const overlays = getOverlayByPage(data);
  return appendOverlayToTemplate(templateBytes, overlays);
}
