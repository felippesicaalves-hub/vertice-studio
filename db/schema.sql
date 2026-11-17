-- Esquema pronto pra quando o banco Postgres for ligado (Neon/Supabase).
-- Regra: RLS ligado em TODAS as tabelas e nenhuma política pra usuários anônimos/autenticados:
-- só o servidor (papel do dono/service role, via DATABASE_URL guardada na Vercel) lê e grava.
-- Nome, WhatsApp e anotação continuam cifrados pela aplicação (AES-256-GCM) antes de chegar aqui.

create table if not exists leads (
  id          text primary key,
  created_at  timestamptz not null default now(),
  name_enc    text not null,           -- cifrado
  whatsapp_enc text not null,          -- cifrado
  business    text not null default '' check (length(business) <= 120),
  plan        text not null default '' check (length(plan) <= 30),
  status      text not null default 'novo' check (status in ('novo','contatado','fechado','perdido')),
  note_enc    text not null default '', -- cifrado
  consent     boolean not null
);

create table if not exists generations (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  business   text not null check (length(business) <= 120),
  style      text not null,
  own        boolean not null,
  ok         boolean not null
);

create table if not exists admin_audit (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  ip_masked  text not null,
  event      text not null
);

alter table leads        enable row level security;
alter table generations  enable row level security;
alter table admin_audit  enable row level security;
alter table leads        force row level security;
alter table generations  force row level security;
alter table admin_audit  force row level security;

-- Supabase: tira qualquer acesso das chaves públicas (anon/authenticated).
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on leads, generations, admin_audit from anon, authenticated;
  end if;
end $$;

-- Política única: só o papel do servidor (troque "app_server" pelo usuário da sua DATABASE_URL).
-- create policy server_all on leads       for all to app_server using (true) with check (true);
-- create policy server_all on generations for all to app_server using (true) with check (true);
-- create policy server_all on admin_audit for all to app_server using (true) with check (true);

-- LGPD: apagar leads antigos sem contrato depois de 12 meses (rodar num cron).
-- delete from leads where status in ('novo','perdido') and created_at < now() - interval '12 months';
