"use client";

import { Bell, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useFinance } from "@/hooks/use-finance";
import { initials } from "@/lib/utils";

const titles: Record<string, string> = {
  "/transactions": "Lançamentos", "/categories": "Categorias", "/cards": "Meus cartões",
  "/accounts": "Contas", "/budgets": "Orçamentos", "/recurring": "Contas fixas", "/goals": "Metas financeiras", "/reports": "Relatórios", "/settings": "Configurações",
};

export function AppHeader() {
  const pathname = usePathname();
  const { currentUser } = useFinance();
  const firstName = currentUser?.name.split(" ")[0] ?? "";
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <header className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:h-24 lg:px-10">
      <div>
        {pathname === "/dashboard" ? (
          <><p className="text-xs text-muted-foreground">{today}</p><h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Olá{firstName ? `, ${firstName}` : ""} <span className="ml-1">👋</span></h1></>
        ) : (
          <><p className="text-xs text-muted-foreground">Finance Flow</p><h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{titles[pathname] ?? "Finance Flow"}</h1></>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="relative grid size-10 place-items-center rounded-full border border-border bg-surface-1 text-muted-foreground transition hover:text-foreground">
          <Bell className="size-[18px]" /><span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-danger" />
        </button>
        <button className="hidden items-center gap-2 rounded-full border border-border bg-surface-1 p-1.5 pr-3 sm:flex">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-[#66a9ff] text-xs font-bold text-primary-foreground">{currentUser ? initials(currentUser.name) : "—"}</span>
          <span className="text-xs font-semibold">{firstName || "Conta"}</span><ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
