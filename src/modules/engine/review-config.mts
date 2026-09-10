import { readFileSync } from "node:fs";
import type { ReviewConfig } from "./review-types.mts";

let cachedReviewConfig: ReviewConfig | null = null;

export function getReviewConfig(): ReviewConfig {
  if (cachedReviewConfig) return cachedReviewConfig;
  const path = new URL("../../../config/review-v1.config.json", import.meta.url);
  cachedReviewConfig = JSON.parse(readFileSync(path, "utf8")) as ReviewConfig;
  return cachedReviewConfig;
}
