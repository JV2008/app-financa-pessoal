"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: string;
  type: "receita" | "despesa" | "transferencia";
  description: string | null;
  occurred_at: string;
}

interface TransactionActionsProps {
  transaction: Transaction;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; type: "receita" | "despesa" }[];
}

export function TransactionActions({ transaction, accounts, categories }: TransactionActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<"receita" | "despesa">(
    transaction.type === "transferencia" ? "despesa" : transaction.type
  );
  const router = useRouter();

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const categoryId = formData.get("categoryId") as string;
    const data = {
      accountId: formData.get("accountId") as string,
      categoryId: categoryId || null,
      type: formData.get("type") as string,
      amount: Number(formData.get("amount")),
      description: formData.get("description") as string,
      occurredAt: formData.get("occurredAt") as string,
    };

    // PUT direto no ID existente — substitui a transação, não cria outra
    const res = await fetch(`/api/transactions/${transaction.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setIsLoading(false);

    if (res.ok) {
      setIsEditOpen(false);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    const res = await fetch(`/api/transactions/${transaction.id}`, {
      method: "DELETE",
    });

    setIsLoading(false);

    if (res.ok) {
      setIsDeleteOpen(false);
      router.refresh();
    }
  };

  // Formatar a data para o input date (YYYY-MM-DD)
  const formattedDate = transaction.occurred_at
    ? new Date(transaction.occurred_at).toISOString().split("T")[0]
    : "";

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsEditOpen(true)}
        >
          Editar
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsDeleteOpen(true)}
        >
          Excluir
        </Button>
      </div>

      {/* Modal de Edição */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Transação">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Conta</label>
            <select
              name="accountId"
              className="w-full border rounded px-3 py-2"
              required
              defaultValue={transaction.account_id}
            >
              <option value="">Selecione</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              name="type"
              className="w-full border rounded px-3 py-2"
              required
              value={type}
              onChange={(e) => setType(e.target.value as "receita" | "despesa")}
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select
              name="categoryId"
              className="w-full border rounded px-3 py-2"
              defaultValue={transaction.category_id ?? ""}
            >
              <option value="">Sem categoria</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Valor"
            name="amount"
            type="number"
            step="0.01"
            required
            defaultValue={Number(transaction.amount)}
          />
          <Input
            label="Descrição"
            name="description"
            defaultValue={transaction.description ?? ""}
          />
          <Input
            label="Data"
            name="occurredAt"
            type="date"
            required
            defaultValue={formattedDate}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Excluir Transação">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
          </p>
          <div className="rounded-md bg-gray-50 p-3 text-sm space-y-1">
            <p><span className="font-medium">Descrição:</span> {transaction.description || "—"}</p>
            <p><span className="font-medium">Valor:</span> {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(transaction.amount))}</p>
            <p><span className="font-medium">Tipo:</span> {transaction.type}</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
