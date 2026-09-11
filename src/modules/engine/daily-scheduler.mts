import dailySchedulerConfig from "../../../config/daily-scheduler-v1.config.json";
import type {
  DailyPlan,
  DailySchedulerConfig,
  DailySchedulerInput,
  DebtBand,
  PlanningReviewCandidate,
} from "./planning-types.mts";
import { getReviewConfig } from "./review-config.mts";

const DAILY_SCHEDULER_CONFIG = dailySchedulerConfig as DailySchedulerConfig;

export function getDailySchedulerConfig(): DailySchedulerConfig {
  return DAILY_SCHEDULER_CONFIG;
}

function clampBudget(minutes: number): number {
  if (!Number.isInteger(minutes) || minutes < 10 || minutes > 120) {
    throw new Error("Daily plan time budget must be an integer from 10 to 120 minutes");
  }
  return minutes;
}

function reviewPriority(
  candidate: PlanningReviewCandidate,
  nowMs: number,
  overdueAfterHours: number,
): 0 | 1 | 2 | 9 {
  if (candidate.lifecycle !== "active") return 9;
  if (candidate.masteryStatus === "lapsed") return 0;
  if (!candidate.dueAt) return 9;
  const dueMs = Date.parse(candidate.dueAt);
  if (!Number.isFinite(dueMs)) throw new Error(`Invalid dueAt for ${candidate.id}`);
  const overdueCutoff = nowMs - overdueAfterHours * 60 * 60 * 1000;
  if (dueMs <= overdueCutoff) return 1;
  if (dueMs <= nowMs) return 2;
  return 9;
}

export function deriveDebtBand(
  dueMinutes: number,
  budget: number,
  config = getDailySchedulerConfig(),
): DebtBand {
  const ratio = budget === 0 ? 0 : dueMinutes / budget;
  if (ratio <= config.review_debt_bands.low_max_due_minutes_ratio) return "low";
  if (ratio <= config.review_debt_bands.normal_max_due_minutes_ratio) return "normal";
  if (ratio <= config.review_debt_bands.high_max_due_minutes_ratio) return "high";
  return "severe";
}

function allocateMinutes(
  budget: number,
  debtBand: DebtBand,
  config: DailySchedulerConfig,
): DailyPlan["allocations"] {
  const weights = config.allocation_percent[debtBand];
  const keys = ["review", "remediation", "new_learning", "application", "wrap_up"] as const;
  const raw = keys.map((key) => ({ key, exact: (budget * weights[key]) / 100 }));
  const result = Object.fromEntries(
    raw.map(({ key, exact }) => [key, Math.floor(exact)]),
  ) as DailyPlan["allocations"];
  let remaining = budget - keys.reduce((sum, key) => sum + result[key], 0);
  raw
    .map(({ key, exact }) => ({ key, fraction: exact - Math.floor(exact) }))
    .sort((a, b) => b.fraction - a.fraction || keys.indexOf(a.key) - keys.indexOf(b.key))
    .forEach(({ key }) => {
      if (remaining > 0) {
        result[key] += 1;
        remaining -= 1;
      }
    });
  return result;
}

function newNodeLimit(
  budget: number,
  debtBand: DebtBand,
  config: DailySchedulerConfig,
): number {
  if (debtBand === "severe") return config.new_primary_node_limits.severe_debt;
  const preset =
    budget <= 20
      ? config.new_primary_node_limits["20"]
      : budget <= 35
        ? config.new_primary_node_limits["35"]
        : config.new_primary_node_limits["50"];
  return debtBand === "high"
    ? Math.min(preset, config.new_primary_node_limits.high_debt_max)
    : preset;
}

