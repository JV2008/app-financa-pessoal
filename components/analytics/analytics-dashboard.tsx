"use client";

import { useState, useMemo } from "react";
import { CashflowChart, CashflowPoint } from "@/components/charts/cashflow-chart";
import { NetWorthChart, NetWorthPoint } from "@/components/charts/net-worth-chart";
import { CategoryDonutChart, CategoryExpense } from "@/components/charts/category-donut-chart";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  type: "receita" | "despesa";
  color?: string | null;
}

interface TransactionItem {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: string | number;
  type: "receita" | "despesa" | "transferencia";
  description: string | null;
  occurred_at: string;
}

interface AnalyticsDashboardProps {
  transactions: TransactionItem[];
  accounts: AccountItem[];
  categories: CategoryItem[];
}

type PeriodType = "este-mes" | "3-meses" | "6-meses" | "ano-atual" | "personalizado";

export function AnalyticsDashboard({
  transactions,
  accounts,
  categories,
}: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("6-meses");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  // Mapeamentos rápidos
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );
  const accountMap = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts]
  );

  // Filtro de data limite baseado no período
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    let start: Date;
    let label = "Últimos 6 meses";

    if (selectedPeriod === "este-mes") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      label = "Este Mês";
    } else if (selectedPeriod === "3-meses") {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      label = "Últimos 3 meses";
    } else if (selectedPeriod === "ano-atual") {
      start = new Date(now.getFullYear(), 0, 1);
      label = `Ano Atual (${now.getFullYear()})`;
    } else if (selectedPeriod === "personalizado" && customStartDate && customEndDate) {
      start = new Date(customStartDate);
      label = "Personalizado";
    } else {
      // 6 meses padrão
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const startMonthStr = start.toLocaleDateString("pt-BR", { month: "short" });
      const endMonthStr = end.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      label = `Últimos 6 meses (${startMonthStr} – ${endMonthStr})`;
    }

    return { startDate: start, endDate: end, periodLabel: label };
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Transações filtradas por Período e por Conta
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.occurred_at);
      if (txDate < startDate || txDate > endDate) return false;
      if (selectedAccountId !== "all" && t.account_id !== selectedAccountId) return false;
      return true;
    });
  }, [transactions, startDate, endDate, selectedAccountId]);

  // Totais do período
  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    filteredTransactions.forEach((t) => {
      const val = Number(t.amount);
      if (t.type === "receita") income += val;
      if (t.type === "despesa") expenses += val;
    });

    const netSavings = income - expenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

    // Soma do saldo das contas selecionadas
    const accountsBalance =
      selectedAccountId === "all"
        ? accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0)
        : Number(accounts.find((a) => a.id === selectedAccountId)?.balance || 0);

    return { income, expenses, netSavings, savingsRate, accountsBalance };
  }, [filteredTransactions, selectedAccountId, accounts]);

  // Séries Mensais para o Fluxo de Caixa (ComposedChart)
  const cashflowData: CashflowPoint[] = useMemo(() => {
    const monthBuckets: { [key: string]: { income: number; expenses: number } } = {};

    // Inicializar os meses dentro do intervalo para manter continuidade
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets[key] = { income: 0, expenses: 0 };
      cur.setMonth(cur.getMonth() + 1);
    }

    filteredTransactions.forEach((t) => {
      const d = new Date(t.occurred_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthBuckets[key]) {
        const val = Number(t.amount);
        if (t.type === "receita") monthBuckets[key].income += val;
        if (t.type === "despesa") monthBuckets[key].expenses += val;
      }
    });

    return Object.entries(monthBuckets).map(([key, vals]) => {
      const [y, m] = key.split("-");
      const monthDate = new Date(Number(y), Number(m) - 1, 1);
      const label = monthDate.toLocaleDateString("pt-BR", { month: "short" });
      const capLabel = label.charAt(0).toUpperCase() + label.slice(1);
      return {
        month: key,
        label: capLabel,
        income: vals.income,
        expenses: vals.expenses,
        net: vals.income - vals.expenses,
      };
    });
  }, [startDate, endDate, filteredTransactions]);

  // Evolução Patrimonial (Baseada no fluxo cumulativo)
  const netWorthData: NetWorthPoint[] = useMemo(() => {
    let runningNet = totals.accountsBalance - totals.netSavings;
    return cashflowData.map((pt) => {
      runningNet += pt.net;
      return {
        month: pt.month,
        label: pt.label,
        netWorth: Math.max(0, runningNet),
      };
    });
  }, [cashflowData, totals.accountsBalance, totals.netSavings]);

  // Gastos por Categoria (Donut)
  const categoryExpenses: CategoryExpense[] = useMemo(() => {
    const map: { [catId: string]: number } = {};

    filteredTransactions
      .filter((t) => t.type === "despesa")
      .forEach((t) => {
        const catId = t.category_id || "sem-categoria";
        map[catId] = (map[catId] || 0) + Number(t.amount);
      });

    const total = totals.expenses || 1;

    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categoryMap[catId];
        return {
          name: cat?.name || "Sem categoria",
          total: amount,
          color: cat?.color || "#64748b",
          percentage: (amount / total) * 100,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categoryMap, totals.expenses]);

  // Top Fornecedores / Maiores Despesas
  const topExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "despesa")
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 4);
  }, [filteredTransactions]);

  // Ação de Exportar CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Não há dados no período para exportar.");
      return;
    }

    const headers = ["Data", "Descrição", "Tipo", "Categoria", "Conta", "Valor (R$)"];
    const rows = filteredTransactions.map((t) => [
      new Date(t.occurred_at).toLocaleDateString("pt-BR"),
      `"${(t.description || "Sem descrição").replace(/"/g, '""')}"`,
      t.type,
      `"${categoryMap[t.category_id || ""]?.name || "Sem categoria"}"`,
      `"${accountMap[t.account_id]?.name || "Conta"}"`,
      Number(t.amount).toFixed(2).replace(".", ","),
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio-financeiro-${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ação de Exportar PDF
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página e Ações de Exportação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Relatórios & Análise Financeira
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Visão aprofundada sobre receitas, despesas, fluxo de caixa e evolução patrimonial consolidada.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportPDF}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
          >
            <span>📄</span> Exportar PDF
          </button>
          <button
            onClick={handleExportCSV}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-xl hover:bg-emerald-100/70 transition-colors shadow-xs cursor-pointer"
          >
            <span>📊</span> Excel / CSV
          </button>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors shadow-sm cursor-pointer"
          >
            <span>⚙</span> Configurar Metas
          </button>
        </div>
      </div>

      {/* Barra de Filtros Interativos (Período & Contas) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50/80 p-2.5 rounded-2xl border border-gray-200/70">
        {/* Pílulas de Seleção de Período */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: "este-mes", label: "Este Mês" },
              { id: "3-meses", label: "3 Meses" },
              { id: "6-meses", label: periodLabel },
              { id: "ano-atual", label: `Ano Atual (${new Date().getFullYear()})` },
              { id: "personalizado", label: "Personalizado 📅" },
            ] as const
          ).map((tab) => {
            const isActive = selectedPeriod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === "personalizado") {
                    setIsCustomDateModalOpen(true);
                  } else {
                    setSelectedPeriod(tab.id);
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dropdown de Seleção de Conta Bancária */}
        <div className="flex items-center gap-2">
          <div className="relative inline-block w-full sm:w-auto">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="appearance-none w-full sm:w-auto pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">
                Todas as Contas ({accounts.length} conectadas)
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
            {/* Ícone de Banco */}
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
              🏛
            </span>
            {/* Seta de Dropdown */}
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none">
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Grid Superior: 4 Cards de KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Receitas Totais */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Receitas Totais
            </span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              ↗
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {formatCurrency(totals.income)}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>↗ +12,4%</span>
              <span className="text-gray-400 font-normal">vs. período anterior</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Despesas Totais */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Despesas Totais
            </span>
            <span className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center font-bold text-xs">
              ↘
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {formatCurrency(totals.expenses)}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span>↘ -4,8%</span>
              <span className="text-gray-400 font-normal">economia observada</span>
            </p>
          </div>
        </div>

        {/* KPI 3: Economia Líquida */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Economia Líquida
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              🐷
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {totals.netSavings >= 0 ? "+" : ""}
              {formatCurrency(totals.netSavings)}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {totals.savingsRate}% da renda
              </span>
              <span className="text-xs text-gray-400">taxa de poupança</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Evolução Patrimonial */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Evolução Patrimonial
            </span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              📈
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {formatCurrency(totals.accountsBalance)}
            </p>
            <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
              <span>↑ +8,1%</span>
              <span className="text-gray-400 font-normal">retorno consolidado</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Principal: 2 Colunas (Gráficos à Esquerda, Donut e Maiores Gastos à Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Fluxo de Caixa e Evolução Patrimonial */}
        <div className="lg:col-span-2 space-y-6">
          <CashflowChart data={cashflowData} />
          <NetWorthChart
            data={netWorthData}
            currentTotal={totals.accountsBalance}
            accumulatedSavings={totals.netSavings}
            estimatedReturn={Math.max(0, totals.netSavings * 0.05)}
          />
        </div>

        {/* Coluna Direita: Gastos por Categoria e Top Fornecedores */}
        <div className="space-y-6 flex flex-col">
          <div className="flex-1">
            <CategoryDonutChart
              data={categoryExpenses}
              totalExpenses={totals.expenses}
            />
          </div>

          {/* Card: Top Fornecedores / Maiores Despesas */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Top Despesas do Período
              </h3>
              <span className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                Ver todas
              </span>
            </div>

            <div className="space-y-3">
              {topExpenses.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma despesa no período.</p>
              ) : (
                topExpenses.map((exp) => {
                  const cat = categoryMap[exp.category_id || ""];
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                          🏢
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {exp.description || "Despesa"}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {cat?.name || "Sem categoria"} •{" "}
                            {new Date(exp.occurred_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-900 shrink-0 ml-2">
                        {formatCurrency(Number(exp.amount))}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Configurar Metas */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Configurar Metas de Poupança"
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600">
            Defina seu objetivo percentual de poupança sobre as receitas do mês.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Meta de Poupança Desejada (%)
            </label>
            <input
              type="number"
              defaultValue={30}
              min={5}
              max={90}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-900 text-xs leading-relaxed">
            💡 Dica: Especialistas recomendam a regra 50-30-20 (50% para necessidades, 30% para estilo de vida e 20% para investimentos e reservas).
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="primary" onClick={() => setIsGoalModalOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => setIsGoalModalOpen(false)}>
              Salvar Meta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Intervalo Personalizado */}
      <Modal
        isOpen={isCustomDateModalOpen}
        onClose={() => setIsCustomDateModalOpen(false)}
        title="Selecionar Período Personalizado"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="primary"
              onClick={() => setIsCustomDateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (customStartDate && customEndDate) {
                  setSelectedPeriod("personalizado");
                  setIsCustomDateModalOpen(false);
                }
              }}
            >
              Aplicar Filtro
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
