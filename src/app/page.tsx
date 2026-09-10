import Link from "next/link";
import { redirect } from "next/navigation";
import { loadAuthenticatedTodaySnapshot } from "@/modules/ui/today-server";
import { startTodayLesson } from "./lesson/actions";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

function statusLabel(status: "planned" | "in_progress" | "completed" | "superseded") {
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "superseded") return "Updated";
  return "Ready";
}

export default async function Home() {
  const authenticated = await loadAuthenticatedTodaySnapshot();
  if (!authenticated) redirect("/login");

  const { snapshot } = authenticated;
  const { storedPlan, liveReview } = snapshot;
  const plan = storedPlan.plan;
  const lessonRequest = plan.lesson_requests[0];
  const selectedNewCount = plan.selected.new_node_ids.length;
  const lessonActionLabel = storedPlan.status === "planned" ? "Start lesson" : "Resume lesson";

  return (
    <main className="todayShell">
      <header className="todayHeader">
        <div>
          <p className="eyebrow">English Coach</p>
          <h1 className="todayTitle">Today</h1>
          <p className="todayDate">
            {snapshot.planDate} · {snapshot.timezone}
          </p>
        </div>
        <div className="headerActions">
          <Link href="/review" className="quietButton quietLink">
            Review queue
          </Link>
          <form action={logout}>
            <button type="submit" className="quietButton">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="todayHero" aria-labelledby="today-plan-title">
        <div className="todayHeroTopline">
          <span className={`planStatus planStatus-${storedPlan.status}`}>
            {statusLabel(storedPlan.status)}
          </span>
          <span>{plan.time_budget_minutes} min budget</span>
        </div>
        <p className="todayGreeting">
          {snapshot.displayName ? `Hi, ${snapshot.displayName}.` : "Your plan is ready."}
        </p>
        <h2 id="today-plan-title">
          {selectedNewCount > 0 ? snapshot.lessonTitle : "Review and continue"}
        </h2>
        <p className="todayHeroCopy">
          {lessonRequest
            ? `${lessonRequest.minutes} minutes of bounded reviewed work, selected from your current learning state.`
            : "There is no reviewed lesson request ready right now."}
        </p>

        <div className="todayMetrics">
          <div>
            <strong>{selectedNewCount}</strong>
            <span>new nodes</span>
          </div>
          <div>
            <strong>{liveReview.counts.actionable}</strong>
            <span>reviews ready now</span>
          </div>
          <div>
            <strong>{liveReview.counts.upcoming}</strong>
            <span>reviews upcoming</span>
          </div>
        </div>

        {lessonRequest ? (
          <form action={startTodayLesson}>
            <button type="submit" className="quietButton">
              {lessonActionLabel}
            </button>
          </form>
        ) : null}
      </section>

      <section className="todayCard" aria-labelledby="why-title">
        <div className="sectionHeading">
          <p className="eyebrow">Plan logic</p>
          <h2 id="why-title">Why this today?</h2>
        </div>
        <ul className="reasonList">
          {plan.explanations.map((explanation) => (
            <li key={explanation}>{explanation}</li>
          ))}
        </ul>
      </section>

      {plan.warnings.length > 0 ? (
        <section className="todayCard todayWarning" aria-labelledby="warning-title">
          <div className="sectionHeading">
            <p className="eyebrow">Bounded plan</p>
            <h2 id="warning-title">What is intentionally left out</h2>
          </div>
          <ul className="reasonList">
            {plan.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="todayCard compactCard" aria-label="Current learner state">
        <div>
          <span className="detailLabel">Review debt</span>
          <strong className="detailValue">{plan.debt_band}</strong>
        </div>
        <div>
          <span className="detailLabel">Live review</span>
          <strong className="detailValue">
            {liveReview.counts.actionable > 0
              ? `${liveReview.counts.actionable} ready`
              : "Up to date"}
          </strong>
        </div>
        <div>
          <span className="detailLabel">Plan status</span>
          <strong className="detailValue">{statusLabel(storedPlan.status)}</strong>
        </div>
      </section>
    </main>
  );
}
