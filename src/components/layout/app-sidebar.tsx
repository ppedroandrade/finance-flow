"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Gauge, Landmark, LayoutDashboard, Repeat2, Settings, Shapes, Target, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";

const navigation = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/transactions", label: "Lançamentos", icon: WalletCards },
  { href: "/accounts", label: "Contas", icon: Landmark },
  { href: "/categories", label: "Categorias", icon: Shapes },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/recurring", label: "Contas fixas", icon: Repeat2 },
  { href: "/budgets", label: "Orçamentos", icon: Gauge },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-border bg-[#0b100e]/95 px-4 py-6 backdrop-blur-xl lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 px-3">
        <span className="grid size-10 place-items-center rounded-[14px] bg-primary text-primary-foreground shadow-[0_8px_26px_rgba(137,240,196,.18)]">
          <span className="text-xl font-black">F</span>
        </span>
        <div><p className="font-display text-[15px] font-bold tracking-tight">Finance Flow</p><p className="text-[10px] text-muted-foreground">Seu dinheiro em ordem</p></div>
      </Link>
      <nav className="mt-10 space-y-1">
        <p className="mb-3 px-3 text-[10px] font-bold tracking-[.16em] text-muted-foreground/65 uppercase">Organizar</p>
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={cn("group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")}>
              <Icon className={cn("size-[18px]", active && "stroke-[2.2]")} />{label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1 border-t border-border pt-4">
        <Link href="/settings" className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition", pathname === "/settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")}><Settings className="size-[18px]" />Configurações</Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
