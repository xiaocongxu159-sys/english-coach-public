import type { MasteryStatus } from "./types.mts";

export type CurriculumLifecycle = "draft" | "reviewed" | "active" | "deprecated";

export interface CurriculumNodeRecord {
  id: string;
  lifecycle: CurriculumLifecycle;
}

export interface CurriculumPrerequisiteRecord {
  nodeId: string;
  prerequisiteNodeId: string;
  prerequisiteType: "hard" | "soft";
}

export interface LearnerCurriculumState {
  masteryByNodeId: ReadonlyMap<string, MasteryStatus>;
  clearedNodeIds: ReadonlySet<string>;
}

export type CurriculumBlockReason =
  | "node_not_active"
  | "hard_prerequisite_lapsed"
  | "hard_prerequisite_not_ready";

export interface CurriculumEligibility {
  nodeId: string;
  eligible: boolean;
  hardPrerequisiteIds: string[];
  blockedBy: Array<{
    prerequisiteNodeId: string | null;
    reason: CurriculumBlockReason;
  }>;
}

const READY_MASTERY_STATES = new Set<MasteryStatus>(["functional", "secure"]);

function isPrerequisiteReady(
  prerequisiteNodeId: string,
  learnerState: LearnerCurriculumState,
): boolean {
  const mastery = learnerState.masteryByNodeId.get(prerequisiteNodeId) ?? "unseen";

  if (mastery === "lapsed") {
    return false;
  }

  return READY_MASTERY_STATES.has(mastery) || learnerState.clearedNodeIds.has(prerequisiteNodeId);
}

export function evaluateCurriculumEligibility(
  node: CurriculumNodeRecord,
  prerequisites: readonly CurriculumPrerequisiteRecord[],
  learnerState: LearnerCurriculumState,
): CurriculumEligibility {
  if (node.lifecycle !== "active") {
    return {
      nodeId: node.id,
      eligible: false,
      hardPrerequisiteIds: [],
      blockedBy: [{ prerequisiteNodeId: null, reason: "node_not_active" }],
    };
  }

  const hardPrerequisiteIds = prerequisites
    .filter(
      (prerequisite) =>
        prerequisite.nodeId === node.id && prerequisite.prerequisiteType === "hard",
    )
    .map((prerequisite) => prerequisite.prerequisiteNodeId)
    .sort();

  const blockedBy: CurriculumEligibility["blockedBy"] = [];

  for (const prerequisiteNodeId of hardPrerequisiteIds) {
    const mastery = learnerState.masteryByNodeId.get(prerequisiteNodeId) ?? "unseen";

    if (mastery === "lapsed") {
      blockedBy.push({
        prerequisiteNodeId,
        reason: "hard_prerequisite_lapsed",
      });
      continue;
    }

    if (!isPrerequisiteReady(prerequisiteNodeId, learnerState)) {
      blockedBy.push({
        prerequisiteNodeId,
        reason: "hard_prerequisite_not_ready",
      });
    }
  }

  return {
    nodeId: node.id,
    eligible: blockedBy.length === 0,
    hardPrerequisiteIds,
    blockedBy,
  };
}

export function getEligibleActiveNodes(
  nodes: readonly CurriculumNodeRecord[],
  prerequisites: readonly CurriculumPrerequisiteRecord[],
  learnerState: LearnerCurriculumState,
): CurriculumEligibility[] {
  return nodes
    .map((node) => evaluateCurriculumEligibility(node, prerequisites, learnerState))
    .filter((result) => result.eligible)
    .sort((left, right) => left.nodeId.localeCompare(right.nodeId));
}
