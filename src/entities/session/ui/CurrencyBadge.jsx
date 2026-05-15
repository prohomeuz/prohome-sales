/**
 * @file Dollar kurs badge komponenti.
 * @module entities/session/ui/CurrencyBadge
 *
 * CBU dan olingan dollar kursini ko'rsatadi va yangilash imkonini beradi.
 * entities/ qatlamida turadi — useAppStore ishlatgani uchun.
 */

import { useAppStore } from "@/entities/session/model";
import { cn, formatNumber } from "@/shared/lib/utils";
import { DollarSign, RefreshCw } from "lucide-react";

/**
 * Dollar kurs badge — CBU saytiga link va kursni yangilash tugmasi bilan.
 * @param {{ className?: string }} [props]
 */
export default function CurrencyBadge({ className } = {}) {
  const currencyUsd = useAppStore((state) => state.currencyUsd);
  const currencyLoading = useAppStore((state) => state.currencyLoading);
  const fetchCurrencyUsd = useAppStore((state) => state.fetchCurrencyUsd);

  if (!currencyUsd?.rate) return null;

  return (
    <button
      type="button"
      onClick={() => {
        window.open("https://cbu.uz/uz/", "_blank", "noopener,noreferrer");
      }}
      className={cn(
        "group inline-flex items-center gap-2 rounded-[10px] h-full border border-emerald-100 bg-emerald-50/80 px-2.5 py-1.5   text-left text-xs text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:outline-none",
        className,
      )}
      title="CBU saytiga o'tish"
    >
      <span
        onClick={(event) => {
          event.stopPropagation();
          fetchCurrencyUsd?.();
        }}
        className={cn(
          "flex size-7 items-center justify-center rounded-[8px] bg-white text-emerald-600 border transition hover:scale-105",
          currencyLoading && "cursor-wait",
        )}
        role="button"
        tabIndex={0}
        aria-label="Kursni yangilash"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            fetchCurrencyUsd?.();
          }
        }}
      >
        <RefreshCw
          className={cn("size-4", currencyLoading && "animate-spin")}
        />
      </span>
      <span className="flex size-7 items-center justify-center rounded-[8px] bg-white text-emerald-600 border">
        <DollarSign className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-semibold">
          {formatNumber(currencyUsd.rate)} so&apos;m
        </span>
        <span className="text-[11px] text-emerald-700/80">
          {currencyUsd.date}
        </span>
      </span>
    </button>
  );
}
