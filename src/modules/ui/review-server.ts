import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { submitReviewAttempt } from "../engine/review-attempt-service.mts";
import {
  SupabaseReviewLessonResolver,
  PHASE1_REVIEW_BLUEPRINT_ID,
} from "../engine/review-lesson-resolver.mts";
import type { ExerciseResponse, SubmissionResult } from "../engine/types.mts";
import { loadLessonAttemptFeedback, type LessonAttemptFeedback } from "./lesson-exercise-view.mts";
import {
  loadReviewLessonView,
  type ReviewLessonView,
} from "./review-session-service.mts";

async function loadCurrentUser() {
  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) return null;
  return { sessionClient, user: data.user };
}

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context}: expected object`);
  }
  return value as Record<string, unknown>;
}

export async function startAuthenticatedReviewUnit(
  reviewUnitId: string,
): Promise<{ lessonId: string } | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;

  const admin = createAdminSupabaseClient();
  const lesson = await new SupabaseReviewLessonResolver(admin).resolve(
    authenticated.user.id,
    reviewUnitId,
  );
  return { lessonId: lesson.id };
}

export async function loadAuthenticatedReviewLesson(
  lessonId: string,
): Promise<ReviewLessonView | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;
  return loadReviewLessonView(
    authenticated.sessionClient,
    authenticated.user.id,
    lessonId,
  );
}

export async function loadAuthenticatedReviewAttemptFeedback(
  lessonId: string,
  attemptId: string,
): Promise<LessonAttemptFeedback | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;
  return loadLessonAttemptFeedback(
    authenticated.sessionClient,
    authenticated.user.id,
    lessonId,
    attemptId,
  );
}

export async function submitAuthenticatedReviewAnswer(
  lessonId: string,
  response: ExerciseResponse,
): Promise<SubmissionResult | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;

  // The browser provides only the learner-owned Lesson ID and raw answer. The
  // bound Review Unit is re-derived from authoritative persisted Lesson state.
  const admin = createAdminSupabaseClient();
  const lessonResult = await admin
    .from("lesson_instances")
    .select("id,user_id,blueprint_id,state")
    .eq("id", lessonId)
    .eq("user_id", authenticated.user.id)
    .maybeSingle();
  if (lessonResult.error) {
    throw new Error(`Review submit read lesson binding: ${lessonResult.error.message}`);
  }
  if (!lessonResult.data) throw new Error("Review submit lesson not found for learner");
  if (lessonResult.data.blueprint_id !== PHASE1_REVIEW_BLUEPRINT_ID) {
    throw new Error("Review submit lesson is not the reviewed Review Blueprint");
  }
  const state = asRecord(lessonResult.data.state, "Review submit lesson state");
  const reviewUnitId = String(state.review_unit_id ?? "");
  if (!reviewUnitId) throw new Error("Review submit lesson has no bound Review Unit");

  return submitReviewAttempt(admin, {
    userId: authenticated.user.id,
    lessonInstanceId: lessonId,
    reviewUnitId,
    response,
  });
}
