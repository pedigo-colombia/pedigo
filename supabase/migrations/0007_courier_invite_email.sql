-- Email de invitación para vincular el repartidor con Clerk al registrarse.
alter table couriers add column if not exists invite_email text;

create index if not exists idx_couriers_invite_email
  on couriers (invite_email)
  where clerk_user_id is null and invite_email is not null;
