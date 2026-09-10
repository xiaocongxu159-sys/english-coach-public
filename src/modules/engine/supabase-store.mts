import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ApplyReviewUpdateInput,
  ApplyReviewUpdateResult,
  EnsureReviewUnitInput,
  ReviewUnitRecord,
} from "./review-types.mts";
import type {
  AttemptRecord,
  AttemptSourceSnapshot,
  ContentKind,
  EngineEvidence,
  EvidenceType,
  MasteryDerivation,
  MasteryStatus,
  ReviewGrade,
  ReviewProductStatus,
  ScoringResult,
} from "./types.mts";
import type {
  EngineLessonRecord,
  EngineNodeRecord,
  LearningEngineStore,
  StoredExerciseRecord,
  StoredNodeState,
} from "./store.mts";

function fail(error: { message: string; code?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function mapSourceSnapshot(value: unknown): AttemptSourceSnapshot {
  const source = (value ?? {}) as Record<string, unknown>;
  const policy = (source.stateEffectPolicy ?? {}) as Record<string, unknown>;
  return {
    itemVersion: Number(source.itemVersion ?? 0),
    targetNodeIds: Array.isArray(source.targetNodeIds)
      ? source.targetNodeIds.map(String)
      : [],
    evidenceType: source.evidenceType as AttemptSourceSnapshot["evidenceType"],
    contentKind: source.contentKind as AttemptSourceSnapshot["contentKind"],
    stateEffectPolicy: {
      mayChangeMastery: Boolean(policy.mayChangeMastery),
      mayUpdateReview: Boolean(policy.mayUpdateReview),
    },
  };
}

function mapAttempt(row: Record<string, unknown>): AttemptRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    lessonInstanceId: row.lesson_instance_id as string,
    exerciseItemId: row.exercise_item_id as string,
    submissionKey: row.submission_key as string,
    attemptGroupId: row.attempt_group_id as string,
    stageId: row.stage_id as string,
    scenarioTag: typeof row.scenario_tag === "string" ? row.scenario_tag : null,
    response: row.response as AttemptRecord["response"],
    evaluation: row.evaluation as ScoringResult,
    sourceSnapshot: mapSourceSnapshot(row.source_snapshot),
    evaluatorConfidence:
      row.evaluator_confidence as AttemptRecord["evaluatorConfidence"],
    assistance: row.assistance_level as AttemptRecord["assistance"],
    trusted: row.trusted as boolean,
    stateAffecting: row.state_affecting as boolean,
    createdAt: row.created_at as string,
  };
}

function attemptPayload(attempt: AttemptRecord) {
  return {
    id: attempt.id,
    user_id: attempt.userId,
    lesson_instance_id: attempt.lessonInstanceId,
    exercise_item_id: attempt.exerciseItemId,
    submission_key: attempt.submissionKey,
    attempt_group_id: attempt.attemptGroupId,
    stage_id: attempt.stageId,
    scenario_tag: attempt.scenarioTag,
    response: attempt.response,
    evaluation: attempt.evaluation,
    source_snapshot: attempt.sourceSnapshot,
    evaluator_confidence: attempt.evaluatorConfidence,
    assistance_level: attempt.assistance,
    trusted: attempt.trusted,
    state_affecting: attempt.stateAffecting,
    created_at: attempt.createdAt,
  };
}

function neutralizeStateEffect(attempt: AttemptRecord): AttemptRecord {
  return {
    ...attempt,
    evaluation: {
      ...attempt.evaluation,
      mayChangeMastery: false,
      mayUpdateReview: false,
    },
    stateAffecting: false,
  };
}

function serializeDerivation(
  derivation: MasteryDerivation,
  requiredEvidenceTypes: EvidenceType[],
) {
  const dimensions = Object.fromEntries(
    Object.entries(derivation.dimensionSummaries).map(([key, value]) => [
      key,
      {
        scored_events: value.scoredEvents,
        eligible_successes: value.eligibleSuccesses,
        independent_successes: value.independentSuccesses,
        latest_rating: value.latestRating,
        last_event_at: value.lastEventAt,
        last_success_at: value.lastSuccessAt,
      },
    ]),
  );
  return {
    highest_state_achieved: derivation.highestStateAchieved,
    required_evidence_types: requiredEvidenceTypes,
    summary: {
      scored_events: derivation.summary.scoredEvents,
      promotion_eligible_successes: derivation.summary.promotionEligibleSuccesses,
      independent_successes: derivation.summary.independentSuccesses,
      distinct_sessions: derivation.summary.distinctSessions,
      distinct_days: derivation.summary.distinctDays,
      max_delayed_success_days: derivation.summary.maxDelayedSuccessDays,
      context_diversity: derivation.summary.contextDiversity,
      consecutive_core_failures: derivation.summary.consecutiveCoreFailures,
      last_scored_at: derivation.summary.lastScoredAt,
      last_success_at: derivation.summary.lastSuccessAt,
    },
    dimension_summaries: dimensions,
    prerequisite_ready: derivation.prerequisiteReady,
    review_status: derivation.reviewStatus,
  };
}

