import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { submitExerciseAttempt } from "../engine/attempt-service.mts";
import { SupabaseLessonResolver } from "../engine/lesson-resolver.mts";
import { SupabaseLearningEngineStore } from "../engine/supabase-store.mts";
import type {
  EngineExerciseItem,
  ExerciseResponse,
  SubmissionResult,
} from "../engine/types.mts";
import {
  loadLearnerLessonRuntime,
  type LearnerLessonRuntime,
} from "./lesson-service.mts";

const DETERMINISTIC_EXERCISE_STAGE_IDS = new Set([
  "recognition_check",
  "controlled_formulas",
]);

export interface DeterministicExerciseSubmission {
  submittedItemId: string;
  stageAdvanced: boolean;
  submission: SubmissionResult;
  runtime: LearnerLessonRuntime;
}

function fail(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function identitySeed(
  learnerId: string,
  lessonId: string,
  stageId: string,
  exerciseItemId: string,
): string {
  return `${learnerId}:${lessonId}:${stageId}:${exerciseItemId}:primary`;
}

function digest(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function deterministicAttemptGroupId(seed: string): string {
  const chars = digest(seed).slice(0, 32).split("");
  chars[12] = "5";
  chars[16] = ((Number.parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  const hex = chars.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function deterministicSubmissionKey(seed: string): string {
  return `lesson-ui-${digest(seed)}`;
}

function normalizeResponse(
  item: EngineExerciseItem,
  response: ExerciseResponse,
): ExerciseResponse {
  if (item.task_type === "multiple_choice_single") {
    if (response.kind !== "choice") {
      throw new Error("Lesson UI expected a multiple-choice response");
    }
    const validOption = item.content.options?.some(
      (option) => option.id === response.selectedOptionId,
    );
    if (!validOption) {
      throw new Error("Lesson UI received an option outside the reviewed item");
    }
    return response;
  }

  if (item.task_type === "short_answer") {
    if (response.kind !== "text") {
      throw new Error("Lesson UI expected a short text response");
    }
    const text = response.text.trim();
    if (!text || text.length > 240) {
      throw new Error("Lesson UI short response must contain 1-240 characters");
    }
    return { kind: "text", text };
  }

  throw new Error(
    `Lesson UI deterministic submission does not support task type ${item.task_type}`,
  );
}

async function attemptedItemsForStage(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
  stageId: string,
  allowedItemIds: string[],
): Promise<Set<string>> {
  const result = await client
    .from("exercise_attempts")
    .select("exercise_item_id")
    .eq("user_id", learnerId)
    .eq("lesson_instance_id", lessonId)
    .eq("stage_id", stageId)
    .in("exercise_item_id", allowedItemIds);
  fail(result.error, "Lesson UI read persisted stage attempts");
  return new Set((result.data ?? []).map((row) => String(row.exercise_item_id)));
}

async function requireRuntime(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<LearnerLessonRuntime> {
  const runtime = await loadLearnerLessonRuntime(client, learnerId, lessonId);
  if (!runtime) throw new Error("Lesson UI cannot submit to a missing Lesson Instance");
  return runtime;
}

export async function submitCurrentDeterministicExercise(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
  expectedStageId: string,
  expectedItemId: string,
  response: ExerciseResponse,
): Promise<DeterministicExerciseSubmission> {
  const seed = identitySeed(learnerId, lessonId, expectedStageId, expectedItemId);
  const submissionKey = deterministicSubmissionKey(seed);
  const attemptGroupId = deterministicAttemptGroupId(seed);
  const store = new SupabaseLearningEngineStore(client);

  // First handle a true HTTP/browser replay. This remains safe even if the
  // Lesson has already advanced because the Engine requires the exact original
  // response for an existing submission key and cannot duplicate Evidence.
  const existing = await store.getAttemptBySubmissionKey(learnerId, submissionKey);
  if (existing) {
    const storedItem = await store.getExerciseItem(expectedItemId);
    if (!storedItem) {
      throw new Error(`Lesson UI replay item is missing: ${expectedItemId}`);
    }
    const normalizedResponse = normalizeResponse(storedItem.item, response);
    const submission = await submitExerciseAttempt(store, {
      userId: learnerId,
      lessonInstanceId: lessonId,
      exerciseItemId: expectedItemId,
      submissionKey,
      attemptGroupId,
      stageId: expectedStageId,
      response: normalizedResponse,
      assistance: "independent",
      scenarioTag: "everyday_social",
    });
    const runtime = await requireRuntime(client, learnerId, lessonId);
    return {
      submittedItemId: expectedItemId,
      stageAdvanced: runtime.snapshot.currentStageId !== expectedStageId,
      submission,
      runtime,
    };
  }

  const runtimeBefore = await requireRuntime(client, learnerId, lessonId);
  const currentStage = runtimeBefore.currentStage;
  if (
    !currentStage ||
    currentStage.id !== expectedStageId ||
    !DETERMINISTIC_EXERCISE_STAGE_IDS.has(currentStage.id)
  ) {
    throw new Error(
      "Lesson UI exercise request is stale or outside the current deterministic stage",
    );
  }

  const allowedItemIds =
    runtimeBefore.snapshot.allowedItemsByStage[currentStage.id] ?? [];
  if (allowedItemIds.length === 0) {
    throw new Error("Lesson UI current deterministic stage has no reviewed items");
  }

  const attempted = await attemptedItemsForStage(
    client,
    learnerId,
    lessonId,
    currentStage.id,
    allowedItemIds,
  );
  const nextItemId = allowedItemIds.find((itemId) => !attempted.has(itemId));

  if (!nextItemId) {
    const resolver = new SupabaseLessonResolver(client);
    await resolver.completeStage(learnerId, lessonId, currentStage.id);
    throw new Error(
      "Lesson UI exercise stage was already answered and has been checkpointed",
    );
  }
  if (nextItemId !== expectedItemId) {
    throw new Error("Lesson UI exercise request does not match the next reviewed item");
  }

  const itemSnapshot = runtimeBefore.currentItems.find(
    (entry) => entry.id === nextItemId,
  );
  if (!itemSnapshot) {
    throw new Error(`Lesson UI next reviewed item is missing: ${nextItemId}`);
  }
  const normalizedResponse = normalizeResponse(itemSnapshot.item, response);

  const submission = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lessonId,
    exerciseItemId: nextItemId,
    submissionKey,
    attemptGroupId,
    stageId: currentStage.id,
    response: normalizedResponse,
    assistance: "independent",
    scenarioTag: "everyday_social",
  });

  if (nextItemId === allowedItemIds.at(-1)) {
    const resolver = new SupabaseLessonResolver(client);
    await resolver.completeStage(learnerId, lessonId, currentStage.id);
  }

  const runtimeAfter = await requireRuntime(client, learnerId, lessonId);
  return {
    submittedItemId: nextItemId,
    stageAdvanced: runtimeAfter.snapshot.currentStageId !== currentStage.id,
    submission,
    runtime: runtimeAfter,
  };
}
