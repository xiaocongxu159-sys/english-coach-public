import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EngineExerciseItem,
  ExerciseResponse,
  ScoringResult,
} from "../engine/types.mts";
import type {
  LearnerLessonRuntime,
  LessonExerciseItemSnapshot,
} from "./lesson-service.mts";

const DETERMINISTIC_EXERCISE_STAGE_IDS = new Set([
  "recognition_check",
  "controlled_formulas",
]);

export interface DeterministicExerciseProgress {
  stageId: string;
  answeredCount: number;
  totalCount: number;
  nextItem: LessonExerciseItemSnapshot | null;
}

export interface LessonAttemptFeedback {
  attemptId: string;
  itemId: string;
  correct: boolean | null;
  rating: number;
  normalizedResponse: string | boolean | null;
  correctAnswers: string[];
}

function fail(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function correctAnswersForItem(item: EngineExerciseItem): string[] {
  if (item.task_type === "multiple_choice_single") {
    const correctIds = new Set(item.answer_spec.correct_option_ids ?? []);
    return (item.content.options ?? [])
      .filter((option) => correctIds.has(option.id))
      .map((option) => option.text);
  }
  if (item.task_type === "short_answer") {
    return [...(item.answer_spec.accepted_answers ?? [])];
  }
  return [];
}

export async function loadDeterministicExerciseProgress(
  client: SupabaseClient,
  learnerId: string,
  runtime: LearnerLessonRuntime,
): Promise<DeterministicExerciseProgress | null> {
  const stage = runtime.currentStage;
  if (!stage || !DETERMINISTIC_EXERCISE_STAGE_IDS.has(stage.id)) return null;

  const allowedItemIds = runtime.snapshot.allowedItemsByStage[stage.id] ?? [];
  const result = await client
    .from("exercise_attempts")
    .select("exercise_item_id")
    .eq("user_id", learnerId)
    .eq("lesson_instance_id", runtime.snapshot.lesson.id)
    .eq("stage_id", stage.id)
    .in("exercise_item_id", allowedItemIds);
  fail(result.error, "Lesson UI read deterministic exercise progress");

  const attempted = new Set(
    (result.data ?? []).map((row) => String(row.exercise_item_id)),
  );
  const nextItemId = allowedItemIds.find((itemId) => !attempted.has(itemId));
  const nextItem = nextItemId
    ? (runtime.currentItems.find((entry) => entry.id === nextItemId) ?? null)
    : null;

  return {
    stageId: stage.id,
    answeredCount: attempted.size,
    totalCount: allowedItemIds.length,
    nextItem,
  };
}

export async function loadLessonAttemptFeedback(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
  attemptId: string,
): Promise<LessonAttemptFeedback | null> {
  const attemptResult = await client
    .from("exercise_attempts")
    .select("id,exercise_item_id,response,evaluation")
    .eq("id", attemptId)
    .eq("user_id", learnerId)
    .eq("lesson_instance_id", lessonId)
    .maybeSingle();
  fail(attemptResult.error, "Lesson UI read persisted attempt feedback");
  if (!attemptResult.data) return null;

  const itemResult = await client
    .from("exercise_items")
    .select("id,lifecycle,trust_class,item")
    .eq("id", attemptResult.data.exercise_item_id)
    .maybeSingle();
  fail(itemResult.error, "Lesson UI read feedback item");
  if (!itemResult.data) return null;
  if (
    itemResult.data.lifecycle !== "active" ||
    itemResult.data.trust_class !== "reviewed_core"
  ) {
    throw new Error("Lesson UI feedback item is not active reviewed core");
  }

  const item = itemResult.data.item as EngineExerciseItem;
  const evaluation = attemptResult.data.evaluation as ScoringResult;
  const response = attemptResult.data.response as ExerciseResponse;
  if (item.id !== attemptResult.data.exercise_item_id) {
    throw new Error("Lesson UI feedback item contract mismatch");
  }
  if (response.kind === "practice") {
    throw new Error("Lesson UI deterministic feedback cannot use practice response");
  }

  return {
    attemptId: String(attemptResult.data.id),
    itemId: String(attemptResult.data.exercise_item_id),
    correct: evaluation.correct,
    rating: evaluation.rating,
    normalizedResponse: evaluation.normalizedResponse,
    correctAnswers: correctAnswersForItem(item),
  };
}
