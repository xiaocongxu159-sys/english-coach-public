import reviewConfig from "../../../config/review-v1.config.json" with { type: "json" };
import type { ReviewConfig } from "./review-types.mts";

const REVIEW_CONFIG = reviewConfig as ReviewConfig;

export function getReviewConfig(): ReviewConfig {
  return REVIEW_CONFIG;
}
