import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const PILOT_DIR = "content/pilots/a1-social-formulas-v1";
export const PILOT_MANIFEST_PATH = `${PILOT_DIR}/pilot.json`;
export const REGISTRY_PATH = "curriculum/registry.json";

const EXPECTED_PILOT_ID = "PILOT-A1-SOCIAL-FORMULAS-01";
const EXPECTED_BLUEPRINT_ID = "LESB-A1-SOCIAL-FORMULAS-01";
const EXPECTED_ACTIVE_NODES = [
  "CF-A1-SOCIAL-GREET-01",
  "VX-A1-SOCIAL-FORMULAS-01",
];
const EXPECTED_NODE_EVIDENCE = {
  "CF-A1-SOCIAL-GREET-01": [
    "recognition",
    "controlled_production",
    "free_spoken_production",
  ],
  "VX-A1-SOCIAL-FORMULAS-01": ["recognition", "controlled_production"],
};
const ITEM_TASKS = new Set([
  "multiple_choice_single",
  "multiple_choice_multi",
  "true_false",
  "fill_blank",
  "short_answer",
  "ordering",
  "matching",
  "error_correction",
  "sentence_transformation",
  "controlled_production",
  "free_written",
  "free_spoken",
  "listening_completion",
  "listening_choice",
  "reading_choice",
  "reading_completion",
  "pronunciation_production",
  "communication_roleplay",
]);
const EVIDENCE = new Set([
  "recognition",
  "controlled_production",
  "free_written_production",
  "free_spoken_production",
  "spontaneous_reuse",
  "listening_comprehension",
  "reading_comprehension",
  "pronunciation_intelligibility",
  "communication_repair",
]);
const uniq = (xs) => Array.isArray(xs) && new Set(xs).size === xs.length;
const sameSet = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((value) => b.includes(value));
const norm = (value) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/\s+/g, " ")
    : "";

export async function loadPilotFiles(rootDir) {
  const registryRaw = await readFile(resolve(rootDir, REGISTRY_PATH), "utf8");
  const pilotRaw = await readFile(resolve(rootDir, PILOT_MANIFEST_PATH), "utf8");
  const pilot = JSON.parse(pilotRaw);
  const templateFiles = Array.isArray(pilot.exerciseTemplateFiles)
    ? pilot.exerciseTemplateFiles
    : [];
  const itemFiles = Array.isArray(pilot.exerciseItemFiles)
    ? pilot.exerciseItemFiles
    : [];
  const templateRaws = await Promise.all(
    templateFiles.map((file) =>
      readFile(resolve(rootDir, PILOT_DIR, file), "utf8"),
    ),
  );
  const itemRaws = await Promise.all(
    itemFiles.map((file) => readFile(resolve(rootDir, PILOT_DIR, file), "utf8")),
  );
  const manifest = {
    ...pilot,
    exerciseTemplates: templateRaws.flatMap((raw) => JSON.parse(raw)),
    exerciseItems: itemRaws.flatMap((raw) => JSON.parse(raw)),
  };
  const bundleRaw = [pilotRaw, ...templateRaws, ...itemRaws].join("\0");
  return {
    registry: JSON.parse(registryRaw),
    manifest,
    manifestRaw: bundleRaw,
    manifestSha256: createHash("sha256").update(bundleRaw).digest("hex"),
  };
}

