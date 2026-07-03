"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, CreditCard, LayoutDashboard, Target, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/transactions", label: "Lançamentos", icon: WalletCards },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/settings", label: "Perfil", icon: CircleUserRound },
];

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex h-[68px] items-center justify-around rounded-[22px] border border-white/10 bg-[#141a18]/92 px-1 shadow-[0_12px_45px_rgba(0,0,0,.45)] backdrop-blur-xl lg:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className={cn("flex min-w-14 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-semibold transition", active ? "text-primary" : "text-muted-foreground")}>
            <Icon className={cn("size-5", active && "fill-primary/10 stroke-[2.3]")} />{label}
          </Link>
        );
      })}
    </nav>
  );
}

