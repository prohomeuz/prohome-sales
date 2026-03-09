import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

export default function SurfaceLoader({
  title = "Ma'lumot yuklanmoqda",
  description = "Iltimos, biroz kuting.",
  className,
  panelClassName,
}) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center p-4", className)}>
      <div
        className={cn(
          "flex w-full max-w-sm flex-col items-center rounded-xl border bg-background/96 px-6 py-8 text-center shadow-sm backdrop-blur-sm",
          panelClassName,
        )}
      >
        <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl border bg-primary/5 shadow-[0_10px_30px_-18px_rgba(94,165,0,0.55)]">
          <img
            className="size-9 animate-pulse object-contain"
            src="/logo.png"
            alt=""
            aria-hidden="true"
          />
          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border bg-background text-primary">
            <Spinner className="size-3.5" />
          </span>
        </div>
        <h3 className="text-base font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="mt-1 max-w-[20rem] text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
