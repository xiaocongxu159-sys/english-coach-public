"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="app-error-title">
        <p className="eyebrow">Connection problem</p>
        <h1 id="app-error-title">We could not load this step.</h1>
        <p className="lead">
          Check your connection, then retry. Your saved learning state lives on the server, so the
          next request can resume from the authoritative persisted state.
        </p>
        <div className="statusCard" role="alert">
          <span className="statusDot" aria-hidden="true" />
          <div>
            <strong>Your saved progress remains authoritative.</strong>
            <p>
              {error.digest
                ? `Reference: ${error.digest}`
                : "If the previous request already reached the server, retry will reload its persisted result instead of intentionally duplicating trusted progress."}
            </p>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <button type="button" className="quietButton" onClick={reset}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}
