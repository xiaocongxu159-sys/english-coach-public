import process from "node:process";
import { validatePilotContent } from "./pilot-content-lib.mjs";

const report = await validatePilotContent(process.cwd());

if (!report.ok) {
  console.error("P1 pilot content validation failed:");
  for (const error of report.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `P1 pilot validation passed: ${report.activeNodeCount} prerequisite-free active nodes with frozen evidence contracts, ${report.templateCount} templates, ${report.itemCount} items, ${report.deterministicStateChangingCount} deterministic state-eligible items, ${report.practiceOnlySpeakingCount} practice-only speaking item; manifest sha256 ${report.manifestSha256}.`,
  );
}
