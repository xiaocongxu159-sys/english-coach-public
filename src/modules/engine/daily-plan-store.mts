import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyPlan } from "./planning-types.mts";

export interface StoredDailyPlan {
  id: string;
  userId: string;
  planDate: string;
  status: "planned" | "in_progress" | "completed" | "superseded";
  plan: DailyPlan;
  generatedAt: string;
  updatedAt: string;
}

export interface DailyPlanStore {
  getDailyPlan(userId: string, planDate: string): Promise<StoredDailyPlan | null>;
  upsertDailyPlan(plan: DailyPlan): Promise<StoredDailyPlan>;
}

function fail(error: { message: string; code?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function mapRow(row: Record<string, unknown>): StoredDailyPlan {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    planDate: row.plan_date as string,
    status: row.status as StoredDailyPlan["status"],
    plan: row.plan as DailyPlan,
    generatedAt: row.generated_at as string,
    updatedAt: row.updated_at as string,
  };
}

const DAILY_PLAN_SELECT =
  "id,user_id,plan_date,status,plan,generated_at,updated_at";

export class SupabaseDailyPlanStore implements DailyPlanStore {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getDailyPlan(userId: string, planDate: string): Promise<StoredDailyPlan | null> {
    const { data, error } = await this.client
      .from("daily_plans")
      .select(DAILY_PLAN_SELECT)
      .eq("user_id", userId)
      .eq("plan_date", planDate)
      .maybeSingle();
    fail(error, "read daily plan");
    return data ? mapRow(data) : null;
  }

  async upsertDailyPlan(plan: DailyPlan): Promise<StoredDailyPlan> {
    const existing = await this.getDailyPlan(plan.learner_id, plan.plan_date);
    const now = new Date().toISOString();

    if (existing) {
      if (existing.status !== "planned") return existing;

      const update = await this.client
        .from("daily_plans")
        .update({
          plan,
          generated_at: now,
          updated_at: now,
        })
        .eq("id", existing.id)
        .eq("user_id", plan.learner_id)
        .eq("status", "planned")
        .select(DAILY_PLAN_SELECT)
        .maybeSingle();
      fail(update.error, "refresh planned daily plan");
      if (update.data) return mapRow(update.data);

      const raced = await this.getDailyPlan(plan.learner_id, plan.plan_date);
      if (raced) return raced;
      throw new Error("refresh planned daily plan: row disappeared during conditional update");
    }

    const insert = await this.client
      .from("daily_plans")
      .insert({
        user_id: plan.learner_id,
        plan_date: plan.plan_date,
        status: "planned",
        plan,
        generated_at: now,
        updated_at: now,
      })
      .select(DAILY_PLAN_SELECT)
      .single();

    if (insert.error?.code === "23505") {
      const raced = await this.getDailyPlan(plan.learner_id, plan.plan_date);
      if (raced) return raced;
    }
    fail(insert.error, "create daily plan");
    if (!insert.data) throw new Error("create daily plan: database returned no row");
    return mapRow(insert.data);
  }

  async completeDailyPlan(
    userId: string,
    planId: string,
    completedAt = new Date().toISOString(),
  ): Promise<StoredDailyPlan> {
    const update = await this.client
      .from("daily_plans")
      .update({ status: "completed", updated_at: completedAt })
      .eq("id", planId)
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .select(DAILY_PLAN_SELECT)
      .maybeSingle();
    fail(update.error, "complete daily plan");
    if (update.data) return mapRow(update.data);

    const existing = await this.client
      .from("daily_plans")
      .select(DAILY_PLAN_SELECT)
      .eq("id", planId)
      .eq("user_id", userId)
      .maybeSingle();
    fail(existing.error, "read daily plan after completion race");
    if (!existing.data) {
      throw new Error("complete daily plan: referenced plan was not found");
    }

    const mapped = mapRow(existing.data);
    if (mapped.status === "completed") return mapped;
    throw new Error(
      `complete daily plan: expected in_progress or completed, received ${mapped.status}`,
    );
  }
}

export async function persistDailyPlan(
  store: DailyPlanStore,
  plan: DailyPlan,
): Promise<StoredDailyPlan> {
  return store.upsertDailyPlan(plan);
}
