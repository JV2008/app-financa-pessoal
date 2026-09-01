import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountsByUser } from "@/lib/queries/accounts";
import { getBalanceSummary } from "@/lib/queries/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const accounts = await getAccountsByUser(session.user.id);
  const balance = await getBalanceSummary(session.user.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contas</h1>
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
      <Card>
        <CardHeader>
          <CardTitle>Saldo Consolidado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance.balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
