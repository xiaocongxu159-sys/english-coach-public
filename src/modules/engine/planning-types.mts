import type { MasteryStatus } from "./types.mts";

export type DebtBand = "low" | "normal" | "high" | "severe";
export type SkillCode = "LS" | "SP" | "RD" | "WR" | "PR";
export type DeferredReason =
  | "time_budget"
  | "review_debt"
  | "lapsed_prerequisite"
  | "content_unavailable"
  | "skill_balance"
  | "recently_practiced"
  | "clearance_missing"
  | "user_constraint";

export interface PlanningReviewCandidate {
  id: string;
  nodeId: string;
  dueAt: string | null;
  lifecycle: "inactive" | "active" | "suspended" | "retired";
  estimatedMinutes: number;
  masteryStatus?: MasteryStatus;
}

export interface PlanningNodeCandidate {
  nodeId: string;
  masteryStatus: MasteryStatus;
  eligibleForNewLearning: boolean;
  reviewedContentAvailable: boolean;
  applicationCapable: boolean;
  recentPracticeAt?: string | null;
}

export interface DailySchedulerInput {
  learnerId: string;
  planDate: string;
  now: string;
  timeBudgetMinutes: number;
  reviewCandidates: PlanningReviewCandidate[];
  nodeCandidates: PlanningNodeCandidate[];
  skillDeficits?: SkillCode[];
  voiceAvailable?: boolean;
}

export interface DailyPlan {
  id: string;
  learner_id: string;
  plan_date: string;
  time_budget_minutes: number;
  debt_band: DebtBand;
  allocations: {
    review: number;
    remediation: number;
    new_learning: number;
    application: number;
    wrap_up: number;
  };
  selected: {
    review_unit_ids: string[];
    remediation_node_ids: string[];
    continuation_node_ids: string[];
    new_node_ids: string[];
    application_node_ids: string[];
  };
  lesson_requests: Array<{
    block_type: "review" | "remediation" | "mixed_core" | "application" | "checkpoint";
    minutes: number;
    blueprint_type:
      | "new_learning"
      | "mixed_learning"
      | "review"
      | "speaking_focus"
      | "listening_focus"
      | "reading_focus"
      | "writing_focus"
      | "pronunciation_focus"
      | "assessment_checkpoint"
      | "ielts_practice";
    primary_nodes: string[];
    support_nodes: string[];
    review_unit_ids: string[];
    required_modalities: Array<"listening" | "speaking" | "reading" | "writing" | "pronunciation">;
  }>;
  deferred: {
    due_review_units: number;
    new_nodes: number;
    reason_codes: DeferredReason[];
  };
  skill_balance: {
    lookback_days: number;
    deficit_domains: SkillCode[];
  };
  explanations: string[];
  warnings: string[];
}

export interface DailySchedulerConfig {
  version: number;
  default_time_budget_minutes: number;
  review_debt_bands: {
    low_max_due_minutes_ratio: number;
    normal_max_due_minutes_ratio: number;
    high_max_due_minutes_ratio: number;
    severe_above_due_minutes_ratio: number;
  };
  allocation_percent: Record<DebtBand, Record<"review" | "remediation" | "new_learning" | "application" | "wrap_up", number>>;
  new_primary_node_limits: {
    "20": number;
    "35": number;
    "50": number;
    severe_debt: number;
    high_debt_max: number;
  };
}
