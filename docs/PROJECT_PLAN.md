# Project Plan

**Project:** English Coach  
**Design Baseline:** Phase 0 Freeze v1.0  
**Updated:** 2026-09-03  
**Current Phase:** Phase 1 — Usable Vertical Slice  
**Current module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Current verified release:** P1-PWA-001A COMPLETE / MERGED-MAIN VERIFIED at `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`; merged-main CI #243 application + fresh-Supabase double-green  
**Current PWA slice:** P1-PWA-001B — hosted Supabase + Vercel reachable deployment

## Long-term goal

Build a systematic AI English-learning product for two equal outcomes:

1. genuine real-world communication ability, especially productive speaking/practical English;
2. IELTS readiness sufficient for the user's long-term target.

The product remains structured-learning first: deterministic curriculum/state boundaries with bounded AI, not free-form chat as the source of truth.

## Core principles

System before chat; production before recognition; Real English + IELTS; bounded AI; mastery over completion; mandatory review; explainable progress; reuse infrastructure/own pedagogy; validate before advancing; usable vertical slice before horizontal expansion.

## Overall phase map — 9 phases total

- **Phase 0 — Product & Curriculum Design:** COMPLETE / frozen.
- **Phase 1 — Usable Vertical Slice:** CURRENT; make one trustworthy loop work end-to-end on desktop and physical iPhone PWA.
- **Phase 2 — Core Learning Expansion:** broaden reviewed curriculum/content and engine behavior only after Phase 1 is reliable.
- **Phase 3 — Realtime AI Speaking:** realtime speech, curriculum-driven conversation, correction/retry and validated speaking evidence.
- **Phase 4 — Listening & Reading Pipelines:** validated listening/reading asset production, delivery and assessment.
- **Phase 5 — Writing System:** writing workflow, rubric feedback, revision loops and calibration.
- **Phase 6 — IELTS Production & Diagnostics:** IELTS-style practice, timed diagnostics and calibrated readiness evidence.
- **Phase 7 — Personalization & Reporting:** stronger adaptive planning, weakness analysis and longitudinal reporting.
- **Phase 8 — Native iOS Decision:** decide whether sustained PWA usage justifies native iOS/TestFlight/App Store work.

The numbering is `0–8`, therefore the roadmap contains **9 phases**. After Phase 1 there are **7 full phases (2–8)**.

## Phase 0 — COMPLETE

Frozen deliverables include:

- 735-node A1→B2 knowledge graph;
- Lesson Blueprint/Instance schema;
- Mastery Model;
- Spaced Review Model;
- Placement/Curriculum Clearance design;
- Daily Scheduler rules;
- Listening and Exercise specifications;
- IELTS progression gates;
- cross-document freeze review.

The 735 canonical registry nodes remain design inventory. Registry existence never means learner activation.

## Phase 1 objective

Phase 1 must prove this real loop:

```text
authenticated learner
→ bounded Today Plan
→ reviewed Lesson
→ deterministic Attempt
→ Evidence
→ Mastery
→ exactly-once FSRS Review
→ learner Review session
→ later Today reflects current persisted state
→ refresh/relogin survives
→ same loop works in a deployed physical iPhone PWA
```

Only the reviewed A1 Pilot is learner-active during Phase 1.

## Phase 1 planned order and current status

- [x] **P1-BOOT-001** — Next.js/TypeScript/PWA scaffold + permanent validation/CI baseline.
- [x] **P1-DATA-001** — deterministic 735-node registry; A1 124 / A2 164 / B1 206 / B2 241; graph validation 735/735.
- [x] **P1-DB-001** — Supabase Auth, migrations, RLS and browser/server/service-role trust boundaries; fresh-database CI.
- [x] **P1-PILOT-001** — reviewed prerequisite-free A1 Pilot with exactly two learner-active roots:
  - `CF-A1-SOCIAL-GREET-01`;
  - `VX-A1-SOCIAL-FORMULAS-01`.
- [x] **P1-ENGINE-001** — COMPLETE / MERGED-MAIN VERIFIED.
  - deterministic Attempt → Evidence → Mastery;
  - exactly-once FSRS Review Adapter;
  - Curriculum Service → bounded persisted Daily Plan → reviewed Lesson Resolver/Resume;
  - release merge `149bf2d2aac1b3ee1a8426be4880fededf1c4f5b`; merged-main CI #145 double-green.
- [x] **P1-UI-001** — COMPLETE / MERGED-MAIN VERIFIED.
  - Today merge `cf099c14e097bbd3ffdc5a801d7e694db5ec333c`; main CI #158;
  - Lesson Runner merge `415fa68459423f3526d28e86a7308ec7b529bcc5`; main CI #215;
  - Review backend merge `911d9552cfc5586844d91f4d1ac7ded51c462363`; main CI #226;
  - clickable Review UI merge `a525193a0520e512a970f7c1e7aa37331adf3aab`; main CI #228;
  - live Review reflection on Today merge `97cc2a42d864d58b36256b0f9764eccae20bdf34`; main CI #230;
  - UI completion/documentation merge `b0a300f86e54808604665c5a582c40a9106ca4e3`; main CI #232.
