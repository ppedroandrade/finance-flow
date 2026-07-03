"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    if (isSupabaseConfigured()) await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };
  return <button onClick={logout} className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-danger/10 hover:text-danger"><LogOut className="size-[18px]" />Sair</button>;
}

