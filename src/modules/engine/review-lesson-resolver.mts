import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reviewStatusAt } from "./review-adapter.mts";
import { getReviewConfig } from "./review-config.mts";
import type { EvidenceType, MasteryStatus } from "./types.mts";

export const PHASE1_REVIEW_BLUEPRINT_ID = "LESB-A1-SOCIAL-FORMULAS-02";
export const PHASE1_REVIEW_STAGE_ID = "review_retrieval";

export interface ResolvedReviewLesson {
  id: string;
  userId: string;
  blueprintId: string;
  resolutionKey: string;
  revision: number;
  status: "planned" | "in_progress" | "completed" | "abandoned";
  state: Record<string, unknown>;
  startedAt: string | null;
  completedAt: string | null;
  reviewUnitId: string;
  exerciseItemId: string;
  attemptGroupId: string;
  submissionKey: string;
}

interface ReviewUnitRow {
  id: string;
  user_id: string;
  node_id: string;
  evidence_type: EvidenceType;
  content_ref: string;
  content_version: number | null;
  due_at: string | null;
  lifecycle: "active" | "inactive" | "suspended" | "retired";
  revision: number;
}

const LESSON_SELECT =
  "id,user_id,blueprint_id,resolution_key,revision,status,state,started_at,completed_at";

