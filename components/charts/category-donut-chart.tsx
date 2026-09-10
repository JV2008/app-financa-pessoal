"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export interface CategoryExpense {
  name: string;
  total: number;
  color: string;
  percentage: number;
}

interface CategoryDonutChartProps {
  data: CategoryExpense[];
  totalExpenses: number;
}

const DEFAULT_COLORS = [
  "#2563eb", // Blue
  "#93c5fd", // Light blue
  "#f59e0b", // Amber/Orange
  "#8b5cf6", // Purple
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#64748b", // Slate
];

export function CategoryDonutChart({ data, totalExpenses }: CategoryDonutChartProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  const chartData = data.map((item, idx) => ({
    name: item.name,
    value: item.total,
    color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    percentage: item.percentage,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900">
          Gastos por Categoria
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          Distribuição e peso relativo no período
        </p>
      </div>

      {/* Donut Chart com Centro em Destaque */}
      <div className="relative h-[220px] w-full flex items-center justify-center my-2">
        {chartData.length === 0 ? (
          <div className="text-sm text-gray-400">Nenhuma despesa registrada no período.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val), "Gasto"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Texto Central do Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Total
              </span>
              <span className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Lista das Categorias com Percentual e Valor */}
      <div className="space-y-2.5 mt-2 max-h-[220px] overflow-y-auto pr-1">
        {chartData.map((cat, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-medium text-gray-700 truncate">
                {cat.name}{" "}
                <span className="text-gray-400 font-normal">
                  ({cat.percentage.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-gray-900">
                {formatCurrency(cat.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
