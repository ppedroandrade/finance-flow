import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Entrar" };
export default function LoginPage() { return <><p className="text-xs font-semibold text-primary">ACESSO PRIVADO</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-[-.04em]">Finance Flow pessoal</h1><p className="mt-2 text-sm text-muted-foreground">Somente o proprietário autorizado pode entrar.</p><AuthForm /></>; }
