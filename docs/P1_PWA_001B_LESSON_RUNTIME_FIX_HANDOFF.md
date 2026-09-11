# P1-PWA-001B Lesson Runtime Fix Handoff

**Date:** 2026-09-11  
**Parent slice:** P1-PWA-001B  
**Issue:** ISSUE-033 — Lesson exercise submission reaches the root error boundary in Production  
**Status:** FIX IN REVIEW — root cause isolated; Production verification pending

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

Nearby Lesson GET/POST requests were 200 before the failing POST, so this is a later runtime failure inside Lesson progression rather than a login, routing, or initial Lesson-load failure.

## 2. Root cause

The deterministic exercise submission path calls `submitExerciseAttempt()`. That function always loads Mastery configuration through `getMasteryConfig()` before applying state-affecting Mastery/Review logic.

`src/modules/engine/config.mts` still used the same runtime filesystem pattern that had already failed for Today scheduler configuration:

```text
new URL("../../../config/mastery-v1.config.json", import.meta.url)
→ readFileSync(...)
```

That local/CI Node filesystem assumption is not a safe contract for the bundled Vercel server runtime and matches the exact Production `path` TypeError.

The call chain is:

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

Replace runtime `node:fs` loading with a static JSON import:

```text
config/mastery-v1.config.json
```

The fixed loader is intentionally equivalent to the already-corrected scheduler/review configuration loaders:

```ts
import masteryConfig from "../../../config/mastery-v1.config.json" with { type: "json" };

const MASTERY_CONFIG = masteryConfig as MasteryConfig;

export function getMasteryConfig(): MasteryConfig {
  return MASTERY_CONFIG;
}
```

No Mastery thresholds, scoring rules, learner records, Supabase rows, Review semantics, lesson checkpoint semantics, or content are changed.

## 4. Safety

This is a code-only configuration-loading fix.

No Production database mutation, migration, secret change, learner reset, or lesson-state rewrite is required.

The existing idempotent exercise submission contract remains unchanged, so retrying the same learner action after deployment must not duplicate trusted evidence.

## 5. Verification gates

Before merge:

```text
PR validate                    PENDING
PR database-integration        PENDING
Vercel Preview build           PENDING
```

After merge:

```text
merged-main validate           PENDING
merged-main database-integration PENDING
Vercel Production Ready        PENDING
resume same Lesson             PENDING
exercise submission            PENDING
no matching Lesson POST 500    PENDING
persisted progress resumes     PENDING
```

Only after the same Production lesson resumes and progresses beyond the previously failing action may this issue be marked resolved.

## 6. Related prior Production issue

The earlier Today runtime error had the same class of root cause in:

- `src/modules/engine/daily-scheduler.mts`
- `src/modules/engine/review-config.mts`

Those were changed to static JSON imports and Production Today subsequently loaded successfully.

This Lesson failure demonstrates why server-runtime configuration must not depend on `import.meta.url` + `readFileSync` for immutable bundled JSON configuration.
