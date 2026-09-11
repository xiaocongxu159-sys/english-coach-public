import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseDailyPlanStore,
  type StoredDailyPlan,
} from "../engine/daily-plan-store.mts";
import {
  PHASE1_PILOT_BLUEPRINT_ID,
  PHASE1_PILOT_PRIMARY_NODE_IDS,
  isExactPhase1PilotNodeSet,
} from "../engine/pilot-policy.mts";
import { buildLearnerDailyPlan } from "../engine/planning-service.mts";
import {
  loadReviewQueueSnapshot,
  type ReviewQueueSnapshot,
} from "./review-queue-service.mts";
import {
  clearedNodeIdsFromRows,
  masteryMapFromRows,
  planningNodesFromRows,
  resolvePlanDate,
  reviewCandidatesFromRows,
  validateTodayProfile,
  type TodayClearanceRow,
  type TodayNodeRow,
  type TodayNodeStateRow,
  type TodayReviewUnitRow,
} from "./today-planning.mts";

export interface TodaySnapshot {
  learnerId: string;
  displayName: string | null;
  timezone: string;
  planDate: string;
  lessonTitle: string;
  storedPlan: StoredDailyPlan;
  liveReview: ReviewQueueSnapshot;
}

function fail(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function reconcileCompletedPhase1Plan(
  client: SupabaseClient,
  store: SupabaseDailyPlanStore,
  learnerId: string,
  storedPlan: StoredDailyPlan,
): Promise<StoredDailyPlan> {
  if (storedPlan.status !== "in_progress") return storedPlan;

  // P1 has exactly one reviewed two-node Lesson Request. A completed Lesson is
  // therefore sufficient to close that day's frozen plan. Future multi-request
  // plan completion must define its own aggregate completion rule.
  if (
    storedPlan.plan.lesson_requests.length !== 1 ||
    !isExactPhase1PilotNodeSet(storedPlan.plan.selected.new_node_ids)
  ) {
    return storedPlan;
  }

  const resolutionKey = `${storedPlan.plan.id}:request:0`;
  const lessonResult = await client
    .from("lesson_instances")
    .select("status,completed_at")
    .eq("user_id", learnerId)
    .eq("resolution_key", resolutionKey)
    .neq("status", "abandoned")
    .maybeSingle();
  fail(lessonResult.error, "Today reconcile completed Pilot lesson");
  if (lessonResult.data?.status !== "completed") return storedPlan;

  return store.completeDailyPlan(
    learnerId,
    storedPlan.id,
    lessonResult.data.completed_at ?? new Date().toISOString(),
  );
}

async function buildTodaySnapshot(input: {
  client: SupabaseClient;
  learnerId: string;
  displayName: string | null;
  timezone: string;
  planDate: string;
  lessonTitle: string;
  storedPlan: StoredDailyPlan;
  now: Date;
}): Promise<TodaySnapshot> {
  // Daily Plan is intentionally frozen once it starts. Review state is not.
  // Read the authoritative queue separately on every Today request so a later
  // Review can be reflected without silently replacing the persisted plan.
  const liveReview = await loadReviewQueueSnapshot(
    input.client,
    input.learnerId,
    input.now,
  );
  return {
    learnerId: input.learnerId,
    displayName: input.displayName,
    timezone: input.timezone,
    planDate: input.planDate,
    lessonTitle: input.lessonTitle,
    storedPlan: input.storedPlan,
    liveReview,
  };
}

export async function getOrCreateTodaySnapshot(
  client: SupabaseClient,
  learnerId: string,
  now = new Date(),
): Promise<TodaySnapshot> {
  const profileResult = await client
    .from("learner_profiles")
    .select("user_id,display_name,timezone,daily_minutes")
    .eq("user_id", learnerId)
    .maybeSingle();
  fail(profileResult.error, "Today read learner profile");
  if (!profileResult.data) throw new Error("Today learner profile not found");

  const profile = validateTodayProfile({
    timezone: String(profileResult.data.timezone),
    dailyMinutes: Number(profileResult.data.daily_minutes),
  });
  const displayName =
    typeof profileResult.data.display_name === "string"
      ? profileResult.data.display_name
      : null;
  const planDate = resolvePlanDate(now, profile.timezone);
  const planStore = new SupabaseDailyPlanStore(client);
  const existingPlan = await planStore.getDailyPlan(learnerId, planDate);

  const blueprintResult = await client
    .from("lesson_blueprints")
    .select("id,title,lifecycle")
    .eq("id", PHASE1_PILOT_BLUEPRINT_ID)
    .maybeSingle();
  fail(blueprintResult.error, "Today read reviewed Pilot blueprint");
  if (!blueprintResult.data) {
    throw new Error("Today reviewed Pilot blueprint is missing");
  }
  const lessonTitle = String(blueprintResult.data.title);

  if (
    existingPlan &&
    (existingPlan.status === "in_progress" || existingPlan.status === "completed")
  ) {
    const reconciledPlan = await reconcileCompletedPhase1Plan(
      client,
      planStore,
      learnerId,
      existingPlan,
    );
    return buildTodaySnapshot({
      client,
      learnerId,
      displayName,
      timezone: profile.timezone,
      planDate,
      lessonTitle,
      storedPlan: reconciledPlan,
      now,
    });
  }

  const pilotNodeIds = [...PHASE1_PILOT_PRIMARY_NODE_IDS];
  const [nodeResult, stateResult, prerequisiteResult, clearanceResult, reviewResult] =
    await Promise.all([
      client
        .from("knowledge_nodes")
        .select("id,lifecycle")
        .in("id", pilotNodeIds),
      client
        .from("learner_node_state")
        .select("node_id,mastery_status")
        .eq("user_id", learnerId)
        .in("node_id", pilotNodeIds),
      client
        .from("knowledge_prerequisites")
        .select("node_id,prerequisite_node_id,prerequisite_type")
        .in("node_id", pilotNodeIds),
      client
        .from("curriculum_clearance")
        .select("node_id,status")
        .eq("user_id", learnerId),
      client
        .from("review_units")
        .select("id,node_id,due_at,lifecycle")
        .eq("user_id", learnerId)
        .eq("lifecycle", "active")
        .in("node_id", pilotNodeIds),
    ]);

  fail(nodeResult.error, "Today read Pilot nodes");
  fail(stateResult.error, "Today read learner Mastery state");
  fail(prerequisiteResult.error, "Today read Pilot prerequisites");
  fail(clearanceResult.error, "Today read learner Curriculum Clearance");
  fail(reviewResult.error, "Today read learner Review Units");

  const nodeRows = (nodeResult.data ?? []) as TodayNodeRow[];
  if (
    !isExactPhase1PilotNodeSet(nodeRows.map((row) => row.id)) ||
    nodeRows.some((row) => row.lifecycle !== "active")
  ) {
    throw new Error("Today requires the exact learner-active reviewed Pilot node set");
  }
  if (blueprintResult.data.lifecycle !== "active") {
    throw new Error("Today reviewed Pilot blueprint is not learner-active");
  }

  const masteryByNodeId = masteryMapFromRows(
    (stateResult.data ?? []) as TodayNodeStateRow[],
  );
  const clearedNodeIds = clearedNodeIdsFromRows(
    (clearanceResult.data ?? []) as TodayClearanceRow[],
  );
  const curriculumNodes = planningNodesFromRows(nodeRows, masteryByNodeId, true);
  const reviewCandidates = reviewCandidatesFromRows(
    (reviewResult.data ?? []) as TodayReviewUnitRow[],
    masteryByNodeId,
  );
  const prerequisites = (prerequisiteResult.data ?? []).map((row) => ({
    nodeId: String(row.node_id),
    prerequisiteNodeId: String(row.prerequisite_node_id),
    prerequisiteType: row.prerequisite_type as "hard" | "soft",
  }));

  const plan = buildLearnerDailyPlan({
    learnerId,
    planDate,
    now: now.toISOString(),
    timeBudgetMinutes: profile.dailyMinutes,
    reviewCandidates,
    curriculumNodes,
    prerequisites,
    learnerCurriculumState: {
      masteryByNodeId,
      clearedNodeIds,
    },
    skillDeficits: [],
    voiceAvailable: false,
  });
  const storedPlan = await planStore.upsertDailyPlan(plan);

  return buildTodaySnapshot({
    client,
    learnerId,
    displayName,
    timezone: profile.timezone,
    planDate,
    lessonTitle,
    storedPlan,
    now,
  });
}
