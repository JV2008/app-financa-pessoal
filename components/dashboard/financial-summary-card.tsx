"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}

interface FinancialSummaryCardProps {
  balance: {
    balance: number;
    income: number;
    expenses: number;
  };
  accounts: AccountItem[];
  categories: CategoryItem[];
}

export function FinancialSummaryCard({
  balance,
  accounts,
  categories,
}: FinancialSummaryCardProps) {
  const router = useRouter();

  // Estados dos modais de ação rápida
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"receita" | "despesa">("despesa");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cálculos financeiros
  const totalBalance = balance.balance ?? 0;
  const totalIncome = balance.income ?? 0;
  const totalExpenses = balance.expenses ?? 0;

  // Disponível somado das contas
  const totalInAccounts = accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  const availableAmount = totalInAccounts > 0 ? totalInAccounts : totalBalance;

  // Economia prevista (saldo líquido do mês ou projeção)
  const projectedSavings = totalIncome - totalExpenses;

  // Taxa de poupança sobre a renda
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((projectedSavings / totalIncome) * 100)) : 0;
  const isHealthyEconomy = totalIncome >= totalExpenses && totalBalance >= 0;

  // Formatador de Moeda
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Separação do "R$" e do valor numérico para tipografia destacada
  const formattedBalanceNumber = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(totalBalance));

  const handleOpenTransaction = (type: "receita" | "despesa") => {
    setTransactionType(type);
    setFormError(null);
    setIsTransactionModalOpen(true);
  };

  const handleScrollToAccounts = () => {
    const el = document.getElementById("contas-vinculadas");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const categoryId = formData.get("categoryId") as string;

    const data = {
      accountId: formData.get("accountId") as string,
      categoryId: categoryId || null,
      type: transactionType,
      amount: Number(formData.get("amount")),
      description: formData.get("description") as string,
      occurredAt: formData.get("occurredAt") as string,
    };

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Erro ao salvar transação.");
      }

      form.reset();
      setIsTransactionModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "Ocorreu um erro ao salvar a transação.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === transactionType);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-[#0052cc] via-[#085edd] to-[#0344b3] text-white p-6 sm:p-7 shadow-xl shadow-blue-950/20 border border-blue-400/20">
        {/* Glow decorativo de fundo */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-blue-900/30 rounded-full blur-2xl pointer-events-none" />

        {/* Linha Superior: Saldo Consolidado + Status & Poupança Prevista */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-medium text-blue-50/90 tracking-wide">
                Saldo Total Consolidado
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-blue-100 backdrop-blur-sm border border-white/10">
                {isHealthyEconomy ? "Economia Saudável" : "Atenção aos Gastos"}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white/90">
                {totalBalance < 0 ? "- R$" : "R$"}
              </span>
              <span className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-white">
                {formattedBalanceNumber}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-semibold shadow-inner">
              {/* Ícone de cofrinho / poupança */}
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1c-.2-.7-.6-1.5-1-2z" />
                <path d="M16 9h.01" />
                <path d="M2 10a4 4 0 0 1 4-4" />
              </svg>
              <span>
                {projectedSavings >= 0 ? "+" : ""}
                {formatCurrency(projectedSavings)} previstos
              </span>
            </div>
            <span className="text-xs text-blue-100/80 font-normal">
              Poupança de {savingsRate}% da renda
            </span>
          </div>
        </div>

        {/* Linha Intermediária: Sub-métricas com divisórias sutis */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15 gap-4 sm:gap-0">
          <div className="sm:px-4 sm:first:pl-0">
            <p className="text-xs text-blue-200/90 font-medium">Disponível em Contas</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">
              {formatCurrency(availableAmount)}
            </p>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4">
            <p className="text-xs text-blue-200/90 font-medium">A Pagar no Mês</p>
            <p className="text-base sm:text-lg font-bold text-[#facc15] mt-0.5">
              {formatCurrency(totalExpenses)}
            </p>
          </div>

          <div className="pt-3 sm:pt-0 sm:px-4 sm:last:pr-0">
            <p className="text-xs text-blue-200/90 font-medium">Economia Prevista</p>
            <p className="text-base sm:text-lg font-bold text-[#34d399] mt-0.5">
              {formatCurrency(projectedSavings)}
            </p>
          </div>
        </div>

        {/* Linha Inferior: 4 Botões de Ação Rápida no Estilo Glassmorphism */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Botão: Nova Despesa */}
          <button
            type="button"
            onClick={() => handleOpenTransaction("despesa")}
            className="rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/10 backdrop-blur-xs py-3 px-2 flex flex-col items-center justify-center gap-1.5 text-white transition-all cursor-pointer group shadow-sm"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white/90 group-hover:scale-110 transition-transform">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white/95 text-center">
              + Nova Despesa
            </span>
          </button>

          {/* Botão: Nova Receita */}
          <button
            type="button"
            onClick={() => handleOpenTransaction("receita")}
            className="rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/10 backdrop-blur-xs py-3 px-2 flex flex-col items-center justify-center gap-1.5 text-white transition-all cursor-pointer group shadow-sm"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white/90 group-hover:scale-110 transition-transform">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white/95 text-center">
              + Nova Receita
            </span>
          </button>

          {/* Botão: Conciliar Contas */}
          <button
            type="button"
            onClick={handleScrollToAccounts}
            className="rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/10 backdrop-blur-xs py-3 px-2 flex flex-col items-center justify-center gap-1.5 text-white transition-all cursor-pointer group shadow-sm"
          >
            <div className="w-6 h-6 flex items-center justify-center text-white/90 group-hover:scale-110 transition-transform">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <path d="m9 10 2 2 4-4" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white/95 text-center">
              Conciliar Contas
            </span>
          </button>

          {/* Botão: Metas do Mês */}
          <button
            type="button"
            onClick={() => setIsGoalModalOpen(true)}
            className="rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/10 backdrop-blur-xs py-3 px-2 flex flex-col items-center justify-center gap-1.5 text-white transition-all cursor-pointer group shadow-sm"
          >
            <div className="w-6 h-6 flex items-center justify-center text-white/90 group-hover:scale-110 transition-transform">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-white/95 text-center">
              Metas do Mês
            </span>
          </button>
        </div>
      </div>

      {/* Modal para Lançamento Rápido de Nova Despesa / Receita */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={transactionType === "despesa" ? "Registrar Nova Despesa" : "Registrar Nova Receita"}
      >
        <form onSubmit={handleTransactionSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
              Conta Bancária
            </label>
            <select
              id="accountId"
              name="accountId"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione a conta</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Valor (R$)"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              required
            />
            <Input
              label="Data"
              name="occurredAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sem categoria</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Descrição"
            name="description"
            placeholder={transactionType === "despesa" ? "Ex: Almoço, Combustível, Supermercado" : "Ex: Salário, Rendimento, Freelance"}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsTransactionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : `Adicionar ${transactionType === "despesa" ? "Despesa" : "Receita"}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Metas do Mês */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Metas do Mês"
      >
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-1.5">
              <span>Meta de Poupança (Mês Atual)</span>
              <span className="font-bold text-blue-600">{savingsRate}% atingido</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <span>💡</span> Análise do seu ritmo:
            </p>
            <p className="text-blue-800 leading-relaxed">
              Você já poupou <strong>{formatCurrency(projectedSavings)}</strong> do total de{" "}
              <strong>{formatCurrency(totalIncome)}</strong> em receitas neste mês.
              {savingsRate >= 20 ? (
                " Excelente! Você está acima da recomendação tradicional de poupar pelo menos 20% da renda."
              ) : (
                " Continue acompanhando suas despesas para atingir uma poupança mais robusta."
              )}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsGoalModalOpen(false)}>Entendi</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