function mapReviewUnit(row: Record<string, unknown>): ReviewUnitRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    nodeId: row.node_id as string,
    reviewType: row.review_type as ReviewUnitRecord["reviewType"],
    evidenceType: row.evidence_type as EvidenceType,
    contentRef: row.content_ref as string,
    contentVersion:
      typeof row.content_version === "number" ? row.content_version : null,
    siblingGroupId: row.sibling_group_id as string,
    scenarioTag: typeof row.scenario_tag === "string" ? row.scenario_tag : null,
    lifecycle: row.lifecycle as ReviewUnitRecord["lifecycle"],
    algorithm: row.scheduler as "fsrs",
    algorithmVersion: row.algorithm_version as string,
    libraryName: row.library_name as string,
    libraryVersion: row.library_version as string,
    parametersVersion: row.parameters_version as string,
    schedulerState:
      row.scheduler_state === null
        ? null
        : (row.scheduler_state as ReviewUnitRecord["schedulerState"]),
    dueAt: typeof row.due_at === "string" ? row.due_at : null,
    reviewStatus: row.review_status as ReviewProductStatus,
    revision: Number(row.revision ?? 0),
    lastReviewAt:
      typeof row.last_review_at === "string" ? row.last_review_at : null,
    lastGrade:
      typeof row.last_grade === "string" ? (row.last_grade as ReviewGrade) : null,
  };
}

