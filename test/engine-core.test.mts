import assert from "node:assert/strict";
import test from "node:test";
import { getMasteryConfig } from "../src/modules/engine/config.mts";
import { deriveMasteryState } from "../src/modules/engine/mastery.mts";
import {
  normalizeAnswer,
  scoreExercise,
} from "../src/modules/engine/scoring.mts";
import type {
  EngineEvidence,
  EngineExerciseItem,
} from "../src/modules/engine/types.mts";

const config = getMasteryConfig();

const shortItem: EngineExerciseItem = {
  id: "EI-A1-SOCIAL-CONTROLLED-001",
  version: 1,
  status: "active",
  template_id: "ET-A1-SOCIAL-CONTROLLED-01",
  task_type: "short_answer",
  target_node_ids: ["VX-A1-SOCIAL-FORMULAS-01"],
  evidence_type: "controlled_production",
  content: { prompt: "Write a greeting." },
  answer_spec: {
    kind: "deterministic",
    accepted_answers: ["Hello", "Hi"],
    normalization: [
      "trim",
      "casefold",
      "collapse_whitespace",
      "ignore_terminal_punctuation",
    ],
  },
  provenance: { content_class: "reviewed_core" },
  validation: {
    schema_pass: true,
    scope_pass: true,
    answer_pass: true,
    ambiguity_pass: true,
    level_pass: true,
    independent_qa_pass: true,
  },
  state_effect_policy: {
    may_change_mastery: true,
    may_update_review: true,
  },
};

const choiceItem: EngineExerciseItem = {
  ...shortItem,
  id: "EI-A1-SOCIAL-RECOGNITION-001",
  task_type: "multiple_choice_single",
  evidence_type: "recognition",
  content: {
    prompt: "Choose a greeting.",
    options: [
      { id: "A", text: "Hello" },
      { id: "B", text: "Bye" },
    ],
  },
  answer_spec: {
    kind: "deterministic",
    correct_option_ids: ["A"],
    normalization: [],
  },
};

function evidence(
  id: string,
  evidenceType: EngineEvidence["evidenceType"],
  rating: number,
  lessonInstanceId: string,
  occurredAt: string,
  overrides: Partial<EngineEvidence> = {},
): EngineEvidence {
  return {
    id,
    userId: "learner-1",
    nodeId: "VX-A1-SOCIAL-FORMULAS-01",
    attemptId: `attempt-${id}`,
    exerciseItemId: "EI-A1-SOCIAL-RECOGNITION-001",
    exerciseItemVersion: 1,
    evidenceType,
    rating,
    assistance: "independent",
    evaluatorConfidence: "high",
    isScored: true,
    contentKind: "reviewed_core",
    trusted: true,
    occurredAt,
    lessonInstanceId,
    attemptGroupId: `group-${id}`,
    stageId: "test-stage",
    scenarioTag: "everyday_social",
    ...overrides,
  };
}

test("answer normalization accepts reviewed surface variation", () => {
  assert.equal(
    normalizeAnswer("  HELLO!!!  ", [
      "trim",
      "casefold",
      "collapse_whitespace",
      "ignore_terminal_punctuation",
    ]),
    "hello",
  );
  assert.equal(
    scoreExercise(shortItem, { kind: "text", text: " Hi. " }).correct,
    true,
  );
});

test("deterministic multiple choice scores correct and incorrect answers", () => {
  assert.equal(
    scoreExercise(choiceItem, { kind: "choice", selectedOptionId: "A" })
      .rating,
    4,
  );
  assert.equal(
    scoreExercise(choiceItem, { kind: "choice", selectedOptionId: "B" })
      .rating,
    0,
  );
});

test("free spoken pilot practice cannot change mastery or review", () => {
  const spoken: EngineExerciseItem = {
    ...shortItem,
    id: "EI-A1-SOCIAL-SPEAK-001",
    task_type: "free_spoken",
    evidence_type: "free_spoken_production",
    answer_spec: { kind: "rubric" },
    state_effect_policy: {
      may_change_mastery: false,
      may_update_review: false,
    },
  };
  const result = scoreExercise(spoken, {
    kind: "practice",
    completed: true,
  });
  assert.equal(result.isScored, false);
  assert.equal(result.mayChangeMastery, false);
  assert.equal(result.mayUpdateReview, false);
});

