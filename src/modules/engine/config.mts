import masteryConfig from "../../../config/mastery-v1.config.json" with { type: "json" };
import type { MasteryConfig } from "./types.mts";

const MASTERY_CONFIG = masteryConfig as MasteryConfig;

export function getMasteryConfig(): MasteryConfig {
  return MASTERY_CONFIG;
}
