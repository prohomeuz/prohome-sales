const PASSPORT_MOJIBAKE_REPLACEMENTS = [
  [/\u0420\u0459|\u00D0\u009A|\u00D0\u0161/gu, "K"],
  [/\u0420\u0454|\u00D1\u009A|\u00D0\u00BA/gu, "k"],
];

const PASSPORT_SERIES_CHAR_MAP = new Map([
  // A
  ["\u0410", "A"],
  ["\u0430", "A"],
  ["\u0391", "A"],
  ["\u03B1", "A"],
  ["\u04D0", "A"],
  ["\u04D1", "A"],
  // B
  ["\u0412", "B"],
  ["\u0432", "B"],
  ["\u0392", "B"],
  ["\u03B2", "B"],
  // C
  ["\u0421", "C"],
  ["\u0441", "C"],
  // E
  ["\u0415", "E"],
  ["\u0435", "E"],
  ["\u0395", "E"],
  ["\u03B5", "E"],
  // H
  ["\u041D", "H"],
  ["\u043D", "H"],
  ["\u0397", "H"],
  ["\u03B7", "H"],
  // I
  ["\u0406", "I"],
  ["\u0456", "I"],
  ["\u0399", "I"],
  ["\u03B9", "I"],
  ["\u0131", "I"],
  // J
  ["\u0408", "J"],
  ["\u0458", "J"],
  // K
  ["\u041A", "K"],
  ["\u043A", "K"],
  ["\u049A", "K"],
  ["\u049B", "K"],
  ["\u04A0", "K"],
  ["\u04A1", "K"],
  ["\u039A", "K"],
  ["\u03BA", "K"],
  ["\u212A", "K"],
  // M
  ["\u041C", "M"],
  ["\u043C", "M"],
  ["\u039C", "M"],
  ["\u03BC", "M"],
  // O
  ["\u041E", "O"],
  ["\u043E", "O"],
  ["\u039F", "O"],
  ["\u03BF", "O"],
  ["\u04E8", "O"],
  ["\u04E9", "O"],
  // P
  ["\u0420", "P"],
  ["\u0440", "P"],
  ["\u03A1", "P"],
  ["\u03C1", "P"],
  // T
  ["\u0422", "T"],
  ["\u0442", "T"],
  ["\u03A4", "T"],
  ["\u03C4", "T"],
  // X
  ["\u0425", "X"],
  ["\u0445", "X"],
  ["\u03A7", "X"],
  ["\u03C7", "X"],
  // Y
  ["\u0423", "Y"],
  ["\u0443", "Y"],
  ["\u03A5", "Y"],
  ["\u03C5", "Y"],
  ["\u04AE", "Y"],
  ["\u04AF", "Y"],
]);

export function normalizePassportSeriesChars(raw) {
  let source = String(raw ?? "").normalize("NFKC");

  PASSPORT_MOJIBAKE_REPLACEMENTS.forEach(([pattern, replacement]) => {
    source = source.replace(pattern, replacement);
  });

  return Array.from(source.normalize("NFC"))
    .map((char) => PASSPORT_SERIES_CHAR_MAP.get(char) ?? char)
    .join("");
}

export function formatPassportNumberDisplay(raw) {
  const source = normalizePassportSeriesChars(raw).toUpperCase();
  const letters = source.replace(/[^A-Z]/g, "").slice(0, 2);
  const digits = source.replace(/\D/g, "").slice(0, 7);

  if (!letters) return digits;
  if (!digits) return letters;
  return `${letters} ${digits}`;
}

export function normalizePassportNumber(raw) {
  return formatPassportNumberDisplay(raw).replace(/\s+/g, " ").trim();
}
