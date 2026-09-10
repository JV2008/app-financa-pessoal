"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface CashflowPoint {
  month: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

interface CashflowChartProps {
  data: CashflowPoint[];
}

export function CashflowChart({ data }: CashflowChartProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  // Encontrar o melhor mês do período (maior saldo líquido)
  const bestMonth = data.length > 0
    ? [...data].sort((a, b) => b.net - a.net)[0]
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
      {/* Cabeçalho do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Fluxo de Caixa: Receitas vs Despesas
          </h3>
          <p className="text-xs text-gray-500">
            Comparativo mês a mês com linha de balanço líquido
          </p>
        </div>

        {/* Legenda Customizada */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-700 inline-block" />
            <span>Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
            <span>Despesas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-600 border-t-2 border-dashed border-emerald-600 inline-block" />
            <span>Saldo Líquido</span>
          </div>
        </div>
      </div>

      {/* Banner de Destaque Inteligente */}
      {bestMonth && bestMonth.net > 0 && (
        <div className="mb-5 px-3 py-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✪</span>
            <span>
              Destaque do período: <strong>{bestMonth.label}</strong> alcançou a maior margem líquida (+{formatCurrency(bestMonth.net)}).
            </span>
          </div>
          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Recorde
          </span>
        </div>
      )}

      {/* Gráfico Recharts */}
      <div className="h-[280px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            Nenhum dado disponível para o período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: number, name: string) => [
                  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val),
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="income"
                name="Receitas"
                fill="#1d4ed8"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="expenses"
                name="Despesas"
                fill="#f87171"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Saldo Líquido"
                stroke="#059669"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: "#059669" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
