/**
 * @file TJM tafsilot sahifasi konstantalari.
 * @module pages/tjm-details/lib/constants
 */

/** Xona holati badge rang klasslari */
export const STATUS_CLASS = {
  SOLD: "bg-gradient-to-br from-red-600 to-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
  RESERVED: "bg-gradient-to-br from-amber-400 to-amber-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
  EMPTY: "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
  NOT: "bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
};

/** Xona holati o'zbek tilidagi nomlari */
export const STATUS_LABEL = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};
