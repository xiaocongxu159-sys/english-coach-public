import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { submitExerciseAttempt } from "../src/modules/engine/attempt-service.mts";
import { SupabaseLearningEngineStore } from "../src/modules/engine/supabase-store.mts";

const url =
  process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Review RPC hardening test requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const store = new SupabaseLearningEngineStore(admin);
const suffix = randomUUID().slice(0, 8);
const password = `ReviewRpc-${randomUUID()}-aA1!`;
let learnerId: string | undefined;

const allowedItemsByStage: Record<string, string[]> = {
  recognition_check: ["EI-A1-SOCIAL-RECOGNITION-001"],
  controlled_formulas: ["EI-A1-SOCIAL-CONTROLLED-001"],
};

async function createLesson(userId: string): Promise<string> {
  const { data, error } = await admin
    .from("lesson_instances")
    .insert({
      user_id: userId,
      blueprint_id: "LESB-A1-SOCIAL-FORMULAS-01",
      status: "in_progress",
      started_at: new Date().toISOString(),
      state: { allowed_items_by_stage: allowedItemsByStage },
    })
    .select("id")
    .single();
  assert.equal(error, null, error?.message);
  return data.id;
}

try {
  const created = await admin.auth.admin.createUser({
    email: `review-rpc-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  learnerId = created.data.user.id;
  const lessonId = await createLesson(learnerId);

  const controlled = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lessonId,
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-001",
    submissionKey: `review-rpc-${suffix}-controlled`,
    attemptGroupId: randomUUID(),
    stageId: "controlled_formulas",
    response: { kind: "text", text: "Hello" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(controlled.reviewUpdates.length, 2);

  const recognition = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lessonId,
    exerciseItemId: "EI-A1-SOCIAL-RECOGNITION-001",
    submissionKey: `review-rpc-${suffix}-recognition`,
    attemptGroupId: randomUUID(),
    stageId: "recognition_check",
    response: { kind: "choice", selectedOptionId: "A" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(recognition.reviewUpdates.length, 2);

  const recognitionUnit = await admin
    .from("review_units")
    .select("*")
    .eq("user_id", learnerId)
    .eq("node_id", "VX-A1-SOCIAL-FORMULAS-01")
    .eq("evidence_type", "recognition")
    .eq("content_ref", "EI-A1-SOCIAL-RECOGNITION-001@v1")
    .single();
  assert.equal(recognitionUnit.error, null, recognitionUnit.error?.message);

  const wrongBinding = await admin.rpc("apply_review_update", {
    p_review_unit_id: recognitionUnit.data.id,
    p_user_id: learnerId,
    p_attempt_id: controlled.attempt.id,
    p_attempt_group_id: controlled.attempt.attemptGroupId,
    p_expected_revision: recognitionUnit.data.revision,
    p_grade: "Easy",
    p_before_state: recognitionUnit.data.scheduler_state,
    p_after_state: recognitionUnit.data.scheduler_state,
    p_due_at: recognitionUnit.data.due_at,
    p_review_status: recognitionUnit.data.review_status,
    p_algorithm_version: recognitionUnit.data.algorithm_version,
    p_library_version: recognitionUnit.data.library_version,
    p_parameters_version: recognitionUnit.data.parameters_version,
    p_occurred_at: controlled.attempt.createdAt,
    p_scheduled_at: new Date(
      Math.max(
        Date.parse(controlled.attempt.createdAt),
        Date.parse(recognitionUnit.data.last_review_at) + 1,
      ),
    ).toISOString(),
  });
  assert.ok(wrongBinding.error, "RPC must reject a valid Attempt bound to the wrong Review Unit");
  assert.match(
    wrongBinding.error.message,
    /review unit does not match immutable attempt source snapshot/,
  );

  const controlledUnit = await admin
    .from("review_units")
    .select("*")
    .eq("user_id", learnerId)
    .eq("node_id", "VX-A1-SOCIAL-FORMULAS-01")
    .eq("evidence_type", "controlled_production")
    .eq("content_ref", "EI-A1-SOCIAL-CONTROLLED-001@v1")
    .single();
  assert.equal(controlledUnit.error, null, controlledUnit.error?.message);

  const rawAttemptId = randomUUID();
  const rawGroupId = randomUUID();
  const rawCreatedAt = new Date(
    Date.parse(controlledUnit.data.last_review_at) + 60_000,
  ).toISOString();
  const rawInsert = await admin.from("exercise_attempts").insert({
    id: rawAttemptId,
    user_id: learnerId,
    lesson_instance_id: lessonId,
    exercise_item_id: "EI-A1-SOCIAL-CONTROLLED-001",
    submission_key: `review-rpc-${suffix}-raw-valid`,
    attempt_group_id: rawGroupId,
    stage_id: "controlled_formulas",
    scenario_tag: "everyday_social",
    response: { kind: "text", text: "Hello" },
    evaluation: {
      isScored: true,
      correct: true,
      rating: 4,
      normalizedResponse: "hello",
      evaluator: "deterministic",
      evaluatorConfidence: "high",
      contentKind: "reviewed_core",
      trusted: true,
      mayChangeMastery: true,
      mayUpdateReview: true,
    },
    source_snapshot: {
      itemVersion: 1,
      targetNodeIds: ["CF-A1-SOCIAL-GREET-01", "VX-A1-SOCIAL-FORMULAS-01"],
      evidenceType: "controlled_production",
      contentKind: "reviewed_core",
      stateEffectPolicy: { mayChangeMastery: true, mayUpdateReview: true },
    },
    evaluator_confidence: "high",
    assistance_level: "independent",
    trusted: true,
    state_affecting: true,
    created_at: rawCreatedAt,
  });
  assert.equal(rawInsert.error, null, rawInsert.error?.message);

  const staleBefore = await admin.rpc("apply_review_update", {
    p_review_unit_id: controlledUnit.data.id,
    p_user_id: learnerId,
    p_attempt_id: rawAttemptId,
    p_attempt_group_id: rawGroupId,
    p_expected_revision: controlledUnit.data.revision,
    p_grade: "Easy",
    p_before_state: {},
    p_after_state: controlledUnit.data.scheduler_state,
    p_due_at: controlledUnit.data.due_at,
    p_review_status: controlledUnit.data.review_status,
    p_algorithm_version: controlledUnit.data.algorithm_version,
    p_library_version: controlledUnit.data.library_version,
    p_parameters_version: controlledUnit.data.parameters_version,
    p_occurred_at: rawCreatedAt,
    p_scheduled_at: rawCreatedAt,
  });
  assert.equal(staleBefore.error, null, staleBefore.error?.message);
  assert.equal(staleBefore.data, "conflict");

  const eventCheck = await admin
    .from("review_events")
    .select("id", { count: "exact" })
    .eq("attempt_id", rawAttemptId);
  assert.equal(eventCheck.error, null, eventCheck.error?.message);
  assert.equal(eventCheck.count, 0, "a before-state conflict must not create an audit event");

  console.log(
    "Review RPC hardening passed: database rejects wrong Attempt→Review Unit bindings and stale/forged before-state snapshots even for service-role callers.",
  );
} finally {
  if (learnerId) await admin.auth.admin.deleteUser(learnerId);
}
