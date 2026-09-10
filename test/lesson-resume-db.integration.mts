import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { submitExerciseAttempt } from "../src/modules/engine/attempt-service.mts";
import { SupabaseDailyPlanStore } from "../src/modules/engine/daily-plan-store.mts";
import { SupabaseLessonResolver } from "../src/modules/engine/lesson-resolver.mts";
import { buildLearnerDailyPlan } from "../src/modules/engine/planning-service.mts";
import { SupabaseLearningEngineStore } from "../src/modules/engine/supabase-store.mts";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Lesson resume DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const dailyPlanStore = new SupabaseDailyPlanStore(admin);
const resolver = new SupabaseLessonResolver(admin);
const engineStore = new SupabaseLearningEngineStore(admin);
const suffix = randomUUID().slice(0, 8);
const password = `Resume-${randomUUID()}-aA1!`;
let cleanupLearnerId: string | undefined;
let cleanupOtherId: string | undefined;

try {
  const created = await admin.auth.admin.createUser({
    email: `resume-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  const learnerId = created.data.user.id;
  cleanupLearnerId = learnerId;

  const other = await admin.auth.admin.createUser({
    email: `resume-other-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(other.error, null, other.error?.message);
  const otherId = other.data.user.id;
  cleanupOtherId = otherId;

  const plan = buildLearnerDailyPlan({
    learnerId,
    planDate: "2026-09-02",
    now: "2026-09-02T06:00:00.000Z",
    timeBudgetMinutes: 35,
    reviewCandidates: [],
    curriculumNodes: [
      {
        id: "CF-A1-SOCIAL-GREET-01",
        lifecycle: "active",
        masteryStatus: "unseen",
        reviewedContentAvailable: true,
        applicationCapable: true,
      },
      {
        id: "VX-A1-SOCIAL-FORMULAS-01",
        lifecycle: "active",
        masteryStatus: "unseen",
        reviewedContentAvailable: true,
        applicationCapable: true,
      },
    ],
    prerequisites: [],
    learnerCurriculumState: {
      masteryByNodeId: new Map(),
      clearedNodeIds: new Set(),
    },
    voiceAvailable: true,
  });
  const storedPlan = await dailyPlanStore.upsertDailyPlan(plan);

  const first = await resolver.resolve(storedPlan, 0);
  assert.equal(first.userId, learnerId);
  assert.equal(first.blueprintId, "LESB-A1-SOCIAL-FORMULAS-01");
  assert.equal(first.status, "in_progress");
  assert.equal(first.revision, 0);

  const second = await resolver.resolve(storedPlan, 0);
  assert.equal(second.id, first.id);
  assert.equal(second.resolutionKey, first.resolutionKey);

  const instanceRows = await admin
    .from("lesson_instances")
    .select("id")
    .eq("user_id", learnerId)
    .eq("resolution_key", first.resolutionKey)
    .neq("status", "abandoned");
  assert.equal(instanceRows.error, null, instanceRows.error?.message);
  assert.equal(instanceRows.data.length, 1);

  const lessonState = first.state;
  const allowed = lessonState.allowed_items_by_stage as Record<string, string[]>;
  assert.deepEqual(allowed.controlled_formulas, [
    "EI-A1-SOCIAL-CONTROLLED-001",
    "EI-A1-SOCIAL-CONTROLLED-002",
    "EI-A1-SOCIAL-CONTROLLED-003",
    "EI-A1-SOCIAL-CONTROLLED-004",
    "EI-A1-SOCIAL-CONTROLLED-005",
  ]);
  assert.deepEqual(lessonState.resume_policy, {
    checkpoint_after_each_stage: true,
    preserve_attempts: true,
  });

  const attempt = await submitExerciseAttempt(engineStore, {
    userId: learnerId,
    lessonInstanceId: first.id,
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-001",
    submissionKey: `resume-${suffix}-controlled`,
    attemptGroupId: randomUUID(),
    stageId: "controlled_formulas",
    response: { kind: "text", text: "Hello" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(attempt.replayed, false);
  assert.equal(attempt.attempt.stateAffecting, true);

  const checkpoint1 = await resolver.completeStage(learnerId, first.id, "controlled_formulas");
  const checkpoint2 = await resolver.completeStage(learnerId, first.id, "controlled_formulas");
  const checkpointInstance1 = checkpoint1.state.instance as Record<string, unknown>;
  const checkpointInstance2 = checkpoint2.state.instance as Record<string, unknown>;
  const completion1 = checkpointInstance1.completion as Record<string, unknown>;
  const completion2 = checkpointInstance2.completion as Record<string, unknown>;
  assert.deepEqual(completion1.completed_stage_ids, ["controlled_formulas"]);
  assert.deepEqual(completion2.completed_stage_ids, ["controlled_formulas"]);
  assert.equal(checkpoint1.revision, 1);
  assert.equal(checkpoint2.revision, 1);

  await Promise.all([
    resolver.completeStage(learnerId, first.id, "everyday_social_context"),
    resolver.completeStage(learnerId, first.id, "teach_social_formulas"),
  ]);
  const converged = await resolver.completeStage(
    learnerId,
    first.id,
    "controlled_formulas",
  );
  const convergedInstance = converged.state.instance as Record<string, unknown>;
  const convergedCompletion = convergedInstance.completion as Record<string, unknown>;
  assert.deepEqual(convergedCompletion.completed_stage_ids, [
    "everyday_social_context",
    "teach_social_formulas",
    "controlled_formulas",
  ]);
  assert.equal(converged.revision, 3);

  await assert.rejects(
    () => resolver.skipOptionalStage(learnerId, first.id, "recognition_check"),
    /required stage cannot be skipped/,
  );
  const skipped = await resolver.skipOptionalStage(learnerId, first.id, "speaking_rehearsal");
  const skippedInstance = skipped.state.instance as Record<string, unknown>;
  const skippedStages = skippedInstance.resolved_stages as Array<Record<string, unknown>>;
  assert.equal(
    skippedStages.find((stage) => stage.stage_id === "speaking_rehearsal")?.status,
    "skipped",
  );

  const learnerClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signedIn = await learnerClient.auth.signInWithPassword({
    email: `resume-${suffix}@example.test`,
    password,
  });
  assert.equal(signedIn.error, null, signedIn.error?.message);

  const resumedLesson = await learnerClient
    .from("lesson_instances")
    .select("id,user_id,resolution_key,revision,status,state")
    .eq("id", first.id)
    .maybeSingle();
  assert.equal(resumedLesson.error, null, resumedLesson.error?.message);
  assert.equal(resumedLesson.data?.id, first.id);
  assert.equal(resumedLesson.data?.revision, 4);
  const resumedState = resumedLesson.data?.state as Record<string, unknown>;
  const resumedInstance = resumedState.instance as Record<string, unknown>;
  const resumedCompletion = resumedInstance.completion as Record<string, unknown>;
  assert.deepEqual(resumedCompletion.completed_stage_ids, [
    "everyday_social_context",
    "teach_social_formulas",
    "controlled_formulas",
  ]);

  const resumedAttempts = await learnerClient
    .from("exercise_attempts")
    .select("id,lesson_instance_id,exercise_item_id")
    .eq("lesson_instance_id", first.id);
  assert.equal(resumedAttempts.error, null, resumedAttempts.error?.message);
  assert.equal(resumedAttempts.data.length, 1);
  assert.equal(resumedAttempts.data[0].id, attempt.attempt.id);

  const crossLesson = await learnerClient
    .from("lesson_instances")
    .select("id,user_id")
    .eq("user_id", otherId);
  assert.equal(crossLesson.error, null, crossLesson.error?.message);
  assert.equal(crossLesson.data.length, 0);

  const forgedWrite = await learnerClient
    .from("lesson_instances")
    .update({ status: "completed" })
    .eq("id", first.id)
    .select("id");
  assert.notEqual(forgedWrite.error, null);
  assert.equal(forgedWrite.error?.code, "42501");

  const protectedLesson = await admin
    .from("lesson_instances")
    .select("status,revision")
    .eq("id", first.id)
    .single();
  assert.equal(protectedLesson.error, null, protectedLesson.error?.message);
  assert.equal(protectedLesson.data.status, "in_progress");
  assert.equal(protectedLesson.data.revision, 4);

  const dailyPlanRow = await admin
    .from("daily_plans")
    .select("status")
    .eq("id", storedPlan.id)
    .single();
  assert.equal(dailyPlanRow.error, null, dailyPlanRow.error?.message);
  assert.equal(dailyPlanRow.data.status, "in_progress");

  console.log("Lesson resume DB integration passed: reviewed Pilot resolution is idempotent, concurrent stage checkpoints converge by revision CAS, required/optional skip rules hold, 001A attempts survive resume, learner RLS restores own state only, browser writes are rejected, and Daily Plan transitions to in-progress.");
} finally {
  if (cleanupLearnerId) await admin.auth.admin.deleteUser(cleanupLearnerId);
  if (cleanupOtherId) await admin.auth.admin.deleteUser(cleanupOtherId);
}