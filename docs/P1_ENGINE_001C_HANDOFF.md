# P1-ENGINE-001C Planning / Resume Handoff

**Parent:** P1-ENGINE-001 — Minimal planning/lesson/mastery/review engine  
**Submodule:** P1-ENGINE-001C — Curriculum service + bounded Daily Scheduler subset + Lesson resolver/resume  
**Development branch:** `feat/p1-engine-001c-planning-resume`  
**Development PR:** #28 — closed unmerged after final CI because connector could not transition Draft → Ready  
**Release PR:** #29 — squash-merged to `main`  
**Release SHA:** `149bf2d2aac1b3ee1a8426be4880fededf1c4f5b`  
**Merged-main CI:** #145 — application + fresh-Supabase PASS  
**Date:** 2026-09-02  
**Status:** C1 COMPLETE; C2 COMPLETE; C3 COMPLETE; parent P1-ENGINE-001 COMPLETE / merged-main verified  
**Exact next module:** P1-UI-001 — Today + Lesson + Review vertical UI

## Working rule

Each slice advanced only after the previous slice passed permanent application and empty-Supabase regression gates. The implementation did not broaden learner-active curriculum beyond the reviewed two-node Pilot and did not introduce live-AI scored truth.

## C1 — Curriculum Service — COMPLETE

Implemented `src/modules/engine/curriculum-service.mts` as the product-owned prerequisite-readiness boundary used before new learning may enter a Daily Plan.

Verified behavior:

1. active prerequisite-free Pilot roots are eligible for a brand-new learner;
2. non-active curriculum is not schedulable as learner-facing new learning;
3. hard prerequisites require Mastery `functional`/`secure` or explicit Curriculum Clearance;
4. a `lapsed` hard prerequisite blocks dependent new learning even if older clearance exists;
5. soft prerequisites do not fabricate hard blocking;
6. results retain explicit eligibility/block reasons.

Pilot invariants remain unchanged:

- `CF-A1-SOCIAL-GREET-01` — active prerequisite-free root;
- `VX-A1-SOCIAL-FORMULAS-01` — active prerequisite-free root;
- all 735 canonical registry nodes remain lifecycle `draft`;
- no additional learner-active nodes were introduced.

C1 PR #28 CI #104 completed success for both permanent jobs.

## C2 — Bounded Daily Scheduler + persisted Daily Plan — COMPLETE

Implemented:

- `planning-types.mts` — Phase-1 Daily Plan/scheduler contracts;
- `daily-scheduler.mts` — bounded deterministic scheduling using frozen Daily Scheduler + Review config;
- `planning-service.mts` — C1 prerequisite eligibility + reviewed Pilot executability boundary;
- `daily-plan-store.mts` — server-authoritative one-plan-per-learner/date persistence;
- unit and real-Supabase tests for priority, debt, budgets, content gating, RLS, persistence and racing replans.

Verified behavior:

1. due/overdue derives from `due_at` at planning time;
2. overdue uses the frozen 24-hour threshold;
3. lapsed review remains P0 ahead of overdue/due work;
4. review-debt bands and allocation envelopes come from frozen config;
5. learner time budget is not silently extended;
6. severe review debt pauses new learning and high debt caps it;
7. new learning cannot bypass C1 Mastery/Clearance readiness;
8. unavailable/unreviewed curriculum is not selected;
9. excess work is deferred with explicit reason codes;
10. learners read only their own persisted Daily Plan and cannot forge Plan writes;
11. a stale replan cannot downgrade an `in_progress`/`completed` plan;
12. no separate `speaking_focus` Lesson is fabricated when the reviewed Pilot already contains practice-only speaking;
13. 50-minute preference caps the reviewed Pilot at its 18-minute maximum and explicitly leaves extra time unused;
14. a 20-minute first-session result that would contain only one of the two inseparable Pilot nodes is rejected rather than fabricated into a one-node Lesson.

Validation history:

- CI #111 — TypeScript caught nullable Supabase return handling and test fixture inference; fixed.
- CI #117 — Node 24 strip-only execution rejected a constructor parameter property; rewritten with an explicit class field.
- CI #118 — first C2 double-green acceptance.
- later manual C3 cross-layer review found plan→Blueprint coherence and replan-race issues; hardened behavior was re-run successfully in final CI #134/#139 and release CI #144/#145.

