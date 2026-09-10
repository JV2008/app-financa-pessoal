import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountsByUser } from "@/lib/queries/accounts";
import { getTransactionsByUser } from "@/lib/queries/transactions";
import { getCategoriesByUser } from "@/lib/queries/categories";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalisePage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string; month?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const [accounts, transactions, categories] = await Promise.all([
    getAccountsByUser(userId),
    getTransactionsByUser(userId, { accountId: params.accountId }),
    getCategoriesByUser(userId),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <AnalyticsDashboard
        transactions={transactions as any}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}