import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { submitCurrentDeterministicExercise } from "../src/modules/ui/lesson-exercise-service.mts";
import {
  advanceCurrentInstructionStage,
  startOrResumeTodayLesson,
} from "../src/modules/ui/lesson-service.mts";
import type { ExerciseResponse } from "../src/modules/engine/types.mts";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Lesson exercise UI DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const email = `lesson-exercise-ui-${suffix}@example.test`;
const password = `LessonExerciseUi-${randomUUID()}-aA1!`;
let cleanupUserId: string | undefined;

const recognitionAnswers: Array<[string, ExerciseResponse]> = [
  ["EI-A1-SOCIAL-RECOGNITION-001", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-002", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-003", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-004", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-005", { kind: "choice", selectedOptionId: "A" }],
];

const controlledAnswers: Array<[string, ExerciseResponse]> = [
  ["EI-A1-SOCIAL-CONTROLLED-001", { kind: "text", text: " Hello " }],
  ["EI-A1-SOCIAL-CONTROLLED-002", { kind: "text", text: "Thank you" }],
  ["EI-A1-SOCIAL-CONTROLLED-003", { kind: "text", text: "Sorry" }],
  ["EI-A1-SOCIAL-CONTROLLED-004", { kind: "text", text: "Bye" }],
  [
    "EI-A1-SOCIAL-CONTROLLED-005",
    { kind: "text", text: "Nice to meet you, too" },
  ],
];