export class SupabaseLearningEngineStore implements LearningEngineStore {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getLesson(id: string): Promise<EngineLessonRecord | null> {
    const { data, error } = await this.client
      .from("lesson_instances")
      .select("id,user_id,blueprint_id,status,state")
      .eq("id", id)
      .maybeSingle();
    fail(error, "read lesson instance");
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      blueprintId: data.blueprint_id,
      status: data.status,
      state: (data.state ?? {}) as EngineLessonRecord["state"],
    };
  }

  async getExerciseItem(id: string): Promise<StoredExerciseRecord | null> {
    const { data, error } = await this.client
      .from("exercise_items")
      .select("id,lifecycle,trust_class,item")
      .eq("id", id)
      .maybeSingle();
    fail(error, "read exercise item");
    if (!data) return null;
    return {
      id: data.id,
      lifecycle: data.lifecycle,
      trustClass: data.trust_class,
      item: data.item as StoredExerciseRecord["item"],
    };
  }

  async getNode(id: string): Promise<EngineNodeRecord | null> {
    const { data, error } = await this.client
      .from("knowledge_nodes")
      .select("id,lifecycle,metadata")
      .eq("id", id)
      .maybeSingle();
    fail(error, "read knowledge node");
    if (!data) return null;
    return {
      id: data.id,
      lifecycle: data.lifecycle,
      metadata: (data.metadata ?? {}) as EngineNodeRecord["metadata"],
    };
  }

  async getAttemptBySubmissionKey(
    userId: string,
    submissionKey: string,
  ): Promise<AttemptRecord | null> {
    const { data, error } = await this.client
      .from("exercise_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("submission_key", submissionKey)
      .maybeSingle();
    fail(error, "read attempt by submission key");
    return data ? mapAttempt(data) : null;
  }

  async getFirstAttemptInGroup(
    userId: string,
    attemptGroupId: string,
  ): Promise<AttemptRecord | null> {
    const { data, error } = await this.client
      .from("exercise_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("attempt_group_id", attemptGroupId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    fail(error, "read first attempt in group");
    return data ? mapAttempt(data) : null;
  }

  async getStateAffectingAttemptInGroup(
    userId: string,
    attemptGroupId: string,
  ): Promise<AttemptRecord | null> {
    const { data, error } = await this.client
      .from("exercise_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("attempt_group_id", attemptGroupId)
      .eq("state_affecting", true)
      .maybeSingle();
    fail(error, "read state-affecting attempt in group");
    return data ? mapAttempt(data) : null;
  }

  private async rawInsertAttempt(attempt: AttemptRecord) {
    return this.client
      .from("exercise_attempts")
      .insert(attemptPayload(attempt))
      .select("*")
      .single();
  }

  async insertAttempt(attempt: AttemptRecord): Promise<AttemptRecord> {
    const firstInsert = await this.rawInsertAttempt(attempt);
    if (!firstInsert.error) {
      return mapAttempt(firstInsert.data as Record<string, unknown>);
    }

    if (firstInsert.error.code === "23505") {
      const sameSubmission = await this.getAttemptBySubmissionKey(
        attempt.userId,
        attempt.submissionKey,
      );
      if (sameSubmission) return sameSubmission;

      if (attempt.stateAffecting) {
        const winner = await this.getStateAffectingAttemptInGroup(
          attempt.userId,
          attempt.attemptGroupId,
        );
        if (winner) {
          if (
            winner.lessonInstanceId !== attempt.lessonInstanceId ||
            winner.exerciseItemId !== attempt.exerciseItemId ||
            winner.stageId !== attempt.stageId
          ) {
            throw new Error(
              "attempt group state slot is already owned by a different lesson, stage, or exercise item",
            );
          }
          const retryAttempt = neutralizeStateEffect(attempt);
          const retryInsert = await this.rawInsertAttempt(retryAttempt);
          if (!retryInsert.error) {
            return mapAttempt(retryInsert.data as Record<string, unknown>);
          }
          if (retryInsert.error.code === "23505") {
            const concurrentSameSubmission =
              await this.getAttemptBySubmissionKey(
                attempt.userId,
                attempt.submissionKey,
              );
            if (concurrentSameSubmission) return concurrentSameSubmission;
          }
          fail(retryInsert.error, "insert state-neutral retry attempt");
        }
      }
    }

    fail(firstInsert.error, "insert exercise attempt");
    throw new Error("unreachable attempt insertion failure");
  }

  async insertEvidenceIfMissing(evidence: EngineEvidence): Promise<boolean> {
    const { data, error } = await this.client
      .from("mastery_evidence")
      .upsert(
        {
          id: evidence.id,
          user_id: evidence.userId,
          node_id: evidence.nodeId,
          attempt_id: evidence.attemptId,
          evidence_type: evidence.evidenceType,
          result: {
            rating: evidence.rating,
            is_scored: evidence.isScored,
            evaluator: "deterministic",
            evaluator_confidence: evidence.evaluatorConfidence,
            content_kind: evidence.contentKind,
            source: {
              lesson_instance_id: evidence.lessonInstanceId,
              stage_id: evidence.stageId,
              attempt_group_id: evidence.attemptGroupId,
              content_ref: `${evidence.exerciseItemId}@v${evidence.exerciseItemVersion}`,
            },
            context: { scenario_tag: evidence.scenarioTag },
          },
          evaluator_confidence: evidence.evaluatorConfidence,
          assistance_level: evidence.assistance,
          trusted: evidence.trusted,
          created_at: evidence.occurredAt,
        },
        {
          onConflict: "attempt_id,node_id,evidence_type",
          ignoreDuplicates: true,
        },
      )
      .select("id");
    fail(error, "upsert mastery evidence");
    return (data?.length ?? 0) > 0;
  }

  async listEvidenceForNode(
    userId: string,
    nodeId: string,
  ): Promise<EngineEvidence[]> {
    const { data, error } = await this.client
      .from("mastery_evidence")
      .select(
        "id,user_id,node_id,attempt_id,evidence_type,result,evaluator_confidence,assistance_level,trusted,created_at",
      )
      .eq("user_id", userId)
      .eq("node_id", nodeId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    fail(error, "list node evidence");
    return (data ?? []).map((row) => {
      const result = (row.result ?? {}) as Record<string, unknown>;
      const source = (result.source ?? {}) as Record<string, unknown>;
      const context = (result.context ?? {}) as Record<string, unknown>;
      const contentRef = String(source.content_ref ?? "unknown@v0");
      const versionMatch = contentRef.match(/^(.*)@v(\d+)$/u);
      return {
        id: row.id,
        userId: row.user_id,
        nodeId: row.node_id,
        attemptId: row.attempt_id,
        exerciseItemId: versionMatch?.[1] ?? "unknown",
        exerciseItemVersion: Number(versionMatch?.[2] ?? 0),
        evidenceType: row.evidence_type as EvidenceType,
        rating: Number(result.rating ?? 0),
        assistance: row.assistance_level as EngineEvidence["assistance"],
        evaluatorConfidence:
          row.evaluator_confidence as EngineEvidence["evaluatorConfidence"],
        isScored: Boolean(result.is_scored),
        contentKind: (result.content_kind ?? "unscored_practice") as ContentKind,
        trusted: row.trusted,
        occurredAt: row.created_at,
        lessonInstanceId: String(source.lesson_instance_id ?? "unknown"),
        attemptGroupId: String(source.attempt_group_id ?? "unknown"),
        stageId: String(source.stage_id ?? "unknown"),
        scenarioTag:
          typeof context.scenario_tag === "string" ? context.scenario_tag : null,
      };
    });
  }

  async getNodeState(
    userId: string,
    nodeId: string,
  ): Promise<StoredNodeState | null> {
    const { data, error } = await this.client
      .from("learner_node_state")
      .select("mastery_status,evidence_summary")
      .eq("user_id", userId)
      .eq("node_id", nodeId)
      .maybeSingle();
    fail(error, "read learner node state");
    if (!data) return null;
    return {
      state: data.mastery_status as MasteryStatus,
      evidenceSummary: (data.evidence_summary ?? {}) as StoredNodeState["evidenceSummary"],
    };
  }

  async upsertNodeState(
    userId: string,
    nodeId: string,
    derivation: MasteryDerivation,
    requiredEvidenceTypes: EvidenceType[],
  ): Promise<void> {
    const { error } = await this.client.rpc("apply_learner_node_state", {
      p_user_id: userId,
      p_node_id: nodeId,
      p_mastery_status: derivation.state,
      p_evidence_summary: serializeDerivation(
        derivation,
        requiredEvidenceTypes,
      ),
      p_last_evidence_at: derivation.summary.lastScoredAt,
      p_updated_at: new Date().toISOString(),
    });
    fail(error, "apply learner node state");
  }

  async ensureReviewUnit(input: EnsureReviewUnitInput): Promise<ReviewUnitRecord> {
    const inserted = await this.client
      .from("review_units")
      .insert({
        user_id: input.userId,
        node_id: input.nodeId,
        review_type: input.reviewType,
        evidence_type: input.evidenceType,
        content_ref: input.contentRef,
        content_version: input.contentVersion,
        sibling_group_id: input.siblingGroupId,
        scenario_tag: input.scenarioTag,
        lifecycle: "active",
        scheduler: "fsrs",
        algorithm_version: input.algorithmVersion,
        library_name: "ts-fsrs",
        library_version: input.libraryVersion,
        parameters_version: input.parametersVersion,
        review_status: "not_scheduled",
        activated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (!inserted.error) {
      return mapReviewUnit(inserted.data as Record<string, unknown>);
    }

    if (inserted.error.code !== "23505") {
      fail(inserted.error, "create review unit");
    }

    const { data, error } = await this.client
      .from("review_units")
      .select("*")
      .eq("user_id", input.userId)
      .eq("node_id", input.nodeId)
      .eq("evidence_type", input.evidenceType)
      .eq("content_ref", input.contentRef)
      .maybeSingle();
    fail(error, "read concurrent existing review unit");
    if (!data) {
      throw new Error("review unit unique conflict did not resolve to an existing row");
    }
    return mapReviewUnit(data as Record<string, unknown>);
  }

  async getReviewUnit(id: string): Promise<ReviewUnitRecord | null> {
    const { data, error } = await this.client
      .from("review_units")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    fail(error, "read review unit");
    return data ? mapReviewUnit(data as Record<string, unknown>) : null;
  }

  async applyReviewUpdate(
    input: ApplyReviewUpdateInput,
  ): Promise<ApplyReviewUpdateResult> {
    const { data, error } = await this.client.rpc("apply_review_update", {
      p_review_unit_id: input.reviewUnitId,
      p_user_id: input.userId,
      p_attempt_id: input.attemptId,
      p_attempt_group_id: input.attemptGroupId,
      p_expected_revision: input.expectedRevision,
      p_grade: input.grade,
      p_before_state: input.beforeState,
      p_after_state: input.afterState,
      p_due_at: input.dueAt,
      p_review_status: input.reviewStatus,
      p_algorithm_version: input.algorithmVersion,
      p_library_version: input.libraryVersion,
      p_parameters_version: input.parametersVersion,
      p_occurred_at: input.occurredAt,
      p_scheduled_at: input.scheduledAt,
    });
    fail(error, "apply review update");
    if (data !== "applied" && data !== "duplicate" && data !== "conflict") {
      throw new Error(`unexpected review update result: ${String(data)}`);
    }
    return data;
  }
}
