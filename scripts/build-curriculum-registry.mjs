import fs from "node:fs";
import path from "node:path";
import {
  buildRegistry,
  stableRegistryJson,
  validateRegistry,
} from "./curriculum-registry-lib.mjs";

const rootDir = process.cwd();
const outputPath = path.join(rootDir, "curriculum", "registry.json");
const checkMode = process.argv.includes("--check");

const registry = buildRegistry(rootDir);
const validation = validateRegistry(registry);

if (!validation.ok) {
  console.error("Curriculum registry build failed validation:");
  for (const error of validation.errors) console.error(`- ${error}`);
  process.exit(1);
}

const rendered = stableRegistryJson(registry);

if (checkMode) {
  if (!fs.existsSync(outputPath)) {
    console.error("curriculum/registry.json is missing; run npm run curriculum:build");
    process.exit(1);
  }
  const committed = fs.readFileSync(outputPath, "utf8");
  if (committed !== rendered) {
    console.error("curriculum/registry.json is not deterministic/current; run npm run curriculum:build");
    process.exit(1);
  }
  console.log(
    `Curriculum registry deterministic check passed: ${validation.stats.total} nodes, topological ${validation.stats.topologicalVisited}/${validation.stats.total}.`,
  );
  process.exit(0);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, rendered, "utf8");
console.log(
  `Wrote curriculum/registry.json: ${validation.stats.total} nodes (${Object.entries(validation.stats.byLevel)
    .map(([level, count]) => `${level} ${count}`)
    .join(", ")}); topological ${validation.stats.topologicalVisited}/${validation.stats.total}.`,
);
