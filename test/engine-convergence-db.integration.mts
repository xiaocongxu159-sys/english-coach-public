import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { submitExerciseAttempt } from "../src/modules/engine/attempt-service.mts";
import { SupabaseLearningEngineStore } from "../src/modules/engine/supabase-store.mts";

const url =
  process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Engine convergence integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const store = new SupabaseLearningEngineStore(admin);
const suffix = randomUUID().slice(0, 8);
const password = `Engine-Converge-${randomUUID()}-aA1!`;
let cleanupUserId: string | undefined;

const allowedItemsByStage: Record<string, string[]> = {
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

async function createLesson(ownerId: string): Promise<string> {
  const { data, error } = await admin
    .from("lesson_instances")
    .insert({
      user_id: ownerId,
      blueprint_id: "LESB-A1-SOCIAL-FORMULAS-01",
      status: "in_progress",
      started_at: new Date().toISOString(),
      state: {
        engine_convergence_test: true,
        allowed_items_by_stage: allowedItemsByStage,
      },
    })
    .select("id")
    .single();
  assert.equal(error, null, error?.message);
  return data.id;
}

try {
  const created = await admin.auth.admin.createUser({
    email: `engine-converge-${suffix}@example.test`,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  const learnerId = created.data.user.id;
  cleanupUserId = learnerId;

  const lesson1 = await createLesson(learnerId);
  const controlled = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lesson1,
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-001",
    submissionKey: `engine-${suffix}-seed-controlled`,
    attemptGroupId: randomUUID(),
    stageId: "controlled_formulas",
    response: { kind: "text", text: "Hello" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(controlled.emittedEvidence, 2);
  assert.equal(
    controlled.mastery["VX-A1-SOCIAL-FORMULAS-01"].state,
    "developing",
  );

  const lesson2 = await createLesson(learnerId);
  const concurrent = await Promise.all([
    submitExerciseAttempt(store, {
      userId: learnerId,
      lessonInstanceId: lesson2,
      exerciseItemId: "EI-A1-SOCIAL-RECOGNITION-001",
      submissionKey: `engine-${suffix}-recognition-a`,
      attemptGroupId: randomUUID(),
      stageId: "recognition_check",
      response: { kind: "choice", selectedOptionId: "A" },
      assistance: "independent",
      scenarioTag: "everyday_social",
    }),
    submitExerciseAttempt(store, {
      userId: learnerId,
      lessonInstanceId: lesson2,
      exerciseItemId: "EI-A1-SOCIAL-RECOGNITION-005",
      submissionKey: `engine-${suffix}-recognition-b`,
      attemptGroupId: randomUUID(),
      stageId: "recognition_check",
      response: { kind: "choice", selectedOptionId: "A" },
      assistance: "independent",
      scenarioTag: "everyday_social",
    }),
  ]);

  assert.equal(
    concurrent.reduce((total, result) => total + result.emittedEvidence, 0),
    4,
    "two independent groups should each emit evidence for both target nodes",
  );

  const finalState = await admin
    .from("learner_node_state")
    .select("mastery_status,evidence_summary,last_evidence_at")
    .eq("user_id", learnerId)
    .eq("node_id", "VX-A1-SOCIAL-FORMULAS-01")
    .single();
  assert.equal(finalState.error, null, finalState.error?.message);
  assert.equal(
    finalState.data.mastery_status,
    "functional",
    "a stale two-event derivation must never overwrite the three-event functional state",
  );
  assert.equal(finalState.data.evidence_summary.summary.scored_events, 3);
  assert.equal(finalState.data.evidence_summary.summary.distinct_sessions, 2);

  const evidence = await admin
    .from("mastery_evidence")
    .select("id")
    .eq("user_id", learnerId)
    .eq("node_id", "VX-A1-SOCIAL-FORMULAS-01");
  assert.equal(evidence.error, null, evidence.error?.message);
  assert.equal(evidence.data.length, 3);

  console.log(
    "Engine convergence integration passed: different attempt groups may update the same node concurrently without allowing a stale smaller evidence snapshot to overwrite the richer Mastery state.",
  );
} finally {
  if (cleanupUserId) await admin.auth.admin.deleteUser(cleanupUserId);
}
