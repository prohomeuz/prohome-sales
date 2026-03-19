/**
 * @file Kalkulator drawer sarlavhasi — viewer tugmalari.
 * @module widgets/calculator/ui/CalcDrawerHeader
 *
 * Umra safari, Ishonch yorlig'i, Genplan tugmalari va Orqaga tugmasi.
 * Har bir viewer lazy load qilinadi — faqat bosilganda yuklanadi.
 */

import { buttonVariants } from "@/shared/ui/button";
import { Button } from "@/shared/ui/button";
import { DrawerClose } from "@/shared/ui/drawer";
import { ArrowLeft, Images, Plane, ShieldCheck } from "lucide-react";
import { Suspense } from "react";

/**
 * @param {{
 *   onClose: () => void,
 *   umraViewerLoaded: boolean,
 *   umraOpenSignal: number,
 *   onOpenUmra: () => void,
 *   onUmraVisibleChange: (visible: boolean) => void,
 *   confidenceViewerLoaded: boolean,
 *   confidenceOpenSignal: number,
 *   onOpenConfidence: () => void,
 *   onConfidenceVisibleChange: (visible: boolean) => void,
 *   genplanViewerLoaded: boolean,
 *   genplanOpenSignal: number,
 *   onOpenGenplan: () => void,
 *   onGenplanVisibleChange: (visible: boolean) => void,
 *   LazyGenplanViewerButton: React.LazyExoticComponent,
 * }} props
 */
export default function CalcDrawerHeader({
  onClose,
  umraViewerLoaded,
  umraOpenSignal,
  onOpenUmra,
  onUmraVisibleChange,
  confidenceViewerLoaded,
  confidenceOpenSignal,
  onOpenConfidence,
  onConfidenceVisibleChange,
  genplanViewerLoaded,
  genplanOpenSignal,
  onOpenGenplan,
  onGenplanVisibleChange,
  LazyGenplanViewerButton,
}) {
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/90 sticky top-0 z-30 flex items-center justify-between gap-3 px-4 pt-4 pb-2 backdrop-blur sm:px-6 sm:pt-5">
      <DrawerClose
        onClick={onClose}
        className={buttonVariants({ variant: "secondary", size: "sm" })}
      >
        <ArrowLeft />
        Orqaga
      </DrawerClose>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Umra safari viewer */}
        {umraViewerLoaded ? (
          <Suspense
            fallback={
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled
                className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
              >
                <Plane className="size-4" />
                Umra safari
              </Button>
            }
          >
            <LazyGenplanViewerButton
              title="Umra safari"
              Icon={Plane}
              folder="umra"
              imageIds={[1, 2]}
              openSignal={umraOpenSignal}
              onViewerVisibleChange={onUmraVisibleChange}
            />
          </Suspense>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
            onClick={onOpenUmra}
          >
            <Plane className="size-4" />
            Umra safari
          </Button>
        )}

        {/* Ishonch yorlig'i viewer */}
        {confidenceViewerLoaded ? (
          <Suspense
            fallback={
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled
                className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
              >
                <ShieldCheck className="size-4" />
                Ishonch yorlig'i
              </Button>
            }
          >
            <LazyGenplanViewerButton
              title="Ishonch yorlig'i"
              Icon={ShieldCheck}
              folder="confidence"
              imageIds={[1, 2]}
              openSignal={confidenceOpenSignal}
              onViewerVisibleChange={onConfidenceVisibleChange}
            />
          </Suspense>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
            onClick={onOpenConfidence}
          >
            <ShieldCheck className="size-4" />
            Ishonch yorlig'i
          </Button>
        )}

        {/* Genplan viewer */}
        {genplanViewerLoaded ? (
          <Suspense
            fallback={
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled
                className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
              >
                <Images className="size-4" />
                Genplan
              </Button>
            }
          >
            <LazyGenplanViewerButton
              openSignal={genplanOpenSignal}
              onViewerVisibleChange={onGenplanVisibleChange}
            />
          </Suspense>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-8 gap-1.5 px-2 text-sm font-semibold whitespace-nowrap"
            onClick={onOpenGenplan}
          >
            <Images className="size-4" />
            Genplan
          </Button>
        )}
      </div>
    </div>
  );
}
