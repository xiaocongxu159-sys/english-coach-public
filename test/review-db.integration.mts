import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { submitExerciseAttempt } from "../src/modules/engine/attempt-service.mts";
import { SupabaseLearningEngineStore } from "../src/modules/engine/supabase-store.mts";

const url =
  process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error("Review DB integration requires local Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const store = new SupabaseLearningEngineStore(admin);
const suffix = randomUUID().slice(0, 8);
const password = `Review-${randomUUID()}-aA1!`;
let learnerId: string | undefined;
let otherLearnerId: string | undefined;

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

async function createLesson(userId: string): Promise<string> {
  const { data, error } = await admin
    .from("lesson_instances")
    .insert({
      user_id: userId,
      blueprint_id: "LESB-A1-SOCIAL-FORMULAS-01",
      status: "in_progress",
      started_at: new Date().toISOString(),
      state: {
        review_engine_test: true,
        allowed_items_by_stage: allowedItemsByStage,
      },
    })
    .select("id")
    .single();
  assert.equal(error, null, error?.message);
  return data.id;
}

async function signedInClient(email: string) {
  const client = createClient(url as string, anonKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert.equal(error, null, error?.message);
  assert.ok(data.session?.access_token);
  return client;
}

try {
  const email = `review-${suffix}@example.test`;
  const otherEmail = `review-other-${suffix}@example.test`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, created.error?.message);
  learnerId = created.data.user.id;

  const other = await admin.auth.admin.createUser({
    email: otherEmail,
    password,
    email_confirm: true,
  });
  assert.equal(other.error, null, other.error?.message);
  otherLearnerId = other.data.user.id;

  const lesson = await createLesson(learnerId);
  const firstInput = {
    userId: learnerId,
    lessonInstanceId: lesson,
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-001",
    submissionKey: `review-${suffix}-first`,
    attemptGroupId: randomUUID(),
    stageId: "controlled_formulas",
    response: { kind: "text" as const, text: "Hello" },
    assistance: "independent" as const,
    scenarioTag: "everyday_social",
  };

  const first = await submitExerciseAttempt(store, firstInput);
  assert.equal(first.reviewCandidate, true);
  assert.equal(first.reviewUpdates.length, 2);
  assert.ok(first.reviewUpdates.every((update) => update.applied));
  assert.ok(first.reviewUpdates.every((update) => update.grade === "Easy"));

  const firstUnits = await admin
    .from("review_units")
    .select(
      "id,user_id,node_id,evidence_type,content_ref,lifecycle,scheduler,algorithm_version,library_version,parameters_version,scheduler_state,due_at,review_status,revision,last_review_at,last_grade",
    )
    .eq("user_id", learnerId)
    .eq("content_ref", "EI-A1-SOCIAL-CONTROLLED-001@v1");
  assert.equal(firstUnits.error, null, firstUnits.error?.message);
  assert.equal(firstUnits.data.length, 2);
  for (const unit of firstUnits.data) {
    assert.equal(unit.lifecycle, "active");
    assert.equal(unit.scheduler, "fsrs");
    assert.equal(unit.algorithm_version, "FSRS-6");
    assert.equal(unit.library_version, "5.4.2");
    assert.equal(unit.parameters_version, "review-v1-default");
    assert.equal(unit.revision, 1);
    assert.equal(unit.last_grade, "Easy");
    assert.ok(unit.scheduler_state);
    assert.equal(unit.scheduler_state.reps, 1);
    assert.ok(unit.due_at);
    assert.ok(unit.last_review_at);
  }

  const firstEvents = await admin
    .from("review_events")
    .select(
      "review_unit_id,attempt_id,attempt_group_id,grade,before_state,after_state,occurred_at,scheduler_reviewed_at,library_version",
    )
    .eq("user_id", learnerId)
    .eq("attempt_id", first.attempt.id);
  assert.equal(firstEvents.error, null, firstEvents.error?.message);
  assert.equal(firstEvents.data.length, 2);
  for (const event of firstEvents.data) {
    assert.equal(event.grade, "Easy");
    assert.equal(event.before_state, null);
    assert.equal(event.library_version, "5.4.2");
    assert.ok(event.after_state);
    assert.ok(Date.parse(event.scheduler_reviewed_at) >= Date.parse(event.occurred_at));
  }

  const replay = await submitExerciseAttempt(store, firstInput);
  assert.equal(replay.replayed, true);
  assert.equal(replay.reviewUpdates.length, 2);
  assert.ok(replay.reviewUpdates.every((update) => update.replayed));
  assert.ok(replay.reviewUpdates.every((update) => !update.applied));

  const eventsAfterReplay = await admin
    .from("review_events")
    .select("id", { count: "exact" })
    .eq("user_id", learnerId)
    .eq("attempt_id", first.attempt.id);
  assert.equal(eventsAfterReplay.error, null, eventsAfterReplay.error?.message);
  assert.equal(eventsAfterReplay.count, 2);

  const unitsAfterReplay = await admin
    .from("review_units")
    .select("revision")
    .eq("user_id", learnerId)
    .eq("content_ref", "EI-A1-SOCIAL-CONTROLLED-001@v1");
  assert.equal(unitsAfterReplay.error, null, unitsAfterReplay.error?.message);
  assert.ok(unitsAfterReplay.data.every((unit) => unit.revision === 1));

  const prompted = await submitExerciseAttempt(store, {
    ...firstInput,
    submissionKey: `review-${suffix}-minor-prompt`,
    attemptGroupId: randomUUID(),
    assistance: "minor_prompt",
  });
  assert.equal(prompted.reviewUpdates.length, 2);
  assert.ok(prompted.reviewUpdates.every((update) => update.grade === "Hard"));
  assert.ok(prompted.reviewUpdates.every((update) => update.applied));

  const promptedUnits = await admin
    .from("review_units")
    .select("revision,last_grade")
    .eq("user_id", learnerId)
    .eq("content_ref", "EI-A1-SOCIAL-CONTROLLED-001@v1");
  assert.equal(promptedUnits.error, null, promptedUnits.error?.message);
  assert.ok(promptedUnits.data.every((unit) => unit.revision === 2));
  assert.ok(promptedUnits.data.every((unit) => unit.last_grade === "Hard"));

  const recognition = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lesson,
    exerciseItemId: "EI-A1-SOCIAL-RECOGNITION-001",
    submissionKey: `review-${suffix}-recognition`,
    attemptGroupId: randomUUID(),
    stageId: "recognition_check",
    response: { kind: "choice", selectedOptionId: "A" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(recognition.reviewUpdates.length, 2);
  const multiModal = await admin
    .from("review_units")
    .select("node_id,evidence_type,content_ref")
    .eq("user_id", learnerId)
    .eq("node_id", "VX-A1-SOCIAL-FORMULAS-01");
  assert.equal(multiModal.error, null, multiModal.error?.message);
  assert.ok(
    multiModal.data.some(
      (unit) =>
        unit.evidence_type === "controlled_production" &&
        unit.content_ref === "EI-A1-SOCIAL-CONTROLLED-001@v1",
    ),
  );
  assert.ok(
    multiModal.data.some(
      (unit) =>
        unit.evidence_type === "recognition" &&
        unit.content_ref === "EI-A1-SOCIAL-RECOGNITION-001@v1",
    ),
  );

  const concurrentItem = "EI-A1-SOCIAL-CONTROLLED-002";
  const concurrent = await Promise.all([
    submitExerciseAttempt(store, {
      userId: learnerId,
      lessonInstanceId: lesson,
      exerciseItemId: concurrentItem,
      submissionKey: `review-${suffix}-concurrent-a`,
      attemptGroupId: randomUUID(),
      stageId: "controlled_formulas",
      response: { kind: "text", text: "Thank you" },
      assistance: "independent",
      scenarioTag: "everyday_social",
    }),
    submitExerciseAttempt(store, {
      userId: learnerId,
      lessonInstanceId: lesson,
      exerciseItemId: concurrentItem,
      submissionKey: `review-${suffix}-concurrent-b`,
      attemptGroupId: randomUUID(),
      stageId: "controlled_formulas",
      response: { kind: "text", text: "Thank you" },
      assistance: "independent",
      scenarioTag: "everyday_social",
    }),
  ]);
  assert.ok(concurrent.every((result) => result.reviewUpdates.length === 1));
  assert.ok(
    concurrent.every((result) => result.reviewUpdates[0].applied),
    "both distinct attempt groups must eventually apply after CAS convergence",
  );

  const concurrentUnit = await admin
    .from("review_units")
    .select("id,revision,scheduler_state,last_review_at")
    .eq("user_id", learnerId)
    .eq("node_id", "VX-A1-SOCIAL-FORMULAS-01")
    .eq("content_ref", `${concurrentItem}@v1`)
    .single();
  assert.equal(concurrentUnit.error, null, concurrentUnit.error?.message);
  assert.equal(concurrentUnit.data.revision, 2);
  assert.equal(concurrentUnit.data.scheduler_state.reps, 2);

  const concurrentEvents = await admin
    .from("review_events")
    .select("occurred_at,scheduler_reviewed_at")
    .eq("review_unit_id", concurrentUnit.data.id)
    .order("scheduler_reviewed_at", { ascending: true });
  assert.equal(concurrentEvents.error, null, concurrentEvents.error?.message);
  assert.equal(concurrentEvents.data.length, 2);
  assert.ok(
    Date.parse(concurrentEvents.data[1].scheduler_reviewed_at) >
      Date.parse(concurrentEvents.data[0].scheduler_reviewed_at),
    "FSRS review times must remain strictly monotonic after concurrent CAS retries",
  );
  assert.ok(
    concurrentEvents.data.every(
      (event) => Date.parse(event.scheduler_reviewed_at) >= Date.parse(event.occurred_at),
    ),
  );

  const spoken = await submitExerciseAttempt(store, {
    userId: learnerId,
    lessonInstanceId: lesson,
    exerciseItemId: "EI-A1-SOCIAL-SPEAK-001",
    submissionKey: `review-${suffix}-spoken-practice`,
    attemptGroupId: randomUUID(),
    stageId: "speaking_rehearsal",
    response: { kind: "practice", completed: true },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });
  assert.equal(spoken.reviewCandidate, false);
  assert.equal(spoken.reviewUpdates.length, 0);

  const otherLesson = await createLesson(otherLearnerId);
  await submitExerciseAttempt(store, {
    userId: otherLearnerId,
    lessonInstanceId: otherLesson,
    exerciseItemId: "EI-A1-SOCIAL-CONTROLLED-003",
    submissionKey: `review-${suffix}-other`,
    attemptGroupId: randomUUID(),
    stageId: "controlled_formulas",
    response: { kind: "text", text: "Sorry" },
    assistance: "independent",
    scenarioTag: "everyday_social",
  });

  const client = await signedInClient(email);
  const ownUnits = await client.from("review_units").select("user_id");
  assert.equal(ownUnits.error, null, ownUnits.error?.message);
  assert.ok(ownUnits.data.length > 0);
  assert.ok(ownUnits.data.every((row) => row.user_id === learnerId));

  const ownEvents = await client.from("review_events").select("user_id");
  assert.equal(ownEvents.error, null, ownEvents.error?.message);
  assert.ok(ownEvents.data.length > 0);
  assert.ok(ownEvents.data.every((row) => row.user_id === learnerId));

  const forgedUnit = await client.from("review_units").insert({
    user_id: learnerId,
    node_id: "VX-A1-SOCIAL-FORMULAS-01",
    review_type: "lexical_retrieval",
    evidence_type: "controlled_production",
    content_ref: `forged-${suffix}`,
    sibling_group_id: `forged-${suffix}`,
    algorithm_version: "FSRS-6",
    library_name: "ts-fsrs",
    library_version: "5.4.2",
    parameters_version: "review-v1-default",
  });
  assert.ok(forgedUnit.error, "browser learner must not create authoritative Review Units");

  const forgedEvent = await client.from("review_events").insert({
    user_id: learnerId,
    review_unit_id: firstUnits.data[0].id,
    attempt_id: first.attempt.id,
    attempt_group_id: randomUUID(),
    grade: "Easy",
    after_state: {},
    due_at: new Date().toISOString(),
    review_status: "not_due",
    algorithm_version: "FSRS-6",
    library_version: "5.4.2",
    parameters_version: "review-v1-default",
    occurred_at: new Date().toISOString(),
    scheduler_reviewed_at: new Date().toISOString(),
  });
  assert.ok(forgedEvent.error, "browser learner must not forge Review Events");

  console.log(
    "Review DB integration passed: FSRS units activate from trusted attempts, same-submission replay is exactly-once, prompted grades are capped, one node can own multiple review modalities, concurrent distinct groups converge through revision CAS with monotonic scheduler time, practice-only speech remains state-neutral, and Review RLS blocks cross-user/forged state.",
  );
} finally {
  if (learnerId) await admin.auth.admin.deleteUser(learnerId);
  if (otherLearnerId) await admin.auth.admin.deleteUser(otherLearnerId);
}
