import { createHash, randomUUID } from "node:crypto";
import { getMasteryConfig } from "./config.mts";
import { deriveMasteryState } from "./mastery.mts";
import { updateReviewForAttempt } from "./review-service.mts";
import { scoreExercise } from "./scoring.mts";
import type { EngineLessonRecord, LearningEngineStore } from "./store.mts";
import type {
  AttemptRecord,
  AttemptSourceSnapshot,
  EngineEvidence,
  ExerciseResponse,
  ScoringResult,
  SubmissionInput,
  SubmissionResult,
} from "./types.mts";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

function fingerprint(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

function sameResponse(a: ExerciseResponse, b: ExerciseResponse): boolean {
  return fingerprint(a) === fingerprint(b);
}

function assertReplayMatches(existing: AttemptRecord, input: SubmissionInput): void {
  const exact =
    existing.lessonInstanceId === input.lessonInstanceId &&
    existing.exerciseItemId === input.exerciseItemId &&
    existing.attemptGroupId === input.attemptGroupId &&
    existing.stageId === input.stageId &&
    existing.scenarioTag === (input.scenarioTag ?? null) &&
    existing.assistance === (input.assistance ?? "independent") &&
    sameResponse(existing.response, input.response);
  if (!exact) {
    throw new Error(
      "idempotency conflict: submission key was already used for different input",
    );
  }
}

function assertLessonAllowsItem(
  lesson: EngineLessonRecord,
  stageId: string,
  exerciseItemId: string,
): void {
  const stageMap = lesson.state.allowed_items_by_stage;
  if (!stageMap || !Array.isArray(stageMap[stageId])) {
    throw new Error(`lesson stage is missing an allowed-item contract: ${stageId}`);
  }
  if (!stageMap[stageId].includes(exerciseItemId)) {
    throw new Error(
      `exercise item is not allowed in lesson stage: ${stageId} -> ${exerciseItemId}`,
    );
  }
}

function snapshotFromScoring(
  item: {
    version: number;
    target_node_ids: string[];
    evidence_type: AttemptSourceSnapshot["evidenceType"];
    state_effect_policy: {
      may_change_mastery: boolean;
      may_update_review: boolean;
    };
  },
  scoring: ScoringResult,
): AttemptSourceSnapshot {
  return {
    itemVersion: item.version,
    targetNodeIds: [...item.target_node_ids],
    evidenceType: item.evidence_type,
    contentKind: scoring.contentKind,
    stateEffectPolicy: {
      mayChangeMastery: item.state_effect_policy.may_change_mastery,
      mayUpdateReview: item.state_effect_policy.may_update_review,
    },
  };
}

function assertSourceSnapshot(snapshot: AttemptSourceSnapshot): void {
  if (!Number.isInteger(snapshot.itemVersion) || snapshot.itemVersion < 1) {
    throw new Error("attempt source snapshot has an invalid item version");
  }
  if (!Array.isArray(snapshot.targetNodeIds) || snapshot.targetNodeIds.length === 0) {
    throw new Error("attempt source snapshot has no target nodes");
  }
  if (!snapshot.evidenceType || !snapshot.contentKind) {
    throw new Error("attempt source snapshot is incomplete");
  }
}

function neutralizeRetry(scoring: ScoringResult): ScoringResult {
  return {
    ...scoring,
    mayChangeMastery: false,
    mayUpdateReview: false,
  };
}

export async function submitExerciseAttempt(
  store: LearningEngineStore,
  input: SubmissionInput,
): Promise<SubmissionResult> {
  if (input.submissionKey.length < 8 || input.submissionKey.length > 120) {
    throw new Error("submissionKey must contain 8-120 characters");
  }

  const existing = await store.getAttemptBySubmissionKey(
    input.userId,
    input.submissionKey,
  );
  const lesson = await store.getLesson(input.lessonInstanceId);
  if (!lesson) throw new Error("lesson instance not found");
  if (lesson.userId !== input.userId) throw new Error("lesson ownership mismatch");

  let replayed = Boolean(existing);
  let attempt: AttemptRecord;

  if (existing) {
    assertReplayMatches(existing, input);
    assertSourceSnapshot(existing.sourceSnapshot);
    attempt = existing;
  } else {
    if (lesson.status !== "in_progress") {
      throw new Error(`lesson is not accepting new attempts: ${lesson.status}`);
    }
    assertLessonAllowsItem(lesson, input.stageId, input.exerciseItemId);

    const storedItem = await store.getExerciseItem(input.exerciseItemId);
    if (storedItem?.lifecycle !== "active") {
      throw new Error("exercise item is not learner-active");
    }
    if (
      storedItem.trustClass !== "reviewed_core" &&
      storedItem.trustClass !== "validated_variant"
    ) {
      throw new Error("exercise item is not trusted for the learning engine");
    }

    const priorGroupAttempt = await store.getFirstAttemptInGroup(
      input.userId,
      input.attemptGroupId,
    );
    if (priorGroupAttempt) {
      if (
        priorGroupAttempt.lessonInstanceId !== input.lessonInstanceId ||
        priorGroupAttempt.exerciseItemId !== input.exerciseItemId ||
        priorGroupAttempt.stageId !== input.stageId
      ) {
        throw new Error(
          "attempt group is already bound to a different lesson, stage, or exercise item",
        );
      }
    }

    const rawScoring = scoreExercise(storedItem.item, input.response);
    const evaluation = priorGroupAttempt
      ? neutralizeRetry(rawScoring)
      : rawScoring;
    const stateAffecting =
      (evaluation.mayChangeMastery || evaluation.mayUpdateReview) &&
      evaluation.isScored &&
      evaluation.trusted;
    const created: AttemptRecord = {
      id: randomUUID(),
      userId: input.userId,
      lessonInstanceId: input.lessonInstanceId,
      exerciseItemId: input.exerciseItemId,
      submissionKey: input.submissionKey,
      attemptGroupId: input.attemptGroupId,
      stageId: input.stageId,
      scenarioTag: input.scenarioTag ?? null,
      response: input.response,
      evaluation,
      sourceSnapshot: snapshotFromScoring(storedItem.item, rawScoring),
      evaluatorConfidence: evaluation.evaluatorConfidence,
      assistance: input.assistance ?? "independent",
      trusted: evaluation.trusted,
      stateAffecting,
      createdAt: new Date().toISOString(),
    };
    attempt = await store.insertAttempt(created);
    if (attempt.id !== created.id) {
      replayed = true;
      assertReplayMatches(attempt, input);
    }
    assertSourceSnapshot(attempt.sourceSnapshot);
  }

  const mastery: SubmissionResult["mastery"] = {};
  let emittedEvidence = 0;
  const masteryConfig = getMasteryConfig();
  const source = attempt.sourceSnapshot;

  if (
    attempt.stateAffecting &&
    attempt.evaluation.mayChangeMastery &&
    attempt.evaluation.isScored &&
    attempt.trusted
  ) {
    for (const nodeId of source.targetNodeIds) {
      const node = await store.getNode(nodeId);
      if (node?.lifecycle !== "active") {
        throw new Error(`target node is not learner-active: ${nodeId}`);
      }
      const required = node.metadata.required_evidence_types ?? [];
      if (!required.includes(source.evidenceType)) {
        throw new Error(
          `item evidence type ${source.evidenceType} is outside node contract ${nodeId}`,
        );
      }

      const evidence: EngineEvidence = {
        id: randomUUID(),
        userId: input.userId,
        nodeId,
        attemptId: attempt.id,
        exerciseItemId: attempt.exerciseItemId,
        exerciseItemVersion: source.itemVersion,
        evidenceType: source.evidenceType,
        rating: attempt.evaluation.rating,
        assistance: attempt.assistance,
        evaluatorConfidence: attempt.evaluatorConfidence,
        isScored: attempt.evaluation.isScored,
        contentKind: source.contentKind,
        trusted: attempt.trusted,
        occurredAt: attempt.createdAt,
        lessonInstanceId: attempt.lessonInstanceId,
        attemptGroupId: attempt.attemptGroupId,
        stageId: attempt.stageId,
        scenarioTag: attempt.scenarioTag,
      };
      if (await store.insertEvidenceIfMissing(evidence)) emittedEvidence += 1;

      const allEvidence = await store.listEvidenceForNode(input.userId, nodeId);
      const previous = await store.getNodeState(input.userId, nodeId);
      const derivation = deriveMasteryState({
        requiredEvidenceTypes: required,
        evidence: allEvidence,
        config: masteryConfig,
        previousState: previous?.state ?? "unseen",
        previousHighestState:
          previous?.evidenceSummary.highest_state_achieved ??
          (previous?.state === "lapsed"
            ? "functional"
            : previous?.state ?? "unseen"),
        contextual: node.metadata.contextual === true,
      });
      await store.upsertNodeState(input.userId, nodeId, derivation, required);
      mastery[nodeId] = derivation;
    }
  }

  const reviewUpdates = await updateReviewForAttempt(store, attempt);

  return {
    attempt,
    mastery,
    emittedEvidence,
    reviewCandidate:
      attempt.stateAffecting &&
      attempt.evaluation.mayUpdateReview &&
      attempt.evaluation.isScored &&
      attempt.trusted,
    reviewUpdates,
    replayed,
  };
}