test("one session remains developing even with required recognition and production", () => {
  const result = deriveMasteryState({
    requiredEvidenceTypes: ["recognition", "controlled_production"],
    evidence: [
      evidence(
        "1",
        "recognition",
        4,
        "lesson-1",
        "2026-09-01T01:00:00Z",
      ),
      evidence(
        "2",
        "controlled_production",
        4,
        "lesson-1",
        "2026-09-01T01:01:00Z",
      ),
    ],
    config,
  });
  assert.equal(result.state, "developing");
});

test("two sessions and three trusted events can make the VX pilot node functional", () => {
  const result = deriveMasteryState({
    requiredEvidenceTypes: ["recognition", "controlled_production"],
    evidence: [
      evidence(
        "1",
        "recognition",
        4,
        "lesson-1",
        "2026-09-01T01:00:00Z",
      ),
      evidence(
        "2",
        "controlled_production",
        4,
        "lesson-1",
        "2026-09-01T01:01:00Z",
      ),
      evidence(
        "3",
        "recognition",
        4,
        "lesson-2",
        "2026-09-01T02:00:00Z",
      ),
    ],
    config,
  });
  assert.equal(result.state, "functional");
  assert.equal(result.prerequisiteReady, true);
});

test("CF node cannot become functional without trusted free-spoken evidence", () => {
  const result = deriveMasteryState({
    requiredEvidenceTypes: [
      "recognition",
      "controlled_production",
      "free_spoken_production",
    ],
    evidence: [
      evidence(
        "1",
        "recognition",
        4,
        "lesson-1",
        "2026-09-01T01:00:00Z",
      ),
      evidence(
        "2",
        "controlled_production",
        4,
        "lesson-1",
        "2026-09-01T01:01:00Z",
      ),
      evidence(
        "3",
        "recognition",
        4,
        "lesson-2",
        "2026-09-01T02:00:00Z",
      ),
    ],
    config,
  });
  assert.equal(result.state, "developing");
});

test("two credible required-evidence failures lapse a functional node", () => {
  const prior = [
    evidence(
      "1",
      "recognition",
      4,
      "lesson-1",
      "2026-09-01T01:00:00Z",
    ),
    evidence(
      "2",
      "controlled_production",
      4,
      "lesson-1",
      "2026-09-01T01:01:00Z",
    ),
    evidence(
      "3",
      "recognition",
      4,
      "lesson-2",
      "2026-09-01T02:00:00Z",
    ),
  ];
  const result = deriveMasteryState({
    requiredEvidenceTypes: ["recognition", "controlled_production"],
    evidence: [
      ...prior,
      evidence(
        "4",
        "controlled_production",
        0,
        "lesson-2",
        "2026-09-01T02:10:00Z",
      ),
      evidence(
        "5",
        "controlled_production",
        0,
        "lesson-2",
        "2026-09-01T02:11:00Z",
      ),
    ],
    config,
    previousState: "functional",
    previousHighestState: "functional",
  });
  assert.equal(result.state, "lapsed");
  assert.equal(result.reviewStatus, "relearning");
});

test("low-confidence failures cannot lapse a functional node", () => {
  const result = deriveMasteryState({
    requiredEvidenceTypes: ["recognition", "controlled_production"],
    evidence: [
      evidence(
        "4",
        "controlled_production",
        0,
        "lesson-2",
        "2026-09-01T02:10:00Z",
        { evaluatorConfidence: "low" },
      ),
      evidence(
        "5",
        "controlled_production",
        0,
        "lesson-2",
        "2026-09-01T02:11:00Z",
        { evaluatorConfidence: "low" },
      ),
    ],
    config,
    previousState: "functional",
    previousHighestState: "functional",
  });
  assert.equal(result.state, "functional");
});
