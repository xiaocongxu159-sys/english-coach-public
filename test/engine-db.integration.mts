import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { submitExerciseAttempt } from "../src/modules/engine/attempt-service.mts";
import { SupabaseLearningEngineStore } from "../src/modules/engine/supabase-store.mts";

const url =
  process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Engine DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const store = new SupabaseLearningEngineStore(admin);
const suffix = randomUUID().slice(0, 8);
const password = `Engine-${randomUUID()}-aA1!`;
let cleanupUserId: string | undefined;
let cleanupOtherUserId: string | undefined;
let originalControlledItem:
  | { lifecycle: string; trust_class: string; item: Record<string, unknown> }
  | undefined;

const allowedItemsByStage: Record<string, string[]> = {
  recognition_check: [
    "EI-A1-SOCIAL-RECOGNITION-001",
    "EI-A1-SOCIAL-RECOGNITION-002",
    "EI-A1-SOCIAL-RECOGNITION-003",
    "EI-A1-SOCIAL-RECOGNITION-004",
    "EI-A1-SOCIAL-RECOGNITION-005",
  ],
  controlled_formulas: [
    "EI-A1-SOCIAL-CONTROLLED-001",
    "EI-A1-SOCIAL-CONTROLLED-002",
    "EI-A1-SOCIAL-CONTROLLED-003",
    "EI-A1-SOCIAL-CONTROLLED-004",
    "EI-A1-SOCIAL-CONTROLLED-005",
  ],
  speaking_rehearsal: ["EI-A1-SOCIAL-SPEAK-001"],
};

async function createLesson(ownerId: string): Promise<string> {
  const { data, error } = await admin
    .from("lesson_instances")
    .insert({
      user_id: ownerId,
      blueprint_id: "LESB-A1-SOCIAL-FORMULAS-01",
      status: "in_progress",
      started_at: new Date().toISOString(),
      state: {
        engine_test: true,
        allowed_items_by_stage: allowedItemsByStage,
      },
    })
    .select("id")
    .single();
  assert.equal(error, null, error?.message);
  return data.id;
}

