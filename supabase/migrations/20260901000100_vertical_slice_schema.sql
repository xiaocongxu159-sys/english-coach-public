begin;

create extension if not exists pgcrypto with schema extensions;

-- Shared curriculum / content structure. These rows are service-managed and
-- learner-readable only after authentication.
create table public.curriculum_versions (
  id text primary key,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'active', 'deprecated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_nodes (
  id text primary key,
  curriculum_version_id text not null references public.curriculum_versions(id) on delete restrict,
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2')),
  domain text not null check (domain in ('grammar', 'communicative_function', 'vocabulary', 'pronunciation', 'listening', 'speaking', 'reading', 'writing')),
  title text not null,
  lifecycle text not null default 'draft' check (lifecycle in ('draft', 'reviewed', 'active', 'deprecated')),
  outcome text,
  source_document text,
  source_section text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_prerequisites (
  node_id text not null references public.knowledge_nodes(id) on delete cascade,
  prerequisite_node_id text not null references public.knowledge_nodes(id) on delete restrict,
  prerequisite_type text not null default 'hard' check (prerequisite_type in ('hard', 'soft')),
  created_at timestamptz not null default now(),
  primary key (node_id, prerequisite_node_id, prerequisite_type),
  check (node_id <> prerequisite_node_id)
);

create table public.lesson_blueprints (
  id text primary key,
  curriculum_version_id text not null references public.curriculum_versions(id) on delete restrict,
  title text not null,
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2')),
  lifecycle text not null default 'draft' check (lifecycle in ('draft', 'reviewed', 'active', 'deprecated')),
  blueprint jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_templates (
  id text primary key,
  curriculum_version_id text not null references public.curriculum_versions(id) on delete restrict,
  lifecycle text not null default 'draft' check (lifecycle in ('draft', 'reviewed', 'active', 'deprecated')),
  template jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_items (
  id text primary key,
  template_id text not null references public.exercise_templates(id) on delete restrict,
  lifecycle text not null default 'draft' check (lifecycle in ('draft', 'reviewed', 'active', 'deprecated')),
  trust_class text not null default 'unvalidated_variant' check (trust_class in ('reviewed_core', 'validated_variant', 'unvalidated_variant', 'exploratory')),
  item jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.system_versions (
  component text primary key,
  version text not null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- One profile is created automatically for each authenticated user.
create table public.learner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  goals jsonb not null default '{}'::jsonb,
  timezone text not null default 'UTC',
  daily_minutes integer not null default 35 check (daily_minutes between 10 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blueprint_id text not null references public.lesson_blueprints(id) on delete restrict,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'abandoned')),
  state jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_instance_id uuid references public.lesson_instances(id) on delete cascade,
  exercise_item_id text not null references public.exercise_items(id) on delete restrict,
  attempt_group_id uuid not null default gen_random_uuid(),
  response jsonb not null default '{}'::jsonb,
  evaluation jsonb not null default '{}'::jsonb,
  evaluator_confidence numeric(4,3) check (evaluator_confidence is null or (evaluator_confidence >= 0 and evaluator_confidence <= 1)),
  assistance_level text not null default 'none' check (assistance_level in ('none', 'minor_prompt', 'major_prompt', 'model_then_repeat')),
  trusted boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.mastery_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null references public.knowledge_nodes(id) on delete restrict,
  attempt_id uuid references public.exercise_attempts(id) on delete set null,
  evidence_type text not null,
  result jsonb not null default '{}'::jsonb,
  evaluator_confidence numeric(4,3) check (evaluator_confidence is null or (evaluator_confidence >= 0 and evaluator_confidence <= 1)),
  assistance_level text not null default 'none' check (assistance_level in ('none', 'minor_prompt', 'major_prompt', 'model_then_repeat')),
  trusted boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.learner_node_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null references public.knowledge_nodes(id) on delete restrict,
  mastery_status text not null default 'unseen' check (mastery_status in ('unseen', 'introduced', 'developing', 'functional', 'secure', 'lapsed')),
  evidence_summary jsonb not null default '{}'::jsonb,
  last_evidence_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, node_id)
);

create table public.review_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null references public.knowledge_nodes(id) on delete restrict,
  scheduler text not null default 'fsrs',
  scheduler_state jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  status text not null default 'active' check (status in ('active', 'paused', 'retired')),
  updated_at timestamptz not null default now(),
  unique (user_id, node_id)
);

create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'superseded')),
  plan jsonb not null,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table public.curriculum_clearance (
  user_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null references public.knowledge_nodes(id) on delete cascade,
  status text not null default 'cleared' check (status in ('cleared', 'revoked')),
  source jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, node_id)
);

