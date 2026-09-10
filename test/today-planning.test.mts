import assert from "node:assert/strict";
import test from "node:test";
import {
  TODAY_REVIEW_UNIT_ESTIMATED_MINUTES,
  clearedNodeIdsFromRows,
  masteryMapFromRows,
  planningNodesFromRows,
  resolvePlanDate,
  reviewCandidatesFromRows,
  validateTodayProfile,
} from "../src/modules/ui/today-planning.mts";

test("Today resolves the plan date in the learner timezone", () => {
  const now = new Date("2026-09-02T06:30:00.000Z");
  assert.equal(resolvePlanDate(now, "UTC"), "2026-09-02");
  assert.equal(resolvePlanDate(now, "America/Los_Angeles"), "2026-09-01");
});

test("Today profile validation preserves valid settings and rejects unsupported scheduler budgets", () => {
  assert.deepEqual(validateTodayProfile({ timezone: "UTC", dailyMinutes: 35 }), {
    timezone: "UTC",
    dailyMinutes: 35,
  });
  assert.throws(
    () => validateTodayProfile({ timezone: "UTC", dailyMinutes: 121 }),
    /integer from 10 to 120/,
  );
  assert.throws(
    () => validateTodayProfile({ timezone: "Not/A-Timezone", dailyMinutes: 35 }),
    /invalid learner timezone/,
  );
});

test("Today builds validated Mastery and Clearance state without inventing readiness", () => {
  const mastery = masteryMapFromRows([
    { node_id: "CF-A1-SOCIAL-GREET-01", mastery_status: "developing" },
  ]);
  assert.equal(mastery.get("CF-A1-SOCIAL-GREET-01"), "developing");
  assert.throws(
    () => masteryMapFromRows([{ node_id: "bad", mastery_status: "completed" }]),
    /invalid mastery state/,
  );

  const cleared = clearedNodeIdsFromRows([
    { node_id: "ready", status: "cleared" },
    { node_id: "revoked", status: "revoked" },
  ]);
  assert.deepEqual([...cleared], ["ready"]);
});

test("Today maps curriculum rows for the Engine without precomputing C1 eligibility", () => {
  const mastery = new Map([["CF-A1-SOCIAL-GREET-01", "developing" as const]]);
  const nodes = planningNodesFromRows(
    [
      { id: "CF-A1-SOCIAL-GREET-01", lifecycle: "active" },
      { id: "VX-A1-SOCIAL-FORMULAS-01", lifecycle: "active" },
    ],
    mastery,
    true,
  );

  assert.deepEqual(nodes, [
    {
      id: "CF-A1-SOCIAL-GREET-01",
      lifecycle: "active",
      masteryStatus: "developing",
      reviewedContentAvailable: true,
      applicationCapable: true,
      recentPracticeAt: null,
    },
    {
      id: "VX-A1-SOCIAL-FORMULAS-01",
      lifecycle: "active",
      masteryStatus: "unseen",
      reviewedContentAvailable: true,
      applicationCapable: true,
      recentPracticeAt: null,
    },
  ]);
  assert.equal("eligibleForNewLearning" in nodes[0], false);
});

test("Today maps Review Units through one explicit provisional minute estimate", () => {
  const mastery = new Map([["CF-A1-SOCIAL-GREET-01", "lapsed" as const]]);
  const candidates = reviewCandidatesFromRows(
    [
      {
        id: "review-1",
        node_id: "CF-A1-SOCIAL-GREET-01",
        due_at: "2026-09-01T00:00:00.000Z",
        lifecycle: "active",
      },
    ],
    mastery,
  );

  assert.equal(TODAY_REVIEW_UNIT_ESTIMATED_MINUTES, 1);
  assert.deepEqual(candidates, [
    {
      id: "review-1",
      nodeId: "CF-A1-SOCIAL-GREET-01",
      dueAt: "2026-09-01T00:00:00.000Z",
      lifecycle: "active",
      estimatedMinutes: 1,
      masteryStatus: "lapsed",
    },
  ]);
});
