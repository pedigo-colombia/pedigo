-- Departamento y municipio (DIVIPOLA / DANE) en direcciones de cliente.
alter table customer_addresses
  add column if not exists department text,
  add column if not exists municipality text;

comment on column customer_addresses.department is 'Nombre del departamento (ej. Cundinamarca)';
comment on column customer_addresses.municipality is 'Nombre del municipio (ej. Bogotá)';
