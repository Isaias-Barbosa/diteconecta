-- Execute no SQL Editor do Neon, na mesma branch do Neon Auth.
-- Esta é uma instalação NOVA no Neon, não execute sobre o banco antigo.
begin;
create table if not exists public.app_members (
 user_id text primary key,
 role text not null default 'reader' check (role in ('reader','admin'))
);
create table if not exists public.people (
 id uuid primary key,
 name text not null,
 area text not null,
 email text,
 role text not null,
 blocked boolean not null default false,
 constraint email_format check (email is null or (length(email)<=254 and email ~ '^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+\.[^[:space:]@,;<>]+$'))
);
create unique index if not exists people_unique_email on public.people(lower(email)) where email is not null;
-- Sem acesso público/Data API: somente rotas no servidor usam DATABASE_URL.
revoke all on public.people, public.app_members from public;
commit;
