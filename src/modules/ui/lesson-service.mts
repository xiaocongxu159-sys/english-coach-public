import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseLessonResolver,
  type ResolvedLessonInstance,
} from "../engine/lesson-resolver.mts";
import type { EngineExerciseItem } from "../engine/types.mts";
import {
  getReviewedPhase1PilotContent,
  type ReviewedLessonContent,
} from "./lesson-content.mts";
import { getOrCreateTodaySnapshot } from "./today-service.mts";

export interface LessonStageSnapshot {
  id: string;
  kind: string;
  status: "pending" | "completed" | "skipped";
  required: boolean;
  targetNodeIds: string[];
  contentRefs: string[];
  evidencePlan: string[];
}

export interface LearnerLessonSnapshot {
  lesson: ResolvedLessonInstance;
  currentStageId: string | null;
  stages: LessonStageSnapshot[];
  completedStageIds: string[];
  allowedItemsByStage: Record<string, string[]>;
}

export interface LessonExerciseItemSnapshot {
  id: string;
  item: EngineExerciseItem;
}

export interface LearnerLessonRuntime {
  snapshot: LearnerLessonSnapshot;
  currentStage: LessonStageSnapshot | null;
  currentItems: LessonExerciseItemSnapshot[];
  reviewedContent: ReviewedLessonContent;
}

const INSTRUCTION_STAGE_IDS = new Set([
  "everyday_social_context",
  "teach_social_formulas",
  "model_short_interactions",
]);

function fail(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context}: expected object`);
  }
  return value as Record<string, unknown>;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function mapLessonRow(row: Record<string, unknown>): ResolvedLessonInstance {
  const status = String(row.status ?? "");
  if (
    status !== "planned" &&
    status !== "in_progress" &&
    status !== "completed" &&
    status !== "abandoned"
  ) {
    throw new Error(`Lesson UI received invalid lesson status: ${status}`);
  }
  return {
    id: String(row.id),
    userId: String(row.user_id),
    blueprintId: String(row.blueprint_id),
    resolutionKey: String(row.resolution_key),
    revision: Number(row.revision ?? 0),
    status,
    state: asRecord(row.state ?? {}, "Lesson UI stored state"),
    startedAt: typeof row.started_at === "string" ? row.started_at : null,
    completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
  };
}

export function summarizeResolvedLesson(
  lesson: ResolvedLessonInstance,
): LearnerLessonSnapshot {
  const state = asRecord(lesson.state, "Lesson UI state");
  const instance = asRecord(state.instance, "Lesson UI instance");
  const completion = asRecord(instance.completion, "Lesson UI completion");
  const requiredMap = asRecord(state.stage_required, "Lesson UI required-stage map");
  const allowedMap = asRecord(
    state.allowed_items_by_stage,
    "Lesson UI allowed-item map",
  );
  const rawStages = Array.isArray(instance.resolved_stages)
    ? instance.resolved_stages
    : [];

  const stages = rawStages.map((value) => {
    const stage = asRecord(value, "Lesson UI stage");
    const id = String(stage.stage_id ?? "");
    if (!id) throw new Error("Lesson UI stage is missing stage_id");
    const rawStatus = String(stage.status ?? "pending");
    if (
      rawStatus !== "pending" &&
      rawStatus !== "completed" &&
      rawStatus !== "skipped"
    ) {
      throw new Error(`Lesson UI stage ${id} has invalid status ${rawStatus}`);
    }
    return {
      id,
      kind: String(stage.kind ?? ""),
      status: rawStatus,
      required: requiredMap[id] !== false,
      targetNodeIds: stringArray(stage.target_nodes),
      contentRefs: stringArray(stage.content_refs),
      evidencePlan: stringArray(stage.evidence_plan),
    } satisfies LessonStageSnapshot;
  });

  const allowedItemsByStage = Object.fromEntries(
    Object.entries(allowedMap).map(([stageId, itemIds]) => [
      stageId,
      stringArray(itemIds),
    ]),
  );

  return {
    lesson,
    currentStageId:
      typeof state.current_stage_id === "string" ? state.current_stage_id : null,
    stages,
    completedStageIds: stringArray(completion.completed_stage_ids),
    allowedItemsByStage,
  };
}

export async function startOrResumeTodayLesson(
  client: SupabaseClient,
  learnerId: string,
  now = new Date(),
): Promise<LearnerLessonSnapshot> {
  const today = await getOrCreateTodaySnapshot(client, learnerId, now);
  const resolver = new SupabaseLessonResolver(client);
  const lesson = await resolver.resolve(today.storedPlan, 0);
  return summarizeResolvedLesson(lesson);
}

export async function loadLearnerLessonRuntime(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<LearnerLessonRuntime | null> {
  const lessonResult = await client
    .from("lesson_instances")
    .select(
      "id,user_id,blueprint_id,resolution_key,revision,status,state,started_at,completed_at",
    )
    .eq("id", lessonId)
    .eq("user_id", learnerId)
    .maybeSingle();
  fail(lessonResult.error, "Lesson UI read learner Lesson Instance");
  if (!lessonResult.data) return null;

  const snapshot = summarizeResolvedLesson(
    mapLessonRow(lessonResult.data as Record<string, unknown>),
  );
  const currentStage =
    snapshot.stages.find((stage) => stage.id === snapshot.currentStageId) ?? null;
  const currentItemIds = currentStage
    ? (snapshot.allowedItemsByStage[currentStage.id] ?? [])
    : [];

  let currentItems: LessonExerciseItemSnapshot[] = [];
  if (currentItemIds.length > 0) {
    const itemResult = await client
      .from("exercise_items")
      .select("id,lifecycle,trust_class,item")
      .in("id", currentItemIds);
    fail(itemResult.error, "Lesson UI read reviewed exercise items");
    const itemById = new Map(
      (itemResult.data ?? []).map((row) => [String(row.id), row]),
    );
    currentItems = currentItemIds.map((itemId) => {
      const row = itemById.get(itemId);
      if (!row) throw new Error(`Lesson UI reviewed item is missing: ${itemId}`);
      if (row.lifecycle !== "active" || row.trust_class !== "reviewed_core") {
        throw new Error(`Lesson UI item is not active reviewed core: ${itemId}`);
      }
      const item = row.item as EngineExerciseItem;
      if (item.id !== itemId || item.status !== "active") {
        throw new Error(`Lesson UI stored item contract mismatch: ${itemId}`);
      }
      return { id: itemId, item };
    });
  }

  return {
    snapshot,
    currentStage,
    currentItems,
    reviewedContent: getReviewedPhase1PilotContent(),
  };
}

export async function advanceCurrentInstructionStage(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<LearnerLessonSnapshot> {
  const runtime = await loadLearnerLessonRuntime(client, learnerId, lessonId);
  if (!runtime) throw new Error("Lesson UI cannot advance a missing Lesson Instance");
  const stageId = runtime.snapshot.currentStageId;
  if (!stageId || !INSTRUCTION_STAGE_IDS.has(stageId)) {
    throw new Error("Lesson UI can only advance the current reviewed instruction stage");
  }
  const resolver = new SupabaseLessonResolver(client);
  return summarizeResolvedLesson(
    await resolver.completeStage(learnerId, lessonId, stageId),
  );
}
