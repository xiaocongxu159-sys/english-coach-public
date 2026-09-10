import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
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
  console.error("Lesson UI service DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const email = `lesson-ui-${suffix}@example.test`;
const password = `LessonUi-${randomUUID()}-aA1!`;
let cleanupLearnerId: string | undefined;

try {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  const userId = created.data.user.id;
  cleanupLearnerId = userId;

  const first = await startOrResumeTodayLesson(
    admin,
    userId,
    new Date("2026-09-02T06:00:00.000Z"),
  );
  assert.equal(first.lesson.userId, userId);
  assert.equal(first.lesson.status, "in_progress");
  assert.equal(first.currentStageId, "everyday_social_context");
  assert.equal(first.stages.length, 8);
  assert.deepEqual(first.completedStageIds, []);
  assert.deepEqual(first.allowedItemsByStage.recognition_check, [
    "EI-A1-SOCIAL-RECOGNITION-001",
    "EI-A1-SOCIAL-RECOGNITION-002",
    "EI-A1-SOCIAL-RECOGNITION-003",
    "EI-A1-SOCIAL-RECOGNITION-004",
    "EI-A1-SOCIAL-RECOGNITION-005",
  ]);

  const second = await startOrResumeTodayLesson(
    admin,
    userId,
    new Date("2026-09-02T06:03:00.000Z"),
  );
  assert.equal(second.lesson.id, first.lesson.id);
  assert.equal(second.lesson.resolutionKey, first.lesson.resolutionKey);

  const lessonRows = await admin
    .from("lesson_instances")
    .select("id,user_id,resolution_key,status")
    .eq("user_id", userId)
    .eq("resolution_key", first.lesson.resolutionKey)
    .neq("status", "abandoned");
  assert.equal(lessonRows.error, null, lessonRows.error?.message);
  assert.equal(lessonRows.data.length, 1);

  const planRows = await admin
    .from("daily_plans")
    .select("id,status")
    .eq("user_id", userId)
    .eq("plan_date", "2026-09-02");
  assert.equal(planRows.error, null, planRows.error?.message);
  assert.equal(planRows.data.length, 1);
  assert.equal(planRows.data[0].status, "in_progress");

  const runtime0 = await loadLearnerLessonRuntime(admin, userId, first.lesson.id);
  assert.ok(runtime0);
  assert.equal(runtime0.currentStage?.id, "everyday_social_context");
  assert.equal(runtime0.currentItems.length, 0);
  assert.equal(
    runtime0.reviewedContent.title,
    "Essential Social Formulas: Hello, Thanks, Sorry, Goodbye",
  );
  assert.equal(runtime0.reviewedContent.learningObjectives.length, 3);
  assert.equal(runtime0.reviewedContent.teachBlocks.length, 5);
  assert.equal(runtime0.reviewedContent.reviewedDialogue.length, 5);
  assert.equal(runtime0.reviewedContent.speakingPractice.scored, false);

  const afterContext = await advanceCurrentInstructionStage(
    admin,
    userId,
    first.lesson.id,
  );
  assert.equal(afterContext.currentStageId, "teach_social_formulas");

  const afterTeach = await advanceCurrentInstructionStage(
    admin,
    userId,
    first.lesson.id,
  );
  assert.equal(afterTeach.currentStageId, "model_short_interactions");

  const afterModel = await advanceCurrentInstructionStage(
    admin,
    userId,
    first.lesson.id,
  );
  assert.equal(afterModel.currentStageId, "recognition_check");

  const recognitionRuntime = await loadLearnerLessonRuntime(
    admin,
    userId,
    first.lesson.id,
  );
  assert.ok(recognitionRuntime);
  assert.equal(recognitionRuntime.currentStage?.id, "recognition_check");
  assert.deepEqual(
    recognitionRuntime.currentItems.map((entry) => entry.id),
    [
      "EI-A1-SOCIAL-RECOGNITION-001",
      "EI-A1-SOCIAL-RECOGNITION-002",
      "EI-A1-SOCIAL-RECOGNITION-003",
      "EI-A1-SOCIAL-RECOGNITION-004",
      "EI-A1-SOCIAL-RECOGNITION-005",
    ],
  );
  assert.ok(
    recognitionRuntime.currentItems.every(
      (entry) => entry.item.provenance.content_class === "reviewed_core",
    ),
  );

  await assert.rejects(
    () => advanceCurrentInstructionStage(admin, userId, first.lesson.id),
    /only advance the current reviewed instruction stage/,
  );

  const learner = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await learner.auth.signInWithPassword({ email, password });
  assert.equal(signedIn.error, null, signedIn.error?.message);
  const ownLesson = await learner
    .from("lesson_instances")
    .select("id,user_id,status,state")
    .eq("id", first.lesson.id)
    .maybeSingle();
  assert.equal(ownLesson.error, null, ownLesson.error?.message);
  assert.equal(ownLesson.data?.user_id, userId);
  assert.equal(ownLesson.data?.status, "in_progress");
  const ownState = ownLesson.data?.state as Record<string, unknown>;
  assert.equal(ownState.current_stage_id, "recognition_check");

  console.log(
    "Lesson UI service DB integration passed: Today starts one stable reviewed Lesson, canonical reviewed teaching content is loaded without duplication, only the server-derived current instruction stage can advance, exercise stages cannot be bypassed by generic Continue, and learner RLS restores the same current stage.",
  );
} finally {
  if (cleanupLearnerId) await admin.auth.admin.deleteUser(cleanupLearnerId);
}
