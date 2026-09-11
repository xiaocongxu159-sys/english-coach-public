# P1-PWA-001B Lesson Runtime Fix Handoff

**Date:** 2026-09-11  
**Parent slice:** P1-PWA-001B  
**Issue:** ISSUE-033 — Lesson exercise submission reaches the root error boundary in Production  
**Status:** RESOLVED / PRODUCTION VERIFIED

## 1. Observed production failure

After the earlier Today runtime fix, the hosted Production flow reached the real Today page and successfully started the reviewed Phase 1 lesson.

During Lesson use, a server action POST to the active lesson route failed:

```text
POST /lesson/<lesson-instance-id> → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

The learner-facing root error boundary displayed:

```text
Connection problem
We could not load this step.
Reference: 246545820
```

Nearby Lesson GET/POST requests were 200 before the failing POST, so this was a later runtime failure inside Lesson progression rather than a login, routing, or initial Lesson-load failure.

## 2. Root cause

The deterministic exercise submission path calls `submitExerciseAttempt()`. That function loads Mastery configuration through `getMasteryConfig()` before applying state-affecting Mastery/Review logic.

`src/modules/engine/config.mts` still used the same runtime filesystem pattern that had already failed for Today scheduler configuration:

```text
new URL("../../../config/mastery-v1.config.json", import.meta.url)
→ readFileSync(...)
```

That local/CI Node filesystem assumption is not a safe contract for the bundled Vercel server runtime and matched the exact Production `path` TypeError.

The call chain was:

```text
Lesson server action POST
→ submitAuthenticatedCurrentDeterministicExercise()
→ submitCurrentDeterministicExercise()
→ submitExerciseAttempt()
→ getMasteryConfig()
→ runtime filesystem path resolution
→ Vercel 500
```

## 3. Narrow fix

Runtime `node:fs` loading was replaced with a static JSON import:

```text
config/mastery-v1.config.json
```

The fixed loader is equivalent to the already-corrected scheduler/review configuration loaders:

```ts
import masteryConfig from "../../../config/mastery-v1.config.json" with { type: "json" };

const MASTERY_CONFIG = masteryConfig as MasteryConfig;

export function getMasteryConfig(): MasteryConfig {
  return MASTERY_CONFIG;
}
```

No Mastery thresholds, scoring rules, learner records, Supabase rows, Review semantics, lesson checkpoint semantics, or content were changed.

## 4. Verification chain

PR #6 `fix: bundle mastery config for Vercel lesson runtime` passed all pre-merge gates:

```text
validate                  PASS
database-integration      PASS
Vercel Preview            PASS
```

It was squash-merged to `main` as:

```text
557acfb43944490f991fb1f723299cce70e4e8d8
```

Merged-main verification also passed:

```text
validate                  PASS
database-integration      PASS
Vercel Production         PASS
```

## 5. Real Production acceptance

The learner resumed the same hosted Lesson after deployment instead of resetting the account or recreating the Lesson.

The flow progressed beyond the previously failing Lesson POST and completed all stages:

```text
8/8 stages
Lesson complete
Exit check: 9/10 · more practice needed
```

The Production completion screen explicitly states that persisted attempts, evidence, Mastery state and Review schedule remain separate from Lesson completion and will feed future planning.

This is the required real-device/browser proof that:

- the same Lesson can resume after the runtime failure;
- the previously failing exercise-submission path now works;
- Lesson stage checkpointing continues through the full reviewed Pilot;
- the Lesson reaches its Summary/complete state without the prior Vercel `path` 500.

## 6. Safety / rollback outcome

This was a code-only configuration-loading fix. No Production database reset, migration, secret change, learner reset, or lesson-state rewrite was needed.

The existing idempotent exercise submission contract was preserved. The learner's existing Lesson state survived the failure and was able to continue after deployment.

## 7. Related Production runtime class

Two hosted failures shared the same configuration-loading class:

- Today: `daily-scheduler-v1.config.json` / `review-v1.config.json` runtime filesystem reads;
- Lesson attempt/Mastery: `mastery-v1.config.json` runtime filesystem read.

All three immutable server configuration files now use static JSON imports so Vercel bundles them with the server module graph.

## 8. Final status

```text
Lesson initial load                  PASS
Lesson resume after prior failure    PASS
Exercise submission                  PASS
Stage progression                    PASS
Exit check                           PASS — 9/10
Lesson completion                    PASS — 8/8 stages
Prior Lesson POST path TypeError      RESOLVED
```

ISSUE-033 is resolved and Production verified. The next product gate is no longer this runtime defect; it is the remaining P1-PWA physical-iPhone / deployed vertical acceptance work.
