import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredDailyPlan } from "./daily-plan-store.mts";
import {
  PHASE1_PILOT_ALLOWED_ITEMS_BY_STAGE,
  PHASE1_PILOT_BLUEPRINT_ID,
  PHASE1_PILOT_PRIMARY_NODE_IDS,
  PHASE1_PILOT_RESUME_POLICY,
  isExactPhase1PilotNodeSet,
} from "./pilot-policy.mts";
import type { DailyPlan } from "./planning-types.mts";

interface BlueprintStage {
  key: string;
  kind: string;
  required: boolean;
  target_role: "primary" | "none" | string;
  evidence_types: string[];
}

interface PilotBlueprint {
  id: string;
  version: number;
  status: string;
  level: "A1";
  lesson_type: "new_learning";
  duration_minutes: { min: number; target: number; max: number };
  stages: BlueprintStage[];
  content_policy: {
    reviewed_core_required: boolean;
    ai_variants_allowed: boolean;
    scored_ai_variant_policy: string;
  };
  resume_policy: {
    checkpoint_after_each_stage: boolean;
    preserve_attempts: boolean;
  };
}

export interface ResolvedLessonInstance {
  id: string;
  userId: string;
  blueprintId: string;
  resolutionKey: string;
  revision: number;
  status: "planned" | "in_progress" | "completed" | "abandoned";
  state: Record<string, unknown>;
  startedAt: string | null;
  completedAt: string | null;
}

const LESSON_SELECT =
  "id,user_id,blueprint_id,resolution_key,revision,status,state,started_at,completed_at";

