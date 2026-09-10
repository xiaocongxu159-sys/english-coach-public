import type { SupabaseClient } from "@supabase/supabase-js";
import { reviewStatusAt } from "../engine/review-adapter.mts";
import { getReviewConfig } from "../engine/review-config.mts";
import type { ReviewType } from "../engine/review-types.mts";
import type {
  EvidenceType,
  MasteryStatus,
  ReviewProductStatus,
} from "../engine/types.mts";

export type ReviewQueuePriority = Exclude<ReviewProductStatus, "suspended">;

export interface ReviewQueueSourceUnit {
  id: string;
  userId: string;
  nodeId: string;
  reviewType: ReviewType;
  evidenceType: EvidenceType;
  contentRef: string;
  dueAt: string | null;
  lifecycle: "active" | "inactive" | "suspended" | "retired";
  storedReviewStatus: ReviewProductStatus;
}

export interface ReviewQueueItem {
  reviewUnitId: string;
  nodeId: string;
  nodeTitle: string;
  reviewType: ReviewType;
  evidenceType: EvidenceType;
  contentRef: string;
  masteryStatus: MasteryStatus;
  dueAt: string | null;
  priority: ReviewQueuePriority;
  actionable: boolean;
  explanation: string;
}

export interface ReviewQueueSnapshot {
  learnerId: string;
  generatedAt: string;
  items: ReviewQueueItem[];
  counts: {
    total: number;
    actionable: number;
    relearning: number;
    overdue: number;
    due: number;
    upcoming: number;
  };
}

const PRIORITY_RANK: Record<ReviewQueuePriority, number> = {
  relearning: 0,
  overdue: 1,
  due: 2,
  not_due: 3,
  not_scheduled: 4,
};

function fail(
  error: { message: string; code?: string } | null,
  context: string,
): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function explanationFor(priority: ReviewQueuePriority): string {
  switch (priority) {
    case "relearning":
      return "Mastery is lapsed, so this review stays ahead of other due work.";
    case "overdue":
      return "This retrieval has been due for at least 24 hours.";
    case "due":
      return "This retrieval is due now.";
    case "not_due":
      return "Scheduled for later from the authoritative FSRS due time.";
    case "not_scheduled":
      return "No authoritative due time is available yet.";
  }
}

function dueSortValue(dueAt: string | null): number {
  if (!dueAt) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(dueAt);
  if (!Number.isFinite(parsed)) {
    throw new Error(`review unit has invalid dueAt: ${dueAt}`);
  }
  return parsed;
}

export function buildReviewQueueSnapshot(input: {
  learnerId: string;
  units: ReviewQueueSourceUnit[];
  masteryByNode: ReadonlyMap<string, MasteryStatus>;
  titleByNode: ReadonlyMap<string, string>;
  now: Date;
}): ReviewQueueSnapshot {
  if (Number.isNaN(input.now.getTime())) {
    throw new Error("review queue requires a valid current time");
  }

  const config = getReviewConfig();
  const items = input.units.map((unit): ReviewQueueItem => {
    if (unit.userId !== input.learnerId) {
      throw new Error(`review queue received a unit owned by another learner: ${unit.id}`);
    }
    if (unit.lifecycle !== "active") {
      throw new Error(`review queue received a non-active unit: ${unit.id}`);
    }

    const masteryStatus = input.masteryByNode.get(unit.nodeId);
    if (!masteryStatus) {
      throw new Error(`review unit has no learner node state: ${unit.id}`);
    }
    const nodeTitle = input.titleByNode.get(unit.nodeId);
    if (!nodeTitle) {
      throw new Error(`review unit node is not learner-visible: ${unit.nodeId}`);
    }

    // Deliberately ignore unit.storedReviewStatus. It is only a transition-time
    // snapshot; wall-clock due/overdue state is derived from dueAt on every read.
    const priority = reviewStatusAt(
      unit.dueAt,
      masteryStatus,
      input.now,
      config.status_rules.overdue_after_hours,
    ) as ReviewQueuePriority;

    return {
      reviewUnitId: unit.id,
      nodeId: unit.nodeId,
      nodeTitle,
      reviewType: unit.reviewType,
      evidenceType: unit.evidenceType,
      contentRef: unit.contentRef,
      masteryStatus,
      dueAt: unit.dueAt,
      priority,
      actionable:
        priority === "relearning" || priority === "overdue" || priority === "due",
      explanation: explanationFor(priority),
    };
  });

  items.sort((left, right) => {
    const priorityDelta = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
    if (priorityDelta !== 0) return priorityDelta;

    const leftDue = dueSortValue(left.dueAt);
    const rightDue = dueSortValue(right.dueAt);
    if (leftDue !== rightDue) return leftDue < rightDue ? -1 : 1;

    const nodeDelta = left.nodeId.localeCompare(right.nodeId);
    if (nodeDelta !== 0) return nodeDelta;
    const evidenceDelta = left.evidenceType.localeCompare(right.evidenceType);
    if (evidenceDelta !== 0) return evidenceDelta;
    return left.reviewUnitId.localeCompare(right.reviewUnitId);
  });

  return {
    learnerId: input.learnerId,
    generatedAt: input.now.toISOString(),
    items,
    counts: {
      total: items.length,
      actionable: items.filter((item) => item.actionable).length,
      relearning: items.filter((item) => item.priority === "relearning").length,
      overdue: items.filter((item) => item.priority === "overdue").length,
      due: items.filter((item) => item.priority === "due").length,
      upcoming: items.filter(
        (item) => item.priority === "not_due" || item.priority === "not_scheduled",
      ).length,
    },
  };
}

export async function loadReviewQueueSnapshot(
  client: SupabaseClient,
  learnerId: string,
  now = new Date(),
): Promise<ReviewQueueSnapshot> {
  const unitsResult = await client
    .from("review_units")
    .select(
      "id,user_id,node_id,review_type,evidence_type,content_ref,due_at,lifecycle,review_status",
    )
    .eq("user_id", learnerId)
    .eq("lifecycle", "active");
  fail(unitsResult.error, "read learner review units");

  const units: ReviewQueueSourceUnit[] = (unitsResult.data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    nodeId: row.node_id,
    reviewType: row.review_type as ReviewType,
    evidenceType: row.evidence_type as EvidenceType,
    contentRef: row.content_ref,
    dueAt: row.due_at,
    lifecycle: row.lifecycle as ReviewQueueSourceUnit["lifecycle"],
    storedReviewStatus: row.review_status as ReviewProductStatus,
  }));

  if (units.length === 0) {
    return buildReviewQueueSnapshot({
      learnerId,
      units,
      masteryByNode: new Map(),
      titleByNode: new Map(),
      now,
    });
  }

  const nodeIds = [...new Set(units.map((unit) => unit.nodeId))];
  const [statesResult, nodesResult] = await Promise.all([
    client
      .from("learner_node_state")
      .select("node_id,mastery_status")
      .eq("user_id", learnerId)
      .in("node_id", nodeIds),
    client.from("knowledge_nodes").select("id,title").in("id", nodeIds),
  ]);
  fail(statesResult.error, "read learner mastery for review queue");
  fail(nodesResult.error, "read review queue node titles");

  const masteryByNode = new Map<string, MasteryStatus>(
    (statesResult.data ?? []).map((row) => [
      row.node_id,
      row.mastery_status as MasteryStatus,
    ]),
  );
  const titleByNode = new Map<string, string>(
    (nodesResult.data ?? []).map((row) => [row.id, row.title]),
  );

  return buildReviewQueueSnapshot({
    learnerId,
    units,
    masteryByNode,
    titleByNode,
    now,
  });
}
