import type {
  ContentKind,
  EngineExerciseItem,
  ExerciseResponse,
  ScoringResult,
} from "./types.mts";

const TRUSTED_CONTENT = new Set(["reviewed_core", "validated_variant"]);

function assertContentKind(value: string): ContentKind {
  if (
    value === "reviewed_core" ||
    value === "validated_variant" ||
    value === "interactive_rubric" ||
    value === "unscored_practice"
  ) {
    return value;
  }
  throw new Error(`unsupported content kind: ${value}`);
}

export function normalizeAnswer(value: string, rules: string[] = []): string {
  let normalized = value;
  for (const rule of rules) {
    if (rule === "trim") normalized = normalized.trim();
    if (rule === "casefold") normalized = normalized.toLocaleLowerCase("en-US");
    if (rule === "collapse_whitespace") normalized = normalized.replace(/\s+/gu, " ");
    if (rule === "ignore_terminal_punctuation") {
      normalized = normalized.replace(/[.!?]+$/gu, "").trimEnd();
    }
  }
  return normalized;
}

function itemPassesTrustGate(item: EngineExerciseItem): boolean {
  return (
    item.status === "active" &&
    TRUSTED_CONTENT.has(item.provenance.content_class) &&
    item.validation.schema_pass &&
    item.validation.scope_pass &&
    item.validation.answer_pass &&
    item.validation.ambiguity_pass &&
    item.validation.level_pass &&
    item.validation.independent_qa_pass
  );
}

export function scoreExercise(
  item: EngineExerciseItem,
  response: ExerciseResponse,
): ScoringResult {
  const contentKind = assertContentKind(item.provenance.content_class);
  const trusted = itemPassesTrustGate(item);

  if (item.answer_spec.kind === "rubric" || item.task_type === "free_spoken") {
    if (response.kind !== "practice") {
      throw new Error(`practice response required for ${item.id}`);
    }
    return {
      isScored: false,
      correct: null,
      rating: 0,
      normalizedResponse: response.completed,
      evaluator: "deterministic",
      evaluatorConfidence: "high",
      contentKind: "unscored_practice",
      trusted: false,
      mayChangeMastery: false,
      mayUpdateReview: false,
    };
  }

  if (item.answer_spec.kind !== "deterministic") {
    throw new Error(`P1 Engine only accepts deterministic scored truth: ${item.id}`);
  }

  let correct = false;
  let normalizedResponse: string | boolean | null = null;

  if (item.task_type === "multiple_choice_single") {
    if (response.kind !== "choice") {
      throw new Error(`choice response required for ${item.id}`);
    }
    normalizedResponse = response.selectedOptionId;
    correct = (item.answer_spec.correct_option_ids ?? []).includes(
      response.selectedOptionId,
    );
  } else if (item.task_type === "short_answer") {
    if (response.kind !== "text") {
      throw new Error(`text response required for ${item.id}`);
    }
    const rules = item.answer_spec.normalization ?? [];
    normalizedResponse = normalizeAnswer(response.text, rules);
    const accepted = (item.answer_spec.accepted_answers ?? []).map((answer) =>
      normalizeAnswer(answer, rules),
    );
    correct = accepted.includes(normalizedResponse);
  } else {
    throw new Error(`unsupported deterministic task type: ${item.task_type}`);
  }

  const isScored = trusted;
  const mayChangeMastery =
    isScored && trusted && item.state_effect_policy.may_change_mastery;
  const mayUpdateReview =
    isScored && trusted && item.state_effect_policy.may_update_review;

  return {
    isScored,
    correct,
    rating: correct ? 4 : 0,
    normalizedResponse,
    evaluator: "deterministic",
    evaluatorConfidence: "high",
    contentKind,
    trusted,
    mayChangeMastery,
    mayUpdateReview,
  };
}
