"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TransactionModalProps {
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; type: "receita" | "despesa" }[];
}

export function TransactionModal({ accounts, categories }: TransactionModalProps) {
  const [type, setType] = useState<"receita" | "despesa">("despesa");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const categoryId = formData.get("categoryId") as string;

    const data = {
      accountId: formData.get("accountId") as string,
      categoryId: categoryId || null,
      type: formData.get("type") as string,
      amount: Number(formData.get("amount")),
      description: formData.get("description") as string,
      occurredAt: formData.get("occurredAt") as string,
    };

    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      form.reset();
      setType("despesa");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nova Transação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Conta */}
            <div>
              <label htmlFor="accountId" className="block text-sm font-medium mb-1">
                Conta
              </label>
              <select
                id="accountId"
                name="accountId"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Tipo
              </label>
              <select
                id="type"
                name="type"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                value={type}
                onChange={(e) => setType(e.target.value as "receita" | "despesa")}
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium mb-1">
                Categoria
              </label>
              <select
                id="categoryId"
                name="categoryId"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sem categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <Input
              id="amount"
              label="Valor"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              required
            />

            {/* Data */}
            <Input
              id="occurredAt"
              label="Data"
              name="occurredAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />

            {/* Descrição */}
            <Input
              id="description"
              label="Descrição"
              name="description"
              placeholder="Ex: Almoço, Salário..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Adicionar Transação"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}