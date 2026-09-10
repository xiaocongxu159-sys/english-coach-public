import assert from "node:assert/strict";
import test from "node:test";
import {
  loadPilotFiles,
  validatePilotData,
} from "../scripts/pilot-content-lib.mjs";

const { registry, manifest } = await loadPilotFiles(process.cwd());
const clone = (value) => structuredClone(value);

test("reviewed prerequisite-free A1 pilot manifest passes validation", () => {
  const report = validatePilotData(registry, manifest);
  assert.equal(report.ok, true, report.errors.join("\n"));
  assert.equal(report.activeNodeCount, 2);
  assert.equal(report.templateCount, 3);
  assert.equal(report.itemCount, 11);
  assert.equal(report.deterministicStateChangingCount, 10);
  assert.equal(report.practiceOnlySpeakingCount, 1);
});

test("pilot validation rejects activation outside the frozen root-node slice", () => {
  const broken = clone(manifest);
  broken.activeNodeIds.push("GR-A1-BE-AFFIRMATIVE-01");
  broken.primaryNodeIds.push("GR-A1-BE-AFFIRMATIVE-01");
  broken.nodeEvidenceRequirements["GR-A1-BE-AFFIRMATIVE-01"] = [
    "recognition",
    "controlled_production",
  ];
  const report = validatePilotData(registry, broken);
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("pilot active nodes must exactly match the reviewed root-node slice"),
    ),
  );
});

test("pilot validation rejects a downgraded node evidence contract", () => {
  const broken = clone(manifest);
  broken.nodeEvidenceRequirements["CF-A1-SOCIAL-GREET-01"] = ["recognition"];
  const report = validatePilotData(registry, broken);
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("required evidence contract changed for CF-A1-SOCIAL-GREET-01"),
    ),
  );
});

test("pilot validation rejects missing reviewed opportunity for required spoken evidence", () => {
  const broken = clone(manifest);
  const spokenItem = broken.exerciseItems.find(
    (item) => item.id === "EI-A1-SOCIAL-SPEAK-001",
  );
  spokenItem.target_node_ids = [];
  const report = validatePilotData(registry, broken);
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes(
        "required evidence has no reviewed exercise opportunity: CF-A1-SOCIAL-GREET-01 -> free_spoken_production",
      ),
    ),
  );
});

test("pilot validation rejects an invalid single-choice answer key", () => {
  const broken = clone(manifest);
  broken.exerciseItems.find(
    (item) => item.id === "EI-A1-SOCIAL-RECOGNITION-001",
  ).answer_spec.correct_option_ids = ["Z"];
  const report = validatePilotData(registry, broken);
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((error) => error.includes("single-choice answer invalid")),
  );
});

test("pilot validation rejects unreviewed content from the active slice", () => {
  const broken = clone(manifest);
  broken.exerciseItems[0].provenance.content_class = "unvalidated_variant";
  const report = validatePilotData(registry, broken);
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((error) => error.includes("item provenance invalid")),
  );
});

test("pilot validation blocks rubric speaking content from changing mastery or review", () => {
  const broken = clone(manifest);
  broken.exerciseItems.find(
    (item) => item.id === "EI-A1-SOCIAL-SPEAK-001",
  ).state_effect_policy.may_change_mastery = true;
  const report = validatePilotData(registry, broken);
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("non-deterministic item cannot change learning state"),
    ),
  );
});
