"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthError } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function authErrorMessage(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou senha inválidos";
    case "email_not_confirmed":
      return "Confirme seu e-mail no Supabase antes de entrar";
    case "user_banned":
      return "Esta conta está bloqueada";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente";
    case "request_timeout":
      return "O Supabase demorou para responder. Tente novamente";
  }
  if (error.name === "AuthRetryableFetchError") {
    return "Não foi possível conectar ao Supabase. Verifique sua internet e tente novamente";
  }
  return `Falha no login: ${error.message}`;
}

export function AuthForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [factorId, setFactorId] = useState("");
  const [totpCode, setTotpCode] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp.find((factor) => factor.status === "verified");
      if (verified) setFactorId(verified.id);
    });
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.includes("@") || !password) return toast.error("Preencha seu e-mail e sua senha");
    if (!isSupabaseConfigured()) return toast.error("Configure as variáveis do Supabase para continuar");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return toast.error(authErrorMessage(error));
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp.find((factor) => factor.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (totpCode.length !== 6) return toast.error("Digite o código de 6 números");
    setLoading(true);
    try {
      const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId, code: totpCode });
      if (error) {
        return toast.error(
          error.code === "mfa_challenge_expired"
            ? "O código expirou, digite o novo código gerado pelo app"
            : "Código inválido ou expirado",
        );
      }
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (factorId) return (
    <form onSubmit={verifyMfa} className="mt-8 space-y-4">
      <div><Label htmlFor="totp">Código do autenticador</Label><Input id="totp" value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="text-center text-xl tracking-[.35em]" autoFocus /></div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <>Verificar segundo fator<ShieldCheck className="size-4" /></>}</Button>
    </form>
  );

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div><Label htmlFor="email">E-mail do proprietário</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="seu@email.com" required /></div>
      <div><Label htmlFor="password">Senha</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Sua senha" className="pr-11" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <>Entrar com segurança<ArrowRight className="size-4" /></>}</Button>
      <div className="flex items-start gap-2 pt-2 text-[11px] leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />Acesso restrito ao proprietário configurado. Não existe cadastro público.</div>
    </form>
  );
}
