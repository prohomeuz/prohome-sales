export const COLUMN_COLORS = [
  { bar: "#3b82f6", badge: "#dbeafe", badgeText: "#1d4ed8" }, // blue
  { bar: "#06b6d4", badge: "#cffafe", badgeText: "#0e7490" }, // cyan
  { bar: "#f59e0b", badge: "#fef3c7", badgeText: "#b45309" }, // amber
  { bar: "#8b5cf6", badge: "#ede9fe", badgeText: "#6d28d9" }, // violet
  { bar: "#10b981", badge: "#d1fae5", badgeText: "#047857" }, // emerald
  { bar: "#4b5563", badge: "#e5e7eb", badgeText: "#1f2937" }, // slate (bekor)
  { bar: "#ef4444", badge: "#fee2e2", badgeText: "#b91c1c" }, // red
  { bar: "#f97316", badge: "#ffedd5", badgeText: "#c2410c" }, // orange
];

const STAGE_COLOR_BY_TITLE = {
  Yangi: COLUMN_COLORS[0],
  "Qo'ng'iroq qildim": COLUMN_COLORS[1],
  "Aloqa qilindi": COLUMN_COLORS[1],
  "Telefon ko'tarmadi": COLUMN_COLORS[2],
  Muzokara: COLUMN_COLORS[2],
  "Qayta qo'ng'iroq": COLUMN_COLORS[3],
  Qaror: COLUMN_COLORS[3],
  Kelishildi: COLUMN_COLORS[4],
  Bitim: COLUMN_COLORS[4],
  Bekor: COLUMN_COLORS[5],
  Spam: COLUMN_COLORS[6],
};

function normalizeTitle(rawTitle) {
  return String(rawTitle || "").trim();
}

export function getColumnColorByTitle(title, fallbackIndex = 0) {
  const normalized = normalizeTitle(title);
  if (STAGE_COLOR_BY_TITLE[normalized]) {
    return STAGE_COLOR_BY_TITLE[normalized];
  }
  return COLUMN_COLORS[Math.abs(fallbackIndex) % COLUMN_COLORS.length];
}

