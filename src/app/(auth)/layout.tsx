import { BarChart3, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-[#0d1210] p-12 lg:flex lg:flex-col">
        <div className="absolute top-0 left-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[14px] bg-primary text-lg font-black text-primary-foreground">F</span><span className="font-semibold">Finance Flow</span></div>
        <div className="relative my-auto max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[.06] px-3 py-1.5 text-[11px] font-semibold text-primary"><Sparkles className="size-3" />Controle sem complicação</span><h1 className="mt-6 font-display text-5xl font-semibold leading-[1.08] tracking-[-.05em]">Seu dinheiro merece mais <span className="text-primary">clareza.</span></h1><p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">Entenda seus hábitos, organize o presente e construa seus planos — tudo em um só lugar.</p>
          <div className="mt-10 grid grid-cols-3 gap-3">{[{ icon: BarChart3, text: "Visão completa" }, { icon: ShieldCheck, text: "Dados seguros" }, { icon: CheckCircle2, text: "Rotina simples" }].map(({ icon: Icon, text }) => <div key={text} className="rounded-2xl border border-border bg-white/[.025] p-4"><Icon className="size-4 text-primary" /><p className="mt-3 text-xs font-medium">{text}</p></div>)}</div>
        </div>
        <p className="relative text-[11px] text-muted-foreground">© {new Date().getFullYear()} Finance Flow. Feito para a vida real.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px]"><div className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-[14px] bg-primary text-lg font-black text-primary-foreground">F</span><span className="font-semibold">Finance Flow</span></div>{children}</div>
      </section>
    </main>
  );
}
