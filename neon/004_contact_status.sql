-- Execute no SQL Editor do Neon para habilitar edição de situação e exclusão recuperável.
-- Idempotente: preserva nomes, e-mails, permissões e bloqueios já cadastrados.
begin;
alter table public.people add column if not exists user_unknown boolean not null default false;
alter table public.people add column if not exists user_not_found boolean not null default false;
alter table public.people add column if not exists absence_type text;
alter table public.people add column if not exists return_date date;
alter table public.people add column if not exists deleted_at timestamptz;
alter table public.people drop constraint if exists people_identity_status;
alter table public.people add constraint people_identity_status check(not(user_unknown and user_not_found));
alter table public.people drop constraint if exists people_absence_status;
alter table public.people add constraint people_absence_status check(
 (absence_type is null and return_date is null)
 or (absence_type in ('temporary','vacation') and absence_type is not null and return_date is not null)
);
drop index if exists public.people_unique_email;
create unique index people_unique_email on public.people(lower(email)) where email is not null and deleted_at is null;
commit;
