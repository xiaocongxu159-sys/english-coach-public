import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReviewQueueSnapshot,
  type ReviewQueueSourceUnit,
} from "../src/modules/ui/review-queue-service.mts";
import type { MasteryStatus } from "../src/modules/engine/types.mts";

const learnerId = "learner-1";

function unit(
  id: string,
  nodeId: string,
  evidenceType: ReviewQueueSourceUnit["evidenceType"],
  dueAt: string | null,
  storedReviewStatus: ReviewQueueSourceUnit["storedReviewStatus"] = "not_due",
): ReviewQueueSourceUnit {
  return {
    id,
    userId: learnerId,
    nodeId,
    reviewType: "lexical_retrieval",
    evidenceType,
    contentRef: `${id}@v1`,
    dueAt,
    lifecycle: "active",
    storedReviewStatus,
  };
}

test("review queue derives wall-clock priority and orders relearning before overdue and due", () => {
  const now = new Date("2026-09-02T12:00:00.000Z");
  const units = [
    unit(
      "unit-overdue",
      "CF-A1-SOCIAL-GREET-01",
      "recognition",
      "2026-09-01T11:59:59.000Z",
      "not_due",
    ),
    unit(
      "unit-relearning",
      "VX-A1-SOCIAL-FORMULAS-01",
      "recognition",
      "2026-09-05T12:00:00.000Z",
      "not_due",
    ),
    unit(
      "unit-due",
      "CF-A1-SOCIAL-GREET-01",
      "controlled_production",
      "2026-09-02T11:30:00.000Z",
      "not_due",
    ),
    unit(
      "unit-relearning-earlier",
      "VX-A1-SOCIAL-FORMULAS-01",
      "controlled_production",
      "2026-09-03T12:00:00.000Z",
      "overdue",
    ),
  ];
  const masteryByNode = new Map<string, MasteryStatus>([
    ["CF-A1-SOCIAL-GREET-01", "developing"],
    ["VX-A1-SOCIAL-FORMULAS-01", "lapsed"],
  ]);
  const titleByNode = new Map([
    ["CF-A1-SOCIAL-GREET-01", "Greetings"],
    ["VX-A1-SOCIAL-FORMULAS-01", "Social formulas"],
  ]);

  const snapshot = buildReviewQueueSnapshot({
    learnerId,
    units,
    masteryByNode,
    titleByNode,
    now,
  });

  assert.deepEqual(
    snapshot.items.map((item) => [item.reviewUnitId, item.priority]),
    [
      ["unit-relearning-earlier", "relearning"],
      ["unit-relearning", "relearning"],
      ["unit-overdue", "overdue"],
      ["unit-due", "due"],
    ],
  );
  assert.equal(snapshot.counts.total, 4);
  assert.equal(snapshot.counts.actionable, 4);
  assert.equal(snapshot.counts.relearning, 2);
  assert.equal(snapshot.counts.overdue, 1);
  assert.equal(snapshot.counts.due, 1);
  assert.equal(snapshot.counts.upcoming, 0);

  // Stored transition-time labels are deliberately ignored. The overdue unit is
  // derived from dueAt even though its stored status says not_due.
  assert.equal(snapshot.items[2].priority, "overdue");
});

test("review queue keeps non-lapsed future work upcoming and treats 24 hours as overdue", () => {
  const now = new Date("2026-09-02T12:00:00.000Z");
  const snapshot = buildReviewQueueSnapshot({
    learnerId,
    units: [
      unit(
        "unit-boundary",
        "CF-A1-SOCIAL-GREET-01",
        "recognition",
        "2026-09-01T12:00:00.000Z",
      ),
      unit(
        "unit-future",
        "VX-A1-SOCIAL-FORMULAS-01",
        "recognition",
        "2026-09-03T12:00:00.000Z",
      ),
    ],
    masteryByNode: new Map<string, MasteryStatus>([
      ["CF-A1-SOCIAL-GREET-01", "developing"],
      ["VX-A1-SOCIAL-FORMULAS-01", "functional"],
    ]),
    titleByNode: new Map([
      ["CF-A1-SOCIAL-GREET-01", "Greetings"],
      ["VX-A1-SOCIAL-FORMULAS-01", "Social formulas"],
    ]),
    now,
  });

  assert.deepEqual(
    snapshot.items.map((item) => item.priority),
    ["overdue", "not_due"],
  );
  assert.equal(snapshot.counts.actionable, 1);
  assert.equal(snapshot.counts.upcoming, 1);
});

test("review queue has a deterministic tie-break when dueAt is null", () => {
  const now = new Date("2026-09-02T12:00:00.000Z");
  const snapshot = buildReviewQueueSnapshot({
    learnerId,
    units: [
      unit(
        "unit-z",
        "VX-A1-SOCIAL-FORMULAS-01",
        "recognition",
        null,
        "not_scheduled",
      ),
      unit(
        "unit-a",
        "CF-A1-SOCIAL-GREET-01",
        "recognition",
        null,
        "not_scheduled",
      ),
    ],
    masteryByNode: new Map<string, MasteryStatus>([
      ["CF-A1-SOCIAL-GREET-01", "developing"],
      ["VX-A1-SOCIAL-FORMULAS-01", "functional"],
    ]),
    titleByNode: new Map([
      ["CF-A1-SOCIAL-GREET-01", "Greetings"],
      ["VX-A1-SOCIAL-FORMULAS-01", "Social formulas"],
    ]),
    now,
  });

  assert.deepEqual(
    snapshot.items.map((item) => item.reviewUnitId),
    ["unit-a", "unit-z"],
  );
  assert.deepEqual(
    snapshot.items.map((item) => item.priority),
    ["not_scheduled", "not_scheduled"],
  );
});

test("review queue fails closed when authoritative learner state is missing", () => {
  assert.throws(
    () =>
      buildReviewQueueSnapshot({
        learnerId,
        units: [
          unit(
            "unit-missing-state",
            "CF-A1-SOCIAL-GREET-01",
            "recognition",
            "2026-09-02T12:00:00.000Z",
          ),
        ],
        masteryByNode: new Map(),
        titleByNode: new Map([["CF-A1-SOCIAL-GREET-01", "Greetings"]]),
        now: new Date("2026-09-02T12:00:00.000Z"),
      }),
    /no learner node state/u,
  );
});
