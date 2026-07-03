# Finance Flow

Aplicação financeira pessoal single-user.

## Variáveis na Vercel

Com a integração Supabase + Vercel:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
OWNER_EMAIL=seu-email-exato@exemplo.com
```

Sem a integração, use `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Nunca exponha `SUPABASE_SECRET_KEY` no frontend.

## Banco

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Depois crie exatamente um usuário no Supabase Auth e execute `supabase/owner_setup.sql`.
