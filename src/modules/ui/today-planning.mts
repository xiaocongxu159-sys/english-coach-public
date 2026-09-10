import type { PlanningReviewCandidate } from "../engine/planning-types.mts";
import type { PlanningCurriculumNode } from "../engine/planning-service.mts";
import type { MasteryStatus } from "../engine/types.mts";

export const TODAY_REVIEW_UNIT_ESTIMATED_MINUTES = 1;

const VALID_MASTERY = new Set<MasteryStatus>([
  "unseen",
  "introduced",
  "developing",
  "functional",
  "secure",
  "lapsed",
]);

export interface TodayProfileInput {
  timezone: string;
  dailyMinutes: number;
}

export interface TodayNodeRow {
  id: string;
  lifecycle: "draft" | "reviewed" | "active" | "deprecated";
}

export interface TodayNodeStateRow {
  node_id: string;
  mastery_status: string;
}

export interface TodayReviewUnitRow {
  id: string;
  node_id: string;
  due_at: string | null;
  lifecycle: "inactive" | "active" | "suspended" | "retired";
}

export interface TodayClearanceRow {
  node_id: string;
  status: "cleared" | "revoked";
}

export function resolvePlanDate(now: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  if (!parts.year || !parts.month || !parts.day) {
    throw new Error("Today planning could not resolve learner-local date");
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function validateTodayProfile(profile: TodayProfileInput): TodayProfileInput {
  if (
    !Number.isInteger(profile.dailyMinutes) ||
    profile.dailyMinutes < 10 ||
    profile.dailyMinutes > 120
  ) {
    throw new Error(
      "Today planning requires learner daily_minutes to be an integer from 10 to 120",
    );
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: profile.timezone }).format(new Date(0));
  } catch {
    throw new Error(
      `Today planning received an invalid learner timezone: ${profile.timezone}`,
    );
  }
  return profile;
}

export function masteryMapFromRows(
  rows: readonly TodayNodeStateRow[],
): Map<string, MasteryStatus> {
  const result = new Map<string, MasteryStatus>();
  for (const row of rows) {
    if (!VALID_MASTERY.has(row.mastery_status as MasteryStatus)) {
      throw new Error(`Today planning received invalid mastery state for ${row.node_id}`);
    }
    result.set(row.node_id, row.mastery_status as MasteryStatus);
  }
  return result;
}

export function clearedNodeIdsFromRows(
  rows: readonly TodayClearanceRow[],
): Set<string> {
  return new Set(
    rows.filter((row) => row.status === "cleared").map((row) => row.node_id),
  );
}

export function planningNodesFromRows(
  rows: readonly TodayNodeRow[],
  masteryByNodeId: ReadonlyMap<string, MasteryStatus>,
  reviewedContentAvailable: boolean,
): PlanningCurriculumNode[] {
  return rows.map((row) => ({
    id: row.id,
    lifecycle: row.lifecycle,
    masteryStatus: masteryByNodeId.get(row.id) ?? "unseen",
    reviewedContentAvailable,
    applicationCapable: reviewedContentAvailable,
    recentPracticeAt: null,
  }));
}

export function reviewCandidatesFromRows(
  rows: readonly TodayReviewUnitRow[],
  masteryByNodeId: ReadonlyMap<string, MasteryStatus>,
): PlanningReviewCandidate[] {
  return rows.map((row) => ({
    id: row.id,
    nodeId: row.node_id,
    dueAt: row.due_at,
    lifecycle: row.lifecycle,
    estimatedMinutes: TODAY_REVIEW_UNIT_ESTIMATED_MINUTES,
    masteryStatus: masteryByNodeId.get(row.node_id),
  }));
}