- [ ] **P1-PWA-001** — CURRENT.
  - [x] **P1-PWA-001A — deployment/PWA code readiness** — COMPLETE / MERGED-MAIN VERIFIED.
    - production `NEXT_PUBLIC_APP_URL` fails closed and requires HTTPS/origin-root configuration;
    - signup confirmation callback uses the validated application origin;
    - manifest freezes stable root `id/start_url/scope`, standalone display and iPhone-compatible `purpose: any` icon;
    - existing Apple web-app metadata, `viewport-fit=cover`, safe-area handling and responsive phone layout retained;
    - interactive button/input/select controls have 44px minimum height;
    - root learner-facing error boundary exposes Retry without guessing whether a disconnected request committed server state;
    - Service Worker/offline cache intentionally not added because Phase 1 frozen iPhone acceptance does not require offline content;
    - feature code head `87182c39a845f53aa470e0001afaf6e97c42eb08`; code CI #236 double-green;
    - final code+docs CI #242 double-green;
    - PR #38 squash-merged as `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`;
    - merged-main CI #243 application + fresh-Supabase double-green;
    - detailed handoff `docs/P1_PWA_001_HANDOFF.md`.
  - [ ] **P1-PWA-001B — hosted environment + reachable deployment** — CURRENT.
  - [ ] **P1-PWA-001C — physical iPhone smoke** — requires actual deployed HTTPS app + device.
- [ ] **P1-E2E-001** — full deployed vertical-slice release gate.

## Verified learner-facing path before deployment

```text
Today
→ Start / Resume reviewed Lesson
→ instruction / model content
→ 5 recognition items
→ 5 controlled-production items
→ persisted deterministic feedback
→ state-neutral speaking rehearsal or skip
→ server-derived Exit Gate
→ Lesson Summary / completed Lesson
→ Review queue
→ Start / Resume supported due Review
→ deterministic reviewed answer
→ persisted feedback + FSRS grade + next due
→ return to Today
→ live Review readiness reflects the updated Review Unit
```

## Trust boundaries PWA/E2E must preserve

- learner identity comes from validated Supabase session on state-changing paths;
- browser cannot directly write Daily Plan, Lesson, Attempt, Evidence, Mastery, Review Unit or Review Event truth;
- current scored truth is deterministic reviewed content only;
- spoken rehearsal remains practice-only and Mastery/Review neutral;
- due/overdue is derived from `due_at` at read/planning time;
- exact replays are idempotent and conflicting/stale requests fail closed;
- a started Daily Plan remains frozen; Today may load separate live Review state;
- production service-role secrets remain server-only;
- production confirmation email returns through the server token-hash callback;
- a network response failure is not treated as proof that the server committed nothing.

## P1-PWA-001 frozen physical acceptance

At minimum prove on a physical iPhone:

- Add to Home Screen;
- standalone launch behavior;
- responsive Today/Lesson/Review flow;
- auth/session persistence;
- interruption/resume;
- network error/retry;
- audio playback only when an included approved audio asset exists.

Phase 1 does **not** require offline content caching. Service Worker behavior must not be claimed if it is not implemented.

## Hosted deployment sequence

Proceed conservatively:

```text
1. create/connect dedicated hosted Supabase project
2. `supabase db push --dry-run`
3. `supabase db push`
4. configure hosted credentials without committing secrets
5. run `npm run pilot:seed` twice and verify idempotency/exact two-node activation
6. connect Vercel / Node 24.x
7. configure production env vars
8. deploy reachable HTTPS app
9. configure Supabase Site URL + exact /auth/confirm redirect + token-hash email template
10. hosted desktop signup/confirm/login/Today smoke
11. physical iPhone Add-to-Home-Screen / auth / flow / interruption / network retry smoke
12. P1-E2E-001 full hosted vertical gate
```

Do **not** use `supabase db push --include-seed` for the production project. `supabase/seed.sql` is intentionally empty; reviewed Pilot/Review content is seeded by the validated application-owned seed script.

## Production environment contract

Vercel production requires:

```text
NEXT_PUBLIC_APP_URL=<final https origin>
NEXT_PUBLIC_SUPABASE_URL=<hosted Supabase URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
```

`SUPABASE_SERVICE_ROLE_KEY` must never be exposed with a `NEXT_PUBLIC_` prefix.

## Phase 1 Definition of Done

Phase 1 is complete only when:

1. a learner can open/login to the hosted app;
2. receive a valid bounded Today plan;
3. complete a reviewed real English lesson;
4. submit exercises/production without manual database intervention;
5. trusted Attempts generate auditable Evidence;
6. Mastery derives correctly;
7. Review state is created/updated without duplicate same-attempt effects;
8. a due Review can be completed through the learner UI;
9. refresh/relogin restores authoritative state;
10. later Today reflects prior Lesson/Review state;
11. the same core loop works on a physical iPhone PWA;
12. P1-E2E-001 passes on the deployed environment.

## Immediate next gate

**P1-PWA-001B — hosted Supabase + Vercel deployment.**

Start from verified main `2c32d11f078dd8bdee784d8b7251e9aba998b7f6` with main CI #243 application + fresh-Supabase double-green. Human action is requested only when account authorization, secret access or the physical iPhone genuinely requires it.