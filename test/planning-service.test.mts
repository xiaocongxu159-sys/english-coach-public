import assert from "node:assert/strict";
import test from "node:test";
import { buildLearnerDailyPlan } from "../src/modules/engine/planning-service.mts";

const base = {
  learnerId: "11111111-1111-4111-8111-111111111111",
  planDate: "2026-09-02",
  now: "2026-09-02T06:00:00.000Z",
  timeBudgetMinutes: 35,
  reviewCandidates: [],
  prerequisites: [],
  learnerCurriculumState: {
    masteryByNodeId: new Map(),
    clearedNodeIds: new Set<string>(),
  },
};

const pilotNodes = [
  {
    id: "CF-A1-SOCIAL-GREET-01",
    lifecycle: "active" as const,
    masteryStatus: "unseen" as const,
    reviewedContentAvailable: true,
    applicationCapable: true,
  },
  {
    id: "VX-A1-SOCIAL-FORMULAS-01",
    lifecycle: "active" as const,
    masteryStatus: "unseen" as const,
    reviewedContentAvailable: true,
    applicationCapable: true,
  },
];

test("planning service admits the reviewed prerequisite-free active Pilot roots", () => {
  const plan = buildLearnerDailyPlan({
    ...base,
    curriculumNodes: pilotNodes,
  });

  assert.deepEqual(plan.selected.new_node_ids, [
    "CF-A1-SOCIAL-GREET-01",
    "VX-A1-SOCIAL-FORMULAS-01",
  ]);
  assert.equal(plan.lesson_requests.length, 1);
  assert.equal(plan.lesson_requests[0].blueprint_type, "new_learning");
  assert.equal(plan.lesson_requests[0].minutes, 14);
});

test("50-minute preference does not expand the reviewed Pilot lesson past its 18-minute bound", () => {
  const plan = buildLearnerDailyPlan({
    ...base,
    timeBudgetMinutes: 50,
    curriculumNodes: pilotNodes,
  });

  assert.deepEqual(plan.selected.new_node_ids, [
    "CF-A1-SOCIAL-GREET-01",
    "VX-A1-SOCIAL-FORMULAS-01",
  ]);
  assert.equal(plan.lesson_requests.length, 1);
  assert.equal(plan.lesson_requests[0].minutes, 18);
  assert.ok(plan.warnings.some((warning) => warning.includes("unused")));
});

test("20-minute preference cannot fabricate an unreviewed one-node Pilot lesson", () => {
  assert.throws(
    () =>
      buildLearnerDailyPlan({
        ...base,
        timeBudgetMinutes: 20,
        curriculumNodes: pilotNodes,
      }),
    /no reviewed lesson for a partial Pilot-node frontier/,
  );
});

test("planning service cannot bypass C1 with an unready hard prerequisite", () => {
  const plan = buildLearnerDailyPlan({
    ...base,
    curriculumNodes: [
      {
        id: "TARGET-A1-NODE-01",
        lifecycle: "active",
        masteryStatus: "unseen",
        reviewedContentAvailable: true,
        applicationCapable: false,
      },
    ],
    prerequisites: [
      {
        nodeId: "TARGET-A1-NODE-01",
        prerequisiteNodeId: "PREREQ-A1-NODE-01",
        prerequisiteType: "hard",
      },
    ],
  });

  assert.deepEqual(plan.selected.new_node_ids, []);
});

test("planning service allows hard prerequisite only through functional/secure mastery or clearance", () => {
  const curriculumNodes = [
    {
      id: "TARGET-A1-NODE-01",
      lifecycle: "active" as const,
      masteryStatus: "unseen" as const,
      reviewedContentAvailable: true,
      applicationCapable: false,
    },
  ];
  const prerequisites = [
    {
      nodeId: "TARGET-A1-NODE-01",
      prerequisiteNodeId: "PREREQ-A1-NODE-01",
      prerequisiteType: "hard" as const,
    },
  ];

  const mastered = buildLearnerDailyPlan({
    ...base,
    curriculumNodes,
    prerequisites,
    learnerCurriculumState: {
      masteryByNodeId: new Map([["PREREQ-A1-NODE-01", "functional" as const]]),
      clearedNodeIds: new Set(),
    },
  });
  assert.deepEqual(mastered.selected.new_node_ids, ["TARGET-A1-NODE-01"]);

  const cleared = buildLearnerDailyPlan({
    ...base,
    curriculumNodes,
    prerequisites,
    learnerCurriculumState: {
      masteryByNodeId: new Map([["PREREQ-A1-NODE-01", "unseen" as const]]),
      clearedNodeIds: new Set(["PREREQ-A1-NODE-01"]),
    },
  });
  assert.deepEqual(cleared.selected.new_node_ids, ["TARGET-A1-NODE-01"]);
});