export function validatePilotData(registry, manifest) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };

  const active = Array.isArray(manifest?.activeNodeIds)
    ? manifest.activeNodeIds
    : [];
  const primary = Array.isArray(manifest?.primaryNodeIds)
    ? manifest.primaryNodeIds
    : [];
  const support = Array.isArray(manifest?.supportNodeIds)
    ? manifest.supportNodeIds
    : [];
  const nodeEvidenceRequirements =
    manifest?.nodeEvidenceRequirements &&
    typeof manifest.nodeEvidenceRequirements === "object" &&
    !Array.isArray(manifest.nodeEvidenceRequirements)
      ? manifest.nodeEvidenceRequirements
      : {};
  const nodes = Array.isArray(registry?.nodes) ? registry.nodes : [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  check(manifest?.schemaVersion === 1, "pilot manifest schemaVersion must be 1");
  check(manifest?.pilot?.id === EXPECTED_PILOT_ID, "unexpected pilot id");
  check(
    manifest?.pilot?.version === 1 && manifest?.pilot?.status === "active",
    "pilot version/status invalid",
  );
  check(manifest?.pilot?.level === "A1", "pilot level must be A1");
  check(
    manifest?.pilot?.curriculumVersion === registry?.curriculumVersion,
    "pilot curriculumVersion must match registry",
  );
  check(
    uniq(manifest?.exerciseTemplateFiles) &&
      manifest.exerciseTemplateFiles.length > 0,
    "exerciseTemplateFiles must be nonempty and unique",
  );
  check(
    uniq(manifest?.exerciseItemFiles) && manifest.exerciseItemFiles.length > 0,
    "exerciseItemFiles must be nonempty and unique",
  );

  check(
    sameSet(active, EXPECTED_ACTIVE_NODES),
    "pilot active nodes must exactly match the reviewed root-node slice",
  );
  check(
    JSON.stringify(active) ===
      JSON.stringify([...EXPECTED_ACTIVE_NODES].sort((a, b) => a.localeCompare(b, "en"))),
    "activeNodeIds must use the frozen sorted order",
  );
  check(
    sameSet(primary, EXPECTED_ACTIVE_NODES),
    "both reviewed root nodes must be primary",
  );
  check(support.length === 0, "root-node pilot must not activate support nodes");
  check(primary.every((id) => !support.includes(id)), "primary/support ids must not overlap");
  check(
    sameSet([...primary, ...support], active),
    "primary + support must exactly cover active nodes",
  );

  const evidenceRequirementIds = Object.keys(nodeEvidenceRequirements).sort((a, b) =>
    a.localeCompare(b, "en"),
  );
  check(
    sameSet(evidenceRequirementIds, EXPECTED_ACTIVE_NODES),
    "nodeEvidenceRequirements must exist for every and only active node",
  );
  for (const id of EXPECTED_ACTIVE_NODES) {
    const actual = nodeEvidenceRequirements[id];
    const expected = EXPECTED_NODE_EVIDENCE[id];
    check(
      Array.isArray(actual) && uniq(actual) && actual.every((kind) => EVIDENCE.has(kind)),
      `required evidence types invalid: ${id}`,
    );
    check(
      sameSet(actual ?? [], expected),
      `required evidence contract changed for ${id}`,
    );
  }

  for (const id of active) {
    const node = nodeById.get(id);
    check(Boolean(node), `active node missing from registry: ${id}`);
    if (!node) continue;
    check(node.cefrLevel === "A1", `pilot node is not A1: ${id}`);
    check(node.lifecycle === "draft", `canonical registry must stay draft: ${id}`);
    const hardPrerequisites = Array.isArray(node.hardPrerequisites)
      ? node.hardPrerequisites
      : [];
    check(
      hardPrerequisites.length === 0,
      `pilot active node must be a true hard-prerequisite-free root: ${id}`,
    );
  }

  const blueprint = manifest?.lessonBlueprint;
  check(Boolean(blueprint), "lessonBlueprint is required");
  if (blueprint) {
    check(blueprint.id === EXPECTED_BLUEPRINT_ID, "lessonBlueprint id invalid");
    check(
      blueprint.version === 1 &&
        blueprint.status === "active" &&
        blueprint.level === "A1",
      "lessonBlueprint version/status/level invalid",
    );
    const duration = blueprint.duration_minutes ?? {};
    check(
      Number.isInteger(duration.min) &&
        Number.isInteger(duration.target) &&
        Number.isInteger(duration.max) &&
        duration.min <= duration.target &&
        duration.target <= duration.max,
      "lesson duration invalid",
    );
    check(
      blueprint.node_selection?.primary_count?.min === 2 &&
        blueprint.node_selection?.primary_count?.max === 2 &&
        blueprint.node_selection?.support_count_max === 0,
      "lesson node-selection bounds must match the two-root slice",
    );
    check(
      blueprint.node_selection?.require_hard_prerequisites_ready === true,
      "lesson must require prerequisites ready",
    );
    check(
      blueprint.personalization?.forbid_scope_expansion === true,
      "lesson must forbid scope expansion",
    );
    check(
      blueprint.content_policy?.reviewed_core_required === true &&
        blueprint.content_policy?.ai_variants_allowed === false &&
        blueprint.content_policy?.scored_ai_variant_policy === "forbidden",
      "pilot content policy must be reviewed-only and non-generative",
    );
    check(
      blueprint.resume_policy?.checkpoint_after_each_stage === true &&
        blueprint.resume_policy?.preserve_attempts === true,
      "resume policy must preserve checkpoints/attempts",
    );
    const stages = Array.isArray(blueprint.stages) ? blueprint.stages : [];
    check(
      stages.length > 0 && uniq(stages.map((stage) => stage.key)),
      "lesson stages must exist with unique keys",
    );
    check(
      stages.every(
        (stage) =>
          Array.isArray(stage.evidence_types) &&
          stage.evidence_types.every((kind) => EVIDENCE.has(kind)) &&
          ["none", "reviewed_only"].includes(stage.ai_content_mode),
      ),
      "pilot stages must use reviewed/non-generative content modes and valid evidence types",
    );
  }

  const lessonContent = manifest?.lessonContent;
  check(
    Array.isArray(lessonContent?.learningObjectives) &&
      lessonContent.learningObjectives.length >= 3,
    "lesson needs >=3 objectives",
  );
  check(
    Array.isArray(lessonContent?.teachBlocks) && lessonContent.teachBlocks.length >= 5,
    "lesson needs reviewed teaching blocks for the social-formula scope",
  );
  check(
    Array.isArray(lessonContent?.reviewedDialogue) &&
      lessonContent.reviewedDialogue.length >= 4,
    "lesson needs reviewed dialogue",
  );
  check(
    lessonContent?.speakingPractice?.scored === false,
    "spoken rehearsal must remain unscored",
  );

  const templates = Array.isArray(manifest?.exerciseTemplates)
    ? manifest.exerciseTemplates
    : [];
  const templateIds = templates.map((template) => template.id);
  const templateById = new Map(templates.map((template) => [template.id, template]));
  check(
    templates.length === 3 && uniq(templateIds),
    "pilot must contain exactly three unique exercise templates",
  );
  for (const template of templates) {
    check(
      /^ET-A1-[A-Z0-9-]+-\d{2}$/.test(template.id ?? ""),
      `template id invalid: ${template.id}`,
    );
    check(
      template.version === 1 &&
        template.status === "active" &&
        template.level === "A1",
      `template version/status/level invalid: ${template.id}`,
    );
    check(
      ITEM_TASKS.has(template.task_type) && EVIDENCE.has(template.evidence_type),
      `template task/evidence invalid: ${template.id}`,
    );
    check(
      Array.isArray(template.target_node_ids) &&
        template.target_node_ids.length > 0 &&
        template.target_node_ids.every((id) => active.includes(id)),
      `template targets outside pilot: ${template.id}`,
    );
    check(
      template.target_node_ids?.every((id) =>
        (nodeEvidenceRequirements[id] ?? []).includes(template.evidence_type),
      ),
      `template evidence is not required by every target node: ${template.id}`,
    );
    check(
      template.generation_policy?.ai_variant_allowed === false &&
        template.generation_policy?.reviewed_core_required === true,
      `template must be reviewed-only: ${template.id}`,
    );
    const validationPolicy = template.validation_policy ?? {};
    check(
      validationPolicy.schema === true &&
        validationPolicy.scope === true &&
        validationPolicy.answer === true &&
        validationPolicy.ambiguity === true &&
        validationPolicy.level === true,
      `template validation policy incomplete: ${template.id}`,
    );
  }

  const items = Array.isArray(manifest?.exerciseItems)
    ? manifest.exerciseItems
    : [];
  const itemIds = items.map((item) => item.id);
  const itemById = new Map(items.map((item) => [item.id, item]));
  check(
    items.length === 11 && uniq(itemIds),
    "pilot must contain exactly eleven unique exercise items",
  );

  let deterministicStateChangingCount = 0;
  let practiceOnlySpeakingCount = 0;
  const evidenceKinds = new Set();
  const evidenceOpportunitiesByNode = new Map(
    active.map((id) => [id, new Set()]),
  );
  const trustedEvidenceOpportunitiesByNode = new Map(
    active.map((id) => [id, new Set()]),
  );

  for (const item of items) {
    const template = templateById.get(item.template_id);
    check(
      /^EI-A1-[A-Z0-9-]+-\d{3}$/.test(item.id ?? ""),
      `item id invalid: ${item.id}`,
    );
    check(
      item.version === 1 && item.status === "active" && item.level === "A1",
      `item version/status/level invalid: ${item.id}`,
    );
    check(Boolean(template), `item references unknown template: ${item.id}`);
    check(
      ITEM_TASKS.has(item.task_type) && EVIDENCE.has(item.evidence_type),
      `item task/evidence invalid: ${item.id}`,
    );
    if (template) {
      check(
        item.task_type === template.task_type &&
          item.evidence_type === template.evidence_type,
        `item/template task or evidence mismatch: ${item.id}`,
      );
      check(
        Array.isArray(item.target_node_ids) &&
          item.target_node_ids.every((id) => template.target_node_ids.includes(id)),
        `item target outside template scope: ${item.id}`,
      );
    }
    check(
      Array.isArray(item.target_node_ids) &&
        item.target_node_ids.length > 0 &&
        item.target_node_ids.every((id) => active.includes(id)),
      `item target outside pilot: ${item.id}`,
    );
    check(
      item.target_node_ids?.every((id) =>
        (nodeEvidenceRequirements[id] ?? []).includes(item.evidence_type),
      ),
      `item evidence is not required by every target node: ${item.id}`,
    );
    check(
      Array.isArray(item.support_node_ids) &&
        item.support_node_ids.every((id) => active.includes(id)),
      `item support outside pilot: ${item.id}`,
    );
    check(
      item.provenance?.content_class === "reviewed_core" &&
        item.provenance?.origin === "ai_assisted",
      `item provenance invalid: ${item.id}`,
    );
    const validation = item.validation ?? {};
    check(
      validation.schema_pass === true &&
        validation.scope_pass === true &&
        validation.answer_pass === true &&
        validation.ambiguity_pass === true &&
        validation.level_pass === true &&
        validation.independent_qa_pass === true,
      `item QA flags incomplete: ${item.id}`,
    );

    const optionIds = (item.content?.options ?? []).map((option) => option.id);
    const optionTexts = (item.content?.options ?? []).map((option) => norm(option.text));
    check(uniq(optionIds) && uniq(optionTexts), `item options must be unique: ${item.id}`);

    const answer = item.answer_spec ?? {};
    const changesState =
      item.state_effect_policy?.may_change_mastery === true ||
      item.state_effect_policy?.may_update_review === true;
    if (answer.kind === "deterministic") {
      if (changesState) deterministicStateChangingCount += 1;
      if (item.task_type === "multiple_choice_single") {
        check(
          answer.correct_option_ids?.length === 1 &&
            answer.correct_option_ids.every((id) => optionIds.includes(id)),
          `single-choice answer invalid: ${item.id}`,
        );
        check(
          (answer.accepted_answers ?? []).length === 0,
          `single-choice accepted_answers must be empty: ${item.id}`,
        );
      } else {
        const acceptedAnswers = Array.isArray(answer.accepted_answers)
          ? answer.accepted_answers
          : [];
        check(
          acceptedAnswers.length > 0 &&
            uniq(acceptedAnswers.map((value) => norm(value))) &&
            acceptedAnswers.every((value) => norm(value).length > 0),
          `deterministic production answers invalid: ${item.id}`,
        );
        check(
          (answer.correct_option_ids ?? []).length === 0,
          `non-choice correct_option_ids must be empty: ${item.id}`,
        );
      }
    } else {
      check(!changesState, `non-deterministic item cannot change learning state: ${item.id}`);
    }

    if (item.task_type === "free_spoken" && !changesState) {
      practiceOnlySpeakingCount += 1;
    }
    evidenceKinds.add(item.evidence_type);
    for (const nodeId of item.target_node_ids ?? []) {
      evidenceOpportunitiesByNode.get(nodeId)?.add(item.evidence_type);
      if (answer.kind === "deterministic" && changesState) {
        trustedEvidenceOpportunitiesByNode.get(nodeId)?.add(item.evidence_type);
      }
    }
  }

  check(
    evidenceKinds.has("recognition") &&
      evidenceKinds.has("controlled_production") &&
      evidenceKinds.has("free_spoken_production"),
    "pilot needs recognition, controlled-production and spoken-practice evidence opportunities",
  );
  check(
    practiceOnlySpeakingCount === 1,
    "pilot needs exactly one practice-only speaking item",
  );

  for (const nodeId of active) {
    const requiredKinds = nodeEvidenceRequirements[nodeId] ?? [];
    const allOpportunities = evidenceOpportunitiesByNode.get(nodeId) ?? new Set();
    const trustedOpportunities =
      trustedEvidenceOpportunitiesByNode.get(nodeId) ?? new Set();
    for (const kind of requiredKinds) {
      check(
        allOpportunities.has(kind),
        `required evidence has no reviewed exercise opportunity: ${nodeId} -> ${kind}`,
      );
      if (kind !== "free_spoken_production") {
        check(
          trustedOpportunities.has(kind),
          `required deterministic evidence has no state-eligible reviewed item: ${nodeId} -> ${kind}`,
        );
      }
    }
  }

  const sequence = Array.isArray(lessonContent?.exerciseSequence)
    ? lessonContent.exerciseSequence
    : [];
  check(
    uniq(sequence) && sameSet(sequence, itemIds),
    "exerciseSequence must contain every item exactly once",
  );
  const exitGate = lessonContent?.exitGate ?? {};
  const practiceIds = Array.isArray(exitGate.practiceOnlyItemIds)
    ? exitGate.practiceOnlyItemIds
    : [];
  const scored = items.filter((item) => !practiceIds.includes(item.id));
  check(
    scored.length === exitGate.scoredItemCount,
    "exitGate scoredItemCount mismatch",
  );
  check(
    Number.isInteger(exitGate.minimumCorrect) &&
      exitGate.minimumCorrect > 0 &&
      exitGate.minimumCorrect <= scored.length,
    "exitGate minimumCorrect invalid",
  );
  check(
    practiceIds.every((id) => {
      const item = itemById.get(id);
      return (
        item &&
        item.state_effect_policy?.may_change_mastery === false &&
        item.state_effect_policy?.may_update_review === false
      );
    }),
    "practiceOnlyItemIds must be non-state-changing",
  );
  check(
    (exitGate.requiredCorrectItemIds ?? []).every(
      (id) => itemById.has(id) && !practiceIds.includes(id),
    ),
    "requiredCorrectItemIds must be scored items",
  );

  const review = manifest?.contentReview;
  check(
    review?.contentClass === "reviewed_core" &&
      review?.origin === "ai_assisted" &&
      review?.externalHumanReview === false,
    "content review metadata must not claim external human review",
  );
  check(
    typeof review?.rights === "string" && review.rights.includes("Original"),
    "content rights must identify original project-authored content",
  );

  return {
    ok: errors.length === 0,
    errors,
    activeNodeCount: active.length,
    templateCount: templates.length,
    itemCount: items.length,
    deterministicStateChangingCount,
    practiceOnlySpeakingCount,
  };
}

export async function validatePilotContent(rootDir) {
  const loaded = await loadPilotFiles(rootDir);
  return {
    ...validatePilotData(loaded.registry, loaded.manifest),
    manifestSha256: loaded.manifestSha256,
  };
}
