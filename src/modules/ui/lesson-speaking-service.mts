import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { submitExerciseAttempt } from "../engine/attempt-service.mts";
import { SupabaseLessonResolver } from "../engine/lesson-resolver.mts";
import { SupabaseLearningEngineStore } from "../engine/supabase-store.mts";
import type { SubmissionResult } from "../engine/types.mts";
import {
  loadLearnerLessonRuntime,
  type LearnerLessonRuntime,
} from "./lesson-service.mts";

const SPEAKING_STAGE_ID = "speaking_rehearsal";
const SPEAKING_ITEM_ID = "EI-A1-SOCIAL-SPEAK-001";

export interface SpeakingRehearsalResult {
  submission: SubmissionResult;
  runtime: LearnerLessonRuntime;
}

function digest(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function attemptGroupId(seed: string): string {
  const chars = digest(seed).slice(0, 32).split("");
  chars[12] = "5";
  chars[16] = ((Number.parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  const hex = chars.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function requireRuntime(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<LearnerLessonRuntime> {
  const runtime = await loadLearnerLessonRuntime(client, learnerId, lessonId);
  if (!runtime) throw new Error("Lesson UI cannot access the speaking Lesson Instance");
  return runtime;
}

function assertSpeakingRuntime(runtime: LearnerLessonRuntime): void {
  if (runtime.currentStage?.id !== SPEAKING_STAGE_ID) {
    throw new Error("Lesson UI speaking request is stale or outside speaking rehearsal");
  }
  if (
    runtime.currentItems.length !== 1 ||
    runtime.currentItems[0]?.id !== SPEAKING_ITEM_ID
  ) {
    throw new Error("Lesson UI speaking rehearsal reviewed item contract mismatch");
  }
  const item = runtime.currentItems[0].item;
  if (
    item.task_type !== "free_spoken" ||
    item.state_effect_policy.may_change_mastery ||
    item.state_effect_policy.may_update_review
  ) {
    throw new Error("Lesson UI speaking rehearsal is not frozen practice-only content");
  }
}

function assertStateNeutral(submission: SubmissionResult): void {
  if (
    submission.attempt.stateAffecting ||
    submission.attempt.evaluation.isScored ||
    submission.attempt.evaluation.trusted ||
    submission.emittedEvidence !== 0 ||
    submission.reviewUpdates.length !== 0
  ) {
    throw new Error("Lesson UI speaking rehearsal unexpectedly affected trusted learning state");
  }
}

export async function completeSpeakingRehearsal(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<SpeakingRehearsalResult> {
  const seed = `${learnerId}:${lessonId}:${SPEAKING_STAGE_ID}:${SPEAKING_ITEM_ID}:practice`;
  const submissionKey = `lesson-speaking-${digest(seed)}`;
  const groupId = attemptGroupId(seed);
  const store = new SupabaseLearningEngineStore(client);
  const existing = await store.getAttemptBySubmissionKey(learnerId, submissionKey);

  if (!existing) {
    const runtimeBefore = await requireRuntime(client, learnerId, lessonId);
    assertSpeakingRuntime(runtimeBefore);
  }

  const submission = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lessonId,
    exerciseItemId: SPEAKING_ITEM_ID,
    submissionKey,
    attemptGroupId: groupId,
    stageId: SPEAKING_STAGE_ID,
    response: { kind: "practice", completed: true },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assertStateNeutral(submission);

  const resolver = new SupabaseLessonResolver(client);
  await resolver.completeStage(learnerId, lessonId, SPEAKING_STAGE_ID);
  const runtime = await requireRuntime(client, learnerId, lessonId);
  return { submission, runtime };
}

export async function skipSpeakingRehearsal(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<LearnerLessonRuntime> {
  const runtimeBefore = await requireRuntime(client, learnerId, lessonId);
  assertSpeakingRuntime(runtimeBefore);
  const resolver = new SupabaseLessonResolver(client);
  await resolver.skipOptionalStage(learnerId, lessonId, SPEAKING_STAGE_ID);
  return requireRuntime(client, learnerId, lessonId);
}
