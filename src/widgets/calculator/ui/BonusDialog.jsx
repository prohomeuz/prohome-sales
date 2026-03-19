/**
 * @file Bonus natija dialogi.
 * @module widgets/calculator/ui/BonusDialog
 *
 * Hisoblashdan keyin bonus borligini xabar beruvchi dialog.
 * Faqat presentational — barcha ma'lumot props orqali keladi.
 */

import { formatNumber } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Gift, Plane } from "lucide-react";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   paymentBonus: object | null,
 *   hasUmraBonus: boolean,
 * }} props
 */
export default function BonusDialog({ open, onClose, paymentBonus, hasUmraBonus }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[520px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Gift className="size-6" />
          </div>
          <DialogHeader className="items-center gap-2 text-center">
            <DialogTitle className="text-xl sm:text-2xl">
              Bonus qo'lga kiritildi
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              {paymentBonus && hasUmraBonus
                ? `${paymentBonus.qualifier} asosida sovg'a va qo'shimcha Umra imkoniyati taqdim etiladi.`
                : paymentBonus
                  ? `${paymentBonus.qualifier} asosida ${paymentBonus.title.toLowerCase()} sovg'a sifatida beriladi.`
                  : "Boshlang'ich to'lovingiz maxsus bonus shartiga mos keldi."}
            </DialogDescription>
          </DialogHeader>

          {paymentBonus ? (
            <div className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Qo'shimcha chegirma: +{formatNumber(paymentBonus.discountPerM2)}
              /m<sup>2</sup>.
            </div>
          ) : null}

          {hasUmraBonus ? (
            <div className="w-full rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-yellow-50 p-4 text-left shadow-sm">
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
                    bo'ldingiz. Batafsil ma'lumotni savdo bo'limidan
                    olishingiz mumkin.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="sm:justify-center">
            <Button type="button" onClick={onClose}>
              Tushunarli
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
