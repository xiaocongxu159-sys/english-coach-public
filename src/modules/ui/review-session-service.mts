import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PHASE1_REVIEW_BLUEPRINT_ID,
  PHASE1_REVIEW_STAGE_ID,
} from "../engine/review-lesson-resolver.mts";
import type {
  EngineExerciseItem,
  EvidenceType,
  ReviewGrade,
  ReviewProductStatus,
} from "../engine/types.mts";

export interface ReviewInteractionCandidate {
  reviewUnitId: string;
  nodeId: string;
  evidenceType: EvidenceType;
  contentRef: string;
  actionable: boolean;
}

export interface ReviewLessonView {
  lessonId: string;
  status: "planned" | "in_progress" | "completed" | "abandoned";
  reviewUnitId: string;
  nodeId: string;
  nodeTitle: string;
  item: EngineExerciseItem;
  attemptId: string | null;
  dueAt: string | null;
  reviewStatus: ReviewProductStatus;
  lastGrade: ReviewGrade | null;
}

interface ParsedContentRef {
  itemId: string;
  version: number;
}

interface ExerciseItemRow {
  id: string;
  lifecycle: string;
  trust_class: string;
  item: EngineExerciseItem;
}

function fail(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context}: expected object`);
  }
  return value as Record<string, unknown>;
}

function parseContentRef(contentRef: string): ParsedContentRef | null {
  const match = contentRef.match(/^(.+)@v(\d+)$/u);
  if (!match) return null;
  const version = Number(match[2]);
  if (!Number.isInteger(version) || version < 1) return null;
  return { itemId: match[1], version };
}

function passesValidation(item: EngineExerciseItem): boolean {
  return (
    item.validation.schema_pass &&
    item.validation.scope_pass &&
    item.validation.answer_pass &&
    item.validation.ambiguity_pass &&
    item.validation.level_pass &&
    item.validation.independent_qa_pass
  );
}

function supportedItemFor(
  candidate: ReviewInteractionCandidate,
  row: ExerciseItemRow | undefined,
): EngineExerciseItem | null {
  if (!candidate.actionable || candidate.evidenceType !== "controlled_production") {
    return null;
  }
  const parsed = parseContentRef(candidate.contentRef);
  if (!parsed || !row || row.id !== parsed.itemId) return null;
  const item = row.item;
  if (
    row.lifecycle !== "active" ||
    row.trust_class !== "reviewed_core" ||
    item.id !== row.id ||
    item.version !== parsed.version ||
    item.status !== "active" ||
    item.provenance.content_class !== "reviewed_core" ||
    item.evidence_type !== candidate.evidenceType ||
    item.target_node_ids.length !== 1 ||
    item.target_node_ids[0] !== candidate.nodeId ||
    item.answer_spec.kind !== "deterministic" ||
    !item.state_effect_policy.may_change_mastery ||
    !item.state_effect_policy.may_update_review ||
    !passesValidation(item) ||
    !["short_answer", "multiple_choice_single"].includes(item.task_type)
  ) {
    return null;
  }
  return item;
}

export async function loadStartableReviewUnitIds(
  client: SupabaseClient,
  candidates: ReviewInteractionCandidate[],
): Promise<string[]> {
  const parsedByUnit = new Map<string, ParsedContentRef>();
  for (const candidate of candidates) {
    const parsed = parseContentRef(candidate.contentRef);
    if (parsed) parsedByUnit.set(candidate.reviewUnitId, parsed);
  }
  const itemIds = [...new Set([...parsedByUnit.values()].map((value) => value.itemId))];
  if (itemIds.length === 0) return [];

  const result = await client
    .from("exercise_items")
    .select("id,lifecycle,trust_class,item")
    .in("id", itemIds);
  fail(result.error, "Review UI read candidate exercise items");
  const rowById = new Map<string, ExerciseItemRow>(
    (result.data ?? []).map((row) => [
      String(row.id),
      {
        id: String(row.id),
        lifecycle: String(row.lifecycle),
        trust_class: String(row.trust_class),
        item: row.item as EngineExerciseItem,
      },
    ]),
  );

  return candidates
    .filter((candidate) => {
      const parsed = parsedByUnit.get(candidate.reviewUnitId);
      return Boolean(parsed && supportedItemFor(candidate, rowById.get(parsed.itemId)));
    })
    .map((candidate) => candidate.reviewUnitId);
}

export async function loadReviewLessonView(
  client: SupabaseClient,
  learnerId: string,
  lessonId: string,
): Promise<ReviewLessonView | null> {
  const lessonResult = await client
    .from("lesson_instances")
    .select("id,user_id,blueprint_id,status,state")
    .eq("id", lessonId)
    .eq("user_id", learnerId)
    .maybeSingle();
  fail(lessonResult.error, "Review UI read Review Lesson Instance");
  if (!lessonResult.data) return null;
  if (lessonResult.data.blueprint_id !== PHASE1_REVIEW_BLUEPRINT_ID) return null;

  const state = asRecord(lessonResult.data.state, "Review UI lesson state");
  const reviewUnitId = String(state.review_unit_id ?? "");
  const exerciseItemId = String(state.exercise_item_id ?? "");
  const submissionKey = String(state.review_submission_key ?? "");
  const allowed = asRecord(state.allowed_items_by_stage, "Review UI allowed-item map");
  const stageItems = Array.isArray(allowed[PHASE1_REVIEW_STAGE_ID])
    ? (allowed[PHASE1_REVIEW_STAGE_ID] as unknown[]).map(String)
    : [];
  if (
    !reviewUnitId ||
    !exerciseItemId ||
    !submissionKey ||
    stageItems.length !== 1 ||
    stageItems[0] !== exerciseItemId
  ) {
    throw new Error("Review UI persisted one-item lesson binding is invalid");
  }

  const [unitResult, itemResult, attemptResult] = await Promise.all([
    client
      .from("review_units")
      .select("id,user_id,node_id,evidence_type,content_ref,due_at,review_status,last_grade,lifecycle")
      .eq("id", reviewUnitId)
      .eq("user_id", learnerId)
      .maybeSingle(),
    client
      .from("exercise_items")
      .select("id,lifecycle,trust_class,item")
      .eq("id", exerciseItemId)
      .maybeSingle(),
    client
      .from("exercise_attempts")
      .select("id")
      .eq("user_id", learnerId)
      .eq("lesson_instance_id", lessonId)
      .eq("submission_key", submissionKey)
      .maybeSingle(),
  ]);
  fail(unitResult.error, "Review UI read bound Review Unit");
  fail(itemResult.error, "Review UI read bound exercise item");
  fail(attemptResult.error, "Review UI read bound review Attempt");
  if (!unitResult.data || !itemResult.data) {
    throw new Error("Review UI bound Review Unit or exercise item is missing");
  }

  const candidate: ReviewInteractionCandidate = {
    reviewUnitId,
    nodeId: String(unitResult.data.node_id),
    evidenceType: unitResult.data.evidence_type as EvidenceType,
    contentRef: String(unitResult.data.content_ref),
    actionable: true,
  };
  const row: ExerciseItemRow = {
    id: String(itemResult.data.id),
    lifecycle: String(itemResult.data.lifecycle),
    trust_class: String(itemResult.data.trust_class),
    item: itemResult.data.item as EngineExerciseItem,
  };
  const item = supportedItemFor(candidate, row);
  if (!item) {
    throw new Error("Review UI lesson content is outside the supported reviewed retrieval slice");
  }

  const nodeResult = await client
    .from("knowledge_nodes")
    .select("id,title")
    .eq("id", candidate.nodeId)
    .maybeSingle();
  fail(nodeResult.error, "Review UI read review node title");
  if (!nodeResult.data) throw new Error("Review UI review node is not learner-visible");

  return {
    lessonId: String(lessonResult.data.id),
    status: lessonResult.data.status as ReviewLessonView["status"],
    reviewUnitId,
    nodeId: candidate.nodeId,
    nodeTitle: String(nodeResult.data.title),
    item,
    attemptId: attemptResult.data ? String(attemptResult.data.id) : null,
    dueAt: unitResult.data.due_at,
    reviewStatus: unitResult.data.review_status as ReviewProductStatus,
    lastGrade: (unitResult.data.last_grade ?? null) as ReviewGrade | null,
  };
}
