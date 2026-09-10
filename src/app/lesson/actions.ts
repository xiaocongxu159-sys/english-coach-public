"use server";

import { redirect } from "next/navigation";
import type { ExerciseResponse } from "@/modules/engine/types.mts";
import {
  advanceAuthenticatedCurrentInstructionStage,
  completeAuthenticatedLessonSummary,
  completeAuthenticatedSpeakingRehearsal,
  evaluateAuthenticatedExitGate,
  loadAuthenticatedLessonRuntime,
  skipAuthenticatedSpeakingRehearsal,
  startAuthenticatedTodayLesson,
  submitAuthenticatedCurrentDeterministicExercise,
} from "@/modules/ui/lesson-server";

function formValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function authorizedLessonId(formData: FormData): Promise<string> {
  const lessonId = formValue(formData, "lessonId");
  if (!lessonId) redirect("/");
  const authorized = await loadAuthenticatedLessonRuntime(lessonId);
  if (!authorized) redirect("/");
  return lessonId;
}

export async function startTodayLesson() {
  const lesson = await startAuthenticatedTodayLesson();
  if (!lesson) redirect("/login");
  redirect(`/lesson/${lesson.lesson.id}`);
}

export async function continueCurrentInstruction(formData: FormData) {
  const lessonId = await authorizedLessonId(formData);
  await advanceAuthenticatedCurrentInstructionStage(lessonId);
  redirect(`/lesson/${lessonId}`);
}

export async function submitDeterministicExercise(formData: FormData) {
  const lessonId = await authorizedLessonId(formData);
  const stageId = formValue(formData, "stageId");
  const itemId = formValue(formData, "itemId");
  const responseKind = formValue(formData, "responseKind");
  if (!stageId || !itemId) redirect(`/lesson/${lessonId}`);

  let response: ExerciseResponse;
  if (responseKind === "choice") {
    const selectedOptionId = formValue(formData, "selectedOptionId");
    if (!selectedOptionId) redirect(`/lesson/${lessonId}`);
    response = { kind: "choice", selectedOptionId };
  } else if (responseKind === "text") {
    const text = formValue(formData, "text");
    if (!text) redirect(`/lesson/${lessonId}`);
    response = { kind: "text", text };
  } else {
    redirect(`/lesson/${lessonId}`);
  }

  const result = await submitAuthenticatedCurrentDeterministicExercise(
    lessonId,
    stageId,
    itemId,
    response,
  );
  if (!result) redirect("/login");
  redirect(`/lesson/${lessonId}?attempt=${result.submission.attempt.id}`);
}

export async function completeSpeakingPractice(formData: FormData) {
  const lessonId = await authorizedLessonId(formData);
  const result = await completeAuthenticatedSpeakingRehearsal(lessonId);
  if (!result) redirect("/login");
  redirect(`/lesson/${lessonId}`);
}

export async function skipSpeakingPractice(formData: FormData) {
  const lessonId = await authorizedLessonId(formData);
  const result = await skipAuthenticatedSpeakingRehearsal(lessonId);
  if (!result) redirect("/login");
  redirect(`/lesson/${lessonId}`);
}

export async function runExitCheck(formData: FormData) {
  const lessonId = await authorizedLessonId(formData);
  const result = await evaluateAuthenticatedExitGate(lessonId);
  if (!result) redirect("/login");
  redirect(`/lesson/${lessonId}`);
}

export async function finishLesson(formData: FormData) {
  const lessonId = await authorizedLessonId(formData);
  const result = await completeAuthenticatedLessonSummary(lessonId);
  if (!result) redirect("/login");
  redirect(`/lesson/${lessonId}`);
}
