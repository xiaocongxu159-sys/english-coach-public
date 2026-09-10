import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyPlan, deriveDebtBand } from "../src/modules/engine/daily-scheduler.mts";
import type { DailySchedulerInput } from "../src/modules/engine/planning-types.mts";

const learnerId = "11111111-1111-4111-8111-111111111111";
const now = "2026-09-02T05:30:00.000Z";

function baseInput(): DailySchedulerInput {
  return {
    learnerId,
    planDate: "2026-09-02",
    now,
    timeBudgetMinutes: 35,
    reviewCandidates: [],
    nodeCandidates: [
      {
        nodeId: "CF-A1-SOCIAL-GREET-01",
        masteryStatus: "unseen",
        eligibleForNewLearning: true,
        reviewedContentAvailable: true,
        applicationCapable: true,
      },
      {
        nodeId: "VX-A1-SOCIAL-FORMULAS-01",
        masteryStatus: "unseen",
        eligibleForNewLearning: true,
        reviewedContentAvailable: true,
        applicationCapable: true,
      },
    ],
    skillDeficits: ["SP"],
    voiceAvailable: true,
  };
}

test("review debt bands use frozen ratio boundaries", () => {
  assert.equal(deriveDebtBand(5, 35), "low");
  assert.equal(deriveDebtBand(6, 35), "normal");
  assert.equal(deriveDebtBand(13, 35), "high");
  assert.equal(deriveDebtBand(22, 35), "severe");
});

test("brand-new learner gets only the two reviewed eligible Pilot roots", () => {
  const plan = buildDailyPlan(baseInput());
  assert.equal(plan.debt_band, "low");
  assert.deepEqual(plan.selected.new_node_ids, [
    "CF-A1-SOCIAL-GREET-01",
    "VX-A1-SOCIAL-FORMULAS-01",
  ]);
  assert.equal(
    Object.values(plan.allocations).reduce((sum, value) => sum + value, 0),
    35,
  );
  assert.ok(plan.explanations.some((value) => value.includes("hard prerequisites are ready")));
});

test("scheduler derives due work from dueAt at planning time and ignores future review units", () => {
  const input = baseInput();
  input.reviewCandidates = [
    {
      id: "overdue-old",
      nodeId: "VX-A1-SOCIAL-FORMULAS-01",
      dueAt: "2026-09-01T00:00:00.000Z",
      lifecycle: "active",
      estimatedMinutes: 3,
    },
    {
      id: "future",
      nodeId: "VX-A1-SOCIAL-FORMULAS-01",
      dueAt: "2026-09-03T00:00:00.000Z",
      lifecycle: "active",
      estimatedMinutes: 3,
    },
  ];
  const plan = buildDailyPlan(input);
  assert.deepEqual(plan.selected.review_unit_ids, ["overdue-old"]);
  assert.equal(plan.deferred.due_review_units, 0);
});

test("lapsed review has P0 priority ahead of older overdue review", () => {
  const input = baseInput();
  input.reviewCandidates = [
    {
      id: "old-overdue",
      nodeId: "VX-A1-SOCIAL-FORMULAS-01",
      dueAt: "2026-08-01T00:00:00.000Z",
      lifecycle: "active",
      estimatedMinutes: 3,
    },
    {
      id: "lapsed",
      nodeId: "CF-A1-SOCIAL-GREET-01",
      dueAt: "2026-09-02T05:29:00.000Z",
      lifecycle: "active",
      estimatedMinutes: 3,
      masteryStatus: "lapsed",
    },
  ];
  const plan = buildDailyPlan(input);
  assert.equal(plan.selected.review_unit_ids[0], "lapsed");
});

test("severe review debt pauses new learning and defers overflow without extending budget", () => {
  const input = baseInput();
  input.reviewCandidates = Array.from({ length: 8 }, (_, index) => ({
    id: `review-${index}`,
    nodeId: "VX-A1-SOCIAL-FORMULAS-01",
    dueAt: `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
    lifecycle: "active" as const,
    estimatedMinutes: 4,
  }));
  const plan = buildDailyPlan(input);
  assert.equal(plan.debt_band, "severe");
  assert.deepEqual(plan.selected.new_node_ids, []);
  assert.ok(plan.deferred.due_review_units > 0);
  assert.ok(plan.deferred.reason_codes.includes("time_budget"));
  assert.ok(plan.deferred.reason_codes.includes("review_debt"));
  assert.equal(plan.time_budget_minutes, 35);
});

test("inactive review units and unavailable new content are not selected", () => {
  const input = baseInput();
  input.reviewCandidates = [
    {
      id: "retired",
      nodeId: "VX-A1-SOCIAL-FORMULAS-01",
      dueAt: "2026-08-01T00:00:00.000Z",
      lifecycle: "retired",
      estimatedMinutes: 2,
    },
  ];
  input.nodeCandidates[0].reviewedContentAvailable = false;
  const plan = buildDailyPlan(input);
  assert.deepEqual(plan.selected.review_unit_ids, []);
  assert.deepEqual(plan.selected.new_node_ids, ["VX-A1-SOCIAL-FORMULAS-01"]);
});

test("invalid time budget is rejected rather than silently expanded or clamped", () => {
  assert.throws(
    () => buildDailyPlan({ ...baseInput(), timeBudgetMinutes: 121 }),
    /10 to 120/,
  );
});
