import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validatePhase0 } from "../scripts/phase0-validation-lib.mjs";

test("the frozen Phase 0 JSON baseline is structurally valid", async () => {
  const report = await validatePhase0(process.cwd());
  assert.equal(report.ok, true, report.errors.join("\n"));
  assert.ok(report.schemaCount >= 14);
  assert.ok(report.configCount >= 7);
});

test("duplicate schema ids are rejected", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "english-coach-phase0-"));
  await mkdir(path.join(root, "schemas"));
  await mkdir(path.join(root, "config"));

  const schema = JSON.stringify({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://english-coach.test/duplicate",
    type: "object",
  });

  await writeFile(path.join(root, "schemas", "a.schema.json"), schema);
  await writeFile(path.join(root, "schemas", "b.schema.json"), schema);
  await writeFile(path.join(root, "config", "sample.json"), "{}\n");

  const report = await validatePhase0(root, { enforceBaseline: false });
  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /duplicate \$id/);
});

test("malformed config JSON is rejected", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "english-coach-phase0-"));
  await mkdir(path.join(root, "schemas"));
  await mkdir(path.join(root, "config"));

  await writeFile(
    path.join(root, "schemas", "sample.schema.json"),
    JSON.stringify({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://english-coach.test/sample",
      type: "object",
    }),
  );
  await writeFile(path.join(root, "config", "broken.json"), "{not-json}");

  const report = await validatePhase0(root, { enforceBaseline: false });
  assert.equal(report.ok, false);
  assert.match(report.errors.join("\n"), /invalid JSON/);
});
