import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const REQUIRED_SCHEMA_FILES = [
  "daily-plan.schema.json",
  "exercise-attempt.schema.json",
  "exercise-item.schema.json",
  "exercise-template.schema.json",
  "ielts-readiness.schema.json",
  "learner-node-state.schema.json",
  "lesson-blueprint.schema.json",
  "lesson-instance.schema.json",
  "listening-asset.schema.json",
  "mastery-evidence-event.schema.json",
  "placement-blueprint.schema.json",
  "placement-result.schema.json",
  "review-state.schema.json",
  "review-unit.schema.json",
];

export const REQUIRED_CONFIG_FILES = [
  "daily-scheduler-v1.config.json",
  "exercise-v1.config.json",
  "ielts-progression-v1.config.json",
  "listening-v1.config.json",
  "mastery-v1.config.json",
  "placement-v1.config.json",
  "review-v1.config.json",
];

async function jsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
}

async function parseJson(directory, filename, errors) {
  const fullPath = path.join(directory, filename);
  try {
    return JSON.parse(await readFile(fullPath, "utf8"));
  } catch (error) {
    errors.push(`${filename}: invalid JSON (${error.message})`);
    return null;
  }
}

function missingFiles(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((filename) => !actualSet.has(filename));
}

export async function validatePhase0(rootDirectory, { enforceBaseline = true } = {}) {
  const schemaDirectory = path.join(rootDirectory, "schemas");
  const configDirectory = path.join(rootDirectory, "config");
  const errors = [];

  let schemaFiles = [];
  let configFiles = [];

  try {
    schemaFiles = await jsonFiles(schemaDirectory);
  } catch (error) {
    errors.push(`schemas/: unavailable (${error.message})`);
  }

  try {
    configFiles = await jsonFiles(configDirectory);
  } catch (error) {
    errors.push(`config/: unavailable (${error.message})`);
  }

  if (enforceBaseline) {
    for (const missing of missingFiles(schemaFiles, REQUIRED_SCHEMA_FILES)) {
      errors.push(`schemas/${missing}: required Phase 0 schema is missing`);
    }
    for (const missing of missingFiles(configFiles, REQUIRED_CONFIG_FILES)) {
      errors.push(`config/${missing}: required Phase 0 config is missing`);
    }
  }

  const schemaIds = new Map();

  for (const filename of schemaFiles) {
    const schema = await parseJson(schemaDirectory, filename, errors);
    if (!schema) continue;

    if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
      errors.push(`${filename}: must declare JSON Schema Draft 2020-12`);
    }
    if (typeof schema.$id !== "string" || schema.$id.length === 0) {
      errors.push(`${filename}: missing non-empty $id`);
    } else if (schemaIds.has(schema.$id)) {
      errors.push(`${filename}: duplicate $id also used by ${schemaIds.get(schema.$id)}`);
    } else {
      schemaIds.set(schema.$id, filename);
    }
    if (schema.type !== "object") {
      errors.push(`${filename}: top-level schema type must be object`);
    }
  }

  for (const filename of configFiles) {
    const config = await parseJson(configDirectory, filename, errors);
    if (!config) continue;
    if (typeof config !== "object" || Array.isArray(config)) {
      errors.push(`${filename}: config must be a JSON object`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    schemaCount: schemaFiles.length,
    configCount: configFiles.length,
  };
}
