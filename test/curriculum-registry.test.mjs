import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPECTED_COUNTS,
  buildRegistry,
  validateRegistry,
} from "../scripts/curriculum-registry-lib.mjs";

test("frozen curriculum compiles to the expected 735-node graph", () => {
  const registry = buildRegistry(process.cwd());
  const result = validateRegistry(registry);

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.stats.total, EXPECTED_COUNTS.total);
  assert.deepEqual(result.stats.byLevel, EXPECTED_COUNTS.byLevel);
  assert.equal(result.stats.topologicalVisited, EXPECTED_COUNTS.total);
});

test("validator rejects a missing hard prerequisite", () => {
  const registry = structuredClone(buildRegistry(process.cwd()));
  registry.nodes[0].hardPrerequisites.push("GR-A1-NOT-A-REAL-NODE-99");
  const result = validateRegistry(registry);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /missing hard prerequisite/);
});

test("validator rejects duplicate IDs", () => {
  const registry = structuredClone(buildRegistry(process.cwd()));
  registry.nodes.push(structuredClone(registry.nodes[0]));
  const result = validateRegistry(registry);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /duplicate IDs/);
});

test("validator rejects a dependency cycle", () => {
  const registry = structuredClone(buildRegistry(process.cwd()));
  const first = registry.nodes.find((node) => node.id === "GR-A1-SENT-WORDORDER-01");
  const second = registry.nodes.find((node) => node.id === "GR-A1-PRON-SUBJECT-01");
  assert.ok(first);
  assert.ok(second);

  first.hardPrerequisites.push(second.id);
  const result = validateRegistry(registry);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /cycle detected/);
});
