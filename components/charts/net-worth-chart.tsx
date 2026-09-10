"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface NetWorthPoint {
  month: string;
  label: string;
  netWorth: number;
}

interface NetWorthChartProps {
  data: NetWorthPoint[];
  currentTotal: number;
  accumulatedSavings: number;
  estimatedReturn: number;
}

export function NetWorthChart({
  data,
  currentTotal,
  accumulatedSavings,
  estimatedReturn,
}: NetWorthChartProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];

  const growthPercent =
    firstPoint && firstPoint.netWorth > 0 && lastPoint
      ? (((lastPoint.netWorth - firstPoint.netWorth) / firstPoint.netWorth) * 100).toFixed(1)
      : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Evolução do Patrimônio Líquido
          </h3>
          <p className="text-xs text-gray-500">
            Crescimento consolidado ao longo do período selecionado
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-gray-500 font-medium">Patrimônio Consolidado</span>
          <p className="text-lg sm:text-xl font-bold text-blue-700">
            {formatCurrency(currentTotal)}
          </p>
        </div>
      </div>

      {/* Indicadores sobrepostos no gráfico */}
      <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 px-2 mb-1">
        {firstPoint && (
          <span>
            {firstPoint.label}: {formatCurrency(firstPoint.netWorth)}
          </span>
        )}
        {lastPoint && (
          <span className="text-blue-700">
            {lastPoint.label}: {formatCurrency(lastPoint.netWorth)}{" "}
            {growthPercent && `(+${growthPercent}%)`}
          </span>
        )}
      </div>

      {/* Gráfico de Área */}
      <div className="h-[200px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            Sem dados patrimoniais suficientes.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val: number) => [formatCurrency(val), "Patrimônio"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#netWorthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Métricas Inferiores */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100/60">
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-sm">
            ⊕
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Poupança Acumulada no Período</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(accumulatedSavings)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
          <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
            ✢
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Rendimento Líquido Estimado</p>
            <p className="text-sm font-bold text-emerald-700">+{formatCurrency(estimatedReturn)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
