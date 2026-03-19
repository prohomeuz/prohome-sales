/**
 * @file Kalkulator hisoblash formasi.
 * @module widgets/calculator/ui/CalculatorForm
 *
 * Holat, boshlang'ich to'lov, chegirma, muddat inputlari va Hisoblash tugmasi.
 * Faqat presentational — state va handlerlar props orqali keladi.
 */

import { cn, formatNumberWithPercent } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldContent,
  FieldTitle,
  FieldLabel,
} from "@/shared/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";
import { Label } from "@/shared/ui/label";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { BadgePercent, Calculator } from "lucide-react";
import { Suspense } from "react";
import { states, paymentPeriods } from "../lib/constants";

/**
 * @param {{
 *   selectedState: string,
 *   downPayment: string,
 *   period: string | number,
 *   showDiscount: boolean,
 *   discountType: string,
 *   discount: string,
 *   calcLoading: boolean,
 *   discountViewerLoaded: boolean,
 *   discountOpenSignal: number,
 *   LazyDiscountViewerSlider: React.LazyExoticComponent,
 *   onSubmit: (evt: React.FormEvent) => void,
 *   onStateChange: (value: string) => void,
 *   onDownPayment: (evt: React.ChangeEvent) => void,
 *   onDiscount: (evt: React.ChangeEvent) => void,
 *   onDiscountTypeChange: (value: string) => void,
 *   onPeriod: (p: string) => void,
 *   onPeriodInputChange: (evt: React.ChangeEvent) => void,
 *   onPeriodInputBlur: (evt: React.FocusEvent) => void,
 *   onOpenDiscountViewer: () => void,
 *   onDiscountVisibleChange: (visible: boolean) => void,
 * }} props
 */
export default function CalculatorForm({
  selectedState,
  downPayment,
  period,
  showDiscount,
  discountType,
  discount,
  calcLoading,
  discountViewerLoaded,
  discountOpenSignal,
  LazyDiscountViewerSlider,
  onSubmit,
  onStateChange,
  onDownPayment,
  onDiscount,
  onDiscountTypeChange,
  onPeriod,
  onPeriodInputChange,
  onPeriodInputBlur,
  onOpenDiscountViewer,
  onDiscountVisibleChange,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-xl border p-4"
    >
      {/* Holat */}
      <div className="grid gap-2">
        <Label>Holat</Label>
        <RadioGroup
          value={selectedState}
          onValueChange={onStateChange}
          className="flex gap-3"
          name="state"
        >
          {Object.entries(states).map(([key, label]) => (
            <FieldLabel key={key}>
              <Field orientation="horizontal">
                <RadioGroupItem value={key} id={`state-${key}`} />
                <FieldContent>
                  <FieldTitle>{label}</FieldTitle>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </div>

      {/* Boshlang'ich to'lov */}
      <div className="grid gap-2">
        <Label htmlFor="downPayment">Boshlang'ich to'lov</Label>
        <InputGroup className="w-full">
          <InputGroupInput
            id="downPayment"
            name="downPayment"
            autoComplete="off"
            onChange={onDownPayment}
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]*"
            value={downPayment}
            placeholder="0"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>so'm</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Chegirma (D tugmasi bilan yashirin ochiladi) */}
      {showDiscount && (
        <div className="grid gap-3">
          <Label>Chegirma turi</Label>
          <NativeSelect
            value={discountType}
            onChange={(e) => onDiscountTypeChange(e.target.value)}
          >
            <NativeSelectOption value="discountPerM2">
              M² ga chegirma (so'm)
            </NativeSelectOption>
            <NativeSelectOption value="discountPercent">
              Foizli chegirma (%)
            </NativeSelectOption>
            <NativeSelectOption value="discountValue">
              Umumiy chegirma (so'm)
            </NativeSelectOption>
          </NativeSelect>

          <InputGroup className="w-full">
            <InputGroupInput
              name={discountType}
              autoComplete="off"
              onChange={onDiscount}
              type="text"
              inputMode="numeric"
              value={discount}
              placeholder={
                discountType === "discountPercent" ? "5%" : "1 000 000"
              }
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>
                {discountType === "discountPercent" ? "%" : "so'm"}
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>

          <button
            type="button"
            onClick={onOpenDiscountViewer}
            className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 rounded-sm pt-0.5 text-xs transition-colors"
          >
            <BadgePercent className="size-3.5" />
            Ko'proq to'lang, ko'proq oling
          </button>

          {discountViewerLoaded ? (
            <Suspense fallback={null}>
              <LazyDiscountViewerSlider
                openSignal={discountOpenSignal}
                onViewerVisibleChange={onDiscountVisibleChange}
              />
            </Suspense>
          ) : null}
        </div>
      )}

      {/* Muddat */}
      <div className="grid gap-2">
        <Label htmlFor="months">Necha oyga</Label>
        <div className="grid gap-3">
          <div className="grid grid-cols-5 gap-2">
            {paymentPeriods.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => onPeriod(String(p))}
                className={`inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                  Number(period) === p
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-accent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <InputGroup className="w-full">
            <InputGroupInput
              id="months"
              name="months"
              autoComplete="off"
              onChange={onPeriodInputChange}
              onBlur={onPeriodInputBlur}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={period}
              placeholder="12"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>oy</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <Button variant="secondary" disabled={calcLoading}>
        {calcLoading ? (
          <>Hisoblanmoqda...</>
        ) : (
          <>
            <Calculator /> Hisoblash
          </>
        )}
      </Button>
    </form>
  );
}
