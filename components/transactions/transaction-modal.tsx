"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TransactionModalProps {
  accounts: { id: string; name: string }[];
}

export function TransactionModal({ accounts }: TransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      accountId: formData.get("accountId") as string,
      type: formData.get("type") as string,
      amount: Number(formData.get("amount")),
      description: formData.get("description") as string,
      occurredAt: formData.get("occurredAt") as string,
    };

    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Nova Transação</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nova Transação">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Conta</label>
            <select name="accountId" className="w-full border rounded px-3 py-2" required>
              <option value="">Selecione</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select name="type" className="w-full border rounded px-3 py-2" required>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <Input label="Valor" name="amount" type="number" step="0.01" required />
          <Input label="Descrição" name="description" />
          <Input label="Data" name="occurredAt" type="date" required />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
