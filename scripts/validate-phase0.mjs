import process from "node:process";
import { validatePhase0 } from "./phase0-validation-lib.mjs";

const report = await validatePhase0(process.cwd());

if (!report.ok) {
  console.error("Phase 0 validation failed:");
  for (const error of report.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Phase 0 validation passed: ${report.schemaCount} schemas, ${report.configCount} configs.`,
  );
}
