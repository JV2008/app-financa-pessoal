"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/transacoes", label: "Transações/Extrato" },
  { href: "/analise", label: "Análise Financeira" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">

        <div className="flex items-center gap-3">
          <img
            src="/IconApp.png"
            alt="MyFinanceApp"
            width={100}
            height={100}
            className="h-10 w-10 rounded-xl object-cover"
          />

        </div>

      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

    </aside>
  );
}
