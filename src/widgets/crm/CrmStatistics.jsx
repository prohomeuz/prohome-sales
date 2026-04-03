import { useMemo } from "react";
import { useCrmStore } from "@/features/crm/model/use-crm-store";
import { Card, CardContent } from "@/shared/ui/card";
import { useAppStore } from "@/entities/session/model";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const COLORS = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#65a30d'];

export function CrmStatistics() {
  const columns = useCrmStore((state) => state.columns);
  const leads = useCrmStore((state) => state.leads);
  const isLoading = useCrmStore((state) => state.isLoading);
  const { user } = useAppStore();

  const chartData = useMemo(() => {
    if (!columns || !leads) return [];
    
    return columns.map((col, index) => {
      const columnLeads = leads.filter(l => l.columnId === col.id);
      const totalAmount = columnLeads.reduce((sum, lead) => sum + (Number(lead.price) || 0), 0);
      
      return {
        name: col.title || col.name,
        count: columnLeads.length,
        summa: totalAmount,
        color: COLORS[Math.min(index, COLORS.length - 1)]
      };
    });
  }, [columns, leads]);

  if (isLoading && leads.length === 0) return null;
  if (user?.permission?.CRM !== true) return null;

  const totalBoardAmount = chartData.reduce((acc, stage) => acc + stage.summa, 0);

  return (
    <Card className="rounded-2xl border-none shadow-sm mb-4 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Text Summary */}
        <div className="flex flex-col justify-center min-w-[200px]">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
            Voronka Qiymati
          </h3>
          <div className="text-3xl font-black text-[#65a30d]">
            ${totalBoardAmount.toLocaleString()}
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-2">
            Jami <span className="text-gray-900">{leads.length}</span> ta faol sdelka
          </p>
        </div>

        {/* Right Side: Simple Funnel/Bar Chart */}
        <div className="flex-1 h-[100px] sm:h-[120px] w-full min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-gray-900 text-white text-xs p-2 rounded-lg shadow-lg font-medium border border-gray-700">
                        <p className="font-bold text-[#ecfccb] mb-1">{data.name}</p>
                        <p>Miqdor: {data.count} ta</p>
                        <p>Summa: ${data.summa.toLocaleString()}</p>
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
