import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const PILOT_REVIEW_BLUEPRINT_PATH =
  "content/pilots/a1-social-formulas-v1/review-blueprint.json";
export const PHASE1_REVIEW_BLUEPRINT_ID = "LESB-A1-SOCIAL-FORMULAS-02";
export const PHASE1_REVIEW_STAGE_ID = "review_retrieval";

const EXPECTED_EVIDENCE = "controlled_production";

export async function loadPilotReviewBlueprint(rootDir) {
  const raw = await readFile(resolve(rootDir, PILOT_REVIEW_BLUEPRINT_PATH), "utf8");
  return {
    blueprint: JSON.parse(raw),
    raw,
    sha256: createHash("sha256").update(raw).digest("hex"),
  };
}

export function validatePilotReviewBlueprint(blueprint) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };

  check(blueprint?.id === PHASE1_REVIEW_BLUEPRINT_ID, "review blueprint id invalid");
  check(
    blueprint?.version === 1 &&
      blueprint?.status === "active" &&
      blueprint?.level === "A1" &&
      blueprint?.lesson_type === "review",
    "review blueprint version/status/level/type invalid",
  );
  const duration = blueprint?.duration_minutes ?? {};
  check(
    Number.isInteger(duration.min) &&
      Number.isInteger(duration.target) &&
      Number.isInteger(duration.max) &&
      duration.min >= 5 &&
      duration.min <= duration.target &&
      duration.target <= duration.max &&
      duration.max <= 8,
    "review blueprint duration must stay inside the reviewed 5-8 minute bound",
  );
  const selection = blueprint?.node_selection ?? {};
  check(
    selection?.primary_count?.min === 0 &&
      selection?.primary_count?.max === 0 &&
      selection?.support_count_max === 0 &&
      selection?.review_count_max === 1 &&
      selection?.require_hard_prerequisites_ready === true,
    "review blueprint must contain zero primary/support nodes and exactly one Review Unit",
  );
  const stages = Array.isArray(blueprint?.stages) ? blueprint.stages : [];
  check(stages.length === 1, "review blueprint must contain exactly one stage");
  const stage = stages[0] ?? {};
  check(
    stage.key === PHASE1_REVIEW_STAGE_ID &&
      stage.kind === "review_retrieval" &&
      stage.required === true &&
      stage.target_role === "review" &&
      stage.ai_content_mode === "reviewed_only",
    "review blueprint stage contract invalid",
  );
  check(
    Array.isArray(stage.evidence_types) &&
      stage.evidence_types.length === 1 &&
      stage.evidence_types[0] === EXPECTED_EVIDENCE,
    "Phase 1 review blueprint must remain controlled-production only",
  );
  check(
    blueprint?.content_policy?.reviewed_core_required === true &&
      blueprint?.content_policy?.ai_variants_allowed === false &&
      blueprint?.content_policy?.scored_ai_variant_policy === "forbidden",
    "review blueprint must remain reviewed-core-only with no scored AI variants",
  );
  check(
    blueprint?.personalization?.forbid_scope_expansion === true &&
      blueprint?.personalization?.learner_interest_allowed === false &&
      blueprint?.personalization?.difficulty_adjustment === "fixed",
    "review blueprint personalization must not expand or vary scored scope",
  );
  check(
    blueprint?.resume_policy?.checkpoint_after_each_stage === true &&
      blueprint?.resume_policy?.preserve_attempts === true,
    "review blueprint must preserve attempt/resume state",
  );

  return { ok: errors.length === 0, errors };
}
