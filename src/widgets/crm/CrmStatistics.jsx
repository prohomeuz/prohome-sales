import { useMemo } from "react";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import { Card, CardContent } from "@/shared/ui/card";
import { useAppStore } from "@/entities/session/model";
import { formatNumber } from "@/shared/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#65a30d"];

export function CrmStatistics() {
  const columns = useCrmStore((state) => state.columns);
  const leads = useCrmStore((state) => state.leads);
  const isLoading = useCrmStore((state) => state.isLoading);
  const { user } = useAppStore();

  const chartData = useMemo(() => {
    if (!columns || !leads) return [];

    return columns.map((col, index) => {
      const columnLeads = leads.filter((l) => l.columnId === col.id);
      const totalAmount = columnLeads.reduce(
        (sum, lead) => sum + (Number(lead.price) || 0),
        0,
      );

      return {
        name: col.title || col.name,
        count: columnLeads.length,
        summa: totalAmount,
        color: COLORS[Math.min(index, COLORS.length - 1)],
      };
    });
  }, [columns, leads]);

  if (isLoading && leads.length === 0) return null;
  if (user?.permission?.CRM !== true) return null;

  const totalBoardAmount = chartData.reduce(
    (acc, stage) => acc + stage.summa,
    0,
  );

  return (
    <Card className="mb-4 overflow-hidden rounded-2xl border-none bg-gradient-to-br from-white to-gray-50 shadow-sm">
      <CardContent className="flex flex-col gap-6 p-4 sm:p-5 md:flex-row">
        {/* Left Side: Text Summary */}
        <div className="flex min-w-[200px] flex-col justify-center">
          <h3 className="mb-1 text-sm font-bold tracking-wider text-gray-400 uppercase">
            Voronka Qiymati
          </h3>
          <div className="text-3xl font-black text-[#65a30d]">
            {formatNumber(totalBoardAmount)} so'm
          </div>
          <p className="mt-2 text-xs font-semibold text-gray-500">
            Jami <span className="text-gray-900">{leads.length}</span> ta faol
            sdelka
          </p>
        </div>

        {/* Right Side: Simple Funnel/Bar Chart */}
        <div className="h-[100px] w-full min-w-[300px] flex-1 sm:h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                dy={10}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-gray-700 bg-gray-900 p-2 text-xs font-medium text-white shadow-lg">
                        <p className="mb-1 font-bold text-[#ecfccb]">
                          {data.name}
                        </p>
                        <p>Miqdor: {data.count} ta</p>
                        <p>Summa: {formatNumber(data.summa)} so'm</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
