import { cn } from "@/shared/lib/utils";
import SurfaceLoader from "./SurfaceLoader";

export default function LogoLoader({
  title = "ProHome yuklanmoqda",
  description = "Sahifa ma'lumotlari tayyorlanmoqda.",
  className,
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(94,165,0,0.08),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(255,255,255,0.9))]",
        className,
      )}
    >
      <SurfaceLoader
        title={title}
        description={description}
        className="p-6"
        panelClassName="border-primary/10 bg-background/92"
      />
    </div>
  );
}
