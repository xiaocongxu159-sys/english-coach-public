import type {
  AssistanceLevel,
  ContentKind,
  EvaluatorConfidence,
  EvidenceType,
  MasteryStatus,
  ReviewGrade,
  ReviewProductStatus,
} from "./types.mts";

export type ReviewUnitLifecycle = "inactive" | "active" | "suspended" | "retired";
export type ReviewType =
  | "lexical_retrieval"
  | "grammar_retrieval"
  | "listening_microtask"
  | "speaking_retrieval"
  | "reading_microtask"
  | "writing_retrieval"
  | "pronunciation_retrieval"
  | "communication_repair";
export type FsrsCardStateName = "New" | "Learning" | "Review" | "Relearning";

export interface ReviewConfig {
  version: number;
  scheduler: {
    adapter: "fsrs";
    algorithm_version: string;
    implementation_candidate: string;
    request_retention: number;
    enable_fuzz: boolean;
    short_term_retry_owner: string;
    parameters_version: string;
  };
  grade_mapping: Record<AssistanceLevel, Record<string, ReviewGrade>>;
  fsrs_update_gate: {
    requires_is_scored: boolean;
    allowed_evaluator_confidence: EvaluatorConfidence[];
    allowed_content_kinds: ContentKind[];
  };
  review_unit_activation: {
    allowed_mastery_states: MasteryStatus[];
    requires_reviewable_content_ref: boolean;
    do_not_activate_unseen_nodes: boolean;
  };
  status_rules: {
    overdue_after_hours: number;
    lapsed_mastery_status: "relearning";
  };
}

export interface SerializedFsrsCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningSteps: number;
  state: FsrsCardStateName;
  lastReview: string | null;
}

export interface ReviewUnitRecord {
  id: string;
  userId: string;
  nodeId: string;
  reviewType: ReviewType;
  evidenceType: EvidenceType;
  contentRef: string;
  contentVersion: number | null;
  siblingGroupId: string;
  scenarioTag: string | null;
  lifecycle: ReviewUnitLifecycle;
  algorithm: "fsrs";
  algorithmVersion: string;
  libraryName: string;
  libraryVersion: string;
  parametersVersion: string;
  schedulerState: SerializedFsrsCard | null;
  dueAt: string | null;
  reviewStatus: ReviewProductStatus;
  revision: number;
  lastReviewAt: string | null;
  lastGrade: ReviewGrade | null;
}

export interface EnsureReviewUnitInput {
  userId: string;
  nodeId: string;
  reviewType: ReviewType;
  evidenceType: EvidenceType;
  contentRef: string;
  contentVersion: number;
  siblingGroupId: string;
  scenarioTag: string | null;
  algorithmVersion: string;
  libraryVersion: string;
  parametersVersion: string;
}

export interface ApplyReviewUpdateInput {
  reviewUnitId: string;
  userId: string;
  attemptId: string;
  attemptGroupId: string;
  expectedRevision: number;
  grade: ReviewGrade;
  beforeState: SerializedFsrsCard | null;
  afterState: SerializedFsrsCard;
  dueAt: string;
  reviewStatus: ReviewProductStatus;
  algorithmVersion: string;
  libraryVersion: string;
  parametersVersion: string;
  occurredAt: string;
  scheduledAt: string;
}

export type ApplyReviewUpdateResult = "applied" | "duplicate" | "conflict";

export interface ReviewGateInput {
  isScored: boolean;
  trusted: boolean;
  evaluatorConfidence: EvaluatorConfidence;
  contentKind: ContentKind;
  mayUpdateReview: boolean;
  stateAffecting: boolean;
}
