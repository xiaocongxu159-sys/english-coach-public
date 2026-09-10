import { getReviewConfig } from "./review-config.mts";
import {
  FsrsReviewAdapter,
  mapReviewGrade,
  reviewGatePasses,
  reviewStatusAt,
  reviewTypeFor,
  TS_FSRS_LIBRARY_VERSION,
} from "./review-adapter.mts";
import type { ReviewUnitRecord } from "./review-types.mts";
import type { LearningEngineStore } from "./store.mts";
import type { AttemptRecord, ReviewUpdateSummary } from "./types.mts";

const MAX_CAS_RETRIES = 6;

function monotonicSchedulerTime(
  occurredAt: Date,
  previousScheduledAt: string | null,
): Date {
  if (!previousScheduledAt) return occurredAt;
  const previousMs = Date.parse(previousScheduledAt);
  if (!Number.isFinite(previousMs)) {
    throw new Error(`review unit has invalid lastReviewAt: ${previousScheduledAt}`);
  }
  if (occurredAt.getTime() > previousMs) return occurredAt;
  return new Date(previousMs + 1);
}

export async function updateReviewForAttempt(
  store: LearningEngineStore,
  attempt: AttemptRecord,
): Promise<ReviewUpdateSummary[]> {
  const config = getReviewConfig();
  const eligible = reviewGatePasses(
    {
      isScored: attempt.evaluation.isScored,
      trusted: attempt.trusted,
      evaluatorConfidence: attempt.evaluatorConfidence,
      contentKind: attempt.sourceSnapshot.contentKind,
      mayUpdateReview: attempt.evaluation.mayUpdateReview,
      stateAffecting: attempt.stateAffecting,
    },
    config,
  );
  if (!eligible) return [];

  const grade = mapReviewGrade(attempt, config);
  const adapter = new FsrsReviewAdapter(config);
  const occurredAt = new Date(attempt.createdAt);
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error(`attempt has invalid createdAt: ${attempt.createdAt}`);
  }
  const summaries: ReviewUpdateSummary[] = [];

  for (const nodeId of attempt.sourceSnapshot.targetNodeIds) {
    const node = await store.getNode(nodeId);
    if (node?.lifecycle !== "active") {
      throw new Error(`review target node is not learner-active: ${nodeId}`);
    }
    const required = node.metadata.required_evidence_types ?? [];
    if (!required.includes(attempt.sourceSnapshot.evidenceType)) {
      throw new Error(
        `review evidence type ${attempt.sourceSnapshot.evidenceType} is outside node contract ${nodeId}`,
      );
    }

    const nodeState = await store.getNodeState(attempt.userId, nodeId);
    const masteryState = nodeState?.state ?? "unseen";
    if (
      config.review_unit_activation.do_not_activate_unseen_nodes &&
      masteryState === "unseen"
    ) {
      continue;
    }
    if (
      !config.review_unit_activation.allowed_mastery_states.includes(masteryState)
    ) {
      continue;
    }

    const contentRef = `${attempt.exerciseItemId}@v${attempt.sourceSnapshot.itemVersion}`;
    let unit = await store.ensureReviewUnit({
      userId: attempt.userId,
      nodeId,
      reviewType: reviewTypeFor(nodeId, attempt.sourceSnapshot.evidenceType),
      evidenceType: attempt.sourceSnapshot.evidenceType,
      contentRef,
      contentVersion: attempt.sourceSnapshot.itemVersion,
      siblingGroupId: `${nodeId}:${attempt.sourceSnapshot.evidenceType}`,
      scenarioTag: attempt.scenarioTag,
      algorithmVersion: config.scheduler.algorithm_version,
      libraryVersion: TS_FSRS_LIBRARY_VERSION,
      parametersVersion: config.scheduler.parameters_version,
    });

    let completed = false;
    for (let retry = 0; retry < MAX_CAS_RETRIES; retry += 1) {
      const scheduledAt = monotonicSchedulerTime(occurredAt, unit.lastReviewAt);
      const nextCard = adapter.next(unit.schedulerState, scheduledAt, grade);
      const status = reviewStatusAt(
        nextCard.due,
        masteryState,
        scheduledAt,
        config.status_rules.overdue_after_hours,
      );
      const apply = await store.applyReviewUpdate({
        reviewUnitId: unit.id,
        userId: attempt.userId,
        attemptId: attempt.id,
        attemptGroupId: attempt.attemptGroupId,
        expectedRevision: unit.revision,
        grade,
        beforeState: unit.schedulerState,
        afterState: nextCard,
        dueAt: nextCard.due,
        reviewStatus: status,
        algorithmVersion: config.scheduler.algorithm_version,
        libraryVersion: TS_FSRS_LIBRARY_VERSION,
        parametersVersion: config.scheduler.parameters_version,
        occurredAt: attempt.createdAt,
        scheduledAt: scheduledAt.toISOString(),
      });

      if (apply === "applied") {
        summaries.push({
          reviewUnitId: unit.id,
          nodeId,
          evidenceType: attempt.sourceSnapshot.evidenceType,
          grade,
          status,
          dueAt: nextCard.due,
          applied: true,
          replayed: false,
        });
        completed = true;
        break;
      }

      const refreshed = await store.getReviewUnit(unit.id);
      if (!refreshed) {
        throw new Error(`review unit disappeared during update: ${unit.id}`);
      }
      unit = refreshed;

      if (apply === "duplicate") {
        summaries.push(summaryFromExisting(unit, nodeId, attempt, grade));
        completed = true;
        break;
      }
    }

    if (!completed) {
      throw new Error(
        `review state CAS did not converge after ${MAX_CAS_RETRIES} retries for ${nodeId}`,
      );
    }
  }

  return summaries;
}

function summaryFromExisting(
  unit: ReviewUnitRecord,
  nodeId: string,
  attempt: AttemptRecord,
  grade: ReviewUpdateSummary["grade"],
): ReviewUpdateSummary {
  return {
    reviewUnitId: unit.id,
    nodeId,
    evidenceType: attempt.sourceSnapshot.evidenceType,
    grade,
    status: unit.reviewStatus,
    dueAt: unit.dueAt,
    applied: false,
    replayed: true,
  };
}
