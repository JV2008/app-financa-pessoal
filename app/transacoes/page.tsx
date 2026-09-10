import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountsByUser } from "@/lib/queries/accounts";
import { getBalanceSummary, getMonthlyExpensesByCategory, getTransactionsByUser } from "@/lib/queries/transactions";
import { getCategoriesByUser } from "@/lib/queries/categories";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionActions } from "@/components/transactions/transaction-actions";
import { TransactionFiltersCategory } from "@/components/transactions/transaction-filters-category";
import { TransactionFiltersType } from "@/components/transactions/transaction-filters-type";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ accountId?: string; month?: string; categoryId?: string; type?: string }> }) {
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
        getTransactionsByUser(userId, { month: params.month, accountId: params.accountId, categoryId: params.categoryId, type: params.type }),
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
            <h1 className="text-3xl font-bold">Transações/Extrato</h1>





            {/* Transações */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                    <TransactionFiltersCategory categories={categories} />
                    <TransactionFilters accounts={accounts} />
                    <TransactionFiltersType />
                </div>
                <DataTable data={transactions} columns={transactionColumns} />
            </div>
        </div>
    );
}