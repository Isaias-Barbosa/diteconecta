# DITEC Conecta

Diretório de equipes em **Next.js + TypeScript + Supabase**, preparado para hospedagem na **Vercel**.

## O que já está pronto

- Diretório com busca por nome, área e e-mail; filtros por unidade e contatos habilitados.
- 112 pessoas importadas do PDF “Gestores atualizado 13 1 (1).pdf”, atualizado em 03/06/2026.
- 25 agrupamentos: 22 áreas, superintendências, diretoria e secretaria executiva.
- Os 23 nomes em vermelho ficam visíveis e bloqueados para mensagens, inclusive se tiverem e-mail.
- Administração com tabela de todas as pessoas, edição e limpeza de e-mail, validação e salvamento por linha.
- Modal para escrever a mensagem, copiar o texto e abrir o chat privado no Teams.
- Login por e-mail/senha no Supabase; acesso somente para membros cadastrados; edição somente para administradores.
- RLS no banco e validação no servidor. Nem mesmo o admin pode alterar nomes, funções ou bloqueios por esta interface.
- Layout adaptável a celular e desktop, navegação por teclado e modal nativo com foco contido.

## Como funciona o Teams

O servidor consulta o contato cadastrado e monta um link oficial:

`https://teams.microsoft.com/l/chat/0/0?users=EMAIL&message=TEXTO`

O campo **E-mail do Teams** deve conter o **UserPrincipalName (UPN)**: o endereço usado para entrar na conta corporativa. Ele pode ser diferente do e-mail da caixa postal. Use apenas um destinatário por pessoa.

O link direciona o Teams ao chat privado da conta informada. É necessário estar conectado à organização correta. O usuário confirma o envio no Teams; o site não envia mensagens, não lê conversas e não solicita permissões do Microsoft Graph.

O preenchimento do rascunho depende do cliente Teams e do estado da conversa. O botão **Copiar texto** funciona como alternativa se o aplicativo abrir a conversa sem preservar o texto. O site não sabe se a mensagem foi enviada ou lida e não apresenta status de entrega.

O texto é transportado na URL para o Teams. Nenhuma mensagem é persistida pelo aplicativo. A abertura só acontece quando a pessoa clica no botão; nenhuma mensagem foi enviada durante o desenvolvimento.

Referência oficial: https://learn.microsoft.com/pt-br/microsoftteams/platform/concepts/build-and-test/deep-link-workflow

## 1. Preparar o Supabase

1. Crie um projeto no Supabase.
2. No **SQL Editor**, execute primeiro `supabase/001_schema.sql` e depois `supabase/002_seed.sql`.
3. Em **Authentication → Providers → Email**, mantenha o login por e-mail habilitado. Em **Authentication → Settings**, desative a criação pública de novas contas (Allow new users to sign up). A interface não contém cadastro.
4. Em **Authentication → Users → Add user**, crie seu usuário por e-mail e senha. Use uma conta confirmada ou conclua a confirmação por e-mail antes de entrar.
5. Execute o SQL abaixo, trocando o e-mail pelo da conta que você acabou de criar:

```sql
insert into public.app_members(user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('seu.email@empresa.com.br')
on conflict (user_id) do update set role = excluded.role;
```

Confirme que existe uma linha para sua conta:

```sql
select m.user_id, u.email, m.role
from public.app_members m
join auth.users u on u.id = m.user_id;
```

Para liberar outro usuário somente para consultar e abrir conversas, crie a conta em Authentication e cadastre-a como `reader`:

```sql
insert into public.app_members(user_id, role)
select id, 'reader' from auth.users
where lower(email) = lower('outro.usuario@empresa.com.br')
on conflict (user_id) do update set role = excluded.role;
```

Criar uma conta no Auth não libera o diretório sem esta associação. As funções do aplicativo são atribuídas somente pelo proprietário do banco; usuários não podem se promover a administradores.

**As contas de login no site são diferentes dos contatos do diretório.** Você não precisa criar 112 contas no Supabase Auth. Os contatos do PDF ficam apenas na tabela `people`.

## 2. Executar localmente

Requer Node.js 22 ou superior e npm.

```bash
npm ci
```

