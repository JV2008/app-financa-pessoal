"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface TransactionFiltersCategoryProps {
    categories: { id: string; name: string }[];
}

export function TransactionFiltersCategory({ categories }: TransactionFiltersCategoryProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentCategoryID = searchParams.get("categoryId") ?? "";

    const handleCategoryChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const params = new URLSearchParams(searchParams.toString());
            const value = e.target.value;

            if (value) {
                params.set("categoryId", value);
            } else {
                params.delete("categoryId");
            }

            router.push(`${pathname}?${params.toString()}`);
        },
        [pathname, router, searchParams]
    );

    return (
        <div className="flex items-center gap-3">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-600">
                Filtrar por categoria:
            </label>
            <select
                id="category-filter"
                value={currentCategoryID}
                onChange={handleCategoryChange}
                className="border rounded px-3 py-1.5 text-sm bg-white"
            >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