function fail(error: { message: string; code?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context}: expected object`);
  }
  return value as Record<string, unknown>;
}

function mapLesson(row: Record<string, unknown>): ResolvedLessonInstance {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    blueprintId: row.blueprint_id as string,
    resolutionKey: row.resolution_key as string,
    revision: Number(row.revision ?? 0),
    status: row.status as ResolvedLessonInstance["status"],
    state: (row.state ?? {}) as Record<string, unknown>,
    startedAt: typeof row.started_at === "string" ? row.started_at : null,
    completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
  };
}

export function validatePhase1PilotLessonRequest(
  plan: DailyPlan,
  requestIndex: number,
): DailyPlan["lesson_requests"][number] {
  const request = plan.lesson_requests[requestIndex];
  if (!request) throw new Error("lesson resolver: Daily Plan request does not exist");
  if (request.blueprint_type !== "new_learning") {
    throw new Error(
      "lesson resolver: Phase 1 Pilot only resolves the reviewed new-learning blueprint",
    );
  }
  if (!isExactPhase1PilotNodeSet(request.primary_nodes)) {
    throw new Error(
      "lesson resolver: requested primary nodes are outside the frozen Phase 1 Pilot",
    );
  }
  if (!isExactPhase1PilotNodeSet(plan.selected.new_node_ids)) {
    throw new Error(
      "lesson resolver: Daily Plan selected nodes are outside the frozen Phase 1 Pilot",
    );
  }
  return request;
}

function validateBlueprint(
  value: unknown,
  request: DailyPlan["lesson_requests"][number],
): PilotBlueprint {
  const blueprint = asRecord(
    value,
    "lesson resolver blueprint",
  ) as unknown as PilotBlueprint;
  if (blueprint.id !== PHASE1_PILOT_BLUEPRINT_ID || blueprint.status !== "active") {
    throw new Error("lesson resolver: reviewed Pilot blueprint is not active");
  }
  if (blueprint.level !== "A1" || blueprint.lesson_type !== "new_learning") {
    throw new Error("lesson resolver: Pilot blueprint level/type mismatch");
  }
  if (
    request.minutes < blueprint.duration_minutes.min ||
    request.minutes > blueprint.duration_minutes.max
  ) {
    throw new Error(
      "lesson resolver: Daily Plan request minutes exceed reviewed Pilot blueprint bounds",
    );
  }
  if (
    !blueprint.content_policy.reviewed_core_required ||
    blueprint.content_policy.ai_variants_allowed ||
    blueprint.content_policy.scored_ai_variant_policy !== "forbidden"
  ) {
    throw new Error(
      "lesson resolver: Pilot blueprint content trust policy is not frozen reviewed-core-only",
    );
  }
  if (
    blueprint.resume_policy.checkpoint_after_each_stage !==
      PHASE1_PILOT_RESUME_POLICY.checkpointAfterEachStage ||
    blueprint.resume_policy.preserve_attempts !==
      PHASE1_PILOT_RESUME_POLICY.preserveAttempts
  ) {
    throw new Error("lesson resolver: Pilot resume policy mismatch");
  }
  return blueprint;
}

function allPilotItemIds(): string[] {
  return Object.values(PHASE1_PILOT_ALLOWED_ITEMS_BY_STAGE).flatMap((ids) => [
    ...ids,
  ]);
}

function validateReviewedItems(rows: Array<Record<string, unknown>>): void {
  const expectedIds = allPilotItemIds().sort();
  const actualIds = rows.map((row) => row.id as string).sort();
  if (
    actualIds.length !== expectedIds.length ||
    actualIds.some((id, index) => id !== expectedIds[index])
  ) {
    throw new Error(
      "lesson resolver: reviewed Pilot item set is incomplete or unexpected",
    );
  }

  for (const row of rows) {
    if (row.lifecycle !== "active" || row.trust_class !== "reviewed_core") {
      throw new Error(
        `lesson resolver: item ${String(row.id)} is not active reviewed core`,
      );
    }
    const item = asRecord(row.item, `lesson resolver item ${String(row.id)}`);
    const targetNodeIds = Array.isArray(item.target_node_ids)
      ? item.target_node_ids.map(String)
      : [];
    if (
      targetNodeIds.some(
        (id) =>
          !PHASE1_PILOT_PRIMARY_NODE_IDS.includes(
            id as (typeof PHASE1_PILOT_PRIMARY_NODE_IDS)[number],
          ),
      )
    ) {
      throw new Error(
        `lesson resolver: item ${String(row.id)} targets a node outside the Pilot`,
      );
    }
    const policy = asRecord(
      item.state_effect_policy,
      `lesson resolver item ${String(row.id)} policy`,
    );
    if (String(row.id) === "EI-A1-SOCIAL-SPEAK-001") {
      if (policy.may_change_mastery !== false || policy.may_update_review !== false) {
        throw new Error(
          "lesson resolver: practice-only spoken item became state-affecting",
        );
      }
    }
  }
}

function buildState(
  blueprint: PilotBlueprint,
  plan: DailyPlan,
  requestIndex: number,
  createdAt: string,
): Record<string, unknown> {
  const request = plan.lesson_requests[requestIndex];
  const allowedItemsByStage = Object.fromEntries(
    Object.entries(PHASE1_PILOT_ALLOWED_ITEMS_BY_STAGE).map(([stage, ids]) => [
      stage,
      [...ids],
    ]),
  );
  const resolvedStages = blueprint.stages.map((stage) => ({
    stage_id: stage.key,
    kind: stage.kind,
    status: "pending",
    target_nodes: stage.target_role === "primary" ? [...request.primary_nodes] : [],
    content_refs: [...(PHASE1_PILOT_ALLOWED_ITEMS_BY_STAGE[stage.key] ?? [])],
    evidence_plan: [...stage.evidence_types],
  }));

  const instance = {
    id: `lesson-${randomUUID()}`,
    blueprint_id: blueprint.id,
    learner_id: plan.learner_id,
    created_at: createdAt,
    scheduled_for: plan.plan_date,
    level: blueprint.level,
    lesson_type: blueprint.lesson_type,
    primary_nodes: [...request.primary_nodes],
    support_nodes: [...request.support_nodes],
    review_nodes: [],
    resolved_stages: resolvedStages,
    runtime_context: {
      recent_error_categories: [],
      scenario_tags: ["everyday_social"],
      language_support_mode: "adaptive_bilingual",
      difficulty_band: "on_level",
    },
    completion: {
      status: "in_progress",
      completed_stage_ids: [],
      evidence_event_ids: [],
      summary_ref: null,
    },
  };

  return {
    instance,
    daily_plan_ref: plan.id,
    request_index: requestIndex,
    blueprint_version: blueprint.version,
    allowed_items_by_stage: allowedItemsByStage,
    stage_required: Object.fromEntries(
      blueprint.stages.map((stage) => [stage.key, stage.required]),
    ),
    current_stage_id: blueprint.stages[0]?.key ?? null,
    resume_policy: {
      checkpoint_after_each_stage: true,
      preserve_attempts: true,
    },
  };
}

export class SupabaseLessonResolver {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getExisting(
    userId: string,
    resolutionKey: string,
  ): Promise<ResolvedLessonInstance | null> {
    const { data, error } = await this.client
      .from("lesson_instances")
      .select(LESSON_SELECT)
      .eq("user_id", userId)
      .eq("resolution_key", resolutionKey)
      .neq("status", "abandoned")
      .maybeSingle();
    fail(error, "read resolved lesson instance");
    return data ? mapLesson(data) : null;
  }

  private async markPlanInProgress(
    planRecord: StoredDailyPlan,
    userId: string,
    at: string,
  ): Promise<void> {
    const update = await this.client
      .from("daily_plans")
      .update({ status: "in_progress", updated_at: at })
      .eq("id", planRecord.id)
      .eq("user_id", userId)
      .eq("status", "planned");
    fail(update.error, "mark Daily Plan in progress");
  }

  async resolve(
    planRecord: StoredDailyPlan,
    requestIndex = 0,
  ): Promise<ResolvedLessonInstance> {
    const plan = planRecord.plan;
    validatePhase1PilotLessonRequest(plan, requestIndex);
    if (plan.learner_id !== planRecord.userId) {
      throw new Error("lesson resolver: Daily Plan learner identity mismatch");
    }
    const resolutionKey = `${plan.id}:request:${requestIndex}`;
    const existing = await this.getExisting(plan.learner_id, resolutionKey);
    if (existing) {
      await this.markPlanInProgress(
        planRecord,
        plan.learner_id,
        new Date().toISOString(),
      );
      return existing;
    }

    const blueprintResult = await this.client
      .from("lesson_blueprints")
      .select("id,lifecycle,blueprint")
      .eq("id", PHASE1_PILOT_BLUEPRINT_ID)
      .eq("lifecycle", "active")
      .maybeSingle();
    fail(blueprintResult.error, "read Pilot lesson blueprint");
    if (!blueprintResult.data) {
      throw new Error(
        "lesson resolver: active reviewed Pilot blueprint is missing",
      );
    }
    const request = plan.lesson_requests[requestIndex];
    const blueprint = validateBlueprint(blueprintResult.data.blueprint, request);

    const itemResult = await this.client
      .from("exercise_items")
      .select("id,lifecycle,trust_class,item")
      .in("id", allPilotItemIds());
    fail(itemResult.error, "read reviewed Pilot exercise items");
    validateReviewedItems(
      (itemResult.data ?? []) as Array<Record<string, unknown>>,
    );

    const createdAt = new Date().toISOString();
    const state = buildState(blueprint, plan, requestIndex, createdAt);
    const insert = await this.client
      .from("lesson_instances")
      .insert({
        user_id: plan.learner_id,
        blueprint_id: blueprint.id,
        resolution_key: resolutionKey,
        status: "in_progress",
        state,
        started_at: createdAt,
      })
      .select(LESSON_SELECT)
      .single();

    if (insert.error?.code === "23505") {
      const raced = await this.getExisting(plan.learner_id, resolutionKey);
      if (raced) {
        await this.markPlanInProgress(planRecord, plan.learner_id, createdAt);
        return raced;
      }
    }
    fail(insert.error, "create resolved lesson instance");
    if (!insert.data) {
      throw new Error(
        "create resolved lesson instance: database returned no row",
      );
    }

    await this.markPlanInProgress(planRecord, plan.learner_id, createdAt);
    return mapLesson(insert.data);
  }

  async completeStage(
    userId: string,
    lessonId: string,
    stageId: string,
  ): Promise<ResolvedLessonInstance> {
    return this.updateStage(userId, lessonId, stageId, false);
  }

  async skipOptionalStage(
    userId: string,
    lessonId: string,
    stageId: string,
  ): Promise<ResolvedLessonInstance> {
    return this.updateStage(userId, lessonId, stageId, true);
  }

  private async updateStage(
    userId: string,
    lessonId: string,
    stageId: string,
    skip: boolean,
  ): Promise<ResolvedLessonInstance> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await this.client
        .from("lesson_instances")
        .select(LESSON_SELECT)
        .eq("id", lessonId)
        .eq("user_id", userId)
        .maybeSingle();
      fail(error, "read lesson for stage checkpoint");
      if (!data) {
        throw new Error("lesson checkpoint: lesson not found for learner");
      }
      if (data.status === "completed" || data.status === "abandoned") {
        return mapLesson(data);
      }

      const state = asRecord(data.state, "lesson checkpoint state");
      const instance = asRecord(state.instance, "lesson checkpoint instance");
      const resolvedStages = Array.isArray(instance.resolved_stages)
        ? instance.resolved_stages.map((value) => ({
            ...asRecord(value, "resolved lesson stage"),
          }))
        : [];
      const stageIndex = resolvedStages.findIndex(
        (stage) => stage.stage_id === stageId,
      );
      if (stageIndex < 0) {
        throw new Error(
          "lesson checkpoint: stage is not part of this Lesson Instance",
        );
      }

      const requiredMap = asRecord(
        state.stage_required,
        "lesson checkpoint required-stage map",
      );
      if (skip && requiredMap[stageId] !== false) {
        throw new Error("lesson checkpoint: required stage cannot be skipped");
      }

      if (
        resolvedStages[stageIndex].status === "completed" ||
        resolvedStages[stageIndex].status === "skipped"
      ) {
        return mapLesson(data);
      }
      resolvedStages[stageIndex].status = skip ? "skipped" : "completed";

      const completedStageIds = resolvedStages
        .filter((stage) => stage.status === "completed")
        .map((stage) => String(stage.stage_id));
      const allRequiredComplete = resolvedStages.every(
        (stage) =>
          requiredMap[String(stage.stage_id)] === false ||
          stage.status === "completed",
      );
      const nextStage = resolvedStages.find(
        (stage) =>
          stage.status !== "completed" && stage.status !== "skipped",
      );

      const completion = asRecord(
        instance.completion,
        "lesson checkpoint completion",
      );
      const nextState = {
        ...state,
        instance: {
          ...instance,
          resolved_stages: resolvedStages,
          completion: {
            ...completion,
            status: allRequiredComplete ? "completed" : "in_progress",
            completed_stage_ids: completedStageIds,
          },
        },
        current_stage_id: allRequiredComplete
          ? null
          : (nextStage?.stage_id ?? null),
      };

      const completedAt = allRequiredComplete ? new Date().toISOString() : null;
      const nextRevision = Number(data.revision ?? 0) + 1;
      const update = await this.client
        .from("lesson_instances")
        .update({
          state: nextState,
          revision: nextRevision,
          status: allRequiredComplete ? "completed" : "in_progress",
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lessonId)
        .eq("user_id", userId)
        .eq("revision", Number(data.revision ?? 0))
        .select(LESSON_SELECT)
        .maybeSingle();
      fail(update.error, "persist lesson stage checkpoint");
      if (update.data) return mapLesson(update.data);
    }

    throw new Error(
      "lesson checkpoint: concurrent updates did not converge after retries",
    );
  }
}