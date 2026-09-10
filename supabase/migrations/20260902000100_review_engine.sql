begin;

-- Upgrade the Phase 1 placeholder review_units table into the frozen Review Unit
-- contract. A Knowledge Node may own multiple retrieval instruments, so the old
-- one-row-per-user/node uniqueness is deliberately removed.
alter table public.review_units
  drop constraint if exists review_units_user_id_node_id_key;
alter table public.review_units
  drop constraint if exists review_units_status_check;
alter table public.review_units rename column status to lifecycle;
update public.review_units
set lifecycle = 'suspended'
where lifecycle = 'paused';
alter table public.review_units
  add constraint review_units_lifecycle_check
  check (lifecycle in ('inactive', 'active', 'suspended', 'retired'));

alter table public.review_units
  alter column scheduler_state drop not null;
alter table public.review_units
  alter column scheduler_state drop default;
update public.review_units
set scheduler_state = null
where scheduler_state = '{}'::jsonb;

alter table public.review_units add column review_type text;
alter table public.review_units add column evidence_type text;
alter table public.review_units add column content_ref text;
alter table public.review_units add column content_version integer;
alter table public.review_units add column sibling_group_id text;
alter table public.review_units add column scenario_tag text;
alter table public.review_units add column algorithm_version text;
alter table public.review_units add column library_name text;
alter table public.review_units add column library_version text;
alter table public.review_units add column parameters_version text;
alter table public.review_units
  add column review_status text not null default 'not_scheduled';
alter table public.review_units
  add column revision integer not null default 0;
alter table public.review_units add column last_review_at timestamptz;
alter table public.review_units add column last_grade text;
alter table public.review_units
  add column created_at timestamptz not null default now();
alter table public.review_units add column activated_at timestamptz;
alter table public.review_units add column retired_at timestamptz;

-- Conservative legacy backfill. Phase 1 has no production review state yet, but
-- keeping migration replay safe avoids treating old dev rows as malformed.
update public.review_units
set review_type = coalesce(review_type, 'lexical_retrieval'),
    evidence_type = coalesce(evidence_type, 'recognition'),
    content_ref = coalesce(content_ref, 'legacy:' || id::text),
    sibling_group_id = coalesce(sibling_group_id, node_id || ':legacy'),
    algorithm_version = coalesce(algorithm_version, 'FSRS-6'),
    library_name = coalesce(library_name, 'ts-fsrs'),
    library_version = coalesce(library_version, '5.4.2'),
    parameters_version = coalesce(parameters_version, 'review-v1-default'),
    activated_at = case
      when lifecycle = 'active' then coalesce(activated_at, updated_at)
      else activated_at
    end;

alter table public.review_units alter column review_type set not null;
alter table public.review_units alter column evidence_type set not null;
alter table public.review_units alter column content_ref set not null;
alter table public.review_units alter column sibling_group_id set not null;
alter table public.review_units alter column algorithm_version set not null;
alter table public.review_units alter column library_name set not null;
alter table public.review_units alter column library_version set not null;
alter table public.review_units alter column parameters_version set not null;

alter table public.review_units
  add constraint review_units_scheduler_check check (scheduler = 'fsrs');
alter table public.review_units
  add constraint review_units_review_type_check
  check (
    review_type in (
      'lexical_retrieval',
      'grammar_retrieval',
      'listening_microtask',
      'speaking_retrieval',
      'reading_microtask',
      'writing_retrieval',
      'pronunciation_retrieval',
      'communication_repair'
    )
  );
alter table public.review_units
  add constraint review_units_evidence_type_check
  check (
    evidence_type in (
      'recognition',
      'controlled_production',
      'free_written_production',
      'free_spoken_production',
      'spontaneous_reuse',
      'listening_comprehension',
      'reading_comprehension',
      'pronunciation_intelligibility',
      'communication_repair'
    )
  );
alter table public.review_units
  add constraint review_units_content_ref_length_check
  check (char_length(content_ref) between 1 and 240);
alter table public.review_units
  add constraint review_units_content_version_check
  check (content_version is null or content_version >= 1);
alter table public.review_units
  add constraint review_units_sibling_group_length_check
  check (char_length(sibling_group_id) between 1 and 160);
alter table public.review_units
  add constraint review_units_scenario_tag_length_check
  check (scenario_tag is null or char_length(scenario_tag) <= 60);
alter table public.review_units
  add constraint review_units_scheduler_state_object_check
  check (scheduler_state is null or jsonb_typeof(scheduler_state) = 'object');
alter table public.review_units
  add constraint review_units_review_status_check
  check (
    review_status in (
      'not_scheduled',
      'not_due',
      'due',
      'overdue',
      'relearning',
      'suspended'
    )
  );
alter table public.review_units
  add constraint review_units_revision_check check (revision >= 0);
alter table public.review_units
  add constraint review_units_last_grade_check
  check (last_grade is null or last_grade in ('Again', 'Hard', 'Good', 'Easy'));
alter table public.review_units
  add constraint review_units_identity_unique
  unique (user_id, node_id, evidence_type, content_ref);

create index review_units_user_lifecycle_due_idx
  on public.review_units (user_id, lifecycle, due_at);
create index review_units_user_node_idx
  on public.review_units (user_id, node_id);

