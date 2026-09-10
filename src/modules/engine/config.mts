import { readFileSync } from "node:fs";
import type { MasteryConfig } from "./types.mts";

let cachedMasteryConfig: MasteryConfig | null = null;

export function getMasteryConfig(): MasteryConfig {
  if (cachedMasteryConfig) return cachedMasteryConfig;
  const path = new URL("../../../config/mastery-v1.config.json", import.meta.url);
  cachedMasteryConfig = JSON.parse(readFileSync(path, "utf8")) as MasteryConfig;
  return cachedMasteryConfig;
}
