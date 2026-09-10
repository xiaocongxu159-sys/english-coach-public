import assert from "node:assert/strict";
import test from "node:test";
import {
  FsrsReviewAdapter,
  mapReviewGrade,
  reviewGatePasses,
  reviewStatusAt,
  reviewTypeFor,
  TS_FSRS_LIBRARY_VERSION,
} from "../src/modules/engine/review-adapter.mts";
import { getReviewConfig } from "../src/modules/engine/review-config.mts";
import type { AttemptRecord } from "../src/modules/engine/types.mts";

const config = getReviewConfig();

function attempt(
  rating: AttemptRecord["evaluation"]["rating"],
  assistance: AttemptRecord["assistance"] = "independent",
): AttemptRecord {
  return {
    id: "attempt-review-test",
    userId: "learner-review-test",
    lessonInstanceId: "lesson-review-test",
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-001",
    submissionKey: "review-test-submission",
    attemptGroupId: "review-test-group",
    stageId: "controlled_formulas",
    scenarioTag: "everyday_social",
    response: { kind: "text", text: "Hello" },
    evaluation: {
      isScored: true,
      correct: rating >= 3,
      rating,
      normalizedResponse: "hello",
      evaluator: "deterministic",
      evaluatorConfidence: "high",
      contentKind: "reviewed_core",
      trusted: true,
      mayChangeMastery: true,
      mayUpdateReview: true,
    },
    sourceSnapshot: {
      itemVersion: 1,
      targetNodeIds: ["VX-A1-SOCIAL-FORMULAS-01"],
      evidenceType: "controlled_production",
      contentKind: "reviewed_core",
      stateEffectPolicy: {
        mayChangeMastery: true,
        mayUpdateReview: true,
      },
    },
    evaluatorConfidence: "high",
    assistance,
    trusted: true,
    stateAffecting: true,
    createdAt: "2026-09-02T01:00:00.000Z",
  };
}

test("review config pins the frozen FSRS boundary and library version", () => {
  assert.equal(config.scheduler.adapter, "fsrs");
  assert.equal(config.scheduler.algorithm_version, "FSRS-6");
  assert.equal(config.scheduler.request_retention, 0.9);
  assert.equal(config.scheduler.short_term_retry_owner, "lesson_engine");
  assert.equal(TS_FSRS_LIBRARY_VERSION, "5.4.2");
});

test("review grade mapping follows frozen assistance caps", () => {
  assert.equal(mapReviewGrade(attempt(0), config), "Again");
  assert.equal(mapReviewGrade(attempt(2), config), "Hard");
  assert.equal(mapReviewGrade(attempt(3), config), "Good");
  assert.equal(mapReviewGrade(attempt(4), config), "Easy");
  assert.equal(mapReviewGrade(attempt(4, "minor_prompt"), config), "Hard");
  assert.equal(mapReviewGrade(attempt(4, "major_prompt"), config), "Again");
  assert.equal(mapReviewGrade(attempt(4, "model_then_repeat"), config), "Again");
});

test("review update gate rejects low-confidence, unscored, untrusted and practice events", () => {
  const eligible = {
    isScored: true,
    trusted: true,
    evaluatorConfidence: "high" as const,
    contentKind: "reviewed_core" as const,
    mayUpdateReview: true,
    stateAffecting: true,
  };
  assert.equal(reviewGatePasses(eligible, config), true);
  assert.equal(
    reviewGatePasses({ ...eligible, evaluatorConfidence: "low" }, config),
    false,
  );
  assert.equal(reviewGatePasses({ ...eligible, isScored: false }, config), false);
  assert.equal(reviewGatePasses({ ...eligible, trusted: false }, config), false);
  assert.equal(
    reviewGatePasses({ ...eligible, contentKind: "unscored_practice" }, config),
    false,
  );
  assert.equal(
    reviewGatePasses({ ...eligible, mayUpdateReview: false }, config),
    false,
  );
  assert.equal(
    reviewGatePasses({ ...eligible, stateAffecting: false }, config),
    false,
  );
});

test("review unit modality mapping keeps vocabulary and grammar semantics distinct", () => {
  assert.equal(
    reviewTypeFor("VX-A1-SOCIAL-FORMULAS-01", "controlled_production"),
    "lexical_retrieval",
  );
  assert.equal(
    reviewTypeFor("GR-A1-BE-PRESENT-01", "controlled_production"),
    "grammar_retrieval",
  );
  assert.equal(
    reviewTypeFor("CF-A1-SOCIAL-GREET-01", "free_spoken_production"),
    "speaking_retrieval",
  );
  assert.equal(
    reviewTypeFor("LS-A1-DETAIL-NUMBERS-01", "listening_comprehension"),
    "listening_microtask",
  );
});

test("FSRS adapter creates a serializable next card without short-term lesson retries", () => {
  const now = new Date("2026-09-02T01:00:00.000Z");
  const adapter = new FsrsReviewAdapter(config);
  const next = adapter.next(null, now, "Good");
  assert.equal(next.reps, 1);
  assert.equal(next.lastReview, now.toISOString());
  assert.ok(Date.parse(next.due) >= now.getTime());
  assert.ok(next.stability >= 0);
  assert.ok(next.difficulty >= 0);
});

test("product review status remains separate from mastery and marks lapses relearning", () => {
  const now = new Date("2026-09-02T12:00:00.000Z");
  assert.equal(
    reviewStatusAt("2026-09-03T12:00:00.000Z", "functional", now, 24),
    "not_due",
  );
  assert.equal(
    reviewStatusAt("2026-09-02T11:00:00.000Z", "functional", now, 24),
    "due",
  );
  assert.equal(
    reviewStatusAt("2026-09-01T11:00:00.000Z", "functional", now, 24),
    "overdue",
  );
  assert.equal(
    reviewStatusAt("2026-09-03T12:00:00.000Z", "lapsed", now, 24),
    "relearning",
  );
});
