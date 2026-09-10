import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { submitCurrentDeterministicExercise } from "../src/modules/ui/lesson-exercise-service.mts";
import {
  loadDeterministicExerciseProgress,
  loadLessonAttemptFeedback,
} from "../src/modules/ui/lesson-exercise-view.mts";
import {
  advanceCurrentInstructionStage,
  loadLearnerLessonRuntime,
  startOrResumeTodayLesson,
} from "../src/modules/ui/lesson-service.mts";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Lesson exercise view DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const email = `lesson-exercise-view-${suffix}@example.test`;
const password = `LessonExerciseView-${randomUUID()}-aA1!`;
let cleanupUserId: string | undefined;

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

  const runtime0 = await loadLearnerLessonRuntime(admin, learnerId, lessonId);
  assert.ok(runtime0);
  const progress0 = await loadDeterministicExerciseProgress(admin, learnerId, runtime0);
  assert.ok(progress0);
  assert.equal(progress0.stageId, "recognition_check");
  assert.equal(progress0.answeredCount, 0);
  assert.equal(progress0.totalCount, 5);
  assert.equal(progress0.nextItem?.id, "EI-A1-SOCIAL-RECOGNITION-001");

  const submitted = await submitCurrentDeterministicExercise(
    admin,
    learnerId,
    lessonId,
    "recognition_check",
    "EI-A1-SOCIAL-RECOGNITION-001",
    { kind: "choice", selectedOptionId: "B" },
  );
  assert.equal(submitted.submission.attempt.evaluation.correct, false);

  const learner = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await learner.auth.signInWithPassword({ email, password });
  assert.equal(signedIn.error, null, signedIn.error?.message);

  const learnerRuntime = await loadLearnerLessonRuntime(learner, learnerId, lessonId);
  assert.ok(learnerRuntime);
  const progress1 = await loadDeterministicExerciseProgress(
    learner,
    learnerId,
    learnerRuntime,
  );
  assert.ok(progress1);
  assert.equal(progress1.answeredCount, 1);
  assert.equal(progress1.nextItem?.id, "EI-A1-SOCIAL-RECOGNITION-002");

  const feedback = await loadLessonAttemptFeedback(
    learner,
    learnerId,
    lessonId,
    submitted.submission.attempt.id,
  );
  assert.ok(feedback);
  assert.equal(feedback.correct, false);
  assert.deepEqual(feedback.correctAnswers, ["Hello."]);
  assert.equal(feedback.itemId, "EI-A1-SOCIAL-RECOGNITION-001");

  console.log(
    "Lesson exercise view DB integration passed: authenticated learner RLS derives one-at-a-time progress from persisted Attempts and feedback comes from the trusted stored evaluation plus reviewed answer contract, not browser-side scoring.",
  );
} finally {
  if (cleanupUserId) await admin.auth.admin.deleteUser(cleanupUserId);
}
