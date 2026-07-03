"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { MonthlyEvolutionChart } from "@/components/dashboard/monthly-evolution-chart";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Números que contam uma história" description="Entenda seus hábitos e tome decisões com contexto." action={<Button variant="outline" onClick={() => toast.info("Exportação será conectada ao relatório consolidado")}><Download className="size-4" />Exportar</Button>} />
      <DashboardCards />
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card><CardHeader><div><h3 className="font-semibold">Entradas vs. saídas</h3><p className="mt-1 text-xs text-muted-foreground">Evolução dos últimos seis meses</p></div></CardHeader><CardContent><MonthlyEvolutionChart /></CardContent></Card>
        <Card><CardHeader><div><h3 className="font-semibold">Gastos por categoria</h3><p className="mt-1 text-xs text-muted-foreground">Distribuição deste mês</p></div></CardHeader><CardContent><SpendingChart /></CardContent></Card>
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-[20px] border border-dashed border-border bg-surface-1/50 p-5"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><FileSpreadsheet className="size-5" /></span><div><p className="text-sm font-semibold">Exportação Excel e PDF</p><p className="mt-1 text-xs text-muted-foreground">A estrutura está pronta para receber os geradores de arquivo na próxima fase.</p></div></div>
    </>
  );
}

