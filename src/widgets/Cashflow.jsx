import { HandCoins, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { SparklesText } from "@/shared/ui/sparkles-text";
import { formatNumber } from "@/shared/lib/utils";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Spinner } from "@/shared/ui/spinner";

export default function Cashflow() {
  const [cashflow, setCashflow] = useState(null);

  // Loadings
  const [cashFlowLoading, setCashFlowLoading] = useState(false);

  // Read
  async function getCashflow() {
    let req;
    const token = JSON.parse(localStorage.getItem("user")).accessToken;
    setCashFlowLoading(true);
    try {
      req = await fetch(
        import.meta.env.VITE_BASE_URL +
          `/api/v1/dashboard/cashflow?projectId=1`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
    } catch {
      toast.error("Tizimda nosozlik!");
    }

    if (req) {
      if (req.status === 200) {
        const data = await req.json();

        setCashflow(data);
      } else {
        toast.error("Xatolik yuz berdi qayta urunib ko'ring!");
      }
    }

    setCashFlowLoading(false);
  }

  useEffect(() => {
    getCashflow();
  }, []);
  return (
    <div className="border relative px-3 py-6 rounded flex items-center gap-5 select-none">
      {cashFlowLoading && (
        <div className="absolute inset-0 bg-slate-900/5 z-40 flex items-center justify-center">
          <Spinner />
        </div>
      )}
      <h3 className="absolute left-5 top-0 -translate-y-2/4 bg-background font-bold px-2 flex gap-2 z-50">
        <HandCoins /> Moliya
      </h3>

      <div className="border p-2 w-full rounded bg-primary/2">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-muted-foreground text-xs">
            Aktiv kontraktlar
          </span>
        </div>
        <SparklesText className="text-2xl" sparklesCount={4}>
          {cashflow ? formatNumber(cashflow.activeContractsAmount) : "-------"}{" "}
          UZS
        </SparklesText>
      </div>

      <Tabs className={"w-full"} defaultValue="todayAmount">
        <TabsList>
          <TabsTrigger className={"text-xs"} value="todayAmount">
            Bugun
          </TabsTrigger>
          <TabsTrigger className={"text-xs"} value="last7DaysAmount">
            Hafta
          </TabsTrigger>
          <TabsTrigger className={"text-xs"} value="last30DaysAmount">
            Oy
          </TabsTrigger>
        </TabsList>
        <TabsContent value="todayAmount">
          <p className="font-mono text-xl">
            {cashflow ? formatNumber(cashflow.todayAmount) : "-------"}
          </p>
        </TabsContent>
        <TabsContent value="last7DaysAmount">
          <p className="font-mono text-xl">
            {cashflow ? formatNumber(cashflow.last7DaysAmount) : "-------"}
          </p>
        </TabsContent>
        <TabsContent value="last30DaysAmount">
          <p className="font-mono text-xl">
            {cashflow ? formatNumber(cashflow.last30DaysAmount) : "-------"}
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
