begin;

-- Harden the Review write boundary so service-role callers cannot accidentally
-- pair a legitimate state-affecting Attempt with the wrong Review Unit or feed
-- an FSRS transition from a stale/forged before-state snapshot.
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
  current_scheduler_state jsonb;
  unit_node_id text;
  unit_evidence_type text;
  unit_content_ref text;
  unit_algorithm_version text;
  unit_library_version text;
  unit_parameters_version text;
  attempt_exercise_item_id text;
  attempt_source_snapshot jsonb;
  attempt_evaluation jsonb;
  attempt_trusted boolean;
  attempt_confidence text;
  expected_content_ref text;
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
  if jsonb_typeof(p_after_state) <> 'object' then
    raise exception 'review after-state must be a JSON object';
  end if;
  if p_before_state is not null and jsonb_typeof(p_before_state) <> 'object' then
    raise exception 'review before-state must be null or a JSON object';
  end if;

  select
    attempt.exercise_item_id,
    attempt.source_snapshot,
    attempt.evaluation,
    attempt.trusted,
    attempt.evaluator_confidence
  into
    attempt_exercise_item_id,
    attempt_source_snapshot,
    attempt_evaluation,
    attempt_trusted,
    attempt_confidence
  from public.exercise_attempts as attempt
  where attempt.id = p_attempt_id
    and attempt.user_id = p_user_id
    and attempt.attempt_group_id = p_attempt_group_id
    and attempt.state_affecting = true;

  if not found then
    raise exception 'review update source attempt is not an authoritative state-affecting attempt';
  end if;

  if attempt_trusted is not true
    or coalesce((attempt_evaluation ->> 'isScored')::boolean, false) is not true
    or coalesce((attempt_evaluation ->> 'mayUpdateReview')::boolean, false) is not true
    or attempt_confidence not in ('high', 'medium') then
    raise exception 'review update source attempt does not pass the frozen Review update gate';
  end if;

  select
    unit.revision,
    unit.scheduler_state,
    unit.node_id,
    unit.evidence_type,
    unit.content_ref,
    unit.algorithm_version,
    unit.library_version,
    unit.parameters_version
  into
    current_revision,
    current_scheduler_state,
    unit_node_id,
    unit_evidence_type,
    unit_content_ref,
    unit_algorithm_version,
    unit_library_version,
    unit_parameters_version
  from public.review_units as unit
  where unit.id = p_review_unit_id
    and unit.user_id = p_user_id
    and unit.lifecycle = 'active'
  for update;

  if not found then
    raise exception 'active review unit not found or ownership mismatch';
  end if;

  expected_content_ref := attempt_exercise_item_id || '@v' ||
    coalesce(attempt_source_snapshot ->> 'itemVersion', '');

  if not (attempt_source_snapshot -> 'targetNodeIds' ? unit_node_id)
    or attempt_source_snapshot ->> 'evidenceType' is distinct from unit_evidence_type
    or expected_content_ref is distinct from unit_content_ref then
    raise exception 'review unit does not match immutable attempt source snapshot';
  end if;

  if p_algorithm_version is distinct from unit_algorithm_version
    or p_library_version is distinct from unit_library_version
    or p_parameters_version is distinct from unit_parameters_version then
    raise exception 'review algorithm/library/parameter version mismatch';
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

  if current_scheduler_state is distinct from p_before_state then
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

update public.system_versions
set metadata = metadata || jsonb_build_object(
  'rpc_attempt_snapshot_binding', true,
  'rpc_review_gate_enforced', true,
  'rpc_before_state_cas', true
),
updated_at = now()
where component = 'review_engine';

commit;