Copie `.env.example` para `.env.local` e preencha:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
DEMO_MODE=false
```

A URL está no painel do projeto Supabase. A chave é a **publishable key**, em Settings → API Keys. Projetos que usam a chave pública legada `anon` também podem colocá-la neste campo. **Nunca use `service_role`, secret key ou senha do banco em uma variável NEXT_PUBLIC.**

```bash
npm run dev
```

Abra http://localhost:3000/login. Após entrar, acesse **Administração** e preencha os e-mails. Clique em **Salvar** em cada linha antes de sair da página.

## 3. Publicar na Vercel

1. Crie um repositório GitHub privado e envie o conteúdo desta pasta, sem `node_modules`, `.next` ou `.env.local`.
2. Na Vercel, importe esse repositório. Framework: **Next.js**. Se esta pasta estiver dentro de outro repositório, selecione-a como Root Directory.
3. Cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nas variáveis de ambiente dos ambientes em que usar o sistema.
4. Não habilite `DEMO_MODE` na Vercel. O código também recusa o modo demo em produção.
5. Faça o deploy. Variáveis NEXT_PUBLIC são inseridas no build: após alterá-las, faça novo deploy.
6. Entre pela URL da Vercel com o usuário criado no Supabase.

Não é necessário cadastrar um aplicativo no Entra ID para este método. O login desta versão é do próprio site via Supabase, não é login Microsoft. A conta Microsoft já conectada ao Teams será usada ao abrir o link.

O código foi preparado para Vercel; este pacote não cria projetos ou banco em contas externas automaticamente. A conexão real depende das duas variáveis e da execução dos scripts SQL.

## 4. Validar antes do uso

1. Entre com o admin e confirme os 112 contatos e os 23 bloqueios.
2. Cadastre o UPN de uma pessoa com a qual possa testar e salve.
3. Abra a mesma pessoa no diretório, digite uma mensagem e clique em **Abrir no Teams**.
4. Confira o destinatário e o rascunho. Se preferir, feche sem enviar.
5. Confira que nomes em vermelho não abrem o modal mesmo com e-mail cadastrado.
6. Confira que contatos sem e-mail também não abrem o modal.
7. Entre com um `reader` e verifique que ele pode consultar, mas não editar e-mails.

O acesso real ao Teams e as políticas da organização precisam ser verificados no seu ambiente. O projeto não contorna restrições de contatos externos ou de acesso corporativo.

## Demonstração local sem banco

Para experimentar a interface antes de criar o Supabase, execute em desenvolvimento:

```bash
DEMO_MODE=true npm run dev
```

No PowerShell:

```powershell
$env:DEMO_MODE="true"
npm run dev
```

Abra http://localhost:3000. Um aviso identifica a demonstração. Ela exibe os dados importados e permite salvar e-mails temporários em memória, perdidos ao reiniciar ou recarregar o servidor. Não usa senha nem banco. Use dados de teste. A demonstração é desabilitada em `next build`/`next start`, mesmo com a variável habilitada.

## Segurança e manutenção

- Nenhuma chave administrativa do Supabase é necessária.
- APIs verificam o token do usuário com Supabase Auth e sua associação a `app_members`.
- O banco aplica RLS; somente admins podem atualizar a coluna `email`. Campos de bloqueio, nome e função não têm permissão de escrita para clientes.
- Reexecutar o seed atualiza os dados organizacionais sem apagar e-mails já cadastrados.
- A importação usa IDs estáveis derivados dos nomes. Se uma futura lista mudar a grafia de alguém, revise a correspondência antes de importar para não duplicar o cadastro.
- A cor vermelha foi convertida em `blocked=true`. Não existe cálculo de permissão a partir de CSS.
- Superintendentes em azul e a secretaria executiva permanecem contactáveis após cadastrar o e-mail; os nomes em vermelho, incluindo o diretor, ficam bloqueados.
- A tabela de contatos não representa contas de acesso ao site.
- Revogue acesso removendo a linha de `app_members` correspondente.

## Verificações do projeto

```bash
npm test
npm run typecheck
npm run build
```

Os testes cobrem preservação de acentos e parâmetros na URL, destinatário único, mensagens inválidas, bloqueio com e-mail preenchido, contagem de contatos e consistência da área de adquirência.

## Estrutura

- `app/page.tsx`: diretório.
- `app/admin/page.tsx`: tabela administrativa.
- `app/login/page.tsx`: login.
- `app/api/people/route.ts`: consulta e atualização de e-mails.
- `app/api/teams/route.ts`: validação de contato e geração do link.
- `components/Directory.tsx`: interface e modal.
- `lib/`: Supabase, autorização, tipos e validação dos links.
- `data/people.json`: extração do documento, sem e-mails inventados.
- `supabase/`: schema, políticas e carga inicial.
- `tests/`: testes automatizados.
