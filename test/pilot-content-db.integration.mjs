import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  loadPilotFiles,
  validatePilotData,
} from "../scripts/pilot-content-lib.mjs";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  console.error(
    "Pilot DB integration requires SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const { registry, manifest, manifestSha256 } = await loadPilotFiles(process.cwd());
const report = validatePilotData(registry, manifest);
assert.equal(
  report.ok,
  true,
  `pilot manifest invalid: ${report.errors.join("; ")}`,
);

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anonymous = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomUUID().slice(0, 8);
const email = `p1pilot-${suffix}@example.test`;
const password = `Pilot-${randomUUID()}-aA1!`;
let userId;
const mustNoError = (error, context) =>
  assert.equal(error, null, `${context}: ${error?.message ?? "unknown error"}`);

try {
  const createUser = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Pilot Learner" },
  });
  mustNoError(createUser.error, "create pilot learner");
  userId = createUser.data.user.id;

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  mustNoError(signIn.error, "sign in pilot learner");
  assert.equal(signIn.data.user?.id, userId);

  const anonymousNodes = await anonymous
    .from("knowledge_nodes")
    .select("id")
    .limit(1);
  assert.ok(anonymousNodes.error, "anonymous user must not read pilot curriculum");

  const versionRead = await client
    .from("curriculum_versions")
    .select("id, status")
    .eq("id", registry.curriculumVersion);
  mustNoError(versionRead.error, "read active curriculum version");
  assert.deepEqual(versionRead.data, [
    { id: registry.curriculumVersion, status: "active" },
  ]);

  const nodeRead = await client
    .from("knowledge_nodes")
    .select("id, lifecycle, metadata")
    .contains("metadata", { pilot_id: manifest.pilot.id })
    .order("id");
  mustNoError(nodeRead.error, "read active pilot nodes");
  assert.equal(nodeRead.data.length, manifest.activeNodeIds.length);
  assert.deepEqual(
    nodeRead.data.map((row) => row.id),
    manifest.activeNodeIds,
  );
  assert.ok(nodeRead.data.every((row) => row.lifecycle === "active"));

  for (const row of nodeRead.data) {
    assert.equal(row.metadata.pilot_id, manifest.pilot.id);
    assert.equal(row.metadata.pilot_version, manifest.pilot.version);
    assert.equal(row.metadata.pilot_version_tag, manifest.pilot.versionTag);
    assert.deepEqual(
      row.metadata.required_evidence_types,
      manifest.nodeEvidenceRequirements[row.id],
      `database evidence contract must match reviewed manifest for ${row.id}`,
    );
  }

  const prerequisiteRead = await client
    .from("knowledge_prerequisites")
    .select("node_id, prerequisite_node_id, prerequisite_type");
  mustNoError(prerequisiteRead.error, "read visible pilot prerequisite edges");
  assert.equal(
    prerequisiteRead.data.length,
    0,
    "the first learner-active pilot must contain only hard-prerequisite-free root nodes",
  );

  const blueprintRead = await client
    .from("lesson_blueprints")
    .select("id, lifecycle, blueprint")
    .eq("id", manifest.lessonBlueprint.id);
  mustNoError(blueprintRead.error, "read pilot lesson blueprint");
  assert.equal(blueprintRead.data.length, 1);
  assert.equal(blueprintRead.data[0].lifecycle, "active");
  assert.equal(blueprintRead.data[0].blueprint.id, manifest.lessonBlueprint.id);

  const templateIds = manifest.exerciseTemplates.map((template) => template.id);
  const templateRead = await client
    .from("exercise_templates")
    .select("id, lifecycle, template")
    .in("id", templateIds)
    .order("id");
  mustNoError(templateRead.error, "read pilot exercise templates");
  assert.equal(templateRead.data.length, templateIds.length);
  assert.ok(templateRead.data.every((row) => row.lifecycle === "active"));

  const itemIds = manifest.exerciseItems.map((item) => item.id);
  const itemRead = await client
    .from("exercise_items")
    .select("id, lifecycle, trust_class, item")
    .in("id", itemIds)
    .order("id");
  mustNoError(itemRead.error, "read pilot exercise items");
  assert.equal(itemRead.data.length, itemIds.length);
  assert.ok(itemRead.data.every((row) => row.lifecycle === "active"));
  assert.ok(itemRead.data.every((row) => row.trust_class === "reviewed_core"));
  assert.ok(
    itemRead.data.every(
      (row) =>
        row.item.status === "active" &&
        row.item.provenance.content_class === "reviewed_core",
    ),
  );

  const visibleIds = new Set(nodeRead.data.map((row) => row.id));
  for (const row of itemRead.data) {
    for (const targetNodeId of row.item.target_node_ids) {
      assert.ok(
        visibleIds.has(targetNodeId),
        `exercise item target must be learner-visible: ${row.id} -> ${targetNodeId}`,
      );
      assert.ok(
        manifest.nodeEvidenceRequirements[targetNodeId].includes(
          row.item.evidence_type,
        ),
        `stored item evidence must belong to the target node contract: ${row.id} -> ${targetNodeId}`,
      );
    }
  }

  const spokenItem = itemRead.data.find(
    (row) => row.id === "EI-A1-SOCIAL-SPEAK-001",
  );
  assert.ok(spokenItem, "reviewed spoken practice item must be learner-visible");
  assert.deepEqual(spokenItem.item.target_node_ids, ["CF-A1-SOCIAL-GREET-01"]);
  assert.deepEqual(spokenItem.item.support_node_ids, ["VX-A1-SOCIAL-FORMULAS-01"]);
  assert.equal(spokenItem.item.state_effect_policy.may_change_mastery, false);
  assert.equal(spokenItem.item.state_effect_policy.may_update_review, false);

  const clientWriteAttempt = await client
    .from("exercise_items")
    .update({ lifecycle: "deprecated" })
    .eq("id", itemIds[0]);
  assert.ok(
    clientWriteAttempt.error,
    "learner must not mutate reviewed pilot content",
  );

  const systemVersion = await admin
    .from("system_versions")
    .select("component, version, metadata")
    .eq("component", "pilot_content")
    .single();
  mustNoError(systemVersion.error, "read pilot system version as service");
  assert.equal(systemVersion.data.version, manifest.pilot.versionTag);
  assert.equal(systemVersion.data.metadata.manifest_sha256, manifestSha256);
  assert.equal(
    systemVersion.data.metadata.active_node_count,
    manifest.activeNodeIds.length,
  );
  assert.equal(
    systemVersion.data.metadata.required_evidence_node_count,
    manifest.activeNodeIds.length,
  );

  console.log(
    `Pilot DB integration passed: ${manifest.activeNodeIds.length} prerequisite-free active nodes with explicit evidence contracts, 0 prerequisite edges, ${templateIds.length} templates and ${itemIds.length} reviewed items are seeded idempotently and learner-visible only under authenticated active-content RLS.`,
  );
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId);
}
