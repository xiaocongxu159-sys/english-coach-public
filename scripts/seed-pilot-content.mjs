import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { loadPilotFiles, validatePilotData } from "./pilot-content-lib.mjs";
import {
  loadPilotReviewBlueprint,
  validatePilotReviewBlueprint,
} from "./review-blueprint-lib.mjs";

const url = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Pilot seed requires SUPABASE_TEST_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const { registry, manifest, manifestSha256 } = await loadPilotFiles(process.cwd());
const report = validatePilotData(registry, manifest);
const reviewBlueprintLoaded = await loadPilotReviewBlueprint(process.cwd());
const reviewBlueprintReport = validatePilotReviewBlueprint(
  reviewBlueprintLoaded.blueprint,
);

if (!report.ok || !reviewBlueprintReport.ok) {
  console.error("Refusing to seed invalid pilot content:");
  for (const error of report.errors) console.error(`- ${error}`);
  for (const error of reviewBlueprintReport.errors) console.error(`- ${error}`);
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

function fail(error, context) {
  if (!error) return;
  throw new Error(`${context}: ${error.message}`);
}

const selectedNodes = registry.nodes.filter((node) =>
  manifest.activeNodeIds.includes(node.id),
);
const selectedNodeById = new Map(selectedNodes.map((node) => [node.id, node]));

const curriculumResult = await admin.from("curriculum_versions").upsert(
  {
    id: registry.curriculumVersion,
    status: "active",
    metadata: {
      source: "canonical_registry",
      registry_schema_version: registry.schemaVersion,
      activation_mode: "active-node-subset",
    },
  },
  { onConflict: "id" },
);
fail(curriculumResult.error, "upsert curriculum version");

const nodeRows = selectedNodes.map((node) => ({
  id: node.id,
  curriculum_version_id: registry.curriculumVersion,
  cefr_level: node.cefrLevel,
  domain: node.domain,
  title: node.title,
  lifecycle: "active",
  outcome: node.outcome,
  source_document: node.source?.document ?? null,
  source_section: node.source?.section ?? null,
  metadata: {
    pilot_id: manifest.pilot.id,
    pilot_version: manifest.pilot.version,
    pilot_version_tag: manifest.pilot.versionTag,
    canonical_lifecycle: node.lifecycle,
    required_evidence_types: manifest.nodeEvidenceRequirements[node.id],
  },
}));

const nodesResult = await admin.from("knowledge_nodes").upsert(nodeRows, {
  onConflict: "id",
});
fail(nodesResult.error, "upsert pilot knowledge nodes");

const prerequisiteRows = [];
for (const node of selectedNodes) {
  for (const prerequisiteId of node.hardPrerequisites ?? []) {
    if (!selectedNodeById.has(prerequisiteId)) {
      throw new Error(
        `seed prerequisite closure invariant broken: ${node.id} -> ${prerequisiteId}`,
      );
    }
    prerequisiteRows.push({
      node_id: node.id,
      prerequisite_node_id: prerequisiteId,
      prerequisite_type: "hard",
    });
  }
}

if (prerequisiteRows.length > 0) {
  const prerequisiteResult = await admin
    .from("knowledge_prerequisites")
    .upsert(prerequisiteRows, {
      onConflict: "node_id,prerequisite_node_id,prerequisite_type",
      ignoreDuplicates: false,
    });
  fail(prerequisiteResult.error, "upsert pilot prerequisites");
}

const blueprint = manifest.lessonBlueprint;
const blueprintRows = [blueprint, reviewBlueprintLoaded.blueprint].map((value) => ({
  id: value.id,
  curriculum_version_id: registry.curriculumVersion,
  title: value.name,
  cefr_level: value.level,
  lifecycle: value.status,
  blueprint: value,
}));
const blueprintResult = await admin.from("lesson_blueprints").upsert(blueprintRows, {
  onConflict: "id",
});
fail(blueprintResult.error, "upsert pilot lesson blueprints");

const templateRows = manifest.exerciseTemplates.map((template) => ({
  id: template.id,
  curriculum_version_id: registry.curriculumVersion,
  lifecycle: template.status,
  template,
}));
const templatesResult = await admin.from("exercise_templates").upsert(
  templateRows,
  { onConflict: "id" },
);
fail(templatesResult.error, "upsert pilot exercise templates");

const itemRows = manifest.exerciseItems.map((item) => ({
  id: item.id,
  template_id: item.template_id,
  lifecycle: item.status,
  trust_class: item.provenance.content_class,
  item,
}));
const itemsResult = await admin.from("exercise_items").upsert(itemRows, {
  onConflict: "id",
});
fail(itemsResult.error, "upsert pilot exercise items");

const systemVersions = [
  {
    component: "pilot_content",
    version: manifest.pilot.versionTag,
    metadata: {
      pilot_id: manifest.pilot.id,
      pilot_version: manifest.pilot.version,
      curriculum_version: registry.curriculumVersion,
      manifest_sha256: manifestSha256,
      active_node_count: report.activeNodeCount,
      template_count: report.templateCount,
      item_count: report.itemCount,
      required_evidence_node_count: Object.keys(manifest.nodeEvidenceRequirements).length,
      external_human_review: manifest.contentReview.externalHumanReview,
      origin: manifest.contentReview.origin,
    },
  },
  {
    component: "pilot_review_blueprint",
    version: `${reviewBlueprintLoaded.blueprint.id}@v${reviewBlueprintLoaded.blueprint.version}`,
    metadata: {
      pilot_id: manifest.pilot.id,
      curriculum_version: registry.curriculumVersion,
      blueprint_id: reviewBlueprintLoaded.blueprint.id,
      blueprint_sha256: reviewBlueprintLoaded.sha256,
      lesson_type: reviewBlueprintLoaded.blueprint.lesson_type,
      review_count_max: reviewBlueprintLoaded.blueprint.node_selection.review_count_max,
      scored_ai_variants: false,
    },
  },
];
const systemVersionResult = await admin.from("system_versions").upsert(systemVersions, {
  onConflict: "component",
});
fail(systemVersionResult.error, "upsert pilot system versions");

console.log(
  `Seeded ${manifest.pilot.id}: ${report.activeNodeCount} active root nodes, ${prerequisiteRows.length} hard prerequisite edges, 2 reviewed lesson blueprints, ${report.templateCount} templates, ${report.itemCount} items; manifest sha256 ${manifestSha256}; review blueprint sha256 ${reviewBlueprintLoaded.sha256}.`,
);
