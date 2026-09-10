import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReviewQueuePriority } from "@/modules/ui/review-queue-service.mts";
import { loadAuthenticatedReviewQueueSnapshot } from "@/modules/ui/review-queue-server";
import { startReviewUnit } from "./actions";

export const dynamic = "force-dynamic";

type ReviewQueuePageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

function priorityLabel(priority: ReviewQueuePriority): string {
  if (priority === "relearning") return "Relearning";
  if (priority === "overdue") return "Overdue";
  if (priority === "due") return "Due now";
  if (priority === "not_due") return "Upcoming";
  return "Not scheduled";
}

function evidenceLabel(evidenceType: string): string {
  return evidenceType.replaceAll("_", " ");
}

function formatDueAt(dueAt: string | null, timezone: string): string {
  if (!dueAt) return "No due time yet";
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return "Invalid due time";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(due);
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function ReviewQueuePage({ searchParams }: ReviewQueuePageProps) {
  const [authenticated, query] = await Promise.all([
    loadAuthenticatedReviewQueueSnapshot(),
    searchParams,
  ]);
  if (!authenticated) redirect("/login");

  const { snapshot, timezone, startableReviewUnitIds } = authenticated;
  const startable = new Set(startableReviewUnitIds);
  const notice = firstSearchValue(query.notice);

  return (
    <main className="todayShell reviewShell">
      <header className="todayHeader">
        <div>
          <p className="eyebrow">English Coach</p>
          <h1 className="todayTitle">Review</h1>
          <p className="todayDate">
            {snapshot.counts.actionable} ready now · {snapshot.counts.upcoming} upcoming
          </p>
        </div>
        <Link href="/" className="quietButton quietLink">
          Back to Today
        </Link>
      </header>

      {notice === "unavailable" ? (
        <section className="todayCard todayWarning" aria-live="polite">
          <div className="sectionHeading">
            <p className="eyebrow">Review changed</p>
            <h2>This review is no longer available from that page state.</h2>
          </div>
          <p className="reviewCopy">
            The queue has been reloaded from the authoritative Review Unit state. Choose a review that is ready now.
          </p>
        </section>
      ) : null}

      <section className="todayHero reviewHero" aria-labelledby="review-queue-title">
        <div className="todayHeroTopline">
          <span className="planStatus">
            {snapshot.counts.actionable > 0 ? "Review ready" : "Queue clear"}
          </span>
          <span>{snapshot.counts.total} review units</span>
        </div>
        <p className="todayGreeting">Your persisted review queue</p>
        <h2 id="review-queue-title">
          {snapshot.counts.actionable > 0
            ? "Retrieve what is due next"
            : "Nothing is due right now"}
        </h2>
        <p className="todayHeroCopy">
          Priority is calculated from your current Mastery and authoritative FSRS due time every time this page loads. Supported single-target reviewed retrievals can now be answered here.
        </p>

        <div className="todayMetrics reviewMetrics">
          <div>
            <strong>{snapshot.counts.relearning}</strong>
            <span>relearning</span>
          </div>
          <div>
            <strong>{snapshot.counts.overdue}</strong>
            <span>overdue</span>
          </div>
          <div>
            <strong>{snapshot.counts.due}</strong>
            <span>due now</span>
          </div>
        </div>
      </section>

      {snapshot.items.length === 0 ? (
        <section className="todayCard reviewEmpty" aria-labelledby="review-empty-title">
          <div className="sectionHeading">
            <p className="eyebrow">Queue status</p>
            <h2 id="review-empty-title">No review units yet</h2>
          </div>
          <p className="reviewCopy">
            Reviewed exercises will create authoritative review units as trusted learning evidence accumulates.
          </p>
        </section>
      ) : (
        <section className="reviewList" aria-label="Authoritative review queue">
          {snapshot.items.map((item) => {
            const canStart = startable.has(item.reviewUnitId);
            return (
              <article className="todayCard reviewItem" key={item.reviewUnitId}>
                <div className="reviewItemHeader">
                  <div>
                    <p className="eyebrow">{evidenceLabel(item.evidenceType)}</p>
                    <h2>{item.nodeTitle}</h2>
                  </div>
                  <span className={`reviewPriority reviewPriority-${item.priority}`}>
                    {priorityLabel(item.priority)}
                  </span>
                </div>

                <p className="reviewCopy">{item.explanation}</p>

                <dl className="reviewDetails">
                  <div>
                    <dt>Due</dt>
                    <dd>{formatDueAt(item.dueAt, timezone)}</dd>
                  </div>
                  <div>
                    <dt>Mastery</dt>
                    <dd>{item.masteryStatus}</dd>
                  </div>
                </dl>

                {canStart ? (
                  <form action={startReviewUnit} style={{ marginTop: 18 }}>
                    <input type="hidden" name="reviewUnitId" value={item.reviewUnitId} />
                    <button type="submit" className="quietButton">
                      Start review
                    </button>
                  </form>
                ) : item.actionable ? (
                  <p className="reviewCopy">
                    This due unit stays visible, but it is not clickable yet because the current Phase 1 UI only accepts deterministic single-target controlled-production review items.
                  </p>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      <section className="todayCard todayWarning" aria-labelledby="review-boundary-title">
        <div className="sectionHeading">
          <p className="eyebrow">Authoritative answer path</p>
          <h2 id="review-boundary-title">The browser does not choose the grade</h2>
        </div>
        <p className="reviewCopy">
          Starting a review creates or resumes one server-owned Review Lesson. Your browser submits only the raw answer; the persisted reviewed item, Attempt slot, Evidence, Mastery transition and FSRS update are re-derived and validated on the server.
        </p>
      </section>
    </main>
  );
}
