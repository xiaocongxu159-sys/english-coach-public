import manifest from "../../../content/pilots/a1-social-formulas-v1/pilot.json" with { type: "json" };
import {
  PHASE1_PILOT_BLUEPRINT_ID,
  PHASE1_PILOT_PRIMARY_NODE_IDS,
} from "../engine/pilot-policy.mts";

export interface ReviewedTeachBlock {
  key: string;
  title: string;
  english: string;
  explanation: string;
  supportZh: string;
}

export interface ReviewedDialogueLine {
  speaker: string;
  text: string;
}

export interface ReviewedSpeakingPractice {
  required: boolean;
  scored: boolean;
  prompt: string;
  reasonUnscored: string;
}

export interface ReviewedLessonContent {
  title: string;
  learningObjectives: string[];
  teachBlocks: ReviewedTeachBlock[];
  reviewedDialogue: ReviewedDialogueLine[];
  speakingPractice: ReviewedSpeakingPractice;
  exitGate: {
    scoredItemCount: number;
    minimumCorrect: number;
    requiredCorrectItemIds: string[];
    practiceOnlyItemIds: string[];
  };
}

export function getReviewedPhase1PilotContent(): ReviewedLessonContent {
  if (manifest.lessonBlueprint.id !== PHASE1_PILOT_BLUEPRINT_ID) {
    throw new Error("Lesson UI reviewed content blueprint ID does not match Pilot policy");
  }
  const actualNodes = [...manifest.primaryNodeIds].sort();
  const expectedNodes = [...PHASE1_PILOT_PRIMARY_NODE_IDS].sort();
  if (
    actualNodes.length !== expectedNodes.length ||
    actualNodes.some((nodeId, index) => nodeId !== expectedNodes[index])
  ) {
    throw new Error("Lesson UI reviewed content node set does not match Pilot policy");
  }

  return {
    title: manifest.pilot.title,
    learningObjectives: [...manifest.lessonContent.learningObjectives],
    teachBlocks: manifest.lessonContent.teachBlocks.map((block) => ({ ...block })),
    reviewedDialogue: manifest.lessonContent.reviewedDialogue.map((line) => ({ ...line })),
    speakingPractice: { ...manifest.lessonContent.speakingPractice },
    exitGate: {
      scoredItemCount: manifest.lessonContent.exitGate.scoredItemCount,
      minimumCorrect: manifest.lessonContent.exitGate.minimumCorrect,
      requiredCorrectItemIds: [
        ...manifest.lessonContent.exitGate.requiredCorrectItemIds,
      ],
      practiceOnlyItemIds: [...manifest.lessonContent.exitGate.practiceOnlyItemIds],
    },
  };
}
