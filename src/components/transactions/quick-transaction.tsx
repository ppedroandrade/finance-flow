"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "./transaction-form";
import { cn } from "@/lib/utils";

export function QuickTransaction({ floating = false, label = "Novo lançamento" }: { floating?: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn(floating && "fixed right-5 bottom-23 z-40 size-14 rounded-full p-0 shadow-[0_12px_35px_rgba(137,240,196,.28)] lg:hidden")}>
          <Plus className="size-5" /><span className={cn(floating && "sr-only")}>{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Novo lançamento</DialogTitle>
        <DialogDescription>Registre em poucos segundos. Você pode ajustar depois.</DialogDescription>
        <TransactionForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

