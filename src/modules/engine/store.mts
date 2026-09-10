import type {
  ApplyReviewUpdateInput,
  ApplyReviewUpdateResult,
  EnsureReviewUnitInput,
  ReviewUnitRecord,
} from "./review-types.mts";
import type {
  AttemptRecord,
  EngineEvidence,
  EngineExerciseItem,
  EvidenceType,
  MasteryDerivation,
  MasteryStatus,
} from "./types.mts";

export interface EngineLessonRecord {
  id: string;
  userId: string;
  blueprintId: string;
  status: string;
  state: {
    allowed_items_by_stage?: Record<string, string[]>;
    [key: string]: unknown;
  };
}

export interface EngineNodeRecord {
  id: string;
  lifecycle: string;
  metadata: {
    required_evidence_types?: EvidenceType[];
    contextual?: boolean;
    [key: string]: unknown;
  };
}

export interface StoredExerciseRecord {
  id: string;
  lifecycle: string;
  trustClass: string;
  item: EngineExerciseItem;
}

export interface StoredNodeState {
  state: MasteryStatus;
  evidenceSummary: {
    highest_state_achieved?: Exclude<MasteryStatus, "lapsed">;
    review_status?: MasteryDerivation["reviewStatus"];
    [key: string]: unknown;
  };
}

export interface LearningEngineStore {
  getLesson(id: string): Promise<EngineLessonRecord | null>;
  getExerciseItem(id: string): Promise<StoredExerciseRecord | null>;
  getNode(id: string): Promise<EngineNodeRecord | null>;
  getAttemptBySubmissionKey(
    userId: string,
    submissionKey: string,
  ): Promise<AttemptRecord | null>;
  getFirstAttemptInGroup(
    userId: string,
    attemptGroupId: string,
  ): Promise<AttemptRecord | null>;
  getStateAffectingAttemptInGroup(
    userId: string,
    attemptGroupId: string,
  ): Promise<AttemptRecord | null>;
  insertAttempt(attempt: AttemptRecord): Promise<AttemptRecord>;
  insertEvidenceIfMissing(evidence: EngineEvidence): Promise<boolean>;
  listEvidenceForNode(userId: string, nodeId: string): Promise<EngineEvidence[]>;
  getNodeState(userId: string, nodeId: string): Promise<StoredNodeState | null>;
  upsertNodeState(
    userId: string,
    nodeId: string,
    derivation: MasteryDerivation,
    requiredEvidenceTypes: EvidenceType[],
  ): Promise<void>;
  ensureReviewUnit(input: EnsureReviewUnitInput): Promise<ReviewUnitRecord>;
  getReviewUnit(id: string): Promise<ReviewUnitRecord | null>;
  applyReviewUpdate(
    input: ApplyReviewUpdateInput,
  ): Promise<ApplyReviewUpdateResult>;
}
