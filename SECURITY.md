# Segurança

## Modelo de acesso

O Finance Flow é single-user. Existem três barreiras independentes:

1. `OWNER_EMAIL` bloqueia outros e-mails no proxy.
2. `app_owner` mantém somente um UUID autorizado no PostgreSQL.
3. Todas as tabelas financeiras usam RLS com `auth.uid()` e `is_app_owner()`.

Depois que TOTP é ativado no app, `app_owner.require_mfa` faz o RLS exigir uma sessão `aal2`. Desabilitar ou contornar a interface não contorna as políticas do banco.

Não existe rota de cadastro ou callback público. O único usuário é criado manualmente no painel do Supabase.

## Dados de extratos

PDF, OFX, CSV e senha de PDF são processados no navegador. Somente os lançamentos confirmados são enviados ao Supabase. O arquivo original não é armazenado.

## Segredos

- A chave publicável/anon do Supabase não é um segredo e depende do RLS.
- Nunca exponha `service_role`, senha do PostgreSQL ou tokens administrativos.
- `.env.local` não deve ser versionado.

## Recuperação de MFA

Se o autenticador for perdido, use o SQL Editor com a conta administrativa protegida por MFA:

```sql
update public.app_owner set require_mfa = false where singleton = true;
```

Remova o fator antigo em Authentication → Users, entre novamente e ative um novo TOTP.

## Dependências

Execute regularmente:

```bash
npm audit
npm test
npm run lint
npm run build
```

Relate vulnerabilidades sem incluir extratos, chaves, tokens ou dados financeiros.
