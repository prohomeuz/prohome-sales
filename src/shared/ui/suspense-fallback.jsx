import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";
import LogoLoader from "@/widgets/loading/LogoLoader";

export function PageFallback() {
  return <LogoLoader />;
}

export function PanelFallback({ className }) {
  return (
    <div
      className={cn(
        "bg-background flex h-full min-h-48 items-center justify-center border-l",
        className,
      )}
    >
      <Spinner />
    </div>
  );
}

export function OverlayFallback({ className }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/55 backdrop-blur-[1px]",
        className,
      )}
    >
      <div className="bg-background rounded-full border p-3 shadow-lg">
        <Spinner />
      </div>
    </div>
  );
}
