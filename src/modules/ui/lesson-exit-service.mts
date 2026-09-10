import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseLessonResolver } from "../engine/lesson-resolver.mts";
import { getReviewedPhase1PilotContent } from "./lesson-content.mts";
import {
  loadLearnerLessonRuntime,
  summarizeResolvedLesson,
  type LearnerLessonSnapshot,
} from "./lesson-service.mts";

export interface LessonExitGateResult {
  evaluatedAt: string;
  passed: boolean;
  correctCount: number;
  scoredItemCount: number;
  minimumCorrect: number;
  requiredCorrectItemIds: string[];
  failedRequiredItemIds: string[];
  incorrectItemIds: string[];
  attemptIdsByItem: Record<string, string>;
}

export interface LessonExitGateEvaluation {
  result: LessonExitGateResult;
  snapshot: LearnerLessonSnapshot;
}

interface AttemptRow {
  id: string;
  exercise_item_id: string;
  evaluation: unknown;
}

function fail(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context}: expected object`);
  }
  return value as Record<string, unknown>;
}

function parseStoredResult(value: unknown): LessonExitGateResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  if (
    typeof result.evaluated_at !== "string" ||
    typeof result.passed !== "boolean" ||
    typeof result.correct_count !== "number" ||
    typeof result.scored_item_count !== "number" ||
    typeof result.minimum_correct !== "number" ||
    !Array.isArray(result.required_correct_item_ids) ||
    !Array.isArray(result.failed_required_item_ids) ||
    !Array.isArray(result.incorrect_item_ids) ||
    !result.attempt_ids_by_item ||
    typeof result.attempt_ids_by_item !== "object" ||
    Array.isArray(result.attempt_ids_by_item)
  ) {
    throw new Error("Lesson UI stored exit gate result is malformed");
  }
  return {
    evaluatedAt: result.evaluated_at,
    passed: result.passed,
    correctCount: result.correct_count,
    scoredItemCount: result.scored_item_count,
    minimumCorrect: result.minimum_correct,
    requiredCorrectItemIds: result.required_correct_item_ids.map(String),
    failedRequiredItemIds: result.failed_required_item_ids.map(String),
    incorrectItemIds: result.incorrect_item_ids.map(String),
    attemptIdsByItem: Object.fromEntries(
      Object.entries(result.attempt_ids_by_item as Record<string, unknown>).map(
        ([itemId, attemptId]) => [itemId, String(attemptId)],
      ),
    ),
  };
}

function storedPayload(result: LessonExitGateResult) {
  return {
    evaluated_at: result.evaluatedAt,
    passed: result.passed,
    correct_count: result.correctCount,
    scored_item_count: result.scoredItemCount,
    minimum_correct: result.minimumCorrect,
    required_correct_item_ids: result.requiredCorrectItemIds,
    failed_required_item_ids: result.failedRequiredItemIds,
    incorrect_item_ids: result.incorrectItemIds,
    attempt_ids_by_item: result.attemptIdsByItem,
  };
}

function expectedScoredItems(snapshot: LearnerLessonSnapshot): string[] {
  const itemIds = [
    ...(snapshot.allowedItemsByStage.recognition_check ?? []),
    ...(snapshot.allowedItemsByStage.controlled_formulas ?? []),
  ];
  if (new Set(itemIds).size !== itemIds.length) {
    throw new Error("Lesson UI exit gate scored item set contains duplicates");
  }
  return itemIds;
}

function computeResult(
  attempts: AttemptRow[],
  expectedItemIds: string[],
  now: string,
): LessonExitGateResult {
  const gate = getReviewedPhase1PilotContent().exitGate;
  if (expectedItemIds.length !== gate.scoredItemCount) {
    throw new Error("Lesson UI exit gate scored item count does not match reviewed Pilot");
  }

  const expected = new Set(expectedItemIds);
  const byItem = new Map<string, AttemptRow>();
  for (const attempt of attempts) {
    if (!expected.has(attempt.exercise_item_id)) {
      throw new Error(`Lesson UI exit gate received unexpected scored item: ${attempt.exercise_item_id}`);
    }
    if (byItem.has(attempt.exercise_item_id)) {
      throw new Error(`Lesson UI exit gate found duplicate primary attempts for ${attempt.exercise_item_id}`);
    }
    byItem.set(attempt.exercise_item_id, attempt);
  }

  const missing = expectedItemIds.filter((itemId) => !byItem.has(itemId));
  if (missing.length > 0) {
    throw new Error(`Lesson UI exit gate is not ready; missing scored attempts: ${missing.join(", ")}`);
  }

  const incorrectItemIds: string[] = [];
  const attemptIdsByItem: Record<string, string> = {};
  for (const itemId of expectedItemIds) {
    const attempt = byItem.get(itemId);
    if (!attempt) throw new Error(`Lesson UI exit gate missing expected attempt: ${itemId}`);
    const evaluation = asRecord(attempt.evaluation, `Lesson UI exit gate evaluation ${itemId}`);
    if (evaluation.isScored !== true || typeof evaluation.correct !== "boolean") {
      throw new Error(`Lesson UI exit gate attempt is not deterministic scored truth: ${itemId}`);
    }
    attemptIdsByItem[itemId] = attempt.id;
    if (!evaluation.correct) incorrectItemIds.push(itemId);
  }

  const correctCount = expectedItemIds.length - incorrectItemIds.length;
  const incorrect = new Set(incorrectItemIds);
  const failedRequiredItemIds = gate.requiredCorrectItemIds.filter((itemId) =>
    incorrect.has(itemId),
  );

  return {
    evaluatedAt: now,
    passed:
      correctCount >= gate.minimumCorrect && failedRequiredItemIds.length === 0,
    correctCount,
    scoredItemCount: gate.scoredItemCount,
    minimumCorrect: gate.minimumCorrect,
    requiredCorrectItemIds: [...gate.requiredCorrectItemIds],
    failedRequiredItemIds,
    incorrectItemIds,
    attemptIdsByItem,
  };
}

async function loadExistingResult(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<LessonExitGateResult | null> {
  const row = await client
    .from("lesson_instances")
    .select("state")
    .eq("id", lessonId)
    .eq("user_id", learnerId)
    .maybeSingle();
  fail(row.error, "Lesson UI read stored exit gate result");
  if (!row.data) return null;
  const state = asRecord(row.data.state, "Lesson UI exit gate state");
  return parseStoredResult(state.exit_gate_result);
}

async function persistResult(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
  result: LessonExitGateResult,
): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const row = await client
      .from("lesson_instances")
      .select("revision,state,status")
      .eq("id", lessonId)
      .eq("user_id", learnerId)
      .maybeSingle();
    fail(row.error, "Lesson UI read Lesson for exit gate persistence");
    if (!row.data) throw new Error("Lesson UI exit gate Lesson is missing");

    const state = asRecord(row.data.state, "Lesson UI exit gate persistence state");
    const currentStageId =
      typeof state.current_stage_id === "string" ? state.current_stage_id : null;
    const existing = parseStoredResult(state.exit_gate_result);
    if (existing && currentStageId !== "exit_check") return;
    if (currentStageId !== "exit_check") {
      throw new Error("Lesson UI exit gate can only persist while exit_check is current");
    }

    const revision = Number(row.data.revision ?? 0);
    const update = await client
      .from("lesson_instances")
      .update({
        state: { ...state, exit_gate_result: storedPayload(result) },
        revision: revision + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId)
      .eq("user_id", learnerId)
      .eq("revision", revision)
      .select("id")
      .maybeSingle();
    fail(update.error, "Lesson UI persist exit gate result");
    if (update.data) return;
  }
  throw new Error("Lesson UI exit gate persistence did not converge after retries");
}

export async function evaluateAndCheckpointExitGate(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
  now = new Date(),
): Promise<LessonExitGateEvaluation> {
  const runtime = await loadLearnerLessonRuntime(client, learnerId, lessonId);
  if (!runtime) throw new Error("Lesson UI cannot evaluate a missing Lesson Instance");

  const existing = await loadExistingResult(client, learnerId, lessonId);
  if (runtime.snapshot.currentStageId !== "exit_check") {
    if (!existing) {
      throw new Error("Lesson UI exit gate request is outside the exit_check stage");
    }
    return { result: existing, snapshot: runtime.snapshot };
  }

  const expectedItemIds = expectedScoredItems(runtime.snapshot);
  const attemptsResult = await client
    .from("exercise_attempts")
    .select("id,exercise_item_id,evaluation")
    .eq("user_id", learnerId)
    .eq("lesson_instance_id", lessonId)
    .eq("trusted", true)
    .eq("state_affecting", true)
    .in("exercise_item_id", expectedItemIds);
  fail(attemptsResult.error, "Lesson UI read scored attempts for exit gate");

  const result = computeResult(
    (attemptsResult.data ?? []) as AttemptRow[],
    expectedItemIds,
    now.toISOString(),
  );
  await persistResult(client, learnerId, lessonId, result);

  const resolver = new SupabaseLessonResolver(client);
  const checkpointed = await resolver.completeStage(learnerId, lessonId, "exit_check");
  return { result, snapshot: summarizeResolvedLesson(checkpointed) };
}

export async function loadLessonExitGateResult(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<LessonExitGateResult | null> {
  return loadExistingResult(client, learnerId, lessonId);
}
