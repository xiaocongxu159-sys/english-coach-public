begin;

-- Align runtime database vocabulary with the frozen Mastery/Review contracts.
alter table public.exercise_attempts alter column assistance_level drop default;
update public.exercise_attempts
set assistance_level = 'independent'
where assistance_level = 'none';
alter table public.exercise_attempts
  drop constraint if exists exercise_attempts_assistance_level_check;
alter table public.exercise_attempts
  add constraint exercise_attempts_assistance_level_check
  check (
    assistance_level in (
      'independent',
      'minor_prompt',
      'major_prompt',
      'model_then_repeat'
    )
  );
alter table public.exercise_attempts
  alter column assistance_level set default 'independent';

alter table public.mastery_evidence alter column assistance_level drop default;
update public.mastery_evidence
set assistance_level = 'independent'
where assistance_level = 'none';
alter table public.mastery_evidence
  drop constraint if exists mastery_evidence_assistance_level_check;
alter table public.mastery_evidence
  add constraint mastery_evidence_assistance_level_check
  check (
    assistance_level in (
      'independent',
      'minor_prompt',
      'major_prompt',
      'model_then_repeat'
    )
  );
alter table public.mastery_evidence
  alter column assistance_level set default 'independent';

-- Frozen evidence contracts use confidence labels, not fake-precision decimals.
alter table public.exercise_attempts
  drop constraint if exists exercise_attempts_evaluator_confidence_check;
alter table public.exercise_attempts
  alter column evaluator_confidence type text
  using case
    when evaluator_confidence is null then null
    when evaluator_confidence >= 0.85 then 'high'
    when evaluator_confidence >= 0.60 then 'medium'
    else 'low'
  end;
alter table public.exercise_attempts
  add constraint exercise_attempts_evaluator_confidence_check
  check (
    evaluator_confidence is null
    or evaluator_confidence in ('high', 'medium', 'low')
  );

alter table public.mastery_evidence
  drop constraint if exists mastery_evidence_evaluator_confidence_check;
alter table public.mastery_evidence
  alter column evaluator_confidence type text
  using case
    when evaluator_confidence is null then null
    when evaluator_confidence >= 0.85 then 'high'
    when evaluator_confidence >= 0.60 then 'medium'
    else 'low'
  end;
alter table public.mastery_evidence
  add constraint mastery_evidence_evaluator_confidence_check
  check (
    evaluator_confidence is null
    or evaluator_confidence in ('high', 'medium', 'low')
  );

-- Idempotency and source-trace fields for the authoritative submission pipeline.
alter table public.exercise_attempts
  add column if not exists submission_key text;
alter table public.exercise_attempts
  add column if not exists stage_id text;
alter table public.exercise_attempts
  add column if not exists scenario_tag text;
alter table public.exercise_attempts
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb;
alter table public.exercise_attempts
  add column if not exists state_affecting boolean not null default false;

alter table public.exercise_attempts
  add constraint exercise_attempts_submission_key_length_check
  check (
    submission_key is null
    or char_length(submission_key) between 8 and 120
  );
alter table public.exercise_attempts
  add constraint exercise_attempts_stage_id_length_check
  check (stage_id is null or char_length(stage_id) between 1 and 80);
alter table public.exercise_attempts
  add constraint exercise_attempts_scenario_tag_length_check
  check (scenario_tag is null or char_length(scenario_tag) <= 60);
alter table public.exercise_attempts
  add constraint exercise_attempts_source_snapshot_object_check
  check (jsonb_typeof(source_snapshot) = 'object');
alter table public.exercise_attempts
  add constraint exercise_attempts_user_submission_key_unique
  unique (user_id, submission_key);

