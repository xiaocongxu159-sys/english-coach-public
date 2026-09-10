import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ExerciseResponse } from "../engine/types.mts";
import {
  evaluateAndCheckpointExitGate,
  loadLessonExitGateResult,
  type LessonExitGateEvaluation,
  type LessonExitGateResult,
} from "./lesson-exit-service.mts";
import {
  submitCurrentDeterministicExercise,
  type DeterministicExerciseSubmission,
} from "./lesson-exercise-service.mts";
import {
  loadDeterministicExerciseProgress,
  loadLessonAttemptFeedback,
  type DeterministicExerciseProgress,
  type LessonAttemptFeedback,
} from "./lesson-exercise-view.mts";
import {
  advanceCurrentInstructionStage,
  loadLearnerLessonRuntime,
  startOrResumeTodayLesson,
  type LearnerLessonRuntime,
  type LearnerLessonSnapshot,
} from "./lesson-service.mts";
import {
  completeSpeakingRehearsal,
  skipSpeakingRehearsal,
  type SpeakingRehearsalResult,
} from "./lesson-speaking-service.mts";
import { completeLessonSummary } from "./lesson-summary-service.mts";

export interface AuthenticatedLessonRuntime {
  email: string | null;
  runtime: LearnerLessonRuntime;
  exerciseProgress: DeterministicExerciseProgress | null;
  exitGateResult: LessonExitGateResult | null;
}

async function loadCurrentUser() {
  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) return null;
  return { sessionClient, user: data.user };
}

export async function startAuthenticatedTodayLesson(): Promise<LearnerLessonSnapshot | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;

  // Writes stay server-owned. The learner ID is taken only from the validated
  // Supabase user, never from browser input.
  const admin = createAdminSupabaseClient();
  return startOrResumeTodayLesson(admin, authenticated.user.id);
}

export async function loadAuthenticatedLessonRuntime(
  lessonId: string,
): Promise<AuthenticatedLessonRuntime | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;

  // Reads use the authenticated session client so existing learner RLS remains
  // part of the request path. A tampered lessonId cannot reveal another learner's lesson.
  const runtime = await loadLearnerLessonRuntime(
    authenticated.sessionClient,
    authenticated.user.id,
    lessonId,
  );
  if (!runtime) return null;
  const [exerciseProgress, exitGateResult] = await Promise.all([
    loadDeterministicExerciseProgress(
      authenticated.sessionClient,
      authenticated.user.id,
      runtime,
    ),
    loadLessonExitGateResult(
      authenticated.sessionClient,
      authenticated.user.id,
      lessonId,
    ),
  ]);

  return {
    email: authenticated.user.email ?? null,
    runtime,
    exerciseProgress,
    exitGateResult,
  };
}

export async function loadAuthenticatedLessonAttemptFeedback(
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

export async function advanceAuthenticatedCurrentInstructionStage(
  lessonId: string,
): Promise<LearnerLessonSnapshot | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;

  // The browser supplies only the Lesson ID. The current stage is reloaded and
  // derived on the server before the authoritative Resolver checkpoint runs.
  const admin = createAdminSupabaseClient();
  return advanceCurrentInstructionStage(admin, authenticated.user.id, lessonId);
}

export async function submitAuthenticatedCurrentDeterministicExercise(
  lessonId: string,
  expectedStageId: string,
  expectedItemId: string,
  response: ExerciseResponse,
): Promise<DeterministicExerciseSubmission | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;

  // The stage/item values are only stale-request guards. The service reloads
  // the authoritative Lesson and derives the actual next reviewed item before
  // accepting a new Attempt. All state-changing writes stay service-role-only.
  const admin = createAdminSupabaseClient();
  return submitCurrentDeterministicExercise(
    admin,
    authenticated.user.id,
    lessonId,
    expectedStageId,
    expectedItemId,
    response,
  );
}

export async function completeAuthenticatedSpeakingRehearsal(
  lessonId: string,
): Promise<SpeakingRehearsalResult | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;
  const admin = createAdminSupabaseClient();
  return completeSpeakingRehearsal(admin, authenticated.user.id, lessonId);
}

export async function skipAuthenticatedSpeakingRehearsal(
  lessonId: string,
): Promise<LearnerLessonRuntime | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;
  const admin = createAdminSupabaseClient();
  return skipSpeakingRehearsal(admin, authenticated.user.id, lessonId);
}

export async function evaluateAuthenticatedExitGate(
  lessonId: string,
): Promise<LessonExitGateEvaluation | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;

  // The result is derived only from persisted trusted deterministic Attempts.
  // No browser-provided score, correctness count, or gate outcome is accepted.
  const admin = createAdminSupabaseClient();
  return evaluateAndCheckpointExitGate(admin, authenticated.user.id, lessonId);
}

export async function completeAuthenticatedLessonSummary(
  lessonId: string,
): Promise<LearnerLessonSnapshot | null> {
  const authenticated = await loadCurrentUser();
  if (!authenticated) return null;

  // Lesson completion is a lesson-state transition only. Mastery remains wholly
  // derived from trusted Evidence and is never promoted by this UI action.
  const admin = createAdminSupabaseClient();
  return completeLessonSummary(admin, authenticated.user.id, lessonId);
}
