import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getOrCreateTodaySnapshot,
  type TodaySnapshot,
} from "./today-service.mts";

export interface AuthenticatedTodaySnapshot {
  email: string | null;
  snapshot: TodaySnapshot;
}

export async function loadAuthenticatedTodaySnapshot(): Promise<AuthenticatedTodaySnapshot | null> {
  const sessionClient = await createServerSupabaseClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) return null;

  // Service-role access is created only after Supabase has validated the current
  // user. The browser never receives or chooses the learner ID used below.
  const admin = createAdminSupabaseClient();
  const snapshot = await getOrCreateTodaySnapshot(admin, data.user.id);

  return {
    email: data.user.email ?? null,
    snapshot,
  };
}
