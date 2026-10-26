-- Opcional para alinhar bancos existentes. O bloqueio já é aplicado pelo código.
-- Preserva os e-mails cadastrados e todos os demais dados.
begin;
update public.people set blocked=true where lower(trim(role))='superintendente';
commit;
