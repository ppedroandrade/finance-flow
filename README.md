# Finance Flow

Aplicação financeira pessoal single-user.

## Variáveis na Vercel

Com a integração Supabase + Vercel, o próprio painel já injeta a URL e a chave
publicável com prefixo do nome do projeto (ex.: `financeflow_SUPABASE_URL`,
`NEXT_PUBLIC_financeflow_SUPABASE_ANON_KEY`). O `next.config.ts` detecta essas
variáveis automaticamente por sufixo, não importa o prefixo usado. Você só
precisa adicionar manualmente, em Project Settings → Environment Variables:

```env
OWNER_EMAIL=seu-email-exato@exemplo.com
```

Sem a integração, defina `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` (ou
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`) você mesmo.

Nunca exponha `SUPABASE_SECRET_KEY` nem `SUPABASE_SERVICE_ROLE_KEY` no frontend —
o código nunca os mapeia para `NEXT_PUBLIC_*`.

## Banco

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Depois crie exatamente um usuário no Supabase Auth e execute `supabase/owner_setup.sql`.
