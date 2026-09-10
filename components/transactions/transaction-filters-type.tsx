"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function TransactionFiltersType() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentType = searchParams.get("type") ?? "";

    const handleTypeChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const params = new URLSearchParams(searchParams.toString());
            const value = e.target.value;

            if (value) {
                params.set("type", value);
            } else {
                params.delete("type");
            }

            router.push(`${pathname}?${params.toString()}`);
        },
        [pathname, router, searchParams]
    );

    return (
        <div className="flex items-center gap-3">
            <label htmlFor="type-filter" className="text-sm font-medium text-gray-600">
                Filtrar por tipo:
            </label>
            <select
                id="type-filter"
                value={currentType}
                onChange={handleTypeChange}
                className="border rounded px-3 py-1.5 text-sm bg-white"
            >
                <option value="">Todos os tipos</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
                <option value="transferencia">Transferência</option>
            </select>
        </div>
    );
}

