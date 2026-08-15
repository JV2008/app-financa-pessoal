import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTransactionsByUser } from "@/lib/queries/transactions";
import { getAccountsByUser } from "@/lib/queries/accounts";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { TransactionModal } from "@/components/transactions/transaction-modal";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const [transactions, accounts] = await Promise.all([
    getTransactionsByUser(userId, { month: new Date().toISOString().slice(0, 7) }),
    getAccountsByUser(userId),
  ]);

  const columns = [
    { header: "Data", accessorKey: "occurred_at" as const },
    { header: "Descrição", accessorKey: "description" as const },
    { header: "Tipo", accessorKey: "type" as const, cell: (row: any) => <Badge variant={row.type === "receita" ? "income" : "expense"}>{row.type}</Badge> },
    { header: "Valor", accessorKey: "amount" as const, cell: (row: any) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(row.amount)) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transações</h1>
        <TransactionModal accounts={accounts} />
      </div>
      <DataTable data={transactions} columns={columns} />
    </div>
  );
}
