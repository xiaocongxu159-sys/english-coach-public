import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { evaluateAndCheckpointExitGate } from "../src/modules/ui/lesson-exit-service.mts";
import { submitCurrentDeterministicExercise } from "../src/modules/ui/lesson-exercise-service.mts";
import { skipSpeakingRehearsal } from "../src/modules/ui/lesson-speaking-service.mts";
import { completeLessonSummary } from "../src/modules/ui/lesson-summary-service.mts";
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
  console.error("Lesson exit UI DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const recognitionAnswers: Array<[string, ExerciseResponse]> = [
  ["EI-A1-SOCIAL-RECOGNITION-001", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-002", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-003", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-004", { kind: "choice", selectedOptionId: "A" }],
  ["EI-A1-SOCIAL-RECOGNITION-005", { kind: "choice", selectedOptionId: "A" }],
];

function controlledAnswers(failRequiredItem: boolean): Array<[string, ExerciseResponse]> {
  return [
    [
      "EI-A1-SOCIAL-CONTROLLED-001",
      { kind: "text", text: failRequiredItem ? "Goodbye" : "Hello" },
    ],
    ["EI-A1-SOCIAL-CONTROLLED-002", { kind: "text", text: "Thank you" }],
    ["EI-A1-SOCIAL-CONTROLLED-003", { kind: "text", text: "Sorry" }],
    ["EI-A1-SOCIAL-CONTROLLED-004", { kind: "text", text: "Bye" }],
    [
      "EI-A1-SOCIAL-CONTROLLED-005",
      { kind: "text", text: "Nice to meet you, too" },
    ],
  ];
}

async function createLearner(label: string) {
  const suffix = randomUUID().slice(0, 8);
  const email = `lesson-exit-${label}-${suffix}@example.test`;
  const password = `LessonExit-${randomUUID()}-aA1!`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  return { userId: created.data.user.id, email, password };
}

async function driveToExit(
  client: SupabaseClient,
  learnerId: string,
  failRequiredItem: boolean,
) {
  const started = await startOrResumeTodayLesson(
    client,
    learnerId,
    new Date("2026-09-02T06:00:00.000Z"),
  );
  const lessonId = started.lesson.id;
  for (let index = 0; index < 3; index += 1) {
    await advanceCurrentInstructionStage(client, learnerId, lessonId);
  }
  for (const [itemId, response] of recognitionAnswers) {
    await submitCurrentDeterministicExercise(
      client,
      learnerId,
      lessonId,
      "recognition_check",
      itemId,
      response,
    );
  }
  for (const [itemId, response] of controlledAnswers(failRequiredItem)) {
    await submitCurrentDeterministicExercise(
      client,
      learnerId,
      lessonId,
      "controlled_formulas",
      itemId,
      response,
    );
  }
  const skipped = await skipSpeakingRehearsal(client, learnerId, lessonId);
  assert.equal(skipped.snapshot.currentStageId, "exit_check");
  return lessonId;
}

const cleanupIds: string[] = [];
try {
  const passLearner = await createLearner("pass");
  cleanupIds.push(passLearner.userId);
  const passLessonId = await driveToExit(admin, passLearner.userId, false);
  const passed = await evaluateAndCheckpointExitGate(
    admin,
    passLearner.userId,
    passLessonId,
    new Date("2026-09-02T06:20:00.000Z"),
  );
  assert.equal(passed.result.passed, true);
  assert.equal(passed.result.correctCount, 10);
  assert.equal(passed.result.scoredItemCount, 10);
  assert.equal(passed.result.minimumCorrect, 8);
  assert.deepEqual(passed.result.failedRequiredItemIds, []);
  assert.deepEqual(passed.result.incorrectItemIds, []);
  assert.equal(Object.keys(passed.result.attemptIdsByItem).length, 10);
  assert.equal(passed.snapshot.currentStageId, "lesson_summary");

  const passedRow = await admin
    .from("lesson_instances")
    .select("status,state")
    .eq("id", passLessonId)
    .single();
  assert.equal(passedRow.error, null, passedRow.error?.message);
  assert.equal(passedRow.data.status, "in_progress");
  const passedState = passedRow.data.state as Record<string, unknown>;
  const storedPassed = passedState.exit_gate_result as Record<string, unknown>;
  assert.equal(storedPassed.passed, true);
  assert.equal(storedPassed.correct_count, 10);

  const replay = await evaluateAndCheckpointExitGate(
    admin,
    passLearner.userId,
    passLessonId,
    new Date("2026-09-02T06:21:00.000Z"),
  );
  assert.equal(replay.result.evaluatedAt, passed.result.evaluatedAt);
  assert.equal(replay.snapshot.currentStageId, "lesson_summary");

  const passCompleted = await completeLessonSummary(
    admin,
    passLearner.userId,
    passLessonId,
  );
  assert.equal(passCompleted.lesson.status, "completed");
  assert.equal(passCompleted.currentStageId, null);
  const passCompletionReplay = await completeLessonSummary(
    admin,
    passLearner.userId,
    passLessonId,
  );
  assert.equal(passCompletionReplay.lesson.status, "completed");

  const failLearner = await createLearner("required-fail");
  cleanupIds.push(failLearner.userId);
  const failLessonId = await driveToExit(admin, failLearner.userId, true);
  const failed = await evaluateAndCheckpointExitGate(
    admin,
    failLearner.userId,
    failLessonId,
    new Date("2026-09-02T07:20:00.000Z"),
  );
  assert.equal(failed.result.correctCount, 9);
  assert.equal(failed.result.passed, false);
  assert.deepEqual(failed.result.failedRequiredItemIds, [
    "EI-A1-SOCIAL-CONTROLLED-001",
  ]);
  assert.deepEqual(failed.result.incorrectItemIds, [
    "EI-A1-SOCIAL-CONTROLLED-001",
  ]);
  assert.equal(failed.snapshot.currentStageId, "lesson_summary");

  const failedCompleted = await completeLessonSummary(
    admin,
    failLearner.userId,
    failLessonId,
  );
  assert.equal(failedCompleted.lesson.status, "completed");
  assert.equal(failedCompleted.currentStageId, null);

  const failStates = await admin
    .from("learner_node_state")
    .select("node_id,mastery_status")
    .eq("user_id", failLearner.userId);
  assert.equal(failStates.error, null, failStates.error?.message);
  assert.ok(
    failStates.data.every(
      (row) => row.mastery_status !== "functional" && row.mastery_status !== "secure",
    ),
  );

  const learnerClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await learnerClient.auth.signInWithPassword({
    email: failLearner.email,
    password: failLearner.password,
  });
  assert.equal(signedIn.error, null, signedIn.error?.message);
  const ownLesson = await learnerClient
    .from("lesson_instances")
    .select("status,state")
    .eq("id", failLessonId)
    .single();
  assert.equal(ownLesson.error, null, ownLesson.error?.message);
  assert.equal(ownLesson.data.status, "completed");
  const ownState = ownLesson.data.state as Record<string, unknown>;
  assert.equal((ownState.exit_gate_result as Record<string, unknown>).passed, false);

  const forged = await learnerClient
    .from("lesson_instances")
    .update({ state: { exit_gate_result: { passed: true } } })
    .eq("id", failLessonId);
  assert.notEqual(forged.error, null);

  console.log(
    "Lesson exit UI DB integration passed: the reviewed Pilot gate is derived only from persisted trusted deterministic Attempts, 10/10 passes, 9/10 still fails when a required controlled-production item is wrong, both outcomes can finish the Lesson only after the persisted exit result exists, completion does not declare mastery, retries are idempotent, and learner RLS cannot forge the gate result.",
  );
} finally {
  for (const userId of cleanupIds) {
    await admin.auth.admin.deleteUser(userId);
  }
}
