# DITEC Conecta — Vercel + Neon

Diretório corporativo em **Next.js + TypeScript**, com **PostgreSQL e Neon Auth no Neon**. Não precisa de Supabase nem de servidor no Render.

## Funcionalidades

- 112 pessoas do PDF atualizado em 03/06/2026, em 25 agrupamentos.
- 30 contatos originais somente para consulta: os 23 nomes em vermelho do PDF, os 6 superintendentes e a Secretaria Executiva de TI. Gerentes e diretoria aparecem em vermelho; superintendentes, em azul; a Secretaria Executiva, em verde-petróleo.
- Busca por nome, área e e-mail; filtros por área e contatos habilitados.
- Página `/admin` com coluna Opções, edição do e-mail e da situação em modal e exclusão com confirmação.
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

Abra http://localhost:3000/login, entre e acesse **Administração**. Clique em **Opções → Editar**, preencha o e-mail/UPN e clique em **Salvar alterações** no modal. Contatos em vermelho permanecem bloqueados mesmo com e-mail.

### Confirmar o e-mail da conta criada pelo terminal

Na página `/login`, clique em **Confirmar e-mail com código**, informe o e-mail usado no terminal e o código recebido. Se expirou, clique em **Reenviar código** e use o mais recente. Após confirmar, entre com sua senha normalmente. O formulário também aparece automaticamente quando o Neon responde `EMAIL_NOT_VERIFIED` ao tentar entrar.

Configure o Neon Auth para verificação por **código**, com provedor de e-mail habilitado. A confirmação não cria nova conta e não altera a permissão em `app_members`. Não é necessário recriar o administrador.

### Recuperar a senha de uma conta existente

Na página `/login`, clique em **Esqueci minha senha**. Informe o e-mail cadastrado e solicite o link. Ao recebê-lo, abra a página `/reset-password` pelo link, preencha a nova senha e a confirmação e salve. Volte ao login e entre com a nova senha. O link é temporário; se expirar, solicite outro em `/forgot-password`.

A recuperação utiliza os métodos `requestPasswordReset` e `resetPassword` do SDK instalado, os mesmos chamados pelos formulários de recuperação da biblioteca oficial. O envio depende do provedor de e-mail do Neon Auth estar configurado e do domínio da Vercel estar autorizado. Não é necessário alterar o banco ou recriar a conta. Não compartilhe o link de recuperação: ele contém o token que autoriza a troca de senha.

O site retorna mensagem genérica de envio para não informar se um e-mail pertence a uma conta. A nova senha só é aceita com token validado pelo Neon Auth; as permissões do usuário não são modificadas.

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
- A aplicação expõe somente os endpoints de login, sessão, logout, confirmação de e-mail por código e recuperação de senha com token do Auth. Cadastro e gerenciamento de funções não são expostos pelo proxy do site.
- Cada chamada de dados verifica a sessão e consulta `app_members`. Revogar a associação corta o acesso aos dados, mesmo com uma sessão ainda válida.
- O servidor permite alterar somente e-mail, identificação do usuário e ausência/retorno, com consulta parametrizada que também verifica a função `admin` no banco. A exclusão é lógica e também exige administrador.
- `reader` não pode editar nem excluir contatos. Campos de nome, função e bloqueio não são recebidos como alterações.
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
npm run test:contacts
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


## Superintendentes somente para consulta

Os seis superintendentes aparecem em azul e não podem preparar mensagens, mesmo com e-mail cadastrado. O servidor e a interface aplicam a regra pela função `Superintendente`, incluindo bancos antigos que ainda tenham `blocked=false`. O bloqueio entra em vigor após o deploy, sem necessidade de recadastrar contatos.

Opcionalmente, execute `neon/003_block_superintendents.sql` no banco existente para persistir o bloqueio na coluna `blocked`. O script preserva e-mails. Em bancos novos, o seed já inclui os seis superintendentes bloqueados.


## Atualização do admin: situações e exclusão

**Banco existente: execute `neon/004_contact_status.sql` no SQL Editor do Neon.** O script adiciona as colunas de situação, retorno e exclusão, preservando os e-mails e os bloqueios já existentes. Reexecutá-lo é seguro. A lista continua legível no banco antigo; salvar situações e excluir exige essa migração. Em bancos novos, `001_schema.sql` já inclui as colunas.

Em Administração, a coluna **Opções** contém **Editar** e **Excluir**. A edição abre um modal com:

- E-mail do Teams.
- Caixinha **Usuário desconhecido**.
- Caixinha **Usuário não encontrado**. As duas situações de identificação são alternativas: selecionar uma desmarca a outra.
- Dropdown **Usuário ausente?**, com **Não está ausente**, **Ausência temporária** e **Férias**.
- Data de retorno obrigatória ao selecionar ausência ou férias.

Na página inicial, as situações de identificação aparecem sob o nome, em âmbar (desconhecido) ou vermelho (não encontrado). Ausência/férias aparecem com bolinha roxa, descrição e data de retorno. O indicador de ausência desaparece na data de retorno, considerando o horário de Brasília, sem exigir uma tarefa agendada. Essas situações são informativas; não alteram as regras de envio dos cargos. Gerentes e superintendentes continuam bloqueados.

**Excluir** pede confirmação e remove o contato do diretório, das buscas e da administração. A conta de login não é alterada. Os dados são preservados com `deleted_at` para recuperação administrativa; o seed não reativa contatos excluídos. O e-mail pode ser reutilizado por outro contato ativo. Para restaurar pelo SQL Editor, primeiro confira se o e-mail não foi reutilizado e execute:

```sql
update public.people set deleted_at=null where id='ID_DO_CONTATO';
```

Os testes de contatos utilizam somente a demonstração local em memória, sem alterar o banco real ou enviar mensagens no Teams.


## Secretaria Executiva e cadastro manual

A Secretaria Executiva recebe destaque em **verde-petróleo**, aparece primeiro nos cards e fica somente para consulta, mesmo em bancos antigos que indiquem `blocked=false`. O seed já inclui o bloqueio. O script opcional `neon/005_block_executive_secretary.sql` persiste essa marcação no banco existente sem alterar e-mails ou situações.

Em **Administração → Novo contato**, informe nome, área/unidade, cargo e, opcionalmente, o e-mail do Teams. A área oferece sugestões das unidades existentes e permite digitar uma nova. Após salvar, o contato aparece na tabela e no card da respectiva área. As opções de situação podem ser ajustadas depois em Editar.

A criação exige administrador e não cria uma conta de login. O identificador é gerado no servidor; cargos de gestão (Gerente, Superintendente, Diretor e Secretária executiva) são automaticamente bloqueados. O cliente não pode escolher ou remover esse bloqueio. Um e-mail já utilizado por outro contato ativo é recusado.

Não há colunas novas para este cadastro. O banco com a migração 004 aplicada já está preparado. Cadastros manuais e suas situações são preservados ao reexecutar o seed.
