import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InvestmentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Investimentos</h1>
      <p className="text-gray-500">Módulo de investimentos disponível na V2.</p>
    </div>
  );
}
