import type { SupabaseClient } from "@supabase/supabase-js";
import { submitExerciseAttempt } from "./attempt-service.mts";
import { SupabaseLessonResolver } from "./lesson-resolver.mts";
import {
  PHASE1_REVIEW_BLUEPRINT_ID,
  PHASE1_REVIEW_STAGE_ID,
} from "./review-lesson-resolver.mts";
import { SupabaseLearningEngineStore } from "./supabase-store.mts";
import type {
  AssistanceLevel,
  ExerciseResponse,
  SubmissionResult,
} from "./types.mts";

export interface SubmitReviewAttemptInput {
  userId: string;
  lessonInstanceId: string;
  reviewUnitId: string;
  response: ExerciseResponse;
  assistance?: AssistanceLevel;
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

export async function submitReviewAttempt(
  client: SupabaseClient,
  input: SubmitReviewAttemptInput,
): Promise<SubmissionResult> {
  const lessonResult = await client
    .from("lesson_instances")
    .select("id,user_id,blueprint_id,status,state")
    .eq("id", input.lessonInstanceId)
    .eq("user_id", input.userId)
    .maybeSingle();
  fail(lessonResult.error, "review attempt: read Review Lesson Instance");
  if (!lessonResult.data) {
    throw new Error("review attempt: Review Lesson Instance not found for learner");
  }
  if (lessonResult.data.blueprint_id !== PHASE1_REVIEW_BLUEPRINT_ID) {
    throw new Error("review attempt: lesson is not the reviewed Review Blueprint");
  }

  const state = asRecord(lessonResult.data.state, "review attempt lesson state");
  if (state.review_unit_id !== input.reviewUnitId) {
    throw new Error("review attempt: Review Unit binding mismatch");
  }
  const exerciseItemId = String(state.exercise_item_id ?? "");
  const attemptGroupId = String(state.review_attempt_group_id ?? "");
  const submissionKey = String(state.review_submission_key ?? "");
  const boundReviewRevision = Number(state.review_unit_revision);
  const allowed = asRecord(
    state.allowed_items_by_stage,
    "review attempt allowed-item map",
  );
  const stageItems = Array.isArray(allowed[PHASE1_REVIEW_STAGE_ID])
    ? (allowed[PHASE1_REVIEW_STAGE_ID] as unknown[]).map(String)
    : [];
  if (
    !exerciseItemId ||
    !attemptGroupId ||
    !submissionKey ||
    !Number.isInteger(boundReviewRevision) ||
    boundReviewRevision < 0 ||
    stageItems.length !== 1 ||
    stageItems[0] !== exerciseItemId
  ) {
    throw new Error("review attempt: persisted one-item authorization contract is invalid");
  }

  const store = new SupabaseLearningEngineStore(client);
  const existingAttempt = await store.getAttemptBySubmissionKey(
    input.userId,
    submissionKey,
  );
  if (!existingAttempt) {
    const unitResult = await client
      .from("review_units")
      .select("id,user_id,lifecycle,revision")
      .eq("id", input.reviewUnitId)
      .eq("user_id", input.userId)
      .maybeSingle();
    fail(unitResult.error, "review attempt: revalidate bound Review Unit");
    if (unitResult.data?.lifecycle !== "active") {
      throw new Error("review attempt: bound Review Unit is no longer active");
    }
    if (Number(unitResult.data.revision) !== boundReviewRevision) {
      throw new Error(
        "review attempt: stale Review Lesson; Review Unit revision has already advanced",
      );
    }
  }

  const result = await submitExerciseAttempt(store, {
    userId: input.userId,
    lessonInstanceId: input.lessonInstanceId,
    exerciseItemId,
    submissionKey,
    attemptGroupId,
    stageId: PHASE1_REVIEW_STAGE_ID,
    response: input.response,
    assistance: input.assistance ?? "independent",
    scenarioTag: "everyday_social",
  });

  if (!result.reviewCandidate) {
    throw new Error("review attempt: reviewed retrieval did not remain Review-eligible");
  }
  if (
    result.reviewUpdates.length !== 1 ||
    result.reviewUpdates[0].reviewUnitId !== input.reviewUnitId
  ) {
    throw new Error(
      "review attempt: state-changing result must update exactly the bound Review Unit",
    );
  }

  await new SupabaseLessonResolver(client).completeStage(
    input.userId,
    input.lessonInstanceId,
    PHASE1_REVIEW_STAGE_ID,
  );
  return result;
}
