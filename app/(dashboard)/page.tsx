import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountsByUser } from "@/lib/queries/accounts";
import { getBalanceSummary, getMonthlyExpensesByCategory } from "@/lib/queries/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyExpensesChart } from "@/components/charts/monthly-expenses";

export default async function DashboardPage() {
  const session = await auth();

  console.log("DASHBOARD SESSION:", session);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const [accounts, balance, monthlyExpenses] = await Promise.all([
    getAccountsByUser(userId),
    getBalanceSummary(userId),
    getMonthlyExpensesByCategory(userId, new Date().toISOString().slice(0, 7)),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

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

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyExpensesChart data={monthlyExpenses} />
        </CardContent>
      </Card>
    </div>
  );
}
