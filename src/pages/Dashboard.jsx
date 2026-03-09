import { Slider } from "@/shared/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { Rocket } from "lucide-react";
import { useCallback, useState } from "react";
import { useDashboardStats } from "@/shared/hooks/use-dashboard-stats";
import { formatNumber } from "@/shared/lib/utils";
import GeneralError from "@/widgets/error/GeneralError";
import LoadTransition from "@/widgets/loading/LoadTransition";
import SurfaceLoader from "@/widgets/loading/SurfaceLoader";

const PERIOD_LABELS = {
  last30: "Oy",
  last7: "Hafta",
  yesterday: "Kecha",
  today: "Bugun",
};

const PERIOD_KEYS = { 1: "today", 2: "yesterday", 3: "last7", 4: "last30" };

export default function Dashboard() {
  const [p, setP] = useState(4);
  const { sales, loading, error } = useDashboardStats(p);

  const handleChange = useCallback((v) => {
    setP(v === 0 ? 1 : v);
  }, []);

  return (
    <section className="animate-fade-in h-full overflow-y-auto p-4 sm:p-6 lg:p-7">
      <div className="relative mx-auto w-full max-w-5xl gap-5 rounded-xl border px-4 py-6 select-none sm:px-5">
        <h3 className="bg-background absolute left-5 top-0 z-50 flex -translate-y-2/4 gap-2 px-2 font-bold">
          <Rocket /> Holat
        </h3>

        <div className="mb-6 w-full">
          <Slider
            value={[p]}
            onValueChange={([v]) => handleChange(v === 0 ? 1 : v)}
            max={4}
            step={1}
            className="mb-4 w-full"
          />
          <ToggleGroup
            className="w-full flex-wrap"
            size="sm"
            type="single"
            variant="outline"
            onValueChange={(v) => handleChange(Number(v))}
            value={String(p)}
          >
            {Object.entries(PERIOD_KEYS).map(([k, v]) => (
              <ToggleGroupItem value={k} className="min-w-[5rem] flex-1" key={v}>
                {PERIOD_LABELS[v]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <LoadTransition
          loading={loading}
          className="relative min-h-[20rem]"
          loader={
            <SurfaceLoader
              title={sales ? "Dashboard yangilanmoqda" : "Dashboard yuklanmoqda"}
              description={
                sales
                  ? "Filtr bo'yicha yangi ko'rsatkichlar olinmoqda."
                  : "Sotuv statistikasi tayyorlanmoqda."
              }
            />
          }
          loaderClassName="rounded-xl bg-background/95 backdrop-blur-sm"
          contentClassName="min-h-[20rem]"
        >
          {error && !sales ? (
            <GeneralError />
          ) : sales ? (
            <>
              <div className="mb-10 flex w-full flex-col overflow-hidden rounded-xl md:flex-row">
                <div className="w-full bg-green-500 p-4 md:w-1/2">
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-primary-foreground text-xs">
                      Sotilgan uylar
                    </span>
                  </div>
                  <h4 className="text-primary-foreground font-mono text-lg font-medium">
                    {formatNumber(sales.totalSalesAmount)} UZS
                  </h4>
                </div>
                <div className="w-full bg-red-800/50 p-4 md:w-1/2">
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-primary-foreground text-xs">
                      Qolgan uylar
                    </span>
                  </div>
                  <h4 className="text-primary-foreground font-mono text-lg font-medium">
                    {formatNumber(sales.totalEmptyAmount)} UZS
                  </h4>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="bg-primary/2 w-full rounded-xl border p-4 sm:col-span-2">
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Mijozlar
                    </span>
                  </div>
                  <h4 className="font-mono text-lg font-medium">
                    {sales.totalCustomers ?? "----"}
                  </h4>
                </div>
                <div className="bg-primary/2 w-full rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Sotuvlar
                    </span>
                  </div>
                  <h4 className="font-mono text-lg font-medium">
                    {sales.totalSales ?? "----"}
                  </h4>
                </div>
                <div className="bg-primary/2 w-full rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Bronlar
                    </span>
                  </div>
                  <h4 className="font-mono text-lg font-medium">
                    {sales.totalBookings ?? "----"}
                  </h4>
                </div>
              </div>
            </>
          ) : null}
        </LoadTransition>
      </div>
    </section>
  );
}
