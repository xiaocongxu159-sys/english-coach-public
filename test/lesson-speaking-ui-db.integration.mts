import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { ExerciseResponse } from "../src/modules/engine/types.mts";
import { submitCurrentDeterministicExercise } from "../src/modules/ui/lesson-exercise-service.mts";
import {
  advanceCurrentInstructionStage,
  startOrResumeTodayLesson,
} from "../src/modules/ui/lesson-service.mts";
import { completeSpeakingRehearsal } from "../src/modules/ui/lesson-speaking-service.mts";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Lesson speaking UI DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const email = `lesson-speaking-ui-${suffix}@example.test`;
const password = `LessonSpeakingUi-${randomUUID()}-aA1!`;
let cleanupUserId: string | undefined;

const recognitionAnswers: Array<[string, ExerciseResponse]> = [
  ["EI-A1-SOCIAL-RECOGNITION-001", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-002", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-003", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-004", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-005", { kind: "choice", selectedOptionId: "A" }],
];

const controlledAnswers: Array<[string, ExerciseResponse]> = [
  ["EI-A1-SOCIAL-CONTROLLED-001", { kind: "text", text: "Hello" }],
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
  for (const [itemId, response] of recognitionAnswers) {
    await submitCurrentDeterministicExercise(
      admin,
      learnerId,
      lessonId,
      "recognition_check",
      itemId,
      response,
    );
  }
  for (const [itemId, response] of controlledAnswers) {
    await submitCurrentDeterministicExercise(
      admin,
      learnerId,
      lessonId,
      "controlled_formulas",
      itemId,
      response,
    );
  }

  const lessonBefore = await admin
    .from("lesson_instances")
    .select("state")
    .eq("id", lessonId)
    .single();
  assert.equal(lessonBefore.error, null, lessonBefore.error?.message);
  const stateBefore = lessonBefore.data.state as Record<string, unknown>;
  assert.equal(stateBefore.current_stage_id, "speaking_rehearsal");

  const evidenceBefore = await admin
    .from("mastery_evidence")
    .select("id", { count: "exact", head: true })
    .eq("user_id", learnerId);
  assert.equal(evidenceBefore.error, null, evidenceBefore.error?.message);
  const reviewUnitsBefore = await admin
    .from("review_units")
    .select("id", { count: "exact", head: true })
    .eq("user_id", learnerId);
  assert.equal(reviewUnitsBefore.error, null, reviewUnitsBefore.error?.message);
  const reviewEventsBefore = await admin
    .from("review_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", learnerId);
  assert.equal(reviewEventsBefore.error, null, reviewEventsBefore.error?.message);

  const practiced = await completeSpeakingRehearsal(admin, learnerId, lessonId);
  assert.equal(practiced.submission.replayed, false);
  assert.equal(practiced.submission.attempt.exerciseItemId, "EI-A1-SOCIAL-SPEAK-001");
  assert.deepEqual(practiced.submission.attempt.response, {
    kind: "practice",
    completed: true,
  });
  assert.equal(practiced.submission.attempt.evaluation.isScored, false);
  assert.equal(practiced.submission.attempt.evaluation.correct, null);
  assert.equal(practiced.submission.attempt.evaluation.trusted, false);
  assert.equal(practiced.submission.attempt.stateAffecting, false);
  assert.equal(practiced.submission.emittedEvidence, 0);
  assert.deepEqual(practiced.submission.reviewUpdates, []);
  assert.equal(practiced.runtime.snapshot.currentStageId, "exit_check");

  const evidenceAfter = await admin
    .from("mastery_evidence")
    .select("id", { count: "exact", head: true })
    .eq("user_id", learnerId);
  const reviewUnitsAfter = await admin
    .from("review_units")
    .select("id", { count: "exact", head: true })
    .eq("user_id", learnerId);
  const reviewEventsAfter = await admin
    .from("review_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", learnerId);
  assert.equal(evidenceAfter.error, null, evidenceAfter.error?.message);
  assert.equal(reviewUnitsAfter.error, null, reviewUnitsAfter.error?.message);
  assert.equal(reviewEventsAfter.error, null, reviewEventsAfter.error?.message);
  assert.equal(evidenceAfter.count, evidenceBefore.count);
  assert.equal(reviewUnitsAfter.count, reviewUnitsBefore.count);
  assert.equal(reviewEventsAfter.count, reviewEventsBefore.count);

  const replay = await completeSpeakingRehearsal(admin, learnerId, lessonId);
  assert.equal(replay.submission.replayed, true);
  assert.equal(replay.submission.attempt.id, practiced.submission.attempt.id);
  assert.equal(replay.submission.emittedEvidence, 0);
  assert.deepEqual(replay.submission.reviewUpdates, []);
  assert.equal(replay.runtime.snapshot.currentStageId, "exit_check");

  const speakingAttempts = await admin
    .from("exercise_attempts")
    .select("id,state_affecting,evaluation")
    .eq("user_id", learnerId)
    .eq("lesson_instance_id", lessonId)
    .eq("exercise_item_id", "EI-A1-SOCIAL-SPEAK-001");
  assert.equal(speakingAttempts.error, null, speakingAttempts.error?.message);
  assert.equal(speakingAttempts.data.length, 1);
  assert.equal(speakingAttempts.data[0].state_affecting, false);

  console.log(
    "Lesson speaking UI DB integration passed: reviewed speaking rehearsal persists exactly one practice Attempt, remains unscored/untrusted/state-neutral, creates no Evidence or Review changes, advances to exit_check, and exact replay stays idempotent.",
  );
} finally {
  if (cleanupUserId) await admin.auth.admin.deleteUser(cleanupUserId);
}
