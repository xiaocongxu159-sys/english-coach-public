# P1-PWA-001B Today Runtime Fix Handoff

**Date:** 2026-09-11  
**Parent slice:** P1-PWA-001B  
**Issue:** ISSUE-032 — authenticated Today reaches the root error boundary in Production  
**Status:** RESOLVED / PRODUCTION VERIFIED

## 1. Observed production failure

Both a previously confirmed learner and a brand-new confirmed learner authenticated successfully, then failed on `/` with the same root error boundary:

```text
Connection problem
We could not load this step.
Reference: 1502838936
```

This ruled out an account-specific data defect.

## 2. Evidence collected before code change

Read-only Production checks proved:

- Auth succeeded and `last_sign_in_at` updated;
- every Auth user had a learner profile;
- the reviewed Pilot blueprint existed and was active;
- both exact Pilot nodes existed and were active;
- current Review schema existed;
- affected learners had no stale Daily Plan to deserialize;
- Supabase request logs showed the Today read sequence returning HTTP 200 for learner profile, Daily Plan, blueprint, Pilot nodes, learner node state, prerequisites, curriculum clearance and Review Units.

Vercel captured the matching Production request:

```text
GET / → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

The failure occurred after successful database reads and before a Today snapshot was returned.

## 3. Root cause

The server-side scheduler configuration loaders used runtime filesystem resolution:

```text
new URL("../../../config/...json", import.meta.url)
→ readFileSync(...)
```

This works in local/CI Node execution but is not a safe contract for the bundled Vercel server runtime.

Affected loaders:

- `src/modules/engine/daily-scheduler.mts`
- `src/modules/engine/review-config.mts`

## 4. Narrow fix

Runtime `node:fs` reads were replaced with static JSON imports:

```text
config/daily-scheduler-v1.config.json
config/review-v1.config.json
```

No scheduler constants, learner state, Supabase data, RLS rules, Review semantics or plan-persistence behavior changed.

## 5. Production verification

After PR CI, merge and Vercel Production deployment, the fresh confirmed learner signed in and loaded the real Today page successfully.

Observed Production Today snapshot:

```text
35 min profile budget
14 minutes of bounded reviewed work
2 new nodes
0 reviews ready now
0 reviews upcoming
```

The page rendered the expected reviewed Pilot and `Start lesson` became usable. The learner then started the reviewed Lesson, proving Today planning and Lesson handoff were functioning in the hosted Production environment.

## 6. Final result

```text
confirmed learner sign-in      PASS
GET / Today                    PASS
Daily Plan creation/read       PASS
expected reviewed Pilot        PASS
Start lesson                   PASS
prior Vercel path 500          RESOLVED
```

ISSUE-032 is resolved and Production verified.

## 7. Follow-on issue discovered

A later Lesson exercise submission exposed the same runtime-filesystem class in the remaining Mastery configuration loader (`mastery-v1.config.json`). That separate defect is ISSUE-033 and is documented in `docs/P1_PWA_001B_LESSON_RUNTIME_FIX_HANDOFF.md`. It was subsequently fixed and Production verified through 8/8 Lesson completion.
