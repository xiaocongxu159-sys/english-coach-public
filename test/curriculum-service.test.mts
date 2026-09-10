import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCurriculumEligibility,
  getEligibleActiveNodes,
  type CurriculumNodeRecord,
  type CurriculumPrerequisiteRecord,
} from "../src/modules/engine/curriculum-service.mts";

const emptyLearnerState = {
  masteryByNodeId: new Map(),
  clearedNodeIds: new Set<string>(),
};

test("active prerequisite-free Pilot roots are eligible for a brand-new learner", () => {
  const nodes: CurriculumNodeRecord[] = [
    { id: "CF-A1-SOCIAL-GREET-01", lifecycle: "active" },
    { id: "VX-A1-SOCIAL-FORMULAS-01", lifecycle: "active" },
  ];

  assert.deepEqual(
    getEligibleActiveNodes(nodes, [], emptyLearnerState).map((result) => result.nodeId),
    ["CF-A1-SOCIAL-GREET-01", "VX-A1-SOCIAL-FORMULAS-01"],
  );
});

test("draft/reviewed/deprecated nodes never become schedulable new learning", () => {
  for (const lifecycle of ["draft", "reviewed", "deprecated"] as const) {
    const result = evaluateCurriculumEligibility(
      { id: `NODE-${lifecycle}`, lifecycle },
      [],
      emptyLearnerState,
    );

    assert.equal(result.eligible, false);
    assert.deepEqual(result.blockedBy, [
      { prerequisiteNodeId: null, reason: "node_not_active" },
    ]);
  }
});

test("hard prerequisites require functional/secure mastery or explicit clearance", () => {
  const node = { id: "TARGET", lifecycle: "active" } as const;
  const prerequisites: CurriculumPrerequisiteRecord[] = [
    {
      nodeId: "TARGET",
      prerequisiteNodeId: "PREREQ",
      prerequisiteType: "hard",
    },
  ];

  const blocked = evaluateCurriculumEligibility(node, prerequisites, emptyLearnerState);
  assert.equal(blocked.eligible, false);
  assert.deepEqual(blocked.blockedBy, [
    { prerequisiteNodeId: "PREREQ", reason: "hard_prerequisite_not_ready" },
  ]);

  for (const mastery of ["functional", "secure"] as const) {
    const ready = evaluateCurriculumEligibility(node, prerequisites, {
      masteryByNodeId: new Map([["PREREQ", mastery]]),
      clearedNodeIds: new Set(),
    });
    assert.equal(ready.eligible, true);
  }

  const cleared = evaluateCurriculumEligibility(node, prerequisites, {
    masteryByNodeId: new Map([["PREREQ", "unseen"]]),
    clearedNodeIds: new Set(["PREREQ"]),
  });
  assert.equal(cleared.eligible, true);
});

test("lapsed hard prerequisite blocks progression even when old clearance exists", () => {
  const result = evaluateCurriculumEligibility(
    { id: "TARGET", lifecycle: "active" },
    [
      {
        nodeId: "TARGET",
        prerequisiteNodeId: "PREREQ",
        prerequisiteType: "hard",
      },
    ],
    {
      masteryByNodeId: new Map([["PREREQ", "lapsed"]]),
      clearedNodeIds: new Set(["PREREQ"]),
    },
  );

  assert.equal(result.eligible, false);
  assert.deepEqual(result.blockedBy, [
    { prerequisiteNodeId: "PREREQ", reason: "hard_prerequisite_lapsed" },
  ]);
});

test("soft prerequisites do not fabricate hard prerequisite blocking", () => {
  const result = evaluateCurriculumEligibility(
    { id: "TARGET", lifecycle: "active" },
    [
      {
        nodeId: "TARGET",
        prerequisiteNodeId: "SOFT",
        prerequisiteType: "soft",
      },
    ],
    emptyLearnerState,
  );

  assert.equal(result.eligible, true);
  assert.deepEqual(result.hardPrerequisiteIds, []);
});