try {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  const learnerId = created.data.user.id;
  cleanupUserId = learnerId;

  const started = await startOrResumeTodayLesson(
    admin,
    learnerId,
    new Date("2026-09-02T06:00:00.000Z"),
  );
  const lessonId = started.lesson.id;

  for (let index = 0; index < 3; index += 1) {
    await advanceCurrentInstructionStage(admin, learnerId, lessonId);
  }

  await assert.rejects(
    () =>
      submitCurrentDeterministicExercise(
        admin,
        learnerId,
        lessonId,
        "recognition_check",
        "EI-A1-SOCIAL-RECOGNITION-005",
        { kind: "choice", selectedOptionId: "A" },
      ),
    /does not match the next reviewed item/,
  );

  const first = await submitCurrentDeterministicExercise(
    admin,
    learnerId,
    lessonId,
    "recognition_check",
    recognitionAnswers[0][0],
    recognitionAnswers[0][1],
  );
  assert.equal(first.submission.replayed, false);
  assert.equal(first.submission.attempt.evaluation.correct, true);
  assert.equal(first.submission.emittedEvidence, 2);
  assert.equal(first.runtime.snapshot.currentStageId, "recognition_check");

  const evidenceAfterFirst = await admin
    .from("mastery_evidence")
    .select("id")
    .eq("user_id", learnerId)
    .eq("attempt_id", first.submission.attempt.id);
  assert.equal(evidenceAfterFirst.error, null, evidenceAfterFirst.error?.message);
  assert.equal(evidenceAfterFirst.data.length, 2);

  const replay = await submitCurrentDeterministicExercise(
    admin,
    learnerId,
    lessonId,
    "recognition_check",
    recognitionAnswers[0][0],
    recognitionAnswers[0][1],
  );
  assert.equal(replay.submission.replayed, true);
  assert.equal(replay.submission.attempt.id, first.submission.attempt.id);
  assert.equal(replay.submission.emittedEvidence, 0);

  const evidenceAfterReplay = await admin
    .from("mastery_evidence")
    .select("id")
    .eq("user_id", learnerId)
    .eq("attempt_id", first.submission.attempt.id);
  assert.equal(evidenceAfterReplay.error, null, evidenceAfterReplay.error?.message);
  assert.equal(evidenceAfterReplay.data.length, 2);

  await assert.rejects(
    () =>
      submitCurrentDeterministicExercise(
        admin,
        learnerId,
        lessonId,
        "recognition_check",
        recognitionAnswers[0][0],
        { kind: "choice", selectedOptionId: "B" },
      ),
    /idempotency conflict/,
  );

  for (const [itemId, response] of recognitionAnswers.slice(1)) {
    const result = await submitCurrentDeterministicExercise(
      admin,
      learnerId,
      lessonId,
      "recognition_check",
      itemId,
      response,
    );
    assert.equal(result.submission.attempt.evaluation.correct, true);
  }

  const afterRecognition = await admin
    .from("lesson_instances")
    .select("state")
    .eq("id", lessonId)
    .single();
  assert.equal(afterRecognition.error, null, afterRecognition.error?.message);
  const recognitionState = afterRecognition.data.state as Record<string, unknown>;
  assert.equal(recognitionState.current_stage_id, "controlled_formulas");

  for (const [itemId, response] of controlledAnswers) {
    const result = await submitCurrentDeterministicExercise(
      admin,
      learnerId,
      lessonId,
      "controlled_formulas",
      itemId,
      response,
    );
    assert.equal(result.submission.attempt.evaluation.correct, true);
  }

  const attempts = await admin
    .from("exercise_attempts")
    .select("id,exercise_item_id,stage_id,submission_key,attempt_group_id,state_affecting")
    .eq("user_id", learnerId)
    .eq("lesson_instance_id", lessonId)
    .order("created_at", { ascending: true });
  assert.equal(attempts.error, null, attempts.error?.message);
  assert.equal(attempts.data.length, 10);
  assert.equal(new Set(attempts.data.map((row) => row.submission_key)).size, 10);
  assert.equal(new Set(attempts.data.map((row) => row.attempt_group_id)).size, 10);
  assert.ok(attempts.data.every((row) => row.state_affecting === true));

  const evidence = await admin
    .from("mastery_evidence")
    .select("id,node_id,evidence_type,attempt_id")
    .eq("user_id", learnerId);
  assert.equal(evidence.error, null, evidence.error?.message);
  assert.equal(evidence.data.length, 16);

  const states = await admin
    .from("learner_node_state")
    .select("node_id,mastery_status,evidence_summary")
    .eq("user_id", learnerId)
    .order("node_id");
  assert.equal(states.error, null, states.error?.message);
  assert.equal(states.data.length, 2);
  const cfState = states.data.find((row) => row.node_id === "CF-A1-SOCIAL-GREET-01");
  const vxState = states.data.find((row) => row.node_id === "VX-A1-SOCIAL-FORMULAS-01");
  assert.ok(cfState);
  assert.ok(vxState);
  assert.ok(cfState.mastery_status !== "functional" && cfState.mastery_status !== "secure");
  assert.ok(vxState.mastery_status !== "functional" && vxState.mastery_status !== "secure");

  const finalLesson = await admin
    .from("lesson_instances")
    .select("status,state")
    .eq("id", lessonId)
    .single();
  assert.equal(finalLesson.error, null, finalLesson.error?.message);
  assert.equal(finalLesson.data.status, "in_progress");
  const finalState = finalLesson.data.state as Record<string, unknown>;
  assert.equal(finalState.current_stage_id, "speaking_rehearsal");

  const learner = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await learner.auth.signInWithPassword({ email, password });
  assert.equal(signedIn.error, null, signedIn.error?.message);

  const ownAttempts = await learner
    .from("exercise_attempts")
    .select("id,exercise_item_id")
    .eq("lesson_instance_id", lessonId);
  assert.equal(ownAttempts.error, null, ownAttempts.error?.message);
  assert.equal(ownAttempts.data.length, 10);

  const forgedAttempt = await learner.from("exercise_attempts").insert({
    user_id: learnerId,
    lesson_instance_id: lessonId,
    exercise_item_id: "EI-A1-SOCIAL-RECOGNITION-001",
    response: { kind: "choice", selectedOptionId: "A" },
  });
  assert.notEqual(forgedAttempt.error, null);

  console.log(
    "Lesson exercise UI DB integration passed: the server derives the next reviewed item, blocks early skipping, submits all 10 deterministic Pilot items through the authoritative Attempt/Evidence/Mastery/Review engine, exact replays remain idempotent, conflicting replays are rejected, both deterministic stages checkpoint in order, missing delayed/spoken evidence prevents false full Mastery, and learner RLS remains read-only for attempts.",
  );
} finally {
  if (cleanupUserId) await admin.auth.admin.deleteUser(cleanupUserId);
}
