import { Slider } from "@/shared/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { Rocket } from "lucide-react";
import { useCallback, useState } from "react";
import { Spinner } from "@/shared/ui/spinner";
import { useDashboardStats } from "@/shared/hooks/use-dashboard-stats";
import { formatNumber } from "@/shared/lib/utils";

const PERIOD_LABELS = {
  last30: "Oy",
  last7: "Hafta",
  yesterday: "Kecha",
  today: "Bugun",
};

const PERIOD_KEYS = { 1: "today", 2: "yesterday", 3: "last7", 4: "last30" };

export default function Dashboard() {
  const [p, setP] = useState(4);
  const { sales, loading } = useDashboardStats(p);

  const handleChange = useCallback((v) => {
    setP(v === 0 ? 1 : v);
  }, []);

  return (
    <section className="animate-fade-in h-full p-7">
      <div className="relative w-full gap-5 rounded border px-3 py-6 select-none">
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
            className="w-full"
            size="sm"
            type="single"
            variant="outline"
            onValueChange={(v) => handleChange(Number(v))}
            value={String(p)}
          >
            {Object.entries(PERIOD_KEYS).map(([k, v]) => (
              <ToggleGroupItem value={k} className="w-[25%]" key={v}>
                {PERIOD_LABELS[v]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/5">
              <Spinner />
            </div>
          )}

          {sales && (
            <>
              <div className="mb-10 flex w-full overflow-hidden rounded">
                <div className="w-2/4 bg-green-500 p-2">
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-primary-foreground text-xs">
                      Sotilgan uylar
                    </span>
                  </div>
                  <h4 className="text-primary-foreground font-mono text-lg font-medium">
                    {formatNumber(sales.totalSalesAmount)} UZS
                  </h4>
                </div>
                <div className="w-2/4 bg-red-800/50 p-2">
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

              <div className="flex flex-col gap-2">
                <div className="bg-primary/2 w-full rounded border p-2">
                  <div className="mb-2 flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Mijozlar
                    </span>
                  </div>
                  <h4 className="font-mono text-lg font-medium">
                    {sales.totalCustomers ?? "----"}
                  </h4>
                </div>
                <div className="flex gap-2">
                  <div className="bg-primary/2 w-full rounded border p-2">
                    <div className="mb-2 flex items-center gap-1">
                      <span className="text-muted-foreground text-xs">
                        Sotuvlar
                      </span>
                    </div>
                    <h4 className="font-mono text-lg font-medium">
                      {sales.totalSales ?? "----"}
                    </h4>
                  </div>
                  <div className="bg-primary/2 w-full rounded border p-2">
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
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
