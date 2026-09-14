"use client";

import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);

  return (
<<<<<<< HEAD
    <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col md:min-h-screen shrink-0 border-b md:border-b-0 md:border-r border-gray-800 sticky top-0 z-40 md:static">
      {/* Topo da Sidebar / Barra Superior Mobile */}
      <div className="p-4 md:p-6 flex items-center justify-between border-b md:border-b-0 border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h1 className="text-xl font-bold tracking-wide text-white">Finanças</h1>
        </div>
=======
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
>>>>>>> develop

        {/* Botão Hamburger visível apenas em telas menores que md */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
          aria-label="Abrir menu de navegação"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu de Navegação: expandido no mobile quando aberto, e sempre visível em md+ */}
      <div
        className={cn(
          "p-4 space-y-2 flex-1 transition-all duration-200",
          isOpen ? "block bg-gray-900" : "hidden md:block"
        )}
      >
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Ação Sair */}
        <div className="pt-4 mt-4 border-t border-gray-800">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}

