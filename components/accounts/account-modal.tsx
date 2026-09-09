"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            type: formData.get("type") as string,
            currency: (formData.get("currency") as string) || "BRL",
        };

        try {
            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                setError(body?.error ?? "Não foi possível criar a conta.");
                return;
            }

            setIsOpen(false);
            router.refresh();
        } catch {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Nova Conta</Button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Nova Conta">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Nome" name="name" placeholder="Ex: Conta Corrente Nubank" required />
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select name="type" className="w-full border rounded px-3 py-2" required>
                            <option value="">Selecione</option>
                            <option value="corrente">Corrente</option>
                            <option value="poupanca">Poupança</option>
                            <option value="investimento">Investimento</option>
                        </select>
                    </div>
                    <Input label="Moeda" name="currency" placeholder="BRL" defaultValue="BRL" />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}