-- Immutable audit log for every accepted FSRS state transition. The actual
-- attempt time is kept separately from scheduler_reviewed_at so rare concurrent
-- out-of-order requests can be serialized monotonically without falsifying when
-- the learner's retrieval occurred.
create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_unit_id uuid not null references public.review_units(id) on delete cascade,
  attempt_id uuid not null references public.exercise_attempts(id) on delete cascade,
  attempt_group_id uuid not null,
  grade text not null check (grade in ('Again', 'Hard', 'Good', 'Easy')),
  before_state jsonb,
  after_state jsonb not null,
  due_at timestamptz not null,
  review_status text not null check (
    review_status in (
      'not_scheduled',
      'not_due',
      'due',
      'overdue',
      'relearning',
      'suspended'
    )
  ),
  algorithm_version text not null,
  library_name text not null default 'ts-fsrs',
  library_version text not null,
  parameters_version text not null,
  occurred_at timestamptz not null,
  scheduler_reviewed_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint review_events_before_state_object_check
    check (before_state is null or jsonb_typeof(before_state) = 'object'),
  constraint review_events_after_state_object_check
    check (jsonb_typeof(after_state) = 'object'),
  constraint review_events_attempt_group_unit_unique
    unique (user_id, attempt_group_id, review_unit_id),
  constraint review_events_attempt_unit_unique
    unique (attempt_id, review_unit_id)
);

create index review_events_user_created_idx
  on public.review_events (user_id, created_at desc);
create index review_events_unit_created_idx
  on public.review_events (review_unit_id, created_at desc);

alter table public.review_events enable row level security;
revoke all on public.review_events from anon, authenticated;
grant select on public.review_events to authenticated;
create policy review_events_own_read
  on public.review_events for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
grant all on public.review_events to service_role;

-- Exactly-once + optimistic revision application. Row locking serializes updates
-- for one Review Unit. The attempt-group unique event prevents retry/replay from
-- changing FSRS twice, while revision conflicts let the application recompute
-- from the newest card before trying again.
create or replace function public.apply_review_update(
  p_review_unit_id uuid,
  p_user_id uuid,
  p_attempt_id uuid,
  p_attempt_group_id uuid,
  p_expected_revision integer,
  p_grade text,
  p_before_state jsonb,
  p_after_state jsonb,
  p_due_at timestamptz,
  p_review_status text,
  p_algorithm_version text,
  p_library_version text,
  p_parameters_version text,
  p_occurred_at timestamptz,
  p_scheduled_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_revision integer;
begin
  if p_grade not in ('Again', 'Hard', 'Good', 'Easy') then
    raise exception 'invalid review grade: %', p_grade;
  end if;
  if p_review_status not in (
    'not_scheduled', 'not_due', 'due', 'overdue', 'relearning', 'suspended'
  ) then
    raise exception 'invalid review status: %', p_review_status;
  end if;
  if p_scheduled_at < p_occurred_at then
    raise exception 'scheduler review time cannot precede actual attempt time';
  end if;
  if not exists (
    select 1
    from public.exercise_attempts as attempt
    where attempt.id = p_attempt_id
      and attempt.user_id = p_user_id
      and attempt.attempt_group_id = p_attempt_group_id
      and attempt.state_affecting = true
  ) then
    raise exception 'review update source attempt is not an authoritative state-affecting attempt';
  end if;

  select unit.revision
  into current_revision
  from public.review_units as unit
  where unit.id = p_review_unit_id
    and unit.user_id = p_user_id
    and unit.lifecycle = 'active'
  for update;

  if not found then
    raise exception 'active review unit not found or ownership mismatch';
  end if;

  if exists (
    select 1
    from public.review_events as event
    where event.user_id = p_user_id
      and event.attempt_group_id = p_attempt_group_id
      and event.review_unit_id = p_review_unit_id
  ) then
    return 'duplicate';
  end if;

  if current_revision <> p_expected_revision then
    return 'conflict';
  end if;

  insert into public.review_events (
    user_id,
    review_unit_id,
    attempt_id,
    attempt_group_id,
    grade,
    before_state,
    after_state,
    due_at,
    review_status,
    algorithm_version,
    library_name,
    library_version,
    parameters_version,
    occurred_at,
    scheduler_reviewed_at
  ) values (
    p_user_id,
    p_review_unit_id,
    p_attempt_id,
    p_attempt_group_id,
    p_grade,
    p_before_state,
    p_after_state,
    p_due_at,
    p_review_status,
    p_algorithm_version,
    'ts-fsrs',
    p_library_version,
    p_parameters_version,
    p_occurred_at,
    p_scheduled_at
  );

  update public.review_units
  set scheduler_state = p_after_state,
      due_at = p_due_at,
      review_status = p_review_status,
      algorithm_version = p_algorithm_version,
      library_name = 'ts-fsrs',
      library_version = p_library_version,
      parameters_version = p_parameters_version,
      revision = revision + 1,
      last_review_at = p_scheduled_at,
      last_grade = p_grade,
      updated_at = now()
  where id = p_review_unit_id
    and user_id = p_user_id;

  return 'applied';
end;
$$;

revoke all on function public.apply_review_update(
  uuid, uuid, uuid, uuid, integer, text, jsonb, jsonb, timestamptz, text,
  text, text, text, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_review_update(
  uuid, uuid, uuid, uuid, integer, text, jsonb, jsonb, timestamptz, text,
  text, text, text, timestamptz, timestamptz
) to service_role;

insert into public.system_versions (component, version, metadata)
values (
  'review_engine',
  'p1-engine-001b',
  jsonb_build_object(
    'algorithm', 'FSRS-6',
    'library', 'ts-fsrs',
    'library_version', '5.4.2',
    'parameters_version', 'review-v1-default',
    'request_retention', 0.90,
    'short_term_retry_owner', 'lesson_engine',
    'attempt_group_exactly_once', true,
    'revision_cas', true,
    'immutable_review_events', true,
    'monotonic_scheduler_time', true
  )
)
on conflict (component) do update
set version = excluded.version,
    metadata = excluded.metadata,
    updated_at = now();

commit;
