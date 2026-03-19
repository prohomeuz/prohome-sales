/**
 * @file Kalkulator natijalar paneli (chap tomon).
 * @module widgets/calculator/ui/CalculatorResultPanel
 *
 * Oylik to'lov, xulosa kartalar, bonus banneri, galerya va timeline ko'rsatadi.
 * Faqat presentational — barcha ma'lumot props orqali keladi.
 */

import CurrencyBadge from "@/shared/ui/currency-badge";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { cn, formatNumber } from "@/shared/lib/utils";
import AppartmentTimeLine from "@/widgets/AppartmentTimeLine";
import LoadTransition from "@/widgets/loading/LoadTransition";
import SurfaceLoader from "@/widgets/loading/SurfaceLoader";
import { Gift, Plane } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";

/**
 * @param {{
 *   home: object,
 *   calcResult: object,
 *   summaryCards: Array<object>,
 *   paymentBonus: object | null,
 *   hasUmraBonus: boolean,
 *   bonusItems: Array<string>,
 *   calcLoading: boolean,
 * }} props
 */
export default function CalculatorResultPanel({
  home,
  calcResult,
  summaryCards,
  paymentBonus,
  hasUmraBonus,
  bonusItems,
  calcLoading,
}) {
  const bonusLabels = {
    refrigerator: "Muzlatgich",
    "gas-stove": "Gaz plita",
    "washing-machine": "Kir yuvish mashinasi",
    "electric-plate": "Elektr plita",
  };

  return (
    <LoadTransition
      loading={calcLoading}
      hideContentWhileLoading
      className="min-h-full"
      loader={
        <SurfaceLoader
          title="Hisoblash tayyorlanmoqda"
          description="To'lov jadvali va natijalar yangilanmoqda."
        />
      }
      loaderClassName="bg-background/72 backdrop-blur-[2px]"
      contentClassName="min-h-full"
    >
      {/* Oylik to'lov — sticky karta */}
      <div className="animate-fade-in bg-background/95 supports-[backdrop-filter]:bg-background/90 sticky top-[4.5rem] z-10 mb-6 w-full rounded-xl border px-4 py-5 shadow-sm backdrop-blur sm:top-[4.75rem] sm:mb-8 sm:px-6 sm:py-6 lg:top-2 lg:shadow-none">
        <h3 className="bg-background text-muted-foreground absolute top-0 left-5 flex -translate-y-2/4 gap-2 rounded px-2">
          Oyiga
        </h3>
        <h2 className="font-mono text-3xl font-bold sm:text-4xl lg:text-5xl">
          {formatNumber(calcResult.monthlyPayment)}
        </h2>
        <div className="mt-4 flex justify-end">
          <CurrencyBadge className="text-[11px]" />
        </div>
      </div>

      {/* Xulosa kartalar */}
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="bg-primary/2 w-full rounded border p-2"
            >
              <div className="mb-2 flex items-center gap-1">
                <Icon />
                <span className="text-muted-foreground text-xs">
                  {card.label}
                </span>
              </div>
              <h4
                className={cn(
                  "text-lg font-medium",
                  card.mono ? "font-mono" : "tracking-normal",
                )}
              >
                {card.value}
              </h4>
              {Array.isArray(card.subValues) && card.subValues.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {card.subValues.map((sv) => (
                    <li
                      key={sv}
                      className="text-muted-foreground font-mono text-xs"
                    >
                      {sv}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Umra safari banner */}
      {(hasUmraBonus || bonusItems.length > 0) && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-yellow-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Plane className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-950">
                2 kishilik Umra safari imkoniyati
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Siz Umra safari yo'llanmasini yutib olish imkoniyatiga ega
                bo'ldingiz. Batafsil ma'lumotni savdo bo'limidan olishingiz
                mumkin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bonus mahsulotlar */}
      {bonusItems.length > 0 && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Gift className="size-4 text-emerald-700" />
            <p className="text-sm font-medium text-emerald-900">
              Bonus:{" "}
              {bonusItems
                .map((item) => bonusLabels[item] ?? item)
                .join(" + ")}
            </p>
          </div>
        </div>
      )}

      {/* Xona rasmlari galereyasi */}
      {home.images?.length > 0 && (
        <PhotoProvider>
          <div className="mb-5 grid grid-cols-3 gap-2">
            {home.images.map((img, i) => (
              <PhotoView key={i} src={img}>
                <img
                  src={img}
                  alt={`Uy rasmi ${i + 1}`}
                  className="aspect-square w-full cursor-zoom-in rounded-lg object-cover"
                />
              </PhotoView>
            ))}
          </div>
        </PhotoProvider>
      )}

      {/* Ramazon chegirmasi */}
      {home.ramazonChegirma && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertTitle className="text-green-900">Ramazon chegirmasi</AlertTitle>
          <AlertDescription className="text-green-800">
            {home.ramazonChegirma}
          </AlertDescription>
        </Alert>
      )}

      {/* Infratuzilma */}
      {home.infratuzilma && (
        <Alert className="mb-4">
          <AlertTitle>Infratuzilma</AlertTitle>
          <AlertDescription>{home.infratuzilma}</AlertDescription>
        </Alert>
      )}

      <AppartmentTimeLine home={home} />
    </LoadTransition>
  );
}
