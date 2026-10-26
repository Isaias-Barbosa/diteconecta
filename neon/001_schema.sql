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
 user_unknown boolean not null default false,
 user_not_found boolean not null default false,
 absence_type text,
 return_date date,
 deleted_at timestamptz,
 constraint people_identity_status check(not(user_unknown and user_not_found)),
 constraint people_absence_status check((absence_type is null and return_date is null) or (absence_type in ('temporary','vacation') and absence_type is not null and return_date is not null)),
 constraint email_format check (email is null or (length(email)<=254 and email ~ '^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+\.[^[:space:]@,;<>]+$'))
);
create unique index if not exists people_unique_email on public.people(lower(email)) where email is not null and deleted_at is null;
-- Sem acesso público/Data API: somente rotas no servidor usam DATABASE_URL.
revoke all on public.people, public.app_members from public;
commit;
