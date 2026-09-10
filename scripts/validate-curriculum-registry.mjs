import fs from "node:fs";
import path from "node:path";
import { validateRegistry } from "./curriculum-registry-lib.mjs";

const registryPath = path.join(process.cwd(), "curriculum", "registry.json");

if (!fs.existsSync(registryPath)) {
  console.error("curriculum/registry.json is missing");
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const result = validateRegistry(registry);

if (!result.ok) {
  console.error("Curriculum registry validation failed:");
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Curriculum registry validation passed: ${result.stats.total} nodes (${Object.entries(result.stats.byLevel)
    .map(([level, count]) => `${level} ${count}`)
    .join(", ")}); duplicate IDs 0; missing prerequisites 0; cycles 0; topological ${result.stats.topologicalVisited}/${result.stats.total}.`,
);
