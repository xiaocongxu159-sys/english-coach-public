import process from "node:process";
import {
  loadPilotReviewBlueprint,
  validatePilotReviewBlueprint,
} from "./review-blueprint-lib.mjs";

const loaded = await loadPilotReviewBlueprint(process.cwd());
const report = validatePilotReviewBlueprint(loaded.blueprint);

if (!report.ok) {
  console.error("P1 review blueprint validation failed:");
  for (const error of report.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `P1 review blueprint validation passed: ${loaded.blueprint.id} is a one-unit, controlled-production, reviewed-core-only review lesson; sha256 ${loaded.sha256}.`,
  );
}
