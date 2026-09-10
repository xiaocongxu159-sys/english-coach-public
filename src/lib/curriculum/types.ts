export type CefrLevel = "A1" | "A2" | "B1" | "B2";

export type KnowledgeDomain =
  | "grammar"
  | "communicative_function"
  | "vocabulary"
  | "pronunciation"
  | "listening"
  | "speaking"
  | "reading"
  | "writing";

export type KnowledgeNodeLifecycle =
  | "draft"
  | "reviewed"
  | "active"
  | "deprecated";

export interface CanonicalKnowledgeNode {
  id: string;
  cefrLevel: CefrLevel;
  domain: KnowledgeDomain;
  title: string;
  hardPrerequisites: string[];
  outcome: string | null;
  lifecycle: KnowledgeNodeLifecycle;
  source: {
    document: string;
    section: string | null;
  };
}

export interface CurriculumRegistry {
  schemaVersion: 1;
  curriculumVersion: "phase0-freeze-v1";
  generatedFrom: string[];
  expectedCounts: {
    total: 735;
    byLevel: Record<CefrLevel, number>;
  };
  nodes: CanonicalKnowledgeNode[];
}
