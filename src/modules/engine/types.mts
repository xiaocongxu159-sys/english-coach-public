export type EvidenceType =
  | "recognition"
  | "controlled_production"
  | "free_written_production"
  | "free_spoken_production"
  | "spontaneous_reuse"
  | "listening_comprehension"
  | "reading_comprehension"
  | "pronunciation_intelligibility"
  | "communication_repair";

export type AssistanceLevel =
  | "independent"
  | "minor_prompt"
  | "major_prompt"
  | "model_then_repeat";

export type EvaluatorConfidence = "high" | "medium" | "low";
export type ContentKind =
  | "reviewed_core"
  | "validated_variant"
  | "interactive_rubric"
  | "unscored_practice";

export type MasteryStatus =
  | "unseen"
  | "introduced"
  | "developing"
  | "functional"
  | "secure"
  | "lapsed";

export type ReviewGrade = "Again" | "Hard" | "Good" | "Easy";
export type ReviewProductStatus =
  | "not_scheduled"
  | "not_due"
  | "due"
  | "overdue"
  | "relearning"
  | "suspended";

export type ExerciseResponse =
  | { kind: "choice"; selectedOptionId: string }
  | { kind: "text"; text: string }
  | { kind: "practice"; completed: boolean };

export interface EngineExerciseItem {
  id: string;
  version: number;
  status: string;
  template_id: string;
  task_type: string;
  target_node_ids: string[];
  support_node_ids?: string[];
  evidence_type: EvidenceType;
  content: {
    prompt: string;
    options?: Array<{ id: string; text: string }>;
  };
  answer_spec: {
    kind: "deterministic" | "rubric";
    accepted_answers?: string[];
    correct_option_ids?: string[];
    normalization?: string[];
  };
  provenance: { content_class: string };
  validation: {
    schema_pass: boolean;
    scope_pass: boolean;
    answer_pass: boolean;
    ambiguity_pass: boolean;
    level_pass: boolean;
    independent_qa_pass: boolean;
  };
  state_effect_policy: {
    may_change_mastery: boolean;
    may_update_review: boolean;
  };
}

export interface ScoringResult {
  isScored: boolean;
  correct: boolean | null;
  rating: 0 | 1 | 2 | 3 | 4;
  normalizedResponse: string | boolean | null;
  evaluator: "deterministic" | "rubric_ai" | "human";
  evaluatorConfidence: EvaluatorConfidence;
  contentKind: ContentKind;
  trusted: boolean;
  mayChangeMastery: boolean;
  mayUpdateReview: boolean;
}

export interface AttemptSourceSnapshot {
  itemVersion: number;
  targetNodeIds: string[];
  evidenceType: EvidenceType;
  contentKind: ContentKind;
  stateEffectPolicy: {
    mayChangeMastery: boolean;
    mayUpdateReview: boolean;
  };
}

export interface EngineEvidence {
  id?: string;
  userId: string;
  nodeId: string;
  attemptId: string;
  exerciseItemId: string;
  exerciseItemVersion: number;
  evidenceType: EvidenceType;
  rating: number;
  assistance: AssistanceLevel;
  evaluatorConfidence: EvaluatorConfidence;
  isScored: boolean;
  contentKind: ContentKind;
  trusted: boolean;
  occurredAt: string;
  lessonInstanceId: string;
  attemptGroupId: string;
  stageId: string;
  scenarioTag: string | null;
}

export interface MasteryConfig {
  state_affecting: {
    allowed_evaluator_confidence: EvaluatorConfidence[];
    allowed_content_kinds: ContentKind[];
  };
  promotion_eligible: {
    minimum_rating: number;
    allowed_assistance: AssistanceLevel[];
    allowed_evaluator_confidence: EvaluatorConfidence[];
    allowed_content_kinds: ContentKind[];
    requires_is_scored: boolean;
  };
  functional_gate: {
    minimum_scored_events: number;
    minimum_promotion_eligible_successes: number;
    minimum_independent_successes: number;
    minimum_distinct_sessions: number;
    required_evidence_types_each_need_success: boolean;
    latest_required_rating_floor: number;
  };
  secure_gate: {
    minimum_scored_events: number;
    minimum_promotion_eligible_successes: number;
    minimum_independent_successes: number;
    minimum_distinct_sessions: number;
    minimum_distinct_days: number;
    minimum_delayed_success_days: number;
    minimum_context_diversity_if_contextual: number;
    required_evidence_types_each_need_success: boolean;
    spontaneous_success_required_if_node_requires: boolean;
  };
  lapse_rule: {
    consecutive_core_failures: number;
    failure_rating_max: number;
    failure_must_be_scored: boolean;
    failure_evaluator_confidence_allowed: EvaluatorConfidence[];
    demote_to: "lapsed";
  };
  hard_prerequisite_ready_states: MasteryStatus[];
}

export interface MasteryDerivation {
  state: MasteryStatus;
  highestStateAchieved: Exclude<MasteryStatus, "lapsed">;
  prerequisiteReady: boolean;
  reviewStatus: "not_scheduled" | "not_due" | "due" | "overdue" | "relearning";
  summary: {
    scoredEvents: number;
    promotionEligibleSuccesses: number;
    independentSuccesses: number;
    distinctSessions: number;
    distinctDays: number;
    maxDelayedSuccessDays: number;
    contextDiversity: number;
    consecutiveCoreFailures: number;
    lastScoredAt: string | null;
    lastSuccessAt: string | null;
  };
  dimensionSummaries: Record<
    string,
    {
      scoredEvents: number;
      eligibleSuccesses: number;
      independentSuccesses: number;
      latestRating: number | null;
      lastEventAt: string | null;
      lastSuccessAt: string | null;
    }
  >;
}

export interface SubmissionInput {
  userId: string;
  lessonInstanceId: string;
  exerciseItemId: string;
  submissionKey: string;
  attemptGroupId: string;
  stageId: string;
  response: ExerciseResponse;
  assistance?: AssistanceLevel;
  scenarioTag?: string | null;
}

export interface AttemptRecord {
  id: string;
  userId: string;
  lessonInstanceId: string;
  exerciseItemId: string;
  submissionKey: string;
  attemptGroupId: string;
  stageId: string;
  scenarioTag: string | null;
  response: ExerciseResponse;
  evaluation: ScoringResult;
  sourceSnapshot: AttemptSourceSnapshot;
  evaluatorConfidence: EvaluatorConfidence;
  assistance: AssistanceLevel;
  trusted: boolean;
  stateAffecting: boolean;
  createdAt: string;
}

export interface ReviewUpdateSummary {
  reviewUnitId: string;
  nodeId: string;
  evidenceType: EvidenceType;
  grade: ReviewGrade;
  status: ReviewProductStatus;
  dueAt: string | null;
  applied: boolean;
  replayed: boolean;
}

export interface SubmissionResult {
  attempt: AttemptRecord;
  mastery: Record<string, MasteryDerivation>;
  emittedEvidence: number;
  reviewCandidate: boolean;
  reviewUpdates: ReviewUpdateSummary[];
  replayed: boolean;
}
