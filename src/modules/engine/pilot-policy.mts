export const PHASE1_PILOT_BLUEPRINT_ID = "LESB-A1-SOCIAL-FORMULAS-01";

export const PHASE1_PILOT_PRIMARY_NODE_IDS = [
  "CF-A1-SOCIAL-GREET-01",
  "VX-A1-SOCIAL-FORMULAS-01",
] as const;

export const PHASE1_PILOT_DURATION_MINUTES = {
  min: 10,
  target: 14,
  max: 18,
} as const;

export const PHASE1_PILOT_ALLOWED_ITEMS_BY_STAGE: Readonly<Record<string, readonly string[]>> = {
  recognition_check: [
    "EI-A1-SOCIAL-RECOGNITION-001",
    "EI-A1-SOCIAL-RECOGNITION-002",
    "EI-A1-SOCIAL-RECOGNITION-003",
    "EI-A1-SOCIAL-RECOGNITION-004",
    "EI-A1-SOCIAL-RECOGNITION-005",
  ],
  controlled_formulas: [
    "EI-A1-SOCIAL-CONTROLLED-001",
    "EI-A1-SOCIAL-CONTROLLED-002",
    "EI-A1-SOCIAL-CONTROLLED-003",
    "EI-A1-SOCIAL-CONTROLLED-004",
    "EI-A1-SOCIAL-CONTROLLED-005",
  ],
  speaking_rehearsal: ["EI-A1-SOCIAL-SPEAK-001"],
};

export const PHASE1_PILOT_RESUME_POLICY = {
  checkpointAfterEachStage: true,
  preserveAttempts: true,
} as const;

export function isExactPhase1PilotNodeSet(nodeIds: readonly string[]): boolean {
  const actual = [...new Set(nodeIds)].sort();
  const expected = [...PHASE1_PILOT_PRIMARY_NODE_IDS].sort();
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

export function isPhase1PilotNode(nodeId: string): boolean {
  return PHASE1_PILOT_PRIMARY_NODE_IDS.includes(
    nodeId as (typeof PHASE1_PILOT_PRIMARY_NODE_IDS)[number],
  );
}