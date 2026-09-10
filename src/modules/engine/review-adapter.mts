import {
  createEmptyCard,
  fsrs,
  Rating,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";
import type {
  AttemptRecord,
  EvidenceType,
  MasteryStatus,
  ReviewGrade,
  ReviewProductStatus,
} from "./types.mts";
import type {
  FsrsCardStateName,
  ReviewConfig,
  ReviewGateInput,
  ReviewType,
  SerializedFsrsCard,
} from "./review-types.mts";

export const TS_FSRS_LIBRARY_VERSION = "5.4.2";

function stateName(state: State): FsrsCardStateName {
  switch (state) {
    case State.New:
      return "New";
    case State.Learning:
      return "Learning";
    case State.Review:
      return "Review";
    case State.Relearning:
      return "Relearning";
    default:
      throw new Error(`unsupported FSRS card state: ${state}`);
  }
}

function stateValue(state: FsrsCardStateName): State {
  switch (state) {
    case "New":
      return State.New;
    case "Learning":
      return State.Learning;
    case "Review":
      return State.Review;
    case "Relearning":
      return State.Relearning;
  }
}

function serializeCard(card: Card): SerializedFsrsCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learningSteps: card.learning_steps,
    state: stateName(card.state),
    lastReview: card.last_review?.toISOString() ?? null,
  };
}

function deserializeCard(card: SerializedFsrsCard): Card {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learningSteps,
    state: stateValue(card.state),
    last_review: card.lastReview ? new Date(card.lastReview) : undefined,
  };
}

function ratingValue(grade: ReviewGrade): Grade {
  switch (grade) {
    case "Again":
      return Rating.Again;
    case "Hard":
      return Rating.Hard;
    case "Good":
      return Rating.Good;
    case "Easy":
      return Rating.Easy;
  }
}

export function mapReviewGrade(
  attempt: Pick<AttemptRecord, "assistance" | "evaluation">,
  config: ReviewConfig,
): ReviewGrade {
  const mapped = config.grade_mapping[attempt.assistance]?.[
    String(attempt.evaluation.rating)
  ];
  if (!mapped) {
    throw new Error(
      `review grade mapping is missing: ${attempt.assistance}/${attempt.evaluation.rating}`,
    );
  }
  return mapped;
}

export function reviewGatePasses(
  input: ReviewGateInput,
  config: ReviewConfig,
): boolean {
  return (
    input.stateAffecting &&
    input.mayUpdateReview &&
    (!config.fsrs_update_gate.requires_is_scored || input.isScored) &&
    input.trusted &&
    config.fsrs_update_gate.allowed_evaluator_confidence.includes(
      input.evaluatorConfidence,
    ) &&
    config.fsrs_update_gate.allowed_content_kinds.includes(input.contentKind)
  );
}

export function reviewTypeFor(
  nodeId: string,
  evidenceType: EvidenceType,
): ReviewType {
  if (evidenceType === "listening_comprehension") return "listening_microtask";
  if (evidenceType === "reading_comprehension") return "reading_microtask";
  if (evidenceType === "pronunciation_intelligibility") {
    return "pronunciation_retrieval";
  }
  if (evidenceType === "communication_repair") return "communication_repair";
  if (
    evidenceType === "free_spoken_production" ||
    evidenceType === "spontaneous_reuse"
  ) {
    return "speaking_retrieval";
  }
  if (evidenceType === "free_written_production") return "writing_retrieval";
  if (nodeId.startsWith("GR-")) return "grammar_retrieval";
  if (nodeId.startsWith("WR-")) return "writing_retrieval";
  return "lexical_retrieval";
}

export function reviewStatusAt(
  dueAt: string | null,
  masteryState: MasteryStatus,
  now: Date,
  overdueAfterHours: number,
): ReviewProductStatus {
  if (masteryState === "lapsed") return "relearning";
  if (!dueAt) return "not_scheduled";
  const due = Date.parse(dueAt);
  const nowMs = now.getTime();
  if (due > nowMs) return "not_due";
  const overdueMs = overdueAfterHours * 60 * 60 * 1000;
  return nowMs - due >= overdueMs ? "overdue" : "due";
}

export class FsrsReviewAdapter {
  private readonly scheduler;

  constructor(config: ReviewConfig) {
    this.scheduler = fsrs({
      request_retention: config.scheduler.request_retention,
      enable_fuzz: config.scheduler.enable_fuzz,
      enable_short_term: false,
      learning_steps: [],
      relearning_steps: [],
    });
  }

  next(
    current: SerializedFsrsCard | null,
    reviewedAt: Date,
    grade: ReviewGrade,
  ): SerializedFsrsCard {
    const card = current
      ? deserializeCard(current)
      : createEmptyCard(reviewedAt);
    const result = this.scheduler.next(card, reviewedAt, ratingValue(grade));
    return serializeCard(result.card);
  }
}
