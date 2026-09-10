import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { TS_FSRS_LIBRARY_VERSION } from "../src/modules/engine/review-adapter.mts";
import { submitReviewAttempt } from "../src/modules/engine/review-attempt-service.mts";
import { getReviewConfig } from "../src/modules/engine/review-config.mts";
import {
  PHASE1_REVIEW_BLUEPRINT_ID,
  PHASE1_REVIEW_STAGE_ID,
  SupabaseReviewLessonResolver,
} from "../src/modules/engine/review-lesson-resolver.mts";
import { SupabaseLearningEngineStore } from "../src/modules/engine/supabase-store.mts";
import {
  loadReviewLessonView,
  loadStartableReviewUnitIds,
} from "../src/modules/ui/review-session-service.mts";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Review session DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const email = `review-session-${suffix}@example.test`;
const password = `Review-${randomUUID()}-aA1!`;
let learnerId = "";
let otherLearnerId = "";

try {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null, created.error?.message);
  learnerId = created.data.user.id;
  const other = await admin.auth.admin.createUser({
    email: `review-other-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(other.error, null, other.error?.message);
  otherLearnerId = other.data.user.id;

  const state = await admin.from("learner_node_state").insert({
    user_id: learnerId,
    node_id: "VX-A1-SOCIAL-FORMULAS-01",
    mastery_status: "introduced",
    evidence_summary: { highest_state_achieved: "introduced" },
  });
  assert.equal(state.error, null, state.error?.message);

  const config = getReviewConfig();
  const store = new SupabaseLearningEngineStore(admin);
  const makeUnit = (contentRef: string) =>
    store.ensureReviewUnit({
      userId: learnerId,
      nodeId: "VX-A1-SOCIAL-FORMULAS-01",
      reviewType: "lexical_retrieval",
      evidenceType: "controlled_production",
      contentRef,
      contentVersion: 1,
      siblingGroupId: `VX-A1-SOCIAL-FORMULAS-01:${contentRef}`,
      scenarioTag: "everyday_social",
      algorithmVersion: config.scheduler.algorithm_version,
      libraryVersion: TS_FSRS_LIBRARY_VERSION,
      parametersVersion: config.scheduler.parameters_version,
    });

  const unit = await makeUnit("EI-A1-SOCIAL-CONTROLLED-002@v1");
  const due = await admin
    .from("review_units")
    .update({ due_at: "2026-09-03T01:00:00.000Z", review_status: "not_due" })
    .eq("id", unit.id);
  assert.equal(due.error, null, due.error?.message);

  const resolver = new SupabaseReviewLessonResolver(admin);
  const now = new Date("2026-09-03T02:00:00.000Z");
  const lesson = await resolver.resolve(learnerId, unit.id, now);
  assert.equal(lesson.blueprintId, PHASE1_REVIEW_BLUEPRINT_ID);
  assert.equal(lesson.reviewUnitId, unit.id);
  assert.equal(lesson.exerciseItemId, "EI-A1-SOCIAL-CONTROLLED-002");
  assert.equal(lesson.resolutionKey, `review:${unit.id}:revision:0`);
  assert.deepEqual(lesson.state.allowed_items_by_stage, {
    [PHASE1_REVIEW_STAGE_ID]: ["EI-A1-SOCIAL-CONTROLLED-002"],
  });
  const resumed = await resolver.resolve(learnerId, unit.id, now);
  assert.equal(resumed.id, lesson.id);
  assert.equal(resumed.submissionKey, lesson.submissionKey);
  await assert.rejects(
    () => resolver.resolve(otherLearnerId, unit.id, now),
    /Review Unit not found for learner/,
  );

  const secondary = await makeUnit("EI-A1-SOCIAL-CONTROLLED-003@v1");
  await admin
    .from("review_units")
    .update({ due_at: "2026-09-04T02:00:00.000Z" })
    .eq("id", secondary.id);
  await assert.rejects(
    () => resolver.resolve(learnerId, secondary.id, now),
    /not actionable \(not_due\)/,
  );
  await admin
    .from("review_units")
    .update({ due_at: "2026-09-03T01:00:00.000Z" })
    .eq("id", secondary.id);
  const staleLesson = await resolver.resolve(learnerId, secondary.id, now);
  await admin.from("review_units").update({ revision: 1 }).eq("id", secondary.id);
  await assert.rejects(
    () =>
      submitReviewAttempt(admin, {
        userId: learnerId,
        lessonInstanceId: staleLesson.id,
        reviewUnitId: secondary.id,
        response: { kind: "text", text: "Sorry" },
      }),
    /stale Review Lesson/,
  );

  const multi = await makeUnit("EI-A1-SOCIAL-CONTROLLED-001@v1");
  await admin
    .from("review_units")
    .update({ due_at: "2026-09-03T01:00:00.000Z" })
    .eq("id", multi.id);
  await assert.rejects(
    () => resolver.resolve(learnerId, multi.id, now),
    /only permits single-target content/,
  );

  const submitted = await submitReviewAttempt(admin, {
    userId: learnerId,
    lessonInstanceId: lesson.id,
    reviewUnitId: unit.id,
    response: { kind: "text", text: "Thank you" },
  });
  assert.equal(submitted.replayed, false);
  assert.equal(submitted.emittedEvidence, 1);
  assert.equal(submitted.reviewUpdates.length, 1);
  assert.equal(submitted.reviewUpdates[0].reviewUnitId, unit.id);
  assert.equal(submitted.reviewUpdates[0].grade, "Easy");
  assert.equal(submitted.reviewUpdates[0].applied, true);

  const persistedLesson = await admin
    .from("lesson_instances")
    .select("status,state")
    .eq("id", lesson.id)
    .single();
  assert.equal(persistedLesson.error, null, persistedLesson.error?.message);
  assert.equal(persistedLesson.data.status, "completed");
  assert.equal(persistedLesson.data.state.current_stage_id, null);

  const events = await admin
    .from("review_events")
    .select("id,attempt_group_id")
    .eq("review_unit_id", unit.id);
  assert.equal(events.error, null, events.error?.message);
  assert.equal(events.data.length, 1);
  assert.equal(events.data[0].attempt_group_id, lesson.attemptGroupId);

  const updatedUnit = await admin
    .from("review_units")
    .select("revision,last_grade")
    .eq("id", unit.id)
    .single();
  assert.equal(updatedUnit.error, null, updatedUnit.error?.message);
  assert.deepEqual(updatedUnit.data, { revision: 1, last_grade: "Easy" });

  const replay = await submitReviewAttempt(admin, {
    userId: learnerId,
    lessonInstanceId: lesson.id,
    reviewUnitId: unit.id,
    response: { kind: "text", text: "Thank you" },
  });
  assert.equal(replay.replayed, true);
  assert.equal(replay.reviewUpdates[0].replayed, true);
  const eventsAfterReplay = await admin
    .from("review_events")
    .select("id")
    .eq("review_unit_id", unit.id);
  assert.equal(eventsAfterReplay.data?.length, 1);
  await assert.rejects(
    () =>
      submitReviewAttempt(admin, {
        userId: learnerId,
        lessonInstanceId: lesson.id,
        reviewUnitId: unit.id,
        response: { kind: "text", text: "Sorry" },
      }),
    /idempotency conflict/,
  );

  const learner = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await learner.auth.signInWithPassword({ email, password });
  assert.equal(signIn.error, null, signIn.error?.message);

  const startable = await loadStartableReviewUnitIds(learner, [
    {
      reviewUnitId: unit.id,
      nodeId: "VX-A1-SOCIAL-FORMULAS-01",
      evidenceType: "controlled_production",
      contentRef: "EI-A1-SOCIAL-CONTROLLED-002@v1",
      actionable: true,
    },
    {
      reviewUnitId: multi.id,
      nodeId: "VX-A1-SOCIAL-FORMULAS-01",
      evidenceType: "controlled_production",
      contentRef: "EI-A1-SOCIAL-CONTROLLED-001@v1",
      actionable: true,
    },
  ]);
  assert.deepEqual(startable, [unit.id]);

  const completedView = await loadReviewLessonView(learner, learnerId, lesson.id);
  assert.ok(completedView);
  assert.equal(completedView.status, "completed");
  assert.equal(completedView.reviewUnitId, unit.id);
  assert.equal(completedView.nodeId, "VX-A1-SOCIAL-FORMULAS-01");
  assert.equal(completedView.item.id, "EI-A1-SOCIAL-CONTROLLED-002");
  assert.equal(completedView.attemptId, submitted.attempt.id);
  assert.equal(completedView.lastGrade, "Easy");
  assert.ok(completedView.dueAt, "completed Review Lesson should expose the next FSRS due time");

  const ownLesson = await learner
    .from("lesson_instances")
    .select("id,user_id,status")
    .eq("id", lesson.id)
    .single();
  assert.equal(ownLesson.error, null, ownLesson.error?.message);
  assert.equal(ownLesson.data.user_id, learnerId);
  const forbiddenWrite = await learner
    .from("lesson_instances")
    .update({ status: "abandoned" })
    .eq("id", lesson.id);
  assert.ok(forbiddenWrite.error, "browser must not mutate authoritative Review Lesson state");

  console.log(
    "Review session DB integration passed: one due single-target reviewed unit resolves to one fixed attempt slot; one deterministic answer writes one Evidence + one FSRS event, replay is idempotent, stale/future/multi-target/foreign units fail closed, learner UI reads the completed result and next due time, queue eligibility exposes only supported single-target content, and browser writes remain denied.",
  );
} finally {
  if (learnerId) await admin.auth.admin.deleteUser(learnerId);
  if (otherLearnerId) await admin.auth.admin.deleteUser(otherLearnerId);
}
