import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  loadReviewQueueSnapshot,
  type ReviewQueueSnapshot,
} from "./review-queue-service.mts";
import { loadStartableReviewUnitIds } from "./review-session-service.mts";
import { validateTodayProfile } from "./today-planning.mts";

export interface AuthenticatedReviewQueueSnapshot {
  email: string | null;
  timezone: string;
  snapshot: ReviewQueueSnapshot;
  startableReviewUnitIds: string[];
}

export async function loadAuthenticatedReviewQueueSnapshot(): Promise<AuthenticatedReviewQueueSnapshot | null> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  const profileResult = await client
    .from("learner_profiles")
    .select("timezone,daily_minutes")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (profileResult.error) {
    throw new Error(`Review queue read learner profile: ${profileResult.error.message}`);
  }
  if (!profileResult.data) {
    throw new Error("Review queue learner profile not found");
  }

  const profile = validateTodayProfile({
    timezone: String(profileResult.data.timezone),
    dailyMinutes: Number(profileResult.data.daily_minutes),
  });
  const snapshot = await loadReviewQueueSnapshot(client, data.user.id);
  const startableReviewUnitIds = await loadStartableReviewUnitIds(client, snapshot.items);

  return {
    email: data.user.email ?? null,
    timezone: profile.timezone,
    snapshot,
    startableReviewUnitIds,
  };
}