try {
  const created = await admin.auth.admin.createUser({
    email: `engine-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  const learnerId = created.data.user.id;
  cleanupUserId = learnerId;

  const other = await admin.auth.admin.createUser({
    email: `engine-other-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(other.error, null, other.error?.message);
  const otherLearnerId = other.data.user.id;
  cleanupOtherUserId = otherLearnerId;

  const lesson1 = await createLesson(learnerId);
  const group1 = randomUUID();
  const firstInput = {
    userId: learnerId,
    lessonInstanceId: lesson1,
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-001",
    submissionKey: `engine-${suffix}-controlled-1`,
    attemptGroupId: group1,
    stageId: "controlled_formulas",
    response: { kind: "text" as const, text: "  HELLO!!! " },
    assistance: "independent" as const,
    scenarioTag: "everyday_social",
  };

  const first = await submitExerciseAttempt(store, firstInput);
  assert.equal(first.replayed, false);
  assert.equal(first.emittedEvidence, 2);
  assert.equal(first.attempt.stateAffecting, true);
  assert.equal(first.attempt.sourceSnapshot.itemVersion, 1);
  assert.deepEqual(first.attempt.sourceSnapshot.targetNodeIds, [
    "CF-A1-SOCIAL-GREET-01",
    "VX-A1-SOCIAL-FORMULAS-01",
  ]);
  assert.equal(
    first.mastery["VX-A1-SOCIAL-FORMULAS-01"].state,
    "developing",
  );
  assert.equal(
    first.mastery["CF-A1-SOCIAL-GREET-01"].state,
    "developing",
  );

  const persistedAttempt = await admin
    .from("exercise_attempts")
    .select(
      "id,assistance_level,evaluator_confidence,stage_id,scenario_tag,source_snapshot,state_affecting",
    )
    .eq("id", first.attempt.id)
    .single();
  assert.equal(persistedAttempt.error, null, persistedAttempt.error?.message);
  assert.equal(persistedAttempt.data.assistance_level, "independent");
  assert.equal(persistedAttempt.data.evaluator_confidence, "high");
  assert.equal(persistedAttempt.data.stage_id, "controlled_formulas");
  assert.equal(persistedAttempt.data.scenario_tag, "everyday_social");
  assert.equal(persistedAttempt.data.state_affecting, true);
  assert.equal(persistedAttempt.data.source_snapshot.itemVersion, 1);
  assert.equal(
    persistedAttempt.data.source_snapshot.evidenceType,
    "controlled_production",
  );

  const replay = await submitExerciseAttempt(store, firstInput);
  assert.equal(replay.replayed, true);
  assert.equal(replay.attempt.id, first.attempt.id);
  assert.equal(replay.emittedEvidence, 0);

  const evidenceBeforeRepair = await admin
    .from("mastery_evidence")
    .select("id,node_id")
    .eq("attempt_id", first.attempt.id);
  assert.equal(
    evidenceBeforeRepair.error,
    null,
    evidenceBeforeRepair.error?.message,
  );
  assert.equal(evidenceBeforeRepair.data.length, 2);

  const originalItemRead = await admin
    .from("exercise_items")
    .select("lifecycle,trust_class,item")
    .eq("id", firstInput.exerciseItemId)
    .single();
  assert.equal(originalItemRead.error, null, originalItemRead.error?.message);
  const originalRow = originalItemRead.data as {
    lifecycle: string;
    trust_class: string;
    item: Record<string, unknown>;
  };
  originalControlledItem = originalRow;

  const deletion = await admin
    .from("mastery_evidence")
    .delete()
    .eq("attempt_id", first.attempt.id)
    .eq("node_id", "VX-A1-SOCIAL-FORMULAS-01");
  assert.equal(deletion.error, null, deletion.error?.message);

  const changedItem = {
    ...originalRow.item,
    version: 99,
    status: "deprecated",
    target_node_ids: ["CF-A1-SOCIAL-GREET-01"],
    evidence_type: "free_spoken_production",
  };
  const drift = await admin
    .from("exercise_items")
    .update({ lifecycle: "deprecated", item: changedItem })
    .eq("id", firstInput.exerciseItemId);
  assert.equal(drift.error, null, drift.error?.message);

  const repaired = await submitExerciseAttempt(store, firstInput);
  assert.equal(repaired.replayed, true);
  assert.equal(
    repaired.emittedEvidence,
    1,
    "retry must repair only the missing evidence row from the immutable attempt snapshot",
  );
  const repairedEvidence = await admin
    .from("mastery_evidence")
    .select("evidence_type,result")
    .eq("attempt_id", first.attempt.id)
    .eq("node_id", "VX-A1-SOCIAL-FORMULAS-01")
    .single();
  assert.equal(repairedEvidence.error, null, repairedEvidence.error?.message);
  assert.equal(repairedEvidence.data.evidence_type, "controlled_production");
  assert.equal(
    repairedEvidence.data.result.source.content_ref,
    "EI-A1-SOCIAL-CONTROLLED-001@v1",
  );

  const restore = await admin
    .from("exercise_items")
    .update(originalRow)
    .eq("id", firstInput.exerciseItemId);
  assert.equal(restore.error, null, restore.error?.message);
  originalControlledItem = undefined;

  const finishLesson1 = await admin
    .from("lesson_instances")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", lesson1);
  assert.equal(finishLesson1.error, null, finishLesson1.error?.message);
  const replayAfterCompletion = await submitExerciseAttempt(store, firstInput);
  assert.equal(replayAfterCompletion.replayed, true);
  assert.equal(replayAfterCompletion.emittedEvidence, 0);

  await assert.rejects(
    () =>
      submitExerciseAttempt(store, {
        ...firstInput,
        submissionKey: `engine-${suffix}-completed-new`,
        attemptGroupId: randomUUID(),
      }),
    /lesson is not accepting new attempts/,
  );

  const lesson2 = await createLesson(learnerId);
  await assert.rejects(
    () =>
      submitExerciseAttempt(store, {
        userId: learnerId,
        lessonInstanceId: lesson2,
        exerciseItemId: "EI-A1-SOCIAL-RECOGNITION-001",
        submissionKey: `engine-${suffix}-wrong-stage`,
        attemptGroupId: randomUUID(),
        stageId: "controlled_formulas",
        response: { kind: "choice", selectedOptionId: "A" },
        assistance: "independent",
        scenarioTag: "everyday_social",
      }),
    /exercise item is not allowed in lesson stage/,
  );

  await assert.rejects(
    () =>
      submitExerciseAttempt(store, {
        ...firstInput,
        lessonInstanceId: lesson2,
        response: { kind: "text", text: "Bye" },
      }),
    /idempotency conflict/,
  );

  await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lesson2,
    exerciseItemId: "EI-A1-SOCIAL-RECOGNITION-001",
    submissionKey: `engine-${suffix}-recognition-1`,
    attemptGroupId: randomUUID(),
    stageId: "recognition_check",
    response: { kind: "choice", selectedOptionId: "A" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });

  const functional = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lesson2,
    exerciseItemId: "EI-A1-SOCIAL-RECOGNITION-005",
    submissionKey: `engine-${suffix}-recognition-2`,
    attemptGroupId: randomUUID(),
    stageId: "recognition_check",
    response: { kind: "choice", selectedOptionId: "A" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(
    functional.mastery["VX-A1-SOCIAL-FORMULAS-01"].state,
    "functional",
  );
  assert.equal(
    functional.mastery["VX-A1-SOCIAL-FORMULAS-01"].prerequisiteReady,
    true,
  );
  assert.equal(
    functional.mastery["CF-A1-SOCIAL-GREET-01"].state,
    "developing",
  );

  const spoken = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lesson2,
    exerciseItemId: "EI-A1-SOCIAL-SPEAK-001",
    submissionKey: `engine-${suffix}-spoken-practice`,
    attemptGroupId: randomUUID(),
    stageId: "speaking_rehearsal",
    response: { kind: "practice", completed: true },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(spoken.reviewCandidate, false);
  assert.equal(spoken.emittedEvidence, 0);
  assert.equal(spoken.attempt.stateAffecting, false);

  const fail1 = await submitExerciseAttempt(store, {
    ...firstInput,
    lessonInstanceId: lesson2,
    submissionKey: `engine-${suffix}-failure-1`,
    attemptGroupId: randomUUID(),
    response: { kind: "text", text: "Goodbye" },
  });
  assert.equal(
    fail1.mastery["VX-A1-SOCIAL-FORMULAS-01"].state,
    "functional",
  );

  const fail2 = await submitExerciseAttempt(store, {
    ...firstInput,
    lessonInstanceId: lesson2,
    submissionKey: `engine-${suffix}-failure-2`,
    attemptGroupId: randomUUID(),
    response: { kind: "text", text: "Goodbye" },
  });
  assert.equal(
    fail2.mastery["VX-A1-SOCIAL-FORMULAS-01"].state,
    "lapsed",
  );
  assert.equal(
    fail2.mastery["VX-A1-SOCIAL-FORMULAS-01"].prerequisiteReady,
    false,
  );

  const otherLesson = await createLesson(otherLearnerId);
  const retryGroup = randomUUID();
  const retryFirst = await submitExerciseAttempt(store, {
    userId: otherLearnerId,
    lessonInstanceId: otherLesson,
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-002",
    submissionKey: `engine-${suffix}-retry-first`,
    attemptGroupId: retryGroup,
    stageId: "controlled_formulas",
    response: { kind: "text", text: "Hello" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(retryFirst.emittedEvidence, 1);
  assert.equal(retryFirst.attempt.stateAffecting, true);

  const retrySecond = await submitExerciseAttempt(store, {
    userId: otherLearnerId,
    lessonInstanceId: otherLesson,
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-002",
    submissionKey: `engine-${suffix}-retry-second`,
    attemptGroupId: retryGroup,
    stageId: "controlled_formulas",
    response: { kind: "text", text: "Thank you" },
    assistance: "minor_prompt",
    scenarioTag: "everyday_social",
  });
  assert.equal(retrySecond.emittedEvidence, 0);
  assert.equal(retrySecond.reviewCandidate, false);
  assert.equal(retrySecond.attempt.stateAffecting, false);

  const retryRows = await admin
    .from("exercise_attempts")
    .select("id,state_affecting")
    .eq("user_id", otherLearnerId)
    .eq("attempt_group_id", retryGroup);
  assert.equal(retryRows.error, null, retryRows.error?.message);
  assert.equal(retryRows.data.length, 2);
  assert.equal(retryRows.data.filter((row) => row.state_affecting).length, 1);

  await assert.rejects(
    () =>
      submitExerciseAttempt(store, {
        userId: otherLearnerId,
        lessonInstanceId: otherLesson,
        exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-003",
        submissionKey: `engine-${suffix}-retry-wrong-item`,
        attemptGroupId: retryGroup,
        stageId: "controlled_formulas",
        response: { kind: "text", text: "Sorry" },
        assistance: "independent",
        scenarioTag: "everyday_social",
      }),
    /attempt group is already bound/,
  );

  const concurrentGroup = randomUUID();
  const concurrentResults = await Promise.all([
    submitExerciseAttempt(store, {
      userId: otherLearnerId,
      lessonInstanceId: otherLesson,
      exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-003",
      submissionKey: `engine-${suffix}-concurrent-a`,
      attemptGroupId: concurrentGroup,
      stageId: "controlled_formulas",
      response: { kind: "text", text: "Sorry" },
      assistance: "independent",
      scenarioTag: "everyday_social",
    }),
    submitExerciseAttempt(store, {
      userId: otherLearnerId,
      lessonInstanceId: otherLesson,
      exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-003",
      submissionKey: `engine-${suffix}-concurrent-b`,
      attemptGroupId: concurrentGroup,
      stageId: "controlled_formulas",
      response: { kind: "text", text: "Hello" },
      assistance: "independent",
      scenarioTag: "everyday_social",
    }),
  ]);
  assert.equal(
    concurrentResults.reduce(
      (total, result) => total + result.emittedEvidence,
      0,
    ),
    1,
  );
  const concurrentRows = await admin
    .from("exercise_attempts")
    .select("id,state_affecting")
    .eq("user_id", otherLearnerId)
    .eq("attempt_group_id", concurrentGroup);
  assert.equal(concurrentRows.error, null, concurrentRows.error?.message);
  assert.equal(concurrentRows.data.length, 2);
  assert.equal(
    concurrentRows.data.filter((row) => row.state_affecting).length,
    1,
  );

  await assert.rejects(
    () =>
      submitExerciseAttempt(store, {
        ...firstInput,
        userId: learnerId,
        lessonInstanceId: otherLesson,
        submissionKey: `engine-${suffix}-cross-user`,
        attemptGroupId: randomUUID(),
      }),
    /lesson ownership mismatch/,
  );

  console.log(
    "Engine DB integration passed: immutable accepted-source replay, lesson-stage authorization, one state-affecting retrieval per attempt group including concurrency, evidence-contract gating, Mastery promotion/lapse, spoken-practice safety, and ownership are enforced after empty reset.",
  );
} finally {
  if (originalControlledItem) {
    await admin
      .from("exercise_items")
      .update(originalControlledItem)
      .eq("id", "EI-A1-SOCIAL-CONTROLLED-001");
  }
  if (cleanupUserId) await admin.auth.admin.deleteUser(cleanupUserId);
  if (cleanupOtherUserId) await admin.auth.admin.deleteUser(cleanupOtherUserId);
}
