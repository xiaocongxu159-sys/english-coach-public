import Link from "next/link";
import { redirect } from "next/navigation";
import {
  loadAuthenticatedReviewAttemptFeedback,
  loadAuthenticatedReviewLesson,
} from "@/modules/ui/review-server";
import { submitReviewAnswer } from "../actions";
import styles from "./review-session.module.css";

export const dynamic = "force-dynamic";

type ReviewLessonPageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{
    attempt?: string | string[];
    notice?: string | string[];
  }>;
};

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function formatDueAt(dueAt: string | null): string {
  if (!dueAt) return "Not scheduled";
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(due);
}

export default async function ReviewLessonPage({
  params,
  searchParams,
}: ReviewLessonPageProps) {
  const [{ lessonId }, query] = await Promise.all([params, searchParams]);
  const view = await loadAuthenticatedReviewLesson(lessonId);
  if (!view) redirect("/review");

  const attemptId = firstSearchValue(query.attempt) ?? view.attemptId;
  const notice = firstSearchValue(query.notice);
  const feedback = attemptId
    ? await loadAuthenticatedReviewAttemptFeedback(lessonId, attemptId)
    : null;
  const item = view.item;
  const completed = view.status === "completed" || Boolean(view.attemptId);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/review" className={styles.quietLink}>
          ← Review queue
        </Link>
        <span>A1 · reviewed retrieval</span>
      </header>

      <section className={styles.panel} aria-labelledby="review-title">
        <p className="eyebrow">Controlled production</p>
        <h1 id="review-title" className={styles.title}>
          Recall it without a hint
        </h1>
        <p className={styles.nodeTitle}>{view.nodeTitle}</p>
        <p className={styles.prompt}>{item.content.prompt}</p>

        {!completed ? (
          <form action={submitReviewAnswer} className={styles.form}>
            <input type="hidden" name="lessonId" value={view.lessonId} />

            {item.task_type === "short_answer" ? (
              <div className={styles.textAnswer}>
                <input type="hidden" name="responseKind" value="text" />
                <label htmlFor="review-answer">Your answer</label>
                <input
                  id="review-answer"
                  name="text"
                  type="text"
                  maxLength={240}
                  autoComplete="off"
                  required
                />
              </div>
            ) : null}

            {item.task_type === "multiple_choice_single" ? (
              <fieldset className={styles.options}>
                <legend className={styles.srOnly}>{item.content.prompt}</legend>
                <input type="hidden" name="responseKind" value="choice" />
                {(item.content.options ?? []).map((option) => (
                  <label className={styles.option} key={option.id}>
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

            <button type="submit" className={styles.primaryButton}>
              Check answer
            </button>
          </form>
        ) : null}
      </section>

      {notice === "unavailable" ? (
        <section className={styles.notice} aria-live="polite">
          <strong>This review changed before the answer could be applied.</strong>
          <p>
            Return to the queue and use the current authoritative Review Unit state instead of retrying a stale page.
          </p>
        </section>
      ) : null}

      {feedback ? (
        <section
          className={`${styles.feedback} ${
            feedback.correct === true ? styles.feedbackCorrect : styles.feedbackIncorrect
          }`}
          aria-live="polite"
          aria-label="Review answer feedback"
        >
          <strong>{feedback.correct === true ? "Correct." : "Not quite."}</strong>
          {feedback.correct !== true && feedback.correctAnswers.length > 0 ? (
            <p>Reviewed answer: {feedback.correctAnswers.join(" / ")}</p>
          ) : (
            <p>Your answer has been saved to your learning history.</p>
          )}
        </section>
      ) : null}

      {completed ? (
        <section className={styles.completeCard} aria-labelledby="review-complete-title">
          <p className="eyebrow">Review complete</p>
          <h2 id="review-complete-title">The scheduler has the result</h2>
          <p>
            The answer was scored from the persisted reviewed item. Evidence, Mastery and the bound FSRS Review Unit were updated on the server exactly once.
          </p>
          <div className={styles.completeGrid}>
            <div>
              <span>FSRS grade</span>
              <strong>{view.lastGrade ?? "Recorded"}</strong>
            </div>
            <div>
              <span>Next due</span>
              <strong>{formatDueAt(view.dueAt)}</strong>
            </div>
          </div>
          <p>
            <Link href="/review" className={styles.quietLink}>
              Continue review queue →
            </Link>
          </p>
        </section>
      ) : null}
    </main>
  );
}