## C3 — Lesson Resolver / Resume — COMPLETE

Implemented:

- `pilot-policy.mts` — exact reviewed Blueprint/nodes/items/resume/duration boundary;
- `lesson-resolver.mts` — server-authoritative Pilot resolution + stage checkpoints;
- migration `20260902000300_lesson_resume.sql` — stable `resolution_key`, one-live-resolution uniqueness and checkpoint `revision`;
- unit tests for request/Blueprint boundary rejection;
- real Supabase integration spanning Daily Plan → Lesson → actual 001A Attempt → checkpoint → refresh/relogin resume.

Verified behavior:

1. only exact reviewed two-node Pilot new learning resolves;
2. active reviewed Blueprint and exact reviewed items are revalidated at resolution time;
3. practice-only spoken content remains state-neutral;
4. same Daily Plan/request has one stable `resolution_key` and one non-abandoned live Lesson;
5. repeated/concurrent resolution converges rather than creating duplicate live Lessons;
6. resolving transitions only a still-`planned` Daily Plan to `in_progress`;
7. Lesson state persists exact stages, 001A allowed-item contracts, Blueprint version and resume policy;
8. a real reviewed controlled-production Attempt submitted through 001A remains attached after resume;
9. repeated stage checkpoint is idempotent;
10. two different concurrent stage checkpoints converge through `revision` optimistic CAS/retry;
11. required stages cannot be skipped; optional unscored speaking rehearsal may be skipped;
12. new authenticated session restores only the learner's own Lesson/Attempt state;
13. browser Lesson writes are rejected by PostgreSQL privileges and service-role verification confirms state is unchanged.

Validation history:

- the first C3 database run failed because the test incorrectly expected a forbidden browser UPDATE to return zero-row success; PostgreSQL correctly returned `42501`, so the test was corrected without weakening permissions;
- manual review then found a potential checkpoint lost-update race; server-owned `revision` CAS/retry plus real concurrent DB test fixed it;
- final code CI #134 passed both permanent jobs;
- synchronized development/documentation head CI #139 passed both permanent jobs again.

## P1-ENGINE-001C outcome

**P1-ENGINE-001C is COMPLETE / merged-main verified.**

The implemented path is:

`Curriculum Service → bounded/persisted Daily Plan → reviewed/resumable Lesson Instance → existing deterministic Attempt/Evidence/Mastery → existing exactly-once FSRS Review Adapter`.

No claim is made that Phase 1 is complete. UI, reachable deployment, physical iPhone PWA and full vertical E2E remain open.

## Administrative release PR replacement

PR #28 was intentionally opened as Draft during incremental C1→C2→C3 development. After final CI #139, the connector's ready-for-review GraphQL action failed because its response selection referenced an unavailable GitHub Repository field. GitHub's actual merge endpoint correctly refused the still-Draft PR with HTTP 405.

The project did **not** bypass this by force-updating `main`.

Safe path used:

1. close #28 unmerged, preserving its code/CI history;
2. open normal non-Draft PR #29 from the exact same verified branch;
3. rerun both permanent CI jobs on #29;
4. squash-merge only if #29 is green;
5. verify merged `main` from fresh Supabase.

Release verification:

- PR #29 CI #144 — both permanent jobs PASS;
- PR #29 squash merge SHA — `149bf2d2aac1b3ee1a8426be4880fededf1c4f5b`;
- merged `main` CI #145 — both permanent jobs PASS.

## Parent status

001A, 001B and 001C are all complete and merged-main verified. Parent **P1-ENGINE-001 is COMPLETE**.

## Exact next work — P1-UI-001

Build the minimum learner-facing vertical UI over the verified server-owned engine:

1. Today reads the persisted bounded plan and exposes `why this today?`;
2. learner can start/resume the reviewed Pilot Lesson;
3. Lesson runner renders reviewed stages/items and submits through the existing Attempt engine;
4. feedback/retry preserves idempotency and attempt-group rules;
5. practice-only spoken rehearsal is clearly unscored;
6. simple Review queue reads authoritative Review Units;
7. refresh/relogin resumes the same Lesson and prior attempts;
8. no browser-side shadow source of truth for Plan, Mastery or Review.

P1-UI-001 must keep the permanent application + fresh-Supabase Engine regression gates green.