create index lesson_instances_user_status_idx on public.lesson_instances(user_id, status);
create index exercise_attempts_user_created_idx on public.exercise_attempts(user_id, created_at desc);
create index mastery_evidence_user_node_created_idx on public.mastery_evidence(user_id, node_id, created_at desc);
create index learner_node_state_user_status_idx on public.learner_node_state(user_id, mastery_status);
create index review_units_user_due_idx on public.review_units(user_id, due_at) where status = 'active';
create index daily_plans_user_date_idx on public.daily_plans(user_id, plan_date desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.learner_profiles (user_id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS is enabled on every table exposed through the public schema.
alter table public.curriculum_versions enable row level security;
alter table public.knowledge_nodes enable row level security;
alter table public.knowledge_prerequisites enable row level security;
alter table public.lesson_blueprints enable row level security;
alter table public.exercise_templates enable row level security;
alter table public.exercise_items enable row level security;
alter table public.system_versions enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.lesson_instances enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.mastery_evidence enable row level security;
alter table public.learner_node_state enable row level security;
alter table public.review_units enable row level security;
alter table public.daily_plans enable row level security;
alter table public.curriculum_clearance enable row level security;

-- Explicit grants: signed-out users receive no access to application tables.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

-- Authenticated learners may read shared reviewed/runtime structure. Writes are
-- service-only so clients cannot activate or mutate curriculum/content.
grant select on public.curriculum_versions,
  public.knowledge_nodes,
  public.knowledge_prerequisites,
  public.lesson_blueprints,
  public.exercise_templates,
  public.exercise_items,
  public.system_versions
  to authenticated;

create policy curriculum_versions_authenticated_read
  on public.curriculum_versions for select to authenticated using (true);
create policy knowledge_nodes_authenticated_read
  on public.knowledge_nodes for select to authenticated using (true);
create policy knowledge_prerequisites_authenticated_read
  on public.knowledge_prerequisites for select to authenticated using (true);
create policy lesson_blueprints_authenticated_read
  on public.lesson_blueprints for select to authenticated using (true);
create policy exercise_templates_authenticated_read
  on public.exercise_templates for select to authenticated using (true);
create policy exercise_items_authenticated_read
  on public.exercise_items for select to authenticated using (true);
create policy system_versions_authenticated_read
  on public.system_versions for select to authenticated using (true);

-- Learners can read their own private state. High-trust learning-state writes
-- are intentionally NOT granted to authenticated clients; server-side product
-- logic performs them after validating the user/session.
grant select on public.learner_profiles,
  public.lesson_instances,
  public.exercise_attempts,
  public.mastery_evidence,
  public.learner_node_state,
  public.review_units,
  public.daily_plans,
  public.curriculum_clearance
  to authenticated;

grant update (display_name, goals, timezone, daily_minutes) on public.learner_profiles to authenticated;

create policy learner_profiles_own_read
  on public.learner_profiles for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy learner_profiles_own_update
  on public.learner_profiles for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy lesson_instances_own_read
  on public.lesson_instances for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy exercise_attempts_own_read
  on public.exercise_attempts for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy mastery_evidence_own_read
  on public.mastery_evidence for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy learner_node_state_own_read
  on public.learner_node_state for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy review_units_own_read
  on public.review_units for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy daily_plans_own_read
  on public.daily_plans for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy curriculum_clearance_own_read
  on public.curriculum_clearance for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Keep service-role access explicit for server-side authoritative operations.
grant all on public.curriculum_versions,
  public.knowledge_nodes,
  public.knowledge_prerequisites,
  public.lesson_blueprints,
  public.exercise_templates,
  public.exercise_items,
  public.system_versions,
  public.learner_profiles,
  public.lesson_instances,
  public.exercise_attempts,
  public.mastery_evidence,
  public.learner_node_state,
  public.review_units,
  public.daily_plans,
  public.curriculum_clearance
  to service_role;

commit;
