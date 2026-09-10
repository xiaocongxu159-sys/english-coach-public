import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  console.error(
    "Database integration test requires SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anonymous = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const suffix = randomUUID().slice(0, 8);
const password = `Test-${randomUUID()}-aA1!`;
const emailA = `p1db-a-${suffix}@example.test`;
const emailB = `p1db-b-${suffix}@example.test`;
const curriculumVersionId = `p1-db-test-${suffix}`;
const nodeId = `GR-A1-SENT-WORDORDER-${suffix.toUpperCase()}`;
const draftNodeId = `GR-A1-DRAFT-HIDDEN-${suffix.toUpperCase()}`;
const blueprintId = `LESSON-A1-DB-${suffix.toUpperCase()}`;
const templateId = `TPL-A1-DB-${suffix.toUpperCase()}`;
const itemId = `ITEM-A1-DB-${suffix.toUpperCase()}`;
let userAId;
let userBId;

function mustNoError(error, context) {
  assert.equal(error, null, `${context}: ${error?.message ?? "unknown error"}`);
}

async function signedInClient(email) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  mustNoError(error, `sign in ${email}`);
  assert.ok(data.user?.id, `missing signed-in user for ${email}`);
  assert.ok(data.session?.access_token, `missing session for ${email}`);
  return client;
}

