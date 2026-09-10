import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SupabaseDailyPlanStore } from "../src/modules/engine/daily-plan-store.mts";
import { buildLearnerDailyPlan } from "../src/modules/engine/planning-service.mts";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Daily Plan DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const store = new SupabaseDailyPlanStore(admin);
const suffix = randomUUID().slice(0, 8);
const password = `Planning-${randomUUID()}-aA1!`;
let learnerId: string | undefined;
let otherLearnerId: string | undefined;

try {
  const created = await admin.auth.admin.createUser({
    email: `planning-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  learnerId = created.data.user.id;

  const other = await admin.auth.admin.createUser({
    email: `planning-other-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(other.error, null, other.error?.message);
  otherLearnerId = other.data.user.id;

  const planDate = "2026-09-02";
  const plan = buildLearnerDailyPlan({
    learnerId,
    planDate,
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
    skillDeficits: ["SP"],
    voiceAvailable: true,
  });

  const first = await store.upsertDailyPlan(plan);
  assert.equal(first.userId, learnerId);
  assert.deepEqual(first.plan.selected.new_node_ids, [
    "CF-A1-SOCIAL-GREET-01",
    "VX-A1-SOCIAL-FORMULAS-01",
  ]);

  const second = await store.upsertDailyPlan(plan);
  assert.equal(second.id, first.id);

  const rows = await admin
    .from("daily_plans")
    .select("id,user_id,plan_date")
    .eq("user_id", learnerId)
    .eq("plan_date", planDate);
  assert.equal(rows.error, null, rows.error?.message);
  assert.equal(rows.data.length, 1);

  const learner = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signedIn = await learner.auth.signInWithPassword({ email: `planning-${suffix}@example.test`, password });
  assert.equal(signedIn.error, null, signedIn.error?.message);

  const ownRead = await learner.from("daily_plans").select("id,user_id,plan_date,plan").eq("plan_date", planDate);
  assert.equal(ownRead.error, null, ownRead.error?.message);
  assert.equal(ownRead.data.length, 1);
  assert.equal(ownRead.data[0].user_id, learnerId);

  const otherPlan = buildLearnerDailyPlan({
    learnerId: otherLearnerId,
    planDate,
    now: "2026-09-02T06:00:00.000Z",
    timeBudgetMinutes: 20,
    reviewCandidates: [],
    curriculumNodes: [],
    prerequisites: [],
    learnerCurriculumState: {
      masteryByNodeId: new Map(),
      clearedNodeIds: new Set(),
    },
  });
  await store.upsertDailyPlan(otherPlan);

  const crossRead = await learner.from("daily_plans").select("id,user_id").eq("user_id", otherLearnerId);
  assert.equal(crossRead.error, null, crossRead.error?.message);
  assert.equal(crossRead.data.length, 0);

  const clientWrite = await learner.from("daily_plans").insert({
    user_id: learnerId,
    plan_date: "2026-09-03",
    status: "planned",
    plan,
  });
  assert.notEqual(clientWrite.error, null);

  const inProgress = await admin
    .from("daily_plans")
    .update({ status: "in_progress" })
    .eq("id", first.id);
  assert.equal(inProgress.error, null, inProgress.error?.message);

  const replacement = buildLearnerDailyPlan({
    learnerId,
    planDate,
    now: "2026-09-02T07:00:00.000Z",
    timeBudgetMinutes: 20,
    reviewCandidates: [],
    curriculumNodes: [],
    prerequisites: [],
    learnerCurriculumState: {
      masteryByNodeId: new Map(),
      clearedNodeIds: new Set(),
    },
  });
  const preserved = await store.upsertDailyPlan(replacement);
  assert.equal(preserved.status, "in_progress");
  assert.equal(preserved.plan.time_budget_minutes, 35);

  console.log("Daily Plan DB integration passed: C1-gated Pilot planning, one plan per learner/date, server-authoritative writes, own-row RLS, cross-user isolation and in-progress preservation are enforced.");
} finally {
  if (learnerId) await admin.auth.admin.deleteUser(learnerId);
  if (otherLearnerId) await admin.auth.admin.deleteUser(otherLearnerId);
}