-- Backfill a conservative immutable source snapshot for any pre-engine dev attempts.
-- Old attempts remain state-neutral; the engine only marks newly accepted first
-- retrievals as state_affecting.
update public.exercise_attempts as attempt
set source_snapshot = jsonb_build_object(
  'itemVersion', coalesce((item.item ->> 'version')::integer, 1),
  'targetNodeIds', coalesce(item.item -> 'target_node_ids', '[]'::jsonb),
  'evidenceType', item.item ->> 'evidence_type',
  'contentKind', case
    when item.item #>> '{provenance,content_class}' in ('reviewed_core', 'validated_variant')
      then item.item #>> '{provenance,content_class}'
    else 'unscored_practice'
  end,
  'stateEffectPolicy', jsonb_build_object(
    'mayChangeMastery', coalesce(
      (item.item #>> '{state_effect_policy,may_change_mastery}')::boolean,
      false
    ),
    'mayUpdateReview', coalesce(
      (item.item #>> '{state_effect_policy,may_update_review}')::boolean,
      false
    )
  )
)
from public.exercise_items as item
where attempt.exercise_item_id = item.id
  and attempt.source_snapshot = '{}'::jsonb;

-- At most one trusted state update (Mastery and/or Review) may exist per learner
-- attempt group. Concurrent retries can still be stored, but the losing insert
-- is retried by the server as state-neutral practice.
create unique index exercise_attempts_one_state_affecting_per_group_idx
  on public.exercise_attempts (user_id, attempt_group_id)
  where state_affecting;

-- One attempt may emit evidence for several target nodes, but never duplicate
-- the same node/evidence dimension when a request is retried.
alter table public.mastery_evidence
  add constraint mastery_evidence_attempt_node_type_unique
  unique (attempt_id, node_id, evidence_type);

-- Apply derived learner-node state monotonically. Different attempt groups may
-- legitimately arrive concurrently. A derivation based on fewer/older scored
-- evidence events must never overwrite a state already derived from a richer
-- evidence snapshot. Lapse/recovery still work because each new trusted event
-- increases the evidence count before a newer derivation is applied.
create or replace function public.apply_learner_node_state(
  p_user_id uuid,
  p_node_id text,
  p_mastery_status text,
  p_evidence_summary jsonb,
  p_last_evidence_at timestamptz,
  p_updated_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer := 0;
begin
  if p_mastery_status not in (
    'unseen', 'introduced', 'developing', 'functional', 'secure', 'lapsed'
  ) then
    raise exception 'invalid mastery status: %', p_mastery_status;
  end if;

  insert into public.learner_node_state (
    user_id,
    node_id,
    mastery_status,
    evidence_summary,
    last_evidence_at,
    updated_at
  ) values (
    p_user_id,
    p_node_id,
    p_mastery_status,
    p_evidence_summary,
    p_last_evidence_at,
    p_updated_at
  )
  on conflict (user_id, node_id) do update
  set mastery_status = excluded.mastery_status,
      evidence_summary = excluded.evidence_summary,
      last_evidence_at = excluded.last_evidence_at,
      updated_at = excluded.updated_at
  where
    coalesce(
      (public.learner_node_state.evidence_summary #>> '{summary,scored_events}')::integer,
      0
    ) < coalesce((excluded.evidence_summary #>> '{summary,scored_events}')::integer, 0)
    or (
      coalesce(
        (public.learner_node_state.evidence_summary #>> '{summary,scored_events}')::integer,
        0
      ) = coalesce((excluded.evidence_summary #>> '{summary,scored_events}')::integer, 0)
      and coalesce(public.learner_node_state.last_evidence_at, '-infinity'::timestamptz)
        <= coalesce(excluded.last_evidence_at, '-infinity'::timestamptz)
    );

  get diagnostics affected_rows = row_count;
  return affected_rows > 0;
end;
$$;

revoke all on function public.apply_learner_node_state(
  uuid, text, text, jsonb, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_learner_node_state(
  uuid, text, text, jsonb, timestamptz, timestamptz
) to service_role;

insert into public.system_versions (component, version, metadata)
values (
  'learning_engine',
  'p1-engine-001a',
  jsonb_build_object(
    'scope', 'deterministic scoring -> attempt -> evidence -> mastery',
    'attempt_source_snapshot', true,
    'one_state_affecting_attempt_per_group', true,
    'lesson_stage_item_contract_required', true,
    'monotonic_mastery_state_apply', true,
    'review_scheduler', 'deferred_to_p1-engine-001b'
  )
)
on conflict (component) do update
set version = excluded.version,
    metadata = excluded.metadata,
    updated_at = now();

commit;