function fail(error: { message: string; code?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context}: expected object`);
  }
  return value as Record<string, unknown>;
}

function parseContentRef(contentRef: string): { itemId: string; version: number } {
  const match = contentRef.match(/^(.+)@v(\d+)$/u);
  if (!match) throw new Error(`review resolver: unsupported content_ref ${contentRef}`);
  const version = Number(match[2]);
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`review resolver: invalid content version in ${contentRef}`);
  }
  return { itemId: match[1], version };
}

function mapLesson(row: Record<string, unknown>): ResolvedReviewLesson {
  const state = asRecord(row.state ?? {}, "review lesson state");
  const reviewUnitId = String(state.review_unit_id ?? "");
  const exerciseItemId = String(state.exercise_item_id ?? "");
  const attemptGroupId = String(state.review_attempt_group_id ?? "");
  const submissionKey = String(state.review_submission_key ?? "");
  if (!reviewUnitId || !exerciseItemId || !attemptGroupId || !submissionKey) {
    throw new Error("review resolver: persisted lesson is missing review binding state");
  }
  return {
    id: row.id as string,
    userId: row.user_id as string,
    blueprintId: row.blueprint_id as string,
    resolutionKey: row.resolution_key as string,
    revision: Number(row.revision ?? 0),
    status: row.status as ResolvedReviewLesson["status"],
    state,
    startedAt: typeof row.started_at === "string" ? row.started_at : null,
    completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
    reviewUnitId,
    exerciseItemId,
    attemptGroupId,
    submissionKey,
  };
}

function validateBlueprint(value: unknown): void {
  const blueprint = asRecord(value, "review resolver blueprint");
  if (
    blueprint.id !== PHASE1_REVIEW_BLUEPRINT_ID ||
    blueprint.status !== "active" ||
    blueprint.level !== "A1" ||
    blueprint.lesson_type !== "review"
  ) {
    throw new Error("review resolver: reviewed Review Blueprint identity/type mismatch");
  }
  const selection = asRecord(
    blueprint.node_selection,
    "review resolver blueprint node selection",
  );
  const primaryCount = asRecord(
    selection.primary_count,
    "review resolver blueprint primary count",
  );
  if (
    primaryCount.min !== 0 ||
    primaryCount.max !== 0 ||
    selection.support_count_max !== 0 ||
    selection.review_count_max !== 1
  ) {
    throw new Error("review resolver: Review Blueprint node-selection boundary changed");
  }
  const stages = Array.isArray(blueprint.stages) ? blueprint.stages : [];
  if (stages.length !== 1) {
    throw new Error("review resolver: Review Blueprint must have exactly one stage");
  }
  const stage = asRecord(stages[0], "review resolver blueprint stage");
  const evidenceTypes = Array.isArray(stage.evidence_types)
    ? stage.evidence_types.map(String)
    : [];
  if (
    stage.key !== PHASE1_REVIEW_STAGE_ID ||
    stage.kind !== "review_retrieval" ||
    stage.required !== true ||
    stage.target_role !== "review" ||
    stage.ai_content_mode !== "reviewed_only" ||
    evidenceTypes.length !== 1 ||
    evidenceTypes[0] !== "controlled_production"
  ) {
    throw new Error("review resolver: Review Blueprint stage contract changed");
  }
}

function validateItem(
  row: Record<string, unknown>,
  unit: ReviewUnitRow,
  itemVersion: number,
): void {
  if (row.lifecycle !== "active" || row.trust_class !== "reviewed_core") {
    throw new Error("review resolver: content item is not active reviewed core");
  }
  const item = asRecord(row.item, "review resolver exercise item");
  const targets = Array.isArray(item.target_node_ids)
    ? item.target_node_ids.map(String)
    : [];
  const answerSpec = asRecord(item.answer_spec, "review resolver item answer spec");
  const policy = asRecord(
    item.state_effect_policy,
    "review resolver item state-effect policy",
  );
  if (Number(item.version) !== itemVersion) {
    throw new Error("review resolver: content version mismatch");
  }
  if (
    targets.length !== 1 ||
    targets[0] !== unit.node_id ||
    item.evidence_type !== unit.evidence_type
  ) {
    throw new Error(
      "review resolver: Phase 1 only permits single-target content that exactly matches the Review Unit",
    );
  }
  if (
    unit.evidence_type !== "controlled_production" ||
    answerSpec.kind !== "deterministic" ||
    policy.may_change_mastery !== true ||
    policy.may_update_review !== true
  ) {
    throw new Error(
      "review resolver: Review Unit content is outside the deterministic controlled-production slice",
    );
  }
}

export class SupabaseReviewLessonResolver {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getExisting(
    userId: string,
    resolutionKey: string,
  ): Promise<ResolvedReviewLesson | null> {
    const { data, error } = await this.client
      .from("lesson_instances")
      .select(LESSON_SELECT)
      .eq("user_id", userId)
      .eq("resolution_key", resolutionKey)
      .neq("status", "abandoned")
      .maybeSingle();
    fail(error, "review resolver: read existing review lesson");
    return data ? mapLesson(data as Record<string, unknown>) : null;
  }

  async resolve(
    userId: string,
    reviewUnitId: string,
    now = new Date(),
  ): Promise<ResolvedReviewLesson> {
    if (Number.isNaN(now.getTime())) {
      throw new Error("review resolver: current time is invalid");
    }

    const unitResult = await this.client
      .from("review_units")
      .select(
        "id,user_id,node_id,evidence_type,content_ref,content_version,due_at,lifecycle,revision",
      )
      .eq("id", reviewUnitId)
      .eq("user_id", userId)
      .maybeSingle();
    fail(unitResult.error, "review resolver: read learner Review Unit");
    if (!unitResult.data) {
      throw new Error("review resolver: Review Unit not found for learner");
    }
    const unit = unitResult.data as ReviewUnitRow;
    if (unit.lifecycle !== "active") {
      throw new Error("review resolver: Review Unit is not active");
    }

    const stateResult = await this.client
      .from("learner_node_state")
      .select("mastery_status")
      .eq("user_id", userId)
      .eq("node_id", unit.node_id)
      .maybeSingle();
    fail(stateResult.error, "review resolver: read learner Mastery state");
    if (!stateResult.data) {
      throw new Error("review resolver: Review Unit has no authoritative Mastery state");
    }
    const masteryStatus = stateResult.data.mastery_status as MasteryStatus;
    const status = reviewStatusAt(
      unit.due_at,
      masteryStatus,
      now,
      getReviewConfig().status_rules.overdue_after_hours,
    );
    if (status !== "due" && status !== "overdue" && status !== "relearning") {
      throw new Error(`review resolver: Review Unit is not actionable (${status})`);
    }

    const parsed = parseContentRef(unit.content_ref);
    if (unit.content_version !== null && unit.content_version !== parsed.version) {
      throw new Error("review resolver: Review Unit content version does not match content_ref");
    }
    const resolutionKey = `review:${unit.id}:revision:${unit.revision}`;
    const existing = await this.getExisting(userId, resolutionKey);
    if (existing) return existing;

    const [blueprintResult, itemResult] = await Promise.all([
      this.client
        .from("lesson_blueprints")
        .select("id,lifecycle,blueprint")
        .eq("id", PHASE1_REVIEW_BLUEPRINT_ID)
        .eq("lifecycle", "active")
        .maybeSingle(),
      this.client
        .from("exercise_items")
        .select("id,lifecycle,trust_class,item")
        .eq("id", parsed.itemId)
        .maybeSingle(),
    ]);
    fail(blueprintResult.error, "review resolver: read Review Blueprint");
    fail(itemResult.error, "review resolver: read Review Unit content item");
    if (!blueprintResult.data) {
      throw new Error("review resolver: active reviewed Review Blueprint is missing");
    }
    if (!itemResult.data) {
      throw new Error("review resolver: Review Unit content item is missing");
    }
    validateBlueprint(blueprintResult.data.blueprint);
    validateItem(itemResult.data as Record<string, unknown>, unit, parsed.version);

    const createdAt = now.toISOString();
    const attemptGroupId = randomUUID();
    const submissionKey = `review-${randomUUID()}`;
    const state = {
      instance: {
        id: `lesson-${randomUUID()}`,
        blueprint_id: PHASE1_REVIEW_BLUEPRINT_ID,
        learner_id: userId,
        created_at: createdAt,
        scheduled_for: createdAt.slice(0, 10),
        level: "A1",
        lesson_type: "review",
        primary_nodes: [],
        support_nodes: [],
        review_nodes: [unit.node_id],
        resolved_stages: [
          {
            stage_id: PHASE1_REVIEW_STAGE_ID,
            kind: "review_retrieval",
            status: "pending",
            target_nodes: [unit.node_id],
            content_refs: [parsed.itemId],
            evidence_plan: [unit.evidence_type],
          },
        ],
        runtime_context: {
          recent_error_categories: [],
          scenario_tags: ["everyday_social"],
          language_support_mode: "adaptive_bilingual",
          difficulty_band: "on_level",
        },
        completion: {
          status: "in_progress",
          completed_stage_ids: [],
          evidence_event_ids: [],
          summary_ref: null,
        },
      },
      review_unit_id: unit.id,
      review_unit_revision: unit.revision,
      exercise_item_id: parsed.itemId,
      exercise_item_version: parsed.version,
      review_attempt_group_id: attemptGroupId,
      review_submission_key: submissionKey,
      allowed_items_by_stage: {
        [PHASE1_REVIEW_STAGE_ID]: [parsed.itemId],
      },
      stage_required: { [PHASE1_REVIEW_STAGE_ID]: true },
      current_stage_id: PHASE1_REVIEW_STAGE_ID,
      resume_policy: {
        checkpoint_after_each_stage: true,
        preserve_attempts: true,
      },
    };

    const insert = await this.client
      .from("lesson_instances")
      .insert({
        user_id: userId,
        blueprint_id: PHASE1_REVIEW_BLUEPRINT_ID,
        resolution_key: resolutionKey,
        status: "in_progress",
        state,
        started_at: createdAt,
      })
      .select(LESSON_SELECT)
      .single();

    if (insert.error?.code === "23505") {
      const raced = await this.getExisting(userId, resolutionKey);
      if (raced) return raced;
    }
    fail(insert.error, "review resolver: create Review Lesson Instance");
    if (!insert.data) {
      throw new Error("review resolver: database returned no Review Lesson Instance");
    }
    return mapLesson(insert.data as Record<string, unknown>);
  }
}
