# DITEC Conecta — Vercel + Neon

Diretório corporativo em **Next.js + TypeScript**, com **PostgreSQL e Neon Auth no Neon**. Não precisa de Supabase nem de servidor no Render.

## Funcionalidades

- 112 pessoas do PDF atualizado em 03/06/2026, em 25 agrupamentos.
- 23 nomes em vermelho visíveis somente para consulta, sem preparação de mensagens.
- Busca por nome, área e e-mail; filtros por área e contatos habilitados.
- Página `/admin` com todos os contatos para cadastrar, corrigir ou apagar o e-mail/UPN do Teams.
- Modal para digitar, copiar o texto e abrir a conversa privada no Teams.
- Login por e-mail/senha com Neon Auth; permissões `admin` e `reader` no banco.
- Bloqueios e permissões verificados no servidor. Nenhum cadastro público ou promoção de função pela interface.

## 1. Criar o banco e habilitar o Neon Auth

1. Crie um projeto no https://console.neon.tech.
2. Escolha sua branch de produção, normalmente `main`.
3. Em **Connect**, copie a connection string PostgreSQL. Use a opção pooled (`-pooler`) para `DATABASE_URL`, mantendo `sslmode=require`.
4. Na mesma branch, abra **Auth / Better Auth** e habilite o serviço gerenciado. Copie a **Auth URL** em Configuration / Project Info para `NEON_AUTH_BASE_URL`.
5. Habilite o login por e-mail e senha. Configure a verificação de e-mail conforme sua política e confirme as contas quando exigido.
6. Cadastre `http://localhost:3000` nos domínios/origens confiáveis para desenvolvimento. Depois cadastre a URL HTTPS exata da Vercel. Use os campos de domínio confiável do painel; não libere curingas amplos.
7. No **SQL Editor**, execute nesta ordem:
   - `neon/001_schema.sql`
   - `neon/002_seed.sql`

Os scripts são para uma instalação nova no Neon. O schema do Neon Auth é gerenciado pelo próprio Neon e não deve ser criado manualmente. A tabela `app_members` usa o ID de usuário do Neon Auth como texto, sem dependência de `auth.users` ou `auth.uid()` do Supabase.

## 2. Configurar localmente

Requer Node.js 22+ e npm.

```bash
npm ci
```

Copie `.env.example` para `.env.local` e preencha:

```dotenv
DATABASE_URL=postgresql://USUARIO:SENHA@ep-ENDPOINT-pooler.REGIAO.aws.neon.tech/neondb?sslmode=require
NEON_AUTH_BASE_URL=https://ep-ENDPOINT.neonauth.REGIAO.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=SEU_SEGREDO_ALEATORIO_DE_32_OU_MAIS_CARACTERES
APP_URL=http://localhost:3000
DEMO_MODE=false
```

Gere o segredo de cookies localmente:

```bash
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64'))"
```

**Todas essas configurações são do servidor. Não use prefixo `NEXT_PUBLIC_` para connection string, senha ou segredo. Não envie `.env.local` ao GitHub.**

## 3. Criar o primeiro administrador

Com o banco preparado e `.env.local` preenchido, execute:

```bash
npm run user:create
```

O script solicita e-mail, nome, permissão (`admin` ou `reader`) e senha sem exibi-la. Ele cria a conta no Neon Auth e associa seu ID à tabela `app_members`. Execute apenas na sua máquina. O endereço em `APP_URL` deve estar nas origens confiáveis do Neon Auth. O provedor de e-mail/senha deve permitir o provisionamento da conta.

Se a conta já existir no Neon Auth, não execute o cadastro novamente. Libere ou altere a permissão no SQL Editor, usando o ID da conta em Auth → Users:

```sql
insert into public.app_members(user_id,role)
values ('ID_DO_USUARIO_NO_NEON_AUTH','admin')
on conflict(user_id) do update set role=excluded.role;
```

Use `reader` para consulta e preparação de conversas sem editar contatos. Criar uma conta de autenticação não concede acesso automaticamente: a associação em `app_members` é obrigatória. Em caso de falha após criar a conta, use o mesmo SQL para concluir a liberação.

Não existem 112 contas de login: as pessoas do PDF são contatos na tabela `people`. Crie contas de acesso somente para quem vai usar o site.

```bash
npm run dev
```

Abra http://localhost:3000/login, entre e acesse **Administração**. Preencha o e-mail/UPN de cada pessoa e clique em **Salvar** na respectiva linha. Contatos em vermelho permanecem bloqueados mesmo com e-mail.

### Confirmar o e-mail da conta criada pelo terminal

Na página `/login`, clique em **Confirmar e-mail com código**, informe o e-mail usado no terminal e o código recebido. Se expirou, clique em **Reenviar código** e use o mais recente. Após confirmar, entre com sua senha normalmente. O formulário também aparece automaticamente quando o Neon responde `EMAIL_NOT_VERIFIED` ao tentar entrar.

Configure o Neon Auth para verificação por **código**, com provedor de e-mail habilitado. A confirmação não cria nova conta e não altera a permissão em `app_members`. Não é necessário recriar o administrador.

## 4. Atualizar a Vercel

1. Importe o repositório `Isaias-Barbosa/DITEC_Conecta`, ou use o projeto da Vercel já vinculado a ele.
2. Framework: **Next.js**; raiz: a raiz do repositório.
3. Em Settings → Environment Variables, configure:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | Connection string do Neon, com senha e SSL |
| `NEON_AUTH_BASE_URL` | Auth URL da mesma branch do banco |
| `NEON_AUTH_COOKIE_SECRET` | Segredo aleatório com pelo menos 32 caracteres |
| `APP_URL` | URL HTTPS do site na Vercel; usada também por provisionamento local |

