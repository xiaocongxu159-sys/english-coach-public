import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseLessonResolver } from "../engine/lesson-resolver.mts";
import { loadLessonExitGateResult } from "./lesson-exit-service.mts";
import {
  loadLearnerLessonRuntime,
  summarizeResolvedLesson,
  type LearnerLessonSnapshot,
} from "./lesson-service.mts";

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
    return runtime.snapshot;
  }
  if (runtime.snapshot.currentStageId !== "lesson_summary") {
    throw new Error("Lesson UI can only finish from the lesson_summary stage");
  }

  const resolver = new SupabaseLessonResolver(client);
  return summarizeResolvedLesson(
    await resolver.completeStage(learnerId, lessonId, "lesson_summary"),
  );
}
