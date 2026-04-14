/**
 * @file Xona tafsilot paneli sarlavhasi.
 * @module widgets/home-details/ui/RoomHeader
 *
 * Status badge, yopish tugmasi, mijoz info popouveri,
 * uy raqami va narx ko'rsatadi.
 * Faqat presentational — barcha state props orqali keladi.
 */

import { cn, formatNumber } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { NoiseBackground } from "@/shared/ui/noise-background";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { ArrowLeft, ArrowRight, Check, Copy, Info, Link } from "lucide-react";

const STATUSES = {
  SOLD: "bg-red-700",
  RESERVED: "bg-yellow-400",
  EMPTY: "bg-green-500",
  NOT: "bg-slate-400",
};

const UZBEK_TRANSLATE = {
  SOLD: "Sotilgan",
  RESERVED: "Bron qilingan",
  EMPTY: "Bo'sh",
  NOT: "Sotilmaydi",
};

/**
 * @param {{
 *   home: object,
 *   currencyUsd: object | null,
 *   copied: boolean,
 *   onCopyPhone: (phone: string) => void,
 *   onClose: () => void,
 *   apiBaseUrl: string,
 * }} props
 */
export default function RoomHeader({
  home,
  currencyUsd,
  copied,
  onCopyPhone,
  onClose,
}) {
  return (
    <div className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur-sm">
      {/* Badge + yopish tugmasi */}
      <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
        <Badge className={cn("order-2 lg:order-1", STATUSES[home.status])}>
          {UZBEK_TRANSLATE[home.status]}
        </Badge>

        <Button
          className="order-1 border shadow lg:order-2"
          onClick={onClose}
          variant="secondary"
          size="icon-sm"
        >
          <ArrowLeft className="lg:hidden" />
          <ArrowRight className="hidden lg:block" />
        </Button>
      </div>

      <div className="px-4 pb-4 sm:px-5">
        {/* Mijoz ma'lumoti popouveri */}
        {home.customer && home.status !== "EMPTY" && (
          <div className="animate-fade-in mb-5">
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-full" variant="secondary" size="sm">
                  <Info />
                  Info
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <NoiseBackground
                  className="rounded p-2"
                  gradientColors={[]}
                  animating={false}
                  noiseIntensity={0.3}
                >
                  <dl className="flex flex-col gap-2 font-mono text-xs">
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dt>ISM</dt>
                      <dd className="font-medium">{home.customer.firstName}</dd>
                    </div>
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dt>FAMILIYA</dt>
                      <dd className="font-medium">{home.customer.lastName}</dd>
                    </div>
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dt>TEL</dt>
                      <dd className="relative flex items-center gap-1 font-medium select-none">
                        {home.customer.phone}
                        <Button
                          onClick={() => onCopyPhone(home.customer.phone)}
                          size="sm"
                          variant="ghost"
                        >
                          {copied ? (
                            <Check className="size-3" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </dd>
                    </div>
                    <div className="bg-background flex flex-row-reverse items-center justify-between rounded px-3 py-1 shadow">
                      <dd className="font-medium">
                        <a
                          className={buttonVariants({
                            variant: "link",
                            size: "sm",
                          })}
                          target="_blank"
                          href={`${import.meta.env.VITE_BASE_URL}/api/v1/docs/${home.contractFile}`}
                        >
                          <Link /> Ko'rish
                        </a>
                      </dd>
                      <dt>SHARTNOMA</dt>
                    </div>
                  </dl>
                </NoiseBackground>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Uy haqida sarlavha */}
        <div className="mb-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground uppercase">
            Uy haqida
          </h2>
        </div>

        {/* Uy raqami + narx */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <i className="font-mono text-sm sm:text-base">№ {home.houseNumber}</i>

          {currencyUsd?.rate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="bg-primary text-primary-foreground cursor-help rounded-md px-3 py-1 text-xs leading-none shadow-sm">
                  {(home.price * home.size).toFixed(1)} USD
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <span className="font-semibold">
                    {formatNumber((home.price * home.size).toFixed(1))} USD
                  </span>{" "}
                  ={" "}
                  <span className="font-mono font-semibold">
                    {formatNumber(
                      Math.round(
                        Number(home.price) *
                          Number(home.size) *
                          Number(currencyUsd.rate),
                      ),
                    )}{" "}
                    so&apos;m
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs leading-none shadow-sm">
              {(home.price * home.size).toFixed(1)} USD
            </span>
          )}
        </div>
        <div className="mt-3 flex justify-end" />
      </div>
    </div>
  );
}
