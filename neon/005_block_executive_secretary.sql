-- Opcional: persiste o bloqueio da Secretaria Executiva em bancos existentes.
-- O código já aplica o bloqueio por cargo, sem depender desta atualização.
-- Preserva e-mails, situações e todos os demais dados.
begin;
update public.people set blocked=true where lower(trim(role)) in ('secretária executiva','secretaria executiva');
commit;