export function buildDailyPlan(
  input: DailySchedulerInput,
  config = getDailySchedulerConfig(),
): DailyPlan {
  const budget = clampBudget(input.timeBudgetMinutes);
  const nowMs = Date.parse(input.now);
  if (!Number.isFinite(nowMs)) throw new Error("Daily scheduler requires a valid now timestamp");
  const overdueAfterHours = getReviewConfig().status_rules.overdue_after_hours;

  const rankedReviews = input.reviewCandidates
    .map((candidate) => ({ candidate, priority: reviewPriority(candidate, nowMs, overdueAfterHours) }))
    .filter(({ priority }) => priority < 9)
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        Date.parse(a.candidate.dueAt ?? input.now) - Date.parse(b.candidate.dueAt ?? input.now) ||
        a.candidate.id.localeCompare(b.candidate.id),
    );

  const dueMinutes = rankedReviews.reduce(
    (sum, entry) => sum + Math.max(1, entry.candidate.estimatedMinutes),
    0,
  );
  const debtBand = deriveDebtBand(dueMinutes, budget, config);
  const allocations = allocateMinutes(budget, debtBand, config);

  const reviewBudget = allocations.review + allocations.remediation;
  const selectedReviews: string[] = [];
  let usedReviewMinutes = 0;
  for (const { candidate } of rankedReviews) {
    const minutes = Math.max(1, candidate.estimatedMinutes);
    if (usedReviewMinutes + minutes > reviewBudget) continue;
    selectedReviews.push(candidate.id);
    usedReviewMinutes += minutes;
  }

  const lapsedNodes = input.nodeCandidates
    .filter((node) => node.masteryStatus === "lapsed")
    .map((node) => node.nodeId)
    .sort();
  const continuationNodes = input.nodeCandidates
    .filter((node) => node.masteryStatus === "developing" && node.reviewedContentAvailable)
    .map((node) => node.nodeId)
    .sort();
  const newCandidates = input.nodeCandidates
    .filter(
      (node) =>
        node.masteryStatus === "unseen" &&
        node.eligibleForNewLearning &&
        node.reviewedContentAvailable,
    )
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  const maxNew = newNodeLimit(budget, debtBand, config);
  const selectedNewNodes = newCandidates.slice(0, maxNew).map((node) => node.nodeId);
  const applicationNodes = input.nodeCandidates
    .filter(
      (node) =>
        node.applicationCapable &&
        (selectedNewNodes.includes(node.nodeId) ||
          continuationNodes.includes(node.nodeId) ||
          lapsedNodes.includes(node.nodeId)),
    )
    .map((node) => node.nodeId)
    .sort();

  const deferredReasonCodes: DailyPlan["deferred"]["reason_codes"] = [];
  const deferredDue = rankedReviews.length - selectedReviews.length;
  if (deferredDue > 0) deferredReasonCodes.push("time_budget");
  if (
    (debtBand === "high" || debtBand === "severe") &&
    newCandidates.length > selectedNewNodes.length
  ) {
    deferredReasonCodes.push("review_debt");
  }
  if (
    newCandidates.length > selectedNewNodes.length &&
    !deferredReasonCodes.includes("review_debt")
  ) {
    deferredReasonCodes.push("time_budget");
  }

  const lessonRequests: DailyPlan["lesson_requests"] = [];
  const coreNodes = [...new Set([...lapsedNodes, ...continuationNodes, ...selectedNewNodes])];
  const coreMinutes = Math.max(
    2,
    allocations.remediation +
      allocations.new_learning +
      Math.min(allocations.review, usedReviewMinutes),
  );
  if (coreNodes.length > 0 || selectedReviews.length > 0) {
    lessonRequests.push({
      block_type: "mixed_core",
      minutes: coreMinutes,
      blueprint_type:
        selectedNewNodes.length > 0
          ? "new_learning"
          : selectedReviews.length > 0
            ? "review"
            : "mixed_learning",
      primary_nodes: coreNodes,
      support_nodes: [],
      review_unit_ids: selectedReviews,
      required_modalities: [],
    });
  }
  if (applicationNodes.length > 0 && allocations.application >= 2) {
    lessonRequests.push({
      block_type: "application",
      minutes: allocations.application,
      blueprint_type: input.voiceAvailable === false ? "writing_focus" : "speaking_focus",
      primary_nodes: applicationNodes,
      support_nodes: [],
      review_unit_ids: [],
      required_modalities: [input.voiceAvailable === false ? "writing" : "speaking"],
    });
  }
  if (lessonRequests.length === 0) {
    lessonRequests.push({
      block_type: "checkpoint",
      minutes: Math.max(2, Math.min(budget, allocations.wrap_up || 2)),
      blueprint_type: "assessment_checkpoint",
      primary_nodes: [],
      support_nodes: [],
      review_unit_ids: [],
      required_modalities: [],
    });
  }

  const explanations = [
    `Review debt is ${debtBand}; ${selectedReviews.length} review unit(s) selected within the ${budget}-minute budget.`,
  ];
  if (selectedNewNodes.length > 0) {
    explanations.push(
      `Selected ${selectedNewNodes.length} reviewed curriculum frontier node(s) whose hard prerequisites are ready.`,
    );
  }
  if (deferredDue > 0) {
    explanations.push(
      `${deferredDue} due review unit(s) were deferred rather than extending today's session.`,
    );
  }
  if (debtBand === "severe") {
    explanations.push("New learning is paused because review debt exceeds the severe threshold.");
  }

  return {
    id: `daily-${input.learnerId}-${input.planDate}-v${config.version}`,
    learner_id: input.learnerId,
    plan_date: input.planDate,
    time_budget_minutes: budget,
    debt_band: debtBand,
    allocations,
    selected: {
      review_unit_ids: selectedReviews,
      remediation_node_ids: lapsedNodes,
      continuation_node_ids: continuationNodes,
      new_node_ids: selectedNewNodes,
      application_node_ids: applicationNodes,
    },
    lesson_requests: lessonRequests,
    deferred: {
      due_review_units: deferredDue,
      new_nodes: newCandidates.length - selectedNewNodes.length,
      reason_codes: [...new Set(deferredReasonCodes)],
    },
    skill_balance: {
      lookback_days: 7,
      deficit_domains: [...new Set(input.skillDeficits ?? [])],
    },
    explanations,
    warnings: deferredDue > 0 ? ["Some review work remains after today's bounded plan."] : [],
  };
}
