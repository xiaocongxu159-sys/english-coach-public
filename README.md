# English Coach

**Status:** Phase 0 frozen; Phase 1 vertical slice in deployment/PWA validation  
**Design Baseline:** Phase 0 Freeze v1.0  
**Current verified implementation:** P1-UI-001 COMPLETE / merged-main verified  
**Current milestone:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Verified main:** `97cc2a42d864d58b36256b0f9764eccae20bdf34` / CI #230 double-green  
**Roadmap:** Phase 0–8, **9 phases total**  
**Date:** 2026-09-03

English Coach is an AI-adaptive English learning system designed around two equal outcomes:

1. genuine real-world English communication ability, especially productive/practical English;
2. progression toward IELTS readiness.

The product is **not** a free-form AI chat app. The learning core uses a structured A1–B2 curriculum, evidence-driven Mastery, spaced Review, bounded Daily planning, productive English practice and a separate IELTS-readiness layer. AI is bounded by product-owned deterministic learning-state rules.

## Current project state

### Phase 0 — COMPLETE / FROZEN

The frozen design baseline includes:

- A1–B2 Knowledge Graph — 735 design nodes;
- Lesson Blueprint / Lesson Instance;
- Mastery Evidence / Learner Node State;
- Review Unit / FSRS adapter boundary;
- adaptive Placement + Curriculum Clearance;
- bounded Daily Scheduler;
- Listening / Exercise specifications;
- IELTS progression/readiness model;
- AI teaching and PWA/iPhone architecture boundaries.

### Phase 1 — IN PROGRESS

Completed and merged-main verified:

- `P1-BOOT-001` — application/PWA shell + permanent CI;
- `P1-DATA-001` — deterministic 735-node registry;
- `P1-DB-001` — Supabase Auth/migrations/RLS/trust boundaries;
- `P1-PILOT-001` — reviewed prerequisite-free two-node A1 Pilot;
- `P1-ENGINE-001` — Curriculum → Daily Plan → Lesson → Attempt → Evidence → Mastery → exactly-once FSRS Review;
- `P1-UI-001A` — Today;
- `P1-UI-001B` — real Lesson Runner;
- `P1-UI-001C` — learner Review queue/session + later Today live Review reflection.

Current learner-facing local/fresh-CI path:

```text
login
→ Today bounded plan
→ Start/Resume reviewed Lesson
→ reviewed instruction/model
→ deterministic recognition + controlled-production exercises
→ persisted feedback
→ Evidence / Mastery / FSRS Review
→ practice-only speaking
→ server-derived Exit Check
→ Lesson Summary
→ Review queue
→ Start/Resume supported due Review
→ deterministic Review answer
→ persisted feedback / FSRS grade / next due
→ return to Today
→ live Review readiness reflects updated persisted state
```

The started Daily Plan remains frozen for historical/concurrency correctness; Today reads current Review readiness through a separate authoritative live Review snapshot.

## Phase 1 learner-active scope

Only the reviewed Pilot is learner-active:

- `CF-A1-SOCIAL-GREET-01`;
- `VX-A1-SOCIAL-FORMULAS-01`.

The remaining canonical registry nodes remain `draft` and must not be activated merely because they exist.

Current scored truth is deterministic reviewed content. Speaking rehearsal remains state-neutral until a validated speech evaluator exists.

## Current gate — P1-PWA-001

The application is now usable in the verified local/fresh-Supabase vertical slice. Phase 1 is still incomplete because the real hosted/mobile environment has not been proven.

Next sequence:

```text
hosted Supabase
→ production environment/secrets
→ hosted migrations from empty state
→ reviewed Pilot + Review Blueprint seed
→ Auth redirects + confirmation email template
→ reachable HTTPS deployment
→ hosted desktop smoke
→ physical iPhone PWA install/open/resume smoke
→ P1-E2E-001 full deployed vertical gate
```

Do not claim physical iPhone or hosted email behavior before those tests actually run.

## Local validation

With Node 24 and locked dependencies:

```bash
npm ci
npm run check
```

Permanent application CI validates:

- Phase 0 contracts;
- deterministic 735-node registry;
- reviewed Pilot + Review Blueprint;
- Biome lint;
- TypeScript;
- node tests;
- Next production build.

Permanent database CI starts a disposable Supabase stack and verifies:

- empty migration replay;
- Auth/RLS isolation;
- idempotent reviewed-content seed;
- Pilot trust boundaries;
- deterministic Engine persistence/concurrency;
- Today/Lesson/Review learner flows.

## Deployment work intentionally not claimed yet

- hosted Supabase project/environment not connected;
- production secrets not configured;
- hosted confirmation email flow not E2E verified;
- reachable HTTPS app not yet deployed;
- physical iPhone PWA validation not yet performed;
- final deployed P1-E2E-001 not yet passed.

## Key documents

- `docs/PROJECT_PLAN.md` — roadmap/current gate/Phase 1 Definition of Done
- `docs/IMPLEMENTATION_HANDOFF.md` — authoritative current implementation handoff
- `docs/P1_ENGINE_001C_HANDOFF.md` — planning/resume engine handoff
- `docs/P1_UI_001B_HANDOFF.md` — Lesson Runner handoff
- `docs/P1_UI_001C_HANDOFF.md` — Review + Today vertical integration handoff
- `docs/DEVELOPMENT_LOG.md` — verified implementation/release timeline
- `docs/ISSUES_AND_SOLUTIONS.md` — issue/root-cause/resolution ledger
- `docs/PHASE0_FREEZE_REVIEW.md` — frozen design audit

## Release discipline

A feature is not considered complete merely because code exists. Formal completion requires the applicable PR CI, merge, merged-main CI and handoff documentation to agree. Phase 1 itself only completes after the deployed hosted loop and physical iPhone PWA are verified.