"use client";

import { Bell, ChevronRight, Database, LockKeyhole, Moon, UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { useFinance } from "@/hooks/use-finance";
import { initials } from "@/lib/utils";
import { MfaSettings } from "@/components/auth/mfa-settings";

const options = [
  { icon: UserRound, title: "Dados pessoais", description: "Nome, foto e informações da conta" },
  { icon: Bell, title: "Notificações", description: "Alertas de contas, limites e metas" },
  { icon: LockKeyhole, title: "Segurança", description: "Senha e sessões conectadas" },
  { icon: Database, title: "Dados e privacidade", description: "Exportação e exclusão de dados" },
];

export default function SettingsPage() {
  const { currentUser } = useFinance();
  return (
    <>
      <PageHeader title="Seu espaço, suas regras" description="Ajuste o Finance Flow para funcionar do seu jeito." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <Card><CardContent className="text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-[#66a9ff] text-xl font-bold text-primary-foreground">{currentUser ? initials(currentUser.name) : "—"}</span><h3 className="mt-4 font-semibold">{currentUser?.name || "Sua conta"}</h3><p className="mt-1 text-xs text-muted-foreground">{currentUser?.email || ""}</p></CardContent></Card>
        <Card><CardContent className="divide-y divide-border">
          {options.map(({ icon: Icon, title, description }) => <button key={title} className="flex w-full items-center gap-3 py-4 text-left first:pt-0 last:pb-0"><span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-muted-foreground"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{description}</p></div><ChevronRight className="size-4 text-muted-foreground" /></button>)}
        </CardContent></Card>
        <Card className="lg:col-start-2"><CardContent className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-muted-foreground"><Moon className="size-4" /></span><div className="flex-1"><p className="text-sm font-medium">Tema escuro</p><p className="mt-1 text-xs text-muted-foreground">O visual padrão do Finance Flow</p></div><span className="relative h-6 w-11 rounded-full bg-primary"><i className="absolute top-1 right-1 size-4 rounded-full bg-primary-foreground" /></span></CardContent></Card>
        <div className="lg:col-start-2"><MfaSettings /></div>
        <Card className="lg:col-start-2 lg:hidden"><CardContent><LogoutButton /></CardContent></Card>
      </div>
    </>
  );
}
