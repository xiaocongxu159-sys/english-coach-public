# P1-PWA-001B Today Runtime Fix Handoff

**Date:** 2026-09-11  
**Parent slice:** P1-PWA-001B  
**Issue:** ISSUE-032 — authenticated Today reaches the root error boundary in Production  
**Status:** FIX IN REVIEW — root cause isolated; Production verification pending

## 1. Observed production failure

Both a previously confirmed learner and a brand-new confirmed learner can authenticate successfully, then fail on `/` with the same root error boundary:

```text
Connection problem
We could not load this step.
Reference: 1502838936
```

This ruled out an account-specific data defect.

## 2. Evidence collected before code change

Read-only Production checks proved:

- Auth succeeds and `last_sign_in_at` updates;
- every Auth user has a learner profile;
- the reviewed Pilot blueprint exists and is active;
- both exact Pilot nodes exist and are active;
- current Review schema exists;
- affected learners have no stale Daily Plan to deserialize;
- Supabase request logs show the Today read sequence returning HTTP 200 for learner profile, Daily Plan, blueprint, Pilot nodes, learner node state, prerequisites, curriculum clearance and Review Units.

Vercel then captured the matching Production request:

```text
GET / → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

The failure occurs after successful database reads and before a Today snapshot is returned.

## 3. Root cause

The server-side scheduler configuration loaders used runtime filesystem resolution:

```text
new URL("../../../config/...json", import.meta.url)
→ readFileSync(...)
```

This works in local/CI Node execution, but is not a safe contract for the bundled Vercel server runtime. The Production exception is a Node path/filesystem argument error on the exact Today planning path that first loads scheduler/review configuration.

Two loaders were affected:

- `src/modules/engine/daily-scheduler.mts`
- `src/modules/engine/review-config.mts`

## 4. Narrow fix

Replace runtime `node:fs` reads with static JSON imports:

```text
config/daily-scheduler-v1.config.json
config/review-v1.config.json
```

The project already enables `resolveJsonModule`, so Next/TypeScript can bundle these immutable V1 configuration files with the server module graph.

No scheduler constants, learner state, Supabase data, RLS rules, Review semantics or plan persistence behavior are changed.

## 5. Verification gates

Before merge:

```text
PR validate                    PENDING
PR database-integration        PENDING
Vercel Preview build           PENDING
```

After merge:

```text
merged-main CI                 PENDING
Vercel Production Ready        PENDING
confirmed learner sign-in      PENDING
GET / Today                    PENDING
Daily Plan creation/read       PENDING
no matching Vercel 500         PENDING
```

Only after the real Production Today page loads successfully may ISSUE-032 be marked resolved and P1-PWA-001B continue to the remaining hosted smoke / physical-iPhone gates.

## 6. Safety / rollback

This is a code-only configuration-loading change. No Production database mutation or secret change is required.

Rollback is the previous `main` revision if the PR or Production smoke fails.
