-- Polymath / Ujjivan RM Workspace — database schema
-- Run this in the Supabase SQL editor (or `supabase db push`) to provision the
-- central DB used by F-11 (plan version history) and F-12 (admin analytics).

-- ── F-11: plan version history ────────────────────────────────────────────────
create table if not exists plan_versions (
  id           uuid primary key default gen_random_uuid(),
  client_id    text not null,
  client_name  text not null,
  version      int  not null,
  snapshot     jsonb not null,          -- full PlanSnapshot JSON
  rm_name      text,
  generated_at timestamptz not null default now(),
  unique (client_id, version)
);
create index if not exists plan_versions_client_idx on plan_versions (client_id, version desc);

-- ── F-04 / F-12: session activity log (funnel + activation status) ─────────────
create table if not exists session_log (
  id         uuid primary key default gen_random_uuid(),
  client_id  text,
  rm_name    text,
  event      text not null,             -- 'session_started' | 'plan_generated' | 'activated' | 'deferred' | step name
  metadata   jsonb,
  created_at timestamptz not null default now()
);
create index if not exists session_log_event_idx on session_log (event, created_at desc);

-- ── F-02 / F-12: admin-editable product master ────────────────────────────────
create table if not exists products (
  id         text primary key,
  data       jsonb not null,            -- full ProductMaster JSON
  updated_at timestamptz not null default now()
);

-- ── F-06 / F-12: material events feeding portfolio analysis ────────────────────
create table if not exists material_events (
  id          uuid primary key default gen_random_uuid(),
  product_id  text references products (id) on delete cascade,
  event_type  text not null,            -- 'manager_change' | 'merger' | 'underperformance'
  description text,
  event_date  date,
  created_at  timestamptz not null default now()
);
