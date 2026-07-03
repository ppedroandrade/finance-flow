"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function MfaSettings() {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    void createClient().auth.mfa.listFactors().then(({ data }) => {
      setActive(Boolean(data?.totp.some((factor) => factor.status === "verified")));
      setLoading(false);
    });
  }, []);

  const enroll = async () => {
    setLoading(true);
    const { data, error } = await createClient().auth.mfa.enroll({ factorType: "totp", friendlyName: "Finance Flow" });
    setLoading(false);
    if (error) return toast.error(error.message);
    setFactorId(data.id); setQrCode(data.totp.qr_code); setSecret(data.totp.secret);
  };

  const verify = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (!error) {
      const { error: enforcementError } = await supabase.rpc("enable_owner_mfa");
      if (enforcementError) { setLoading(false); return toast.error("MFA ativado, mas a exigência no banco falhou"); }
    }
    setLoading(false);
    if (error) return toast.error("Código inválido ou expirado");
    setActive(true); setQrCode(""); setSecret(""); toast.success("Autenticação em dois fatores ativada");
  };

  return (
    <div className="rounded-[22px] border border-border bg-surface-1 p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">{loading ? <LoaderCircle className="size-4 animate-spin" /> : active ? <ShieldCheck className="size-4" /> : <KeyRound className="size-4" />}</span><div className="flex-1"><p className="text-sm font-semibold">Autenticação em dois fatores</p><p className="mt-1 text-xs text-muted-foreground">{active ? "Ativa e exigida também pelas políticas do banco." : "Proteja o acesso com um aplicativo autenticador."}</p></div>{!active && !factorId && <Button size="sm" onClick={enroll} disabled={loading}>Ativar</Button>}</div>
      {qrCode && <div className="mt-5 rounded-2xl bg-white p-4 text-[#101412]"><div className="flex flex-col items-center gap-4 sm:flex-row"><Image src={qrCode} alt="QR Code para configurar o autenticador" width={160} height={160} unoptimized className="size-40" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Escaneie no seu autenticador</p><p className="mt-1 text-xs text-black/60">1Password, Google Authenticator, Authy ou similar.</p><p className="mt-3 break-all rounded-lg bg-black/5 p-2 font-mono text-[10px]">{secret}</p><Label htmlFor="mfa-code" className="mt-3 text-black/60">Código de confirmação</Label><div className="flex gap-2"><Input id="mfa-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="border-black/10 bg-black/5 text-black" /><Button onClick={verify} disabled={code.length !== 6 || loading}>Confirmar</Button></div></div></div></div>}
    </div>
  );
}
