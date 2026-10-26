-- Execute uma vez no SQL Editor do Neon, na mesma branch da aplicação.
-- Pode ser reexecutado: preserva os favoritos e os dados existentes.
begin;
create table if not exists public.person_favorites (
 user_id text not null,
 person_id uuid not null references public.people(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,person_id)
);
-- Sem FK para app_members: revogar e reaprovar acesso preserva as preferências.
-- Somente o servidor com a conexão privada do proprietário acessa esta tabela.
revoke all on public.person_favorites from public;
alter table public.person_favorites enable row level security;
commit;
