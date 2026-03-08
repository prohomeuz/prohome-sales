import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/shared/ui/chart";
import { TrendingUp } from "lucide-react";
import { LabelList, Pie, PieChart } from "recharts";

const chartData = [
  { state: "Sotildi", value: 20, fill: "#ef4444" },
  { state: "Band", value: 34, fill: "#eab308" },
  { state: "Bo'sh", value: 50, fill: "#22c55e" },
  { state: "Sotilmaydi", value: 12, fill: "#94a3b8" },
];

const chartConfig = {
  Sotildi: {
    label: "Sotilgan",
  },
  Band: {
    label: "Band",
  },
  "Bo'sh": {
    label: "Bo'sh",
  },
  Sotilmaydi: {
    label: "Sotilmaydi",
  },
};

export default function StatsPieChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="[&_.recharts-text]:fill-background aspect-square h-80"
    >
      <PieChart>
        <Pie data={chartData} nameKey="state">
          <LabelList
            dataKey="value"
            className="fill-background"
            stroke="none"
            fontSize={12}
          />
        </Pie>

        <ChartLegend
          content={<ChartLegendContent nameKey="state" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