4. Remova as antigas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A aplicação não usa mais essas variáveis.
5. Mantenha `DEMO_MODE` ausente ou `false`.
6. Cadastre a URL da Vercel nas origens confiáveis do Neon Auth.
7. Faça novo deploy. Se usar previews, configure banco/Auth e domínio confiável próprios para o ambiente; não copie automaticamente dados de produção para testes.

A aplicação utiliza as funções do próprio Next.js na Vercel. A consulta ao banco usa o driver HTTP do Neon; não há processo permanente a hospedar no Render. O Neon pode suspender compute ocioso e reativá-lo na próxima consulta, com possível demora no primeiro acesso.

## Segurança e permissões

- Login e sessão usam o SDK oficial do Neon Auth e cookies gerenciados pelo servidor.
- A aplicação expõe somente os endpoints de login, sessão, logout e confirmação de e-mail por código do Auth. Cadastro e gerenciamento de funções não são expostos pelo proxy do site.
- Cada chamada de dados verifica a sessão e consulta `app_members`. Revogar a associação corta o acesso aos dados, mesmo com uma sessão ainda válida.
- O servidor permite alteração somente do campo `email`, com uma consulta parametrizada que também verifica a função `admin` no banco.
- `reader` não pode editar e-mails. Campos de nome, função e bloqueio não são recebidos como alterações.
- A connection string fica apenas no servidor. Não habilite acesso público às tabelas via Data API. As consultas usam a conta de banco da `DATABASE_URL`; a autorização desta arquitetura acontece nas rotas e nas condições SQL, não nas antigas políticas RLS do Supabase.
- As tabelas têm permissões públicas revogadas pelo schema. A conexão do servidor deve usar a conta proprietária que executou os scripts, ou uma conta com permissões equivalentes explicitamente configuradas.
- Erros técnicos do banco não são devolvidos aos clientes.
- Para revogar acesso, execute `delete from public.app_members where user_id='ID';` no SQL Editor.

## Contatos e Teams

Use como e-mail o **UserPrincipalName (UPN)** usado para entrar no Teams. Ele pode ser diferente do e-mail da caixa postal.

O botão usa o formato oficial:

`https://teams.microsoft.com/l/chat/0/0?users=EMAIL&message=TEXTO`

O Teams direciona ao privado do destinatário informado. Você precisa estar conectado à organização correta e confirmar o envio lá. O texto do rascunho depende do cliente Teams e do estado da conversa; use **Copiar texto** se o aplicativo não o preservar. O site não envia mensagens, não lê chats, não solicita Graph e não confirma entrega.

## Se já cadastrou e-mails no Supabase

A troca de código não transfere dados de uma conta externa automaticamente. O seed inicia com e-mails vazios. Caso tenha dados no banco antigo, exporte os contatos **antes** de encerrar o Supabase.

Para preservar os e-mails, exporte `id,email` da tabela `people` antiga em CSV. No Neon, crie uma tabela temporária de importação e importe o CSV usando uma ferramenta PostgreSQL que suporte importação. Depois execute:

```sql
begin;
update public.people p
set email=nullif(lower(trim(i.email)),'')
from public.people_email_import i
where p.id=i.id;
commit;
```

A tabela de importação deve ter `id uuid` e `email text`. O update aplica o formato e a unicidade já definidos no banco; resolva erros de duplicidade antes de repetir. Não sobrescreva os campos `blocked`, nome ou função. Reexecutar `002_seed.sql` preserva os e-mails cadastrados no Neon.

Para criar a tabela de importação antes de carregar o CSV:

```sql
create table public.people_email_import(id uuid, email text);
```

As senhas e sessões do Supabase não são transferidas pelo projeto. Recrie no Neon Auth as contas que vão usar o sistema e configure suas permissões em `app_members`.

## Demonstração local sem banco

No bash:

```bash
DEMO_MODE=true npm run dev
```

No PowerShell:

```powershell
$env:DEMO_MODE="true"
npm run dev
```

Abra http://localhost:3000. Um aviso identifica a demonstração. Os e-mails ficam apenas em memória e desaparecem ao reiniciar o servidor. O modo demo não vale em produção, mesmo se a variável estiver habilitada.

## Verificação

```bash
npm test
npm run typecheck
npm run build
npm run test:smoke
```

A conexão real ao banco, o provisionamento de contas e a conversa no Teams devem ser conferidos depois de configurar sua conta Neon. Não foram usados dados de acesso à sua conta durante a migração do código.

## Estrutura

- `app/`: páginas e APIs Next.js.
- `components/Directory.tsx`: diretório, tabela e modal.
- `lib/auth/server.ts`: SDK Neon Auth no servidor.
- `lib/server.ts`: sessão, acesso ao banco e autorização.
- `lib/browser.ts`: cliente de autenticação e chamadas da interface.
- `neon/001_schema.sql`: tabelas.
- `neon/002_seed.sql`: 112 contatos; preserva e-mails em reexecuções.
- `scripts/create-user.mjs`: provisionamento local de contas.
- `tests/`: validações de links e controles de acesso.

Documentação oficial: https://neon.com/docs/auth/quick-start/nextjs-api-only e https://neon.com/docs/serverless/serverless-driver
