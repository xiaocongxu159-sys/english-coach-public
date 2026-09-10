import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadReviewQueueSnapshot } from "../src/modules/ui/review-queue-service.mts";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Review queue DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const email = `review-queue-${suffix}@example.test`;
const otherEmail = `review-queue-other-${suffix}@example.test`;
const password = `Review-${randomUUID()}-aA1!`;
let learnerId: string | undefined;
let otherLearnerId: string | undefined;

const cfNode = "CF-A1-SOCIAL-GREET-01";
const vxNode = "VX-A1-SOCIAL-FORMULAS-01";
const now = new Date("2026-09-02T12:00:00.000Z");

function reviewRow(input: {
  userId: string;
  nodeId: string;
  evidenceType: "recognition" | "controlled_production";
  contentRef: string;
  dueAt: string;
  reviewStatus: "not_due" | "due" | "overdue";
}) {
  return {
    user_id: input.userId,
    node_id: input.nodeId,
    review_type: "lexical_retrieval",
    evidence_type: input.evidenceType,
    content_ref: input.contentRef,
    content_version: 1,
    sibling_group_id: `${input.nodeId}:${input.evidenceType}`,
    lifecycle: "active",
    scheduler: "fsrs",
    scheduler_state: null,
    due_at: input.dueAt,
    algorithm_version: "FSRS-6",
    library_name: "ts-fsrs",
    library_version: "5.4.2",
    parameters_version: "review-v1-default",
    review_status: input.reviewStatus,
    revision: 1,
    activated_at: "2026-09-01T00:00:00.000Z",
  };
}

try {
  const [created, createdOther] = await Promise.all([
    admin.auth.admin.createUser({ email, password, email_confirm: true }),
    admin.auth.admin.createUser({
      email: otherEmail,
      password,
      email_confirm: true,
    }),
  ]);
  assert.equal(created.error, null, created.error?.message);
  assert.equal(createdOther.error, null, createdOther.error?.message);
  learnerId = created.data.user.id;
  otherLearnerId = createdOther.data.user.id;

  const states = await admin.from("learner_node_state").upsert([
    {
      user_id: learnerId,
      node_id: cfNode,
      mastery_status: "developing",
      evidence_summary: {},
    },
    {
      user_id: learnerId,
      node_id: vxNode,
      mastery_status: "lapsed",
      evidence_summary: {},
    },
    {
      user_id: otherLearnerId,
      node_id: cfNode,
      mastery_status: "developing",
      evidence_summary: {},
    },
  ]);
  assert.equal(states.error, null, states.error?.message);

  const inserted = await admin
    .from("review_units")
    .insert([
      reviewRow({
        userId: learnerId,
        nodeId: cfNode,
        evidenceType: "recognition",
        contentRef: `queue-overdue-${suffix}`,
        dueAt: "2026-09-01T10:00:00.000Z",
        reviewStatus: "not_due",
      }),
      reviewRow({
        userId: learnerId,
        nodeId: cfNode,
        evidenceType: "controlled_production",
        contentRef: `queue-due-${suffix}`,
        dueAt: "2026-09-02T11:30:00.000Z",
        reviewStatus: "not_due",
      }),
      reviewRow({
        userId: learnerId,
        nodeId: vxNode,
        evidenceType: "recognition",
        contentRef: `queue-relearning-${suffix}`,
        dueAt: "2026-09-05T12:00:00.000Z",
        reviewStatus: "not_due",
      }),
      reviewRow({
        userId: otherLearnerId,
        nodeId: cfNode,
        evidenceType: "recognition",
        contentRef: `queue-other-${suffix}`,
        dueAt: "2026-09-01T10:00:00.000Z",
        reviewStatus: "overdue",
      }),
    ])
    .select("id,user_id,content_ref,due_at");
  assert.equal(inserted.error, null, inserted.error?.message);
  assert.equal(inserted.data.length, 4);

  const learner = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await learner.auth.signInWithPassword({ email, password });
  assert.equal(signedIn.error, null, signedIn.error?.message);

  const first = await loadReviewQueueSnapshot(learner, learnerId, now);
  assert.equal(first.learnerId, learnerId);
  assert.equal(first.counts.total, 3);
  assert.equal(first.counts.actionable, 3);
  assert.deepEqual(
    first.items.map((item) => item.priority),
    ["relearning", "overdue", "due"],
  );
  assert.ok(first.items.every((item) => item.nodeTitle.length > 0));
  assert.equal(
    first.items.find((item) => item.contentRef === `queue-overdue-${suffix}`)
      ?.priority,
    "overdue",
  );

  // RLS prevents the learner-owned read service from seeing another learner's
  // queue even if a wrong user ID were passed below the authenticated server wrapper.
  const crossUser = await loadReviewQueueSnapshot(learner, otherLearnerId, now);
  assert.equal(crossUser.counts.total, 0);

  const ownOverdue = inserted.data.find(
    (row) => row.user_id === learnerId && row.content_ref === `queue-overdue-${suffix}`,
  );
  assert.ok(ownOverdue);
  const forbiddenUpdate = await learner
    .from("review_units")
    .update({ due_at: "2030-01-01T00:00:00.000Z" })
    .eq("id", ownOverdue.id)
    .select("id");
  assert.notEqual(forbiddenUpdate.error, null);
  assert.equal(forbiddenUpdate.error?.code, "42501");

  const authoritative = await admin
    .from("review_units")
    .select("due_at")
    .eq("id", ownOverdue.id)
    .single();
  assert.equal(authoritative.error, null, authoritative.error?.message);
  assert.equal(
    Date.parse(authoritative.data.due_at),
    Date.parse("2026-09-01T10:00:00.000Z"),
  );

  // A fresh authenticated client must reconstruct the same queue from persisted
  // Review Units rather than relying on browser memory.
  const freshLearner = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const freshSignIn = await freshLearner.auth.signInWithPassword({ email, password });
  assert.equal(freshSignIn.error, null, freshSignIn.error?.message);
  const afterRelogin = await loadReviewQueueSnapshot(freshLearner, learnerId, now);
  assert.deepEqual(
    afterRelogin.items.map((item) => [item.reviewUnitId, item.priority]),
    first.items.map((item) => [item.reviewUnitId, item.priority]),
  );

  console.log(
    "Review queue DB integration passed: own active Review Units are dynamically ordered from dueAt + Mastery, stale stored status is ignored, cross-user rows stay hidden, browser mutation is denied, and relogin reconstructs the same queue.",
  );
} finally {
  if (learnerId) await admin.auth.admin.deleteUser(learnerId);
  if (otherLearnerId) await admin.auth.admin.deleteUser(otherLearnerId);
}
