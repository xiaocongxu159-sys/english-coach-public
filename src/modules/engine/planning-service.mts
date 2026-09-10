import {
  evaluateCurriculumEligibility,
  type CurriculumNodeRecord,
  type CurriculumPrerequisiteRecord,
  type LearnerCurriculumState,
} from "./curriculum-service.mts";
import { buildDailyPlan } from "./daily-scheduler.mts";
import {
  PHASE1_PILOT_DURATION_MINUTES,
  isExactPhase1PilotNodeSet,
  isPhase1PilotNode,
} from "./pilot-policy.mts";
import type {
  DailyPlan,
  DailySchedulerInput,
  PlanningNodeCandidate,
} from "./planning-types.mts";
import type { MasteryStatus } from "./types.mts";

export interface PlanningCurriculumNode extends CurriculumNodeRecord {
  masteryStatus: MasteryStatus;
  reviewedContentAvailable: boolean;
  applicationCapable: boolean;
  recentPracticeAt?: string | null;
}

export interface BuildLearnerDailyPlanInput extends Omit<DailySchedulerInput, "nodeCandidates"> {
  curriculumNodes: PlanningCurriculumNode[];
  prerequisites: CurriculumPrerequisiteRecord[];
  learnerCurriculumState: LearnerCurriculumState;
}

export function resolvePlanningNodeCandidates(
  nodes: readonly PlanningCurriculumNode[],
  prerequisites: readonly CurriculumPrerequisiteRecord[],
  learnerState: LearnerCurriculumState,
): PlanningNodeCandidate[] {
  return nodes.map((node) => {
    const eligibility = evaluateCurriculumEligibility(node, prerequisites, learnerState);
    return {
      nodeId: node.id,
      masteryStatus: node.masteryStatus,
      eligibleForNewLearning: eligibility.eligible,
      reviewedContentAvailable: node.reviewedContentAvailable,
      applicationCapable: node.applicationCapable,
      recentPracticeAt: node.recentPracticeAt ?? null,
    };
  });
}

function applyPhase1PilotLessonBoundary(plan: DailyPlan): DailyPlan {
  const selectedPilotNodes = plan.selected.new_node_ids.filter(isPhase1PilotNode);
  if (selectedPilotNodes.length === 0) return plan;

  if (!isExactPhase1PilotNodeSet(plan.selected.new_node_ids)) {
    throw new Error(
      "Phase 1 Pilot has no reviewed lesson for a partial Pilot-node frontier; do not fabricate a one-node lesson",
    );
  }

  const coreRequest = plan.lesson_requests.find(
    (request) => request.block_type === "mixed_core",
  );
  if (
    !coreRequest ||
    coreRequest.blueprint_type !== "new_learning" ||
    !isExactPhase1PilotNodeSet(coreRequest.primary_nodes)
  ) {
    throw new Error(
      "Phase 1 Pilot Daily Plan does not match the reviewed two-node new-learning blueprint",
    );
  }

  const boundedMinutes = Math.min(
    PHASE1_PILOT_DURATION_MINUTES.max,
    Math.max(PHASE1_PILOT_DURATION_MINUTES.min, coreRequest.minutes),
  );
  const durationWasBounded = boundedMinutes !== coreRequest.minutes;

  return {
    ...plan,
    lesson_requests: [
      {
        ...coreRequest,
        minutes: boundedMinutes,
      },
    ],
    explanations: [
      ...plan.explanations,
      "Productive application for the Phase 1 Pilot stays inside its reviewed new-learning blueprint; no separate speaking-focus lesson is fabricated.",
      ...(durationWasBounded
        ? [
            `The reviewed Pilot lesson is bounded to ${PHASE1_PILOT_DURATION_MINUTES.min}-${PHASE1_PILOT_DURATION_MINUTES.max} minutes; extra budget is intentionally not filled with unreviewed content.`,
          ]
        : []),
    ],
    warnings: [
      ...plan.warnings,
      ...(durationWasBounded
        ? [
            "Some available study time remains unused because the current Phase 1 reviewed content bundle is intentionally bounded.",
          ]
        : []),
    ],
  };
}

export function buildLearnerDailyPlan(input: BuildLearnerDailyPlanInput): DailyPlan {
  const nodeCandidates = resolvePlanningNodeCandidates(
    input.curriculumNodes,
    input.prerequisites,
    input.learnerCurriculumState,
  );

  const plan = buildDailyPlan({
    learnerId: input.learnerId,
    planDate: input.planDate,
    now: input.now,
    timeBudgetMinutes: input.timeBudgetMinutes,
    reviewCandidates: input.reviewCandidates,
    nodeCandidates,
    skillDeficits: input.skillDeficits,
    voiceAvailable: input.voiceAvailable,
  });

  return applyPhase1PilotLessonBoundary(plan);
}