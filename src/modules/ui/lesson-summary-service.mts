import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseDailyPlanStore } from "../engine/daily-plan-store.mts";
import { SupabaseLessonResolver } from "../engine/lesson-resolver.mts";
import { isExactPhase1PilotNodeSet } from "../engine/pilot-policy.mts";
import { loadLessonExitGateResult } from "./lesson-exit-service.mts";
import {
  loadLearnerLessonRuntime,
  summarizeResolvedLesson,
  type LearnerLessonSnapshot,
} from "./lesson-service.mts";

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context}: expected object`);
  }
  return value as Record<string, unknown>;
}

async function completePhase1DailyPlan(
  client: SupabaseClient,
  learnerId: string,
  snapshot: LearnerLessonSnapshot,
): Promise<void> {
  if (snapshot.lesson.status !== "completed") return;

  const state = asRecord(snapshot.lesson.state, "Lesson completion state");
  const instance = asRecord(state.instance, "Lesson completion instance");
  const planDocumentId = state.daily_plan_ref;
  const planDate = instance.scheduled_for;
  if (typeof planDocumentId !== "string" || typeof planDate !== "string") {
    throw new Error("Lesson completion is missing its Daily Plan identity");
  }

  const store = new SupabaseDailyPlanStore(client);
  const storedPlan = await store.getDailyPlan(learnerId, planDate);
  if (!storedPlan) {
    throw new Error("Lesson completion references a missing Daily Plan");
  }
  if (storedPlan.plan.id !== planDocumentId) {
    throw new Error("Lesson completion Daily Plan identity mismatch");
  }

  // Phase 1 intentionally resolves exactly one reviewed Pilot Lesson Request.
  // Do not define completion semantics for future multi-request plans here.
  if (
    storedPlan.plan.lesson_requests.length !== 1 ||
    !isExactPhase1PilotNodeSet(storedPlan.plan.selected.new_node_ids)
  ) {
    return;
  }

  await store.completeDailyPlan(
    learnerId,
    storedPlan.id,
    snapshot.lesson.completedAt ?? new Date().toISOString(),
  );
}

export async function completeLessonSummary(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<LearnerLessonSnapshot> {
  const runtime = await loadLearnerLessonRuntime(client, learnerId, lessonId);
  if (!runtime) throw new Error("Lesson UI cannot finish a missing Lesson Instance");

  const exitResult = await loadLessonExitGateResult(client, learnerId, lessonId);
  if (!exitResult) {
    throw new Error("Lesson UI cannot finish before the reviewed exit gate is evaluated");
  }

  if (runtime.snapshot.lesson.status === "completed") {
    await completePhase1DailyPlan(client, learnerId, runtime.snapshot);
    return runtime.snapshot;
  }
  if (runtime.snapshot.currentStageId !== "lesson_summary") {
    throw new Error("Lesson UI can only finish from the lesson_summary stage");
  }

  const resolver = new SupabaseLessonResolver(client);
  const completed = summarizeResolvedLesson(
    await resolver.completeStage(learnerId, lessonId, "lesson_summary"),
  );
  await completePhase1DailyPlan(client, learnerId, completed);
  return completed;
}
