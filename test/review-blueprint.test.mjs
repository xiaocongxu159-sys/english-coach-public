import assert from "node:assert/strict";
import test from "node:test";
import {
  loadPilotReviewBlueprint,
  validatePilotReviewBlueprint,
} from "../scripts/review-blueprint-lib.mjs";

const { blueprint } = await loadPilotReviewBlueprint(process.cwd());
const clone = (value) => structuredClone(value);

test("reviewed Phase 1 review blueprint passes its frozen runtime contract", () => {
  const report = validatePilotReviewBlueprint(blueprint);
  assert.equal(report.ok, true, report.errors.join("\n"));
  assert.equal(blueprint.lesson_type, "review");
  assert.deepEqual(blueprint.node_selection.primary_count, { min: 0, max: 0 });
  assert.equal(blueprint.node_selection.review_count_max, 1);
});

test("review blueprint validation rejects primary-node fabrication", () => {
  const broken = clone(blueprint);
  broken.node_selection.primary_count = { min: 1, max: 1 };
  const report = validatePilotReviewBlueprint(broken);
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("zero primary/support nodes and exactly one Review Unit"),
    ),
  );
});

test("review blueprint validation rejects scored AI variation", () => {
  const broken = clone(blueprint);
  broken.content_policy.ai_variants_allowed = true;
  broken.content_policy.scored_ai_variant_policy = "validated_only";
  const report = validatePilotReviewBlueprint(broken);
  assert.equal(report.ok, false);
  assert.ok(report.errors.some((error) => error.includes("reviewed-core-only")));
});

test("review blueprint validation rejects speaking or other evidence expansion", () => {
  const broken = clone(blueprint);
  broken.stages[0].evidence_types = ["free_spoken_production"];
  const report = validatePilotReviewBlueprint(broken);
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((error) => error.includes("controlled-production only")),
  );
});
