import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountsByUser } from "@/lib/queries/accounts";
import { getBalanceSummary, getMonthlyExpensesByCategory, getTransactionsByUser } from "@/lib/queries/transactions";
import { getCategoriesByUser } from "@/lib/queries/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccountModal } from "@/components/accounts/account-modal";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { FinancialSummaryCard } from "@/components/dashboard/financial-summary-card";



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
      <h1 className="text-3xl font-bold">Inicio</h1>


      {/*Informações do Usuário*/}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</p>
              <p className="text-lg font-semibold text-gray-900">{session?.user?.name || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</p>
              <p className="text-lg font-semibold text-gray-900">{session?.user?.email || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contas Vinculadas</p>
              <p className="text-lg font-semibold text-gray-900">
                {`Possui ${accounts.length} ${accounts.length === 1 ? "conta vinculada" : "contas vinculadas"}`}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                Sair da conta
              </button>
            </form>
          </div>

        </CardContent>
      </Card>


      {/* Contas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Contas Bancárias Vínculadas</h2>
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
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                    {account.type}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: account.currency || "BRL",
                    }).format(account.balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Saldo em conta</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Resumo Financeiro Consolidado */}
      <FinancialSummaryCard
        balance={balance}
        accounts={accounts}
        categories={categories}
      />


      {/* Nova Transação */}
      <TransactionModal accounts={accounts} categories={categories} />


    </div>
  );
}