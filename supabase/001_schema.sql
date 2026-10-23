-- Execute como proprietário no SQL Editor do Supabase.
begin;
create table if not exists public.app_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
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
alter table public.people enable row level security;
alter table public.app_members enable row level security;
revoke all on public.people, public.app_members from anon, authenticated;
grant select on public.people, public.app_members to authenticated;
-- Somente a coluna e-mail pode ser alterada por usuários do aplicativo.
grant update(email) on public.people to authenticated;
drop policy if exists member_self on public.app_members;
create policy member_self on public.app_members for select to authenticated using (user_id=auth.uid());
drop policy if exists directory_read on public.people;
create policy directory_read on public.people for select to authenticated using (
 exists(select 1 from public.app_members where user_id=auth.uid())
);
drop policy if exists directory_admin_email on public.people;
create policy directory_admin_email on public.people for update to authenticated using (
 exists(select 1 from public.app_members where user_id=auth.uid() and role='admin')
) with check (
 exists(select 1 from public.app_members where user_id=auth.uid() and role='admin')
);
commit;
