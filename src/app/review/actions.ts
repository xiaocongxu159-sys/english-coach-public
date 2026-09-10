"use server";

import { redirect } from "next/navigation";
import type { ExerciseResponse } from "@/modules/engine/types.mts";
import {
  startAuthenticatedReviewUnit,
  submitAuthenticatedReviewAnswer,
} from "@/modules/ui/review-server";

function formValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function startReviewUnit(formData: FormData) {
  const reviewUnitId = formValue(formData, "reviewUnitId");
  if (!reviewUnitId) redirect("/review?notice=unavailable");

  let started: Awaited<ReturnType<typeof startAuthenticatedReviewUnit>>;
  try {
    started = await startAuthenticatedReviewUnit(reviewUnitId);
  } catch (error) {
    console.error("Unable to start authoritative review unit", error);
    redirect("/review?notice=unavailable");
  }
  if (!started) redirect("/login");
  redirect(`/review/${started.lessonId}`);
}

export async function submitReviewAnswer(formData: FormData) {
  const lessonId = formValue(formData, "lessonId");
  if (!lessonId) redirect("/review");

  const responseKind = formValue(formData, "responseKind");
  let response: ExerciseResponse;
  if (responseKind === "choice") {
    const selectedOptionId = formValue(formData, "selectedOptionId");
    if (!selectedOptionId) redirect(`/review/${lessonId}`);
    response = { kind: "choice", selectedOptionId };
  } else if (responseKind === "text") {
    const text = formValue(formData, "text");
    if (!text) redirect(`/review/${lessonId}`);
    response = { kind: "text", text };
  } else {
    redirect(`/review/${lessonId}`);
  }

  let result: Awaited<ReturnType<typeof submitAuthenticatedReviewAnswer>>;
  try {
    result = await submitAuthenticatedReviewAnswer(lessonId, response);
  } catch (error) {
    console.error("Unable to submit authoritative review answer", error);
    redirect(`/review/${lessonId}?notice=unavailable`);
  }
  if (!result) redirect("/login");
  redirect(`/review/${lessonId}?attempt=${result.attempt.id}`);
}
