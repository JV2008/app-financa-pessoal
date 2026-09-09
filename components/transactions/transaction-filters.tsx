"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface TransactionFiltersProps {
  accounts: { id: string; name: string }[];
}

export function TransactionFilters({ accounts }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAccountId = searchParams.get("accountId") ?? "";

  const handleAccountChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      const value = e.target.value;

      if (value) {
        params.set("accountId", value);
      } else {
        params.delete("accountId");
      }

      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="account-filter" className="text-sm font-medium text-gray-600">
        Filtrar por conta:
      </label>
      <select
        id="account-filter"
        value={currentAccountId}
        onChange={handleAccountChange}
        className="border rounded px-3 py-1.5 text-sm bg-white"
      >
        <option value="">Todas as contas</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  );
}