try {
  const createA = await admin.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Learner A" },
  });
  mustNoError(createA.error, "create user A");
  userAId = createA.data.user.id;

  const createB = await admin.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Learner B" },
  });
  mustNoError(createB.error, "create user B");
  userBId = createB.data.user.id;

  const contentInsert = await admin.from("curriculum_versions").insert({
    id: curriculumVersionId,
    status: "active",
  });
  mustNoError(contentInsert.error, "insert curriculum version");

  mustNoError(
    (
      await admin.from("knowledge_nodes").insert({
        id: nodeId,
        curriculum_version_id: curriculumVersionId,
        cefr_level: "A1",
        domain: "grammar",
        title: "RLS test node",
        lifecycle: "active",
      })
    ).error,
    "insert active test knowledge node",
  );

  mustNoError(
    (
      await admin.from("knowledge_nodes").insert({
        id: draftNodeId,
        curriculum_version_id: curriculumVersionId,
        cefr_level: "A1",
        domain: "grammar",
        title: "Draft node must stay hidden",
        lifecycle: "draft",
      })
    ).error,
    "insert draft test knowledge node",
  );

  mustNoError(
    (
      await admin.from("lesson_blueprints").insert({
        id: blueprintId,
        curriculum_version_id: curriculumVersionId,
        title: "RLS test lesson",
        cefr_level: "A1",
        lifecycle: "active",
        blueprint: { test: true },
      })
    ).error,
    "insert test lesson blueprint",
  );

  mustNoError(
    (
      await admin.from("exercise_templates").insert({
        id: templateId,
        curriculum_version_id: curriculumVersionId,
        lifecycle: "active",
        template: { test: true },
      })
    ).error,
    "insert test exercise template",
  );

  mustNoError(
    (
      await admin.from("exercise_items").insert({
        id: itemId,
        template_id: templateId,
        lifecycle: "active",
        trust_class: "reviewed_core",
        item: { test: true },
      })
    ).error,
    "insert test exercise item",
  );

  const clientA = await signedInClient(emailA);
  const clientB = await signedInClient(emailB);

  const currentA = await clientA.auth.getUser();
  mustNoError(currentA.error, "get current user A");
  assert.equal(currentA.data.user.id, userAId, "session should resolve user A");

  const profileA = await clientA.from("learner_profiles").select("user_id, display_name");
  mustNoError(profileA.error, "read own profile A");
  assert.deepEqual(profileA.data.map((row) => row.user_id), [userAId]);
  assert.equal(profileA.data[0].display_name, "Learner A");

  const profileB = await clientB.from("learner_profiles").select("user_id");
  mustNoError(profileB.error, "read own profile B");
  assert.deepEqual(profileB.data.map((row) => row.user_id), [userBId]);

  const updateOwn = await clientA
    .from("learner_profiles")
    .update({ daily_minutes: 40 })
    .eq("user_id", userAId)
    .select("daily_minutes");
  mustNoError(updateOwn.error, "update own profile A");
  assert.equal(updateOwn.data[0].daily_minutes, 40);

  const updateOther = await clientA
    .from("learner_profiles")
    .update({ daily_minutes: 99 })
    .eq("user_id", userBId)
    .select("user_id");
  mustNoError(updateOther.error, "attempt update other profile is filtered by RLS");
  assert.equal(updateOther.data.length, 0, "user A must not update user B profile");

  const anonRead = await anonymous.from("knowledge_nodes").select("id").eq("id", nodeId);
  assert.ok(anonRead.error, "signed-out role must not read curriculum tables");

  const sharedRead = await clientA.from("knowledge_nodes").select("id").eq("id", nodeId);
  mustNoError(sharedRead.error, "authenticated active curriculum read");
  assert.deepEqual(sharedRead.data.map((row) => row.id), [nodeId]);

  const hiddenDraftRead = await clientA
    .from("knowledge_nodes")
    .select("id")
    .eq("id", draftNodeId);
  mustNoError(hiddenDraftRead.error, "authenticated draft curriculum query");
  assert.equal(
    hiddenDraftRead.data.length,
    0,
    "authenticated learners must not see draft curriculum rows",
  );

  const forbiddenSharedWrite = await clientA.from("knowledge_nodes").insert({
    id: `GR-A1-FORBIDDEN-${suffix.toUpperCase()}`,
    curriculum_version_id: curriculumVersionId,
    cefr_level: "A1",
    domain: "grammar",
    title: "must not be created",
  });
  assert.ok(forbiddenSharedWrite.error, "learner must not mutate curriculum structure");

  const forbiddenEvidenceWrite = await clientA.from("mastery_evidence").insert({
    user_id: userAId,
    node_id: nodeId,
    evidence_type: "recognition",
    result: { score: 1 },
    trusted: true,
  });
  assert.ok(
    forbiddenEvidenceWrite.error,
    "browser-authenticated learner must not self-award mastery evidence",
  );

  mustNoError(
    (
      await admin.from("learner_node_state").insert([
        { user_id: userAId, node_id: nodeId, mastery_status: "developing" },
        { user_id: userBId, node_id: nodeId, mastery_status: "secure" },
      ])
    ).error,
    "insert authoritative learner states",
  );

  mustNoError(
    (
      await admin.from("daily_plans").insert([
        { user_id: userAId, plan_date: "2026-09-01", plan: { owner: "A" } },
        { user_id: userBId, plan_date: "2026-09-01", plan: { owner: "B" } },
      ])
    ).error,
    "insert authoritative daily plans",
  );

  const stateSeenByA = await clientA
    .from("learner_node_state")
    .select("user_id, mastery_status");
  mustNoError(stateSeenByA.error, "read learner state A");
  assert.deepEqual(stateSeenByA.data, [
    { user_id: userAId, mastery_status: "developing" },
  ]);

  const planSeenByA = await clientA.from("daily_plans").select("user_id, plan");
  mustNoError(planSeenByA.error, "read daily plan A");
  assert.equal(planSeenByA.data.length, 1);
  assert.equal(planSeenByA.data[0].user_id, userAId);
  assert.deepEqual(planSeenByA.data[0].plan, { owner: "A" });

  const planSeenByB = await clientB.from("daily_plans").select("user_id, plan");
  mustNoError(planSeenByB.error, "read daily plan B");
  assert.equal(planSeenByB.data.length, 1);
  assert.equal(planSeenByB.data[0].user_id, userBId);
  assert.deepEqual(planSeenByB.data[0].plan, { owner: "B" });

  console.log(
    "Database integration passed: auth sessions valid; profile trigger works; only active shared curriculum is visible; curriculum/mastery client writes blocked; cross-user private reads/updates isolated by RLS.",
  );
} finally {
  if (userAId) await admin.auth.admin.deleteUser(userAId);
  if (userBId) await admin.auth.admin.deleteUser(userBId);
  await admin.from("exercise_items").delete().eq("id", itemId);
  await admin.from("exercise_templates").delete().eq("id", templateId);
  await admin.from("lesson_blueprints").delete().eq("id", blueprintId);
  await admin.from("knowledge_nodes").delete().eq("id", draftNodeId);
  await admin.from("knowledge_nodes").delete().eq("id", nodeId);
  await admin.from("curriculum_versions").delete().eq("id", curriculumVersionId);
}
