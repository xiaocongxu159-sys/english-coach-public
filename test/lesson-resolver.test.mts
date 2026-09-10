import assert from "node:assert/strict";
import test from "node:test";
import { validatePhase1PilotLessonRequest } from "../src/modules/engine/lesson-resolver.mts";
import { buildLearnerDailyPlan } from "../src/modules/engine/planning-service.mts";

const learnerId = "11111111-1111-4111-8111-111111111111";

function pilotPlan() {
  return buildLearnerDailyPlan({
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
      clearedNodeIds: new Set<string>(),
    },
    voiceAvailable: true,
  });
}

test("Phase 1 Pilot plan exposes exactly one resolvable reviewed lesson request", () => {
  const plan = pilotPlan();
  assert.equal(plan.lesson_requests.length, 1);
  assert.equal(plan.lesson_requests[0].blueprint_type, "new_learning");
  assert.equal(plan.lesson_requests[0].minutes, 14);
  assert.deepEqual(plan.selected.application_node_ids, [
    "CF-A1-SOCIAL-GREET-01",
    "VX-A1-SOCIAL-FORMULAS-01",
  ]);
  assert.ok(plan.explanations.some((value) => value.includes("no separate speaking-focus lesson is fabricated")));
  assert.doesNotThrow(() => validatePhase1PilotLessonRequest(plan, 0));
});

test("resolver rejects a request outside the frozen Pilot instead of fabricating content", () => {
  const plan = pilotPlan();
  plan.lesson_requests[0].primary_nodes = ["VX-A1-SOCIAL-FORMULAS-01"];
  assert.throws(
    () => validatePhase1PilotLessonRequest(plan, 0),
    /outside the frozen Phase 1 Pilot/,
  );
});

test("resolver rejects a fabricated unsupported blueprint type", () => {
  const plan = pilotPlan();
  plan.lesson_requests[0].blueprint_type = "speaking_focus";
  assert.throws(
    () => validatePhase1PilotLessonRequest(plan, 0),
    /only resolves the reviewed new-learning blueprint/,
  );
});
