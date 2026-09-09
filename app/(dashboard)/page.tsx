import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountsByUser } from "@/lib/queries/accounts";
import { getBalanceSummary, getMonthlyExpensesByCategory, getTransactionsByUser } from "@/lib/queries/transactions";
import { getCategoriesByUser } from "@/lib/queries/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { MonthlyExpensesChart } from "@/components/charts/monthly-expenses";
import { AccountModal } from "@/components/accounts/account-modal";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionActions } from "@/components/transactions/transaction-actions";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ accountId?: string; month?: string }> }) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const userId = session.user.id;
  const [accounts, balance, monthlyExpenses, transactions, categories] = await Promise.all([
    getAccountsByUser(userId),
    getBalanceSummary(userId),
    getMonthlyExpensesByCategory(userId, currentMonth),
    getTransactionsByUser(userId, { month: params.month, accountId: params.accountId }),
    getCategoriesByUser(userId),
  ]);

  // Mapear nomes de conta e categoria para exibição rápida
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const transactionColumns = [
    {
      header: "Data",
      accessorKey: "occurred_at" as const,
      cell: (row: any) => {
        // timeZone: "UTC" evita que o fuso horário subtraia 1 dia
        return new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeZone: "UTC",
        }).format(new Date(row.occurred_at));
      },
    },

    { header: "Descrição", accessorKey: "description" as const },
    {
      header: "Conta",
      accessorKey: "account_id" as const,
      cell: (row: any) => accountMap[row.account_id] ?? "—",
    },
    {
      header: "Categoria",
      accessorKey: "category_id" as const,
      cell: (row: any) => categoryMap[row.category_id] ?? "Sem categoria",
    },
    {
      header: "Tipo",
      accessorKey: "type" as const,
      cell: (row: any) => <Badge variant={row.type === "receita" ? "income" : "expense"}>{row.type}</Badge>,
    },
    {
      header: "Valor",
      accessorKey: "amount" as const,
      cell: (row: any) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(row.amount)),
    },
    {
      header: "Ações",
      accessorKey: "id" as const,
      cell: (row: any) => (
        <TransactionActions
          transaction={row}
          accounts={accounts}
          categories={categories}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance.balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receitas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance.income)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Despesas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance.expenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyExpensesChart data={monthlyExpenses} />
        </CardContent>
      </Card>

      {/* Contas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Contas</h2>
          <AccountModal />
        </div>
        {accounts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma conta cadastrada ainda. Crie uma conta para começar a lançar transações.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <CardTitle>{account.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Tipo: {account.type}</p>
                  <p className="text-sm text-gray-500">Moeda: {account.currency}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Transações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Transações</h2>
          <TransactionModal accounts={accounts} categories={categories} />
        </div>
        <TransactionFilters accounts={accounts} />
        <DataTable data={transactions} columns={transactionColumns} />
      </div>
    </div>
  );
}