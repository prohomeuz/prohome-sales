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
        "flex h-full w-full items-center justify-center bg-background",
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
