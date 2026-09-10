import Link from "next/link";
import { redirect } from "next/navigation";
import {
  loadAuthenticatedLessonAttemptFeedback,
  loadAuthenticatedLessonRuntime,
} from "@/modules/ui/lesson-server";
import {
  completeSpeakingPractice,
  continueCurrentInstruction,
  finishLesson,
  runExitCheck,
  skipSpeakingPractice,
  submitDeterministicExercise,
} from "../actions";
import styles from "./lesson.module.css";

export const dynamic = "force-dynamic";

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ attempt?: string | string[] }>;
};

const INSTRUCTION_STAGE_IDS = new Set([
  "everyday_social_context",
  "teach_social_formulas",
  "model_short_interactions",
]);

function stageLabel(stageId: string): string {
  if (stageId === "everyday_social_context") return "Set the context";
  if (stageId === "teach_social_formulas") return "Learn the phrases";
  if (stageId === "model_short_interactions") return "See a short conversation";
  if (stageId === "recognition_check") return "Recognition practice";
  if (stageId === "controlled_formulas") return "Produce the phrases";
  if (stageId === "speaking_rehearsal") return "Say it aloud";
  if (stageId === "exit_check") return "Exit check";
  if (stageId === "lesson_summary") return "Lesson summary";
  return stageId.replaceAll("_", " ");
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function LessonPage({
  params,
  searchParams,
}: LessonPageProps) {
  const [{ lessonId }, query] = await Promise.all([params, searchParams]);
  const authenticated = await loadAuthenticatedLessonRuntime(lessonId);
  if (!authenticated) redirect("/");

  const attemptId = firstSearchValue(query.attempt);
  const feedback = attemptId
    ? await loadAuthenticatedLessonAttemptFeedback(lessonId, attemptId)
    : null;
  const { runtime, exerciseProgress, exitGateResult } = authenticated;
  const { snapshot, currentStage, reviewedContent } = runtime;
  const finishedStages = snapshot.stages.filter(
    (stage) => stage.status === "completed" || stage.status === "skipped",
  ).length;
  const progress = Math.round((finishedStages / snapshot.stages.length) * 100);
  const canContinueInstruction = Boolean(
    currentStage && INSTRUCTION_STAGE_IDS.has(currentStage.id),
  );
  const currentExercise = exerciseProgress?.nextItem ?? null;
  const currentExerciseItem = currentExercise?.item ?? null;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.quietLink}>
          ← Today
        </Link>
        <span className={styles.progressText}>
          {finishedStages}/{snapshot.stages.length} stages
        </span>
      </header>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="Lesson progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className={styles.intro} aria-labelledby="lesson-title">
        <p className="eyebrow">A1 · Reviewed lesson</p>
        <h1 id="lesson-title" className={styles.title}>
          {reviewedContent.title}
        </h1>
        <p className={styles.stageName}>
          {currentStage ? stageLabel(currentStage.id) : "Lesson complete"}
        </p>
      </section>

      {feedback ? (
        <section
          className={`${styles.feedback} ${
            feedback.correct === true ? styles.feedbackCorrect : styles.feedbackIncorrect
          }`}
          aria-live="polite"
          aria-label="Answer feedback"
        >
          <strong>{feedback.correct === true ? "Correct." : "Not quite."}</strong>
          {feedback.correct !== true && feedback.correctAnswers.length > 0 ? (
            <p>Reviewed answer: {feedback.correctAnswers.join(" / ")}</p>
          ) : (
            <p>Your answer has been saved to your learning history.</p>
          )}
        </section>
      ) : null}

      {currentStage?.id === "everyday_social_context" ? (
        <section className={styles.panel} aria-labelledby="lesson-goals-title">
          <p className="eyebrow">What you will do</p>
          <h2 id="lesson-goals-title">Use simple social phrases in real situations</h2>
          <ul className={styles.objectiveList}>
            {reviewedContent.learningObjectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {currentStage?.id === "teach_social_formulas" ? (
        <section className={styles.panel} aria-labelledby="phrases-title">
          <p className="eyebrow">Reviewed phrases</p>
          <h2 id="phrases-title">Five useful social moves</h2>
          <div className={styles.teachList}>
            {reviewedContent.teachBlocks.map((block) => (
              <article className={styles.teachBlock} key={block.key}>
                <h3>{block.title}</h3>
                <p className={styles.teachEnglish}>{block.english}</p>
                <p>{block.explanation}</p>
                <details>
                  <summary>中文提示</summary>
                  <p>{block.supportZh}</p>
                </details>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {currentStage?.id === "model_short_interactions" ? (
        <section className={styles.panel} aria-labelledby="dialogue-title">
          <p className="eyebrow">Model</p>
          <h2 id="dialogue-title">A short first-meeting exchange</h2>
          <div className={styles.dialogueList}>
            {reviewedContent.reviewedDialogue.map((line) => (
              <p className={styles.dialogueLine} key={`${line.speaker}:${line.text}`}>
                <strong>{line.speaker}</strong>
                <span>{line.text}</span>
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {exerciseProgress && currentExercise && currentExerciseItem ? (
        <section className={styles.panel} aria-labelledby="exercise-title">
          <div className={styles.exerciseTopline}>
            <p className="eyebrow">
              {currentStage?.id === "recognition_check" ? "Recognition" : "Production"}
            </p>
            <span>
              {exerciseProgress.answeredCount + 1}/{exerciseProgress.totalCount}
            </span>
          </div>
          <h2 id="exercise-title">{currentExerciseItem.content.prompt}</h2>

          <form action={submitDeterministicExercise} className={styles.exerciseForm}>
            <input type="hidden" name="lessonId" value={snapshot.lesson.id} />
            <input type="hidden" name="stageId" value={exerciseProgress.stageId} />
            <input type="hidden" name="itemId" value={currentExercise.id} />

            {currentExerciseItem.task_type === "multiple_choice_single" ? (
              <fieldset className={styles.optionFieldset}>
                <legend className={styles.srOnly}>{currentExerciseItem.content.prompt}</legend>
                <input type="hidden" name="responseKind" value="choice" />
                {(currentExerciseItem.content.options ?? []).map((option) => (
                  <label className={styles.optionCard} key={option.id}>
                    <input
                      type="radio"
                      name="selectedOptionId"
                      value={option.id}
                      required
                    />
                    <span>{option.text}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}

            {currentExerciseItem.task_type === "short_answer" ? (
              <div className={styles.textAnswer}>
                <input type="hidden" name="responseKind" value="text" />
                <label htmlFor={`answer-${currentExercise.id}`}>Your answer</label>
                <input
                  id={`answer-${currentExercise.id}`}
                  name="text"
                  type="text"
                  maxLength={240}
                  autoComplete="off"
                  required
                />
              </div>
            ) : null}

            <button type="submit" className={styles.primaryButton}>
              Check answer
            </button>
          </form>
        </section>
      ) : null}

      {currentStage?.id === "speaking_rehearsal" ? (
        <section className={styles.panel} aria-labelledby="speaking-title">
          <p className="eyebrow">Speaking rehearsal · practice only</p>
          <h2 id="speaking-title">Say the phrases aloud</h2>
          <p className={styles.practicePrompt}>{reviewedContent.speakingPractice.prompt}</p>
          <p className={styles.practiceNote}>
            This rehearsal is not scored yet. It will not create trusted Mastery evidence until a
            validated speech evaluator is available.
          </p>
          <div className={styles.practiceActions}>
            <form action={completeSpeakingPractice}>
              <input type="hidden" name="lessonId" value={snapshot.lesson.id} />
              <button type="submit" className={styles.primaryButton}>
                I practiced aloud
              </button>
            </form>
            <form action={skipSpeakingPractice}>
              <input type="hidden" name="lessonId" value={snapshot.lesson.id} />
              <button type="submit" className={styles.secondaryButton}>
                Skip for now
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {currentStage?.id === "exit_check" ? (
        <section className={styles.panel} aria-labelledby="exit-title">
          <p className="eyebrow">Exit check</p>
          <h2 id="exit-title">Check this lesson&apos;s scored practice</h2>
          <p className={styles.practicePrompt}>
            This check uses the answers already saved from this lesson. You do not need to answer
            anything again.
          </p>
          <ul className={styles.objectiveList}>
            <li>
              At least {reviewedContent.exitGate.minimumCorrect} of {reviewedContent.exitGate.scoredItemCount}
              {" "}scored items must be correct.
            </li>
            <li>Both key controlled-production checks must be correct.</li>
            <li>Speaking rehearsal is practice-only and is not included in this score.</li>
          </ul>
          <form action={runExitCheck} className={styles.exerciseForm}>
            <input type="hidden" name="lessonId" value={snapshot.lesson.id} />
            <button type="submit" className={styles.primaryButton}>
              Check lesson
            </button>
          </form>
        </section>
      ) : null}

      {currentStage?.id === "lesson_summary" ? (
        <section className={styles.panel} aria-labelledby="summary-title">
          <p className="eyebrow">
            {exitGateResult?.passed ? "Exit check passed" : "More practice needed"}
          </p>
          <h2 id="summary-title">Lesson summary</h2>
          {exitGateResult ? (
            <>
              <p className={styles.practicePrompt}>
                You got {exitGateResult.correctCount} of {exitGateResult.scoredItemCount} scored
                items correct.
              </p>
              {exitGateResult.passed ? (
                <p className={styles.practiceNote}>
                  You met this lesson&apos;s exit gate. Your evidence and review schedule have already
                  been stored.
                </p>
              ) : (
                <p className={styles.practiceNote}>
                  This lesson is still safe to finish. The saved result shows that some reviewed
                  material needs more practice and can be revisited later.
                </p>
              )}
              {exitGateResult.failedRequiredItemIds.length > 0 ? (
                <p className={styles.practiceNote}>
                  A key controlled-production phrase still needs practice.
                </p>
              ) : null}
            </>
          ) : (
            <p className={styles.practiceNote}>
              The exit result is not available yet. Return to the exit check before finishing.
            </p>
          )}
          <p className={styles.practiceNote}>
            Finishing a lesson does not mean full Mastery. Mastery is derived separately from
            trusted evidence across sessions and time.
          </p>
          {exitGateResult ? (
            <form action={finishLesson} className={styles.exerciseForm}>
              <input type="hidden" name="lessonId" value={snapshot.lesson.id} />
              <button type="submit" className={styles.primaryButton}>
                Finish lesson
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      {!currentStage ? (
        <section className={styles.panel} aria-labelledby="complete-title">
          <p className="eyebrow">Complete</p>
          <h2 id="complete-title">This lesson is complete.</h2>
          {exitGateResult ? (
            <p className={styles.practicePrompt}>
              Exit check: {exitGateResult.correctCount}/{exitGateResult.scoredItemCount} ·{" "}
              {exitGateResult.passed ? "gate met" : "more practice needed"}
            </p>
          ) : null}
          <p className={styles.practiceNote}>
            Your persisted attempts, evidence, Mastery state, and review schedule remain separate
            from lesson completion and will be reflected in future planning.
          </p>
          <div className={styles.practiceActions}>
            <Link href="/" className={styles.secondaryButton}>
              Back to Today
            </Link>
          </div>
        </section>
      ) : null}

      {canContinueInstruction ? (
        <form action={continueCurrentInstruction} className={styles.actionBar}>
          <input type="hidden" name="lessonId" value={snapshot.lesson.id} />
          <button type="submit" className={styles.primaryButton}>
            Continue
          </button>
        </form>
      ) : null}
    </main>
  );
}
