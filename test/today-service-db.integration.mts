import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { TS_FSRS_LIBRARY_VERSION } from "../src/modules/engine/review-adapter.mts";
import { submitReviewAttempt } from "../src/modules/engine/review-attempt-service.mts";
import { getReviewConfig } from "../src/modules/engine/review-config.mts";
import { SupabaseReviewLessonResolver } from "../src/modules/engine/review-lesson-resolver.mts";
import { SupabaseLearningEngineStore } from "../src/modules/engine/supabase-store.mts";
import { getOrCreateTodaySnapshot } from "../src/modules/ui/today-service.mts";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Today service DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const email = `today-${suffix}@example.test`;
const password = `Today-${randomUUID()}-aA1!`;
let learnerId: string | undefined;

try {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  learnerId = created.data.user.id;

  const first = await getOrCreateTodaySnapshot(
    admin,
    learnerId,
    new Date("2026-09-03T00:30:00.000Z"),
  );
  assert.equal(first.learnerId, learnerId);
  assert.equal(first.timezone, "UTC");
  assert.equal(first.planDate, "2026-09-03");
  assert.equal(first.storedPlan.status, "planned");
  assert.equal(first.storedPlan.plan.time_budget_minutes, 35);
  assert.deepEqual(first.storedPlan.plan.selected.new_node_ids, [
    "CF-A1-SOCIAL-GREET-01",
    "VX-A1-SOCIAL-FORMULAS-01",
  ]);
  assert.equal(first.storedPlan.plan.lesson_requests.length, 1);
  assert.equal(first.storedPlan.plan.lesson_requests[0].blueprint_type, "new_learning");
  assert.equal(first.storedPlan.plan.lesson_requests[0].minutes, 14);
  assert.ok(first.lessonTitle.length > 0);
  assert.equal(first.liveReview.counts.total, 0);
  assert.equal(first.liveReview.counts.actionable, 0);

  const second = await getOrCreateTodaySnapshot(
    admin,
    learnerId,
    new Date("2026-09-03T00:35:00.000Z"),
  );
  assert.equal(second.storedPlan.id, first.storedPlan.id);

  const rows = await admin
    .from("daily_plans")
    .select("id,user_id,plan_date,status")
    .eq("user_id", learnerId)
    .eq("plan_date", "2026-09-03");
  assert.equal(rows.error, null, rows.error?.message);
  assert.equal(rows.data.length, 1);

  const learner = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await learner.auth.signInWithPassword({ email, password });
  assert.equal(signedIn.error, null, signedIn.error?.message);
  const ownPlan = await learner
    .from("daily_plans")
    .select("id,user_id,plan_date,plan")
    .eq("id", first.storedPlan.id)
    .maybeSingle();
  assert.equal(ownPlan.error, null, ownPlan.error?.message);
  assert.equal(ownPlan.data?.user_id, learnerId);

  const started = await admin
    .from("daily_plans")
    .update({ status: "in_progress" })
    .eq("id", first.storedPlan.id);
  assert.equal(started.error, null, started.error?.message);

  const profileUpdate = await admin
    .from("learner_profiles")
    .update({ daily_minutes: 50 })
    .eq("user_id", learnerId);
  assert.equal(profileUpdate.error, null, profileUpdate.error?.message);

  const resumedToday = await getOrCreateTodaySnapshot(
    admin,
    learnerId,
    new Date("2026-09-03T00:45:00.000Z"),
  );
  assert.equal(resumedToday.storedPlan.id, first.storedPlan.id);
  assert.equal(resumedToday.storedPlan.status, "in_progress");
  assert.equal(resumedToday.storedPlan.plan.time_budget_minutes, 35);

  const nodeState = await admin.from("learner_node_state").insert({
    user_id: learnerId,
    node_id: "VX-A1-SOCIAL-FORMULAS-01",
    mastery_status: "introduced",
    evidence_summary: { highest_state_achieved: "introduced" },
  });
  assert.equal(nodeState.error, null, nodeState.error?.message);

  const config = getReviewConfig();
  const store = new SupabaseLearningEngineStore(admin);
  const reviewUnit = await store.ensureReviewUnit({
    userId: learnerId,
    nodeId: "VX-A1-SOCIAL-FORMULAS-01",
    reviewType: "lexical_retrieval",
    evidenceType: "controlled_production",
    contentRef: "EI-A1-SOCIAL-CONTROLLED-002@v1",
    contentVersion: 1,
    siblingGroupId: "VX-A1-SOCIAL-FORMULAS-01:today-live-review",
    scenarioTag: "everyday_social",
    algorithmVersion: config.scheduler.algorithm_version,
    libraryVersion: TS_FSRS_LIBRARY_VERSION,
    parametersVersion: config.scheduler.parameters_version,
  });
  const makeDue = await admin
    .from("review_units")
    .update({ due_at: "2026-09-03T01:00:00.000Z", review_status: "not_due" })
    .eq("id", reviewUnit.id);
  assert.equal(makeDue.error, null, makeDue.error?.message);

  const beforeReview = await getOrCreateTodaySnapshot(
    admin,
    learnerId,
    new Date("2026-09-03T02:00:00.000Z"),
  );
  assert.equal(beforeReview.storedPlan.id, first.storedPlan.id);
  assert.equal(beforeReview.storedPlan.status, "in_progress");
  assert.equal(beforeReview.storedPlan.plan.time_budget_minutes, 35);
  assert.equal(beforeReview.liveReview.counts.total, 1);
  assert.equal(beforeReview.liveReview.counts.actionable, 1);
  assert.equal(beforeReview.liveReview.counts.due, 1);
  assert.equal(beforeReview.liveReview.counts.upcoming, 0);

  const resolver = new SupabaseReviewLessonResolver(admin);
  const reviewLesson = await resolver.resolve(
    learnerId,
    reviewUnit.id,
    new Date("2026-09-03T02:00:00.000Z"),
  );
  const submitted = await submitReviewAttempt(admin, {
    userId: learnerId,
    lessonInstanceId: reviewLesson.id,
    reviewUnitId: reviewUnit.id,
    response: { kind: "text", text: "Thank you" },
  });
  assert.equal(submitted.replayed, false);
  assert.equal(submitted.reviewUpdates.length, 1);
  assert.equal(submitted.reviewUpdates[0].applied, true);

  const afterReview = await getOrCreateTodaySnapshot(
    admin,
    learnerId,
    new Date("2026-09-03T02:30:00.000Z"),
  );
  assert.equal(afterReview.storedPlan.id, first.storedPlan.id);
  assert.equal(afterReview.storedPlan.status, "in_progress");
  assert.equal(afterReview.storedPlan.plan.time_budget_minutes, 35);
  assert.equal(afterReview.liveReview.counts.total, 1);
  assert.equal(afterReview.liveReview.counts.actionable, 0);
  assert.equal(afterReview.liveReview.counts.upcoming, 1);

  const persistedPlan = await admin
    .from("daily_plans")
    .select("id,status,plan")
    .eq("id", first.storedPlan.id)
    .single();
  assert.equal(persistedPlan.error, null, persistedPlan.error?.message);
  assert.equal(persistedPlan.data.id, first.storedPlan.id);
  assert.equal(persistedPlan.data.status, "in_progress");
  assert.equal(persistedPlan.data.plan.time_budget_minutes, 35);
  assert.deepEqual(persistedPlan.data.plan.selected.new_node_ids, [
    "CF-A1-SOCIAL-GREET-01",
    "VX-A1-SOCIAL-FORMULAS-01",
  ]);

  console.log(
    "Today service DB integration passed: a brand-new learner gets the exact reviewed Pilot, one learner/date plan is reused, own-row RLS reads it, a started plan survives profile changes, and a real due Review completion changes live Today review state from ready to upcoming without replacing or mutating the frozen Daily Plan.",
  );
} finally {
  if (learnerId) await admin.auth.admin.deleteUser(learnerId);
}
