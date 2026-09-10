# Development Log

Chronological record of verified implementation outcomes. Detailed contracts live in module-specific handoffs and frozen design documents.

---

## 2026-09-01 — Phase 0 foundation / freeze

Built and froze the product/curriculum baseline:

- A1→B2 knowledge graph: A1 124 / A2 164 / B1 206 / B2 241 = **735 nodes**;
- Lesson Blueprint/Instance model;
- Mastery Model;
- FSRS Review model;
- Placement/Curriculum Clearance design;
- Daily Scheduler rules;
- Listening / Exercise specifications;
- IELTS progression gates;
- cross-document freeze review.

Phase 0 merged through PRs #1–#14. The 735-node registry is design inventory; learner activation is a separate reviewed decision.

---

## 2026-09-01 — P1-BOOT-001 — COMPLETE

Created the reproducible Next.js/TypeScript/PWA shell and permanent CI baseline.

Verified stack includes Next.js 16.3.4, React 19.2.8, TypeScript 5.9.3, Node 24.20.0, Biome 2.5.11, committed lockfile, `npm ci`, node tests and production build.

Early CI fixed manifest typing, ESLint/Next incompatibility and lockfile reproducibility issues. Physical iPhone validation remained intentionally deferred to P1-PWA-001.

---

## 2026-09-01 — P1-DATA-001 — COMPLETE

Converted the curriculum to a deterministic machine-readable registry.

Permanent validation proves 735 nodes, duplicate IDs 0, missing prerequisites 0, cycles 0 and topological traversal 735/735. All canonical registry nodes remain `draft` unless explicitly activated by reviewed Pilot content.

---

## 2026-09-01 — P1-DB-001 — COMPLETE

Implemented Supabase Auth, migrations, RLS and browser/server/service-role trust boundaries.

Permanent fresh-database CI proves migration replay, authenticated own-row isolation, anonymous blocking and rejection of browser writes to trusted learning state.

Hosted Supabase/email behavior remains a later deployment gate.

---

## 2026-09-01 — P1-PILOT-001 — COMPLETE / MERGED-MAIN VERIFIED

The first broader nine-node Pilot passed structural automation but failed manual curriculum-semantic review and was discarded.

Released `PILOT-A1-SOCIAL-FORMULAS-01` with exactly two prerequisite-free learner-active root nodes:

- `CF-A1-SOCIAL-GREET-01`;
- `VX-A1-SOCIAL-FORMULAS-01`.

Released 1 reviewed new-learning Blueprint, 3 reviewed Templates, 11 reviewed Items, 10 deterministic state-eligible items and 1 state-neutral free-spoken practice item.

PR #21 squash-merged as `6b2992381244530eb7654ddaf5ec0bdb94363c20`; merged-main CI #83 double-green.

---

## 2026-09-02 — P1-ENGINE-001A — COMPLETE / MERGED-MAIN VERIFIED

Implemented deterministic reviewed-item Scoring → immutable/idempotent Attempt → auditable Evidence → deterministic Mastery.

Hardening added immutable source snapshots, Lesson Stage item authorization, retry neutrality, one state-affecting retrieval per attempt group, cross-user ownership and concurrent Mastery convergence.

PR #25 squash-merged as `7fef601a8cb5d5d0f29bef071de2b5db7fef87d6`; merged-main CI #94 double-green.

---

## 2026-09-02 — P1-ENGINE-001B — COMPLETE / MERGED-MAIN VERIFIED

Pinned `ts-fsrs@5.4.2` and implemented the product-owned FSRS-6 Review Adapter.

Added learner-specific Review Units, immutable Review Events, same-group exactly-once behavior, revision convergence and PostgreSQL source/before-state validation.

PR #26 squash-merged as `274a856b5b27f4f426cef0c7460665e23ed58df1`; merged-main CI #101 double-green.

---

## 2026-09-02 — P1-ENGINE-001C — COMPLETE / MERGED-MAIN VERIFIED

Implemented:

```text
Curriculum Service
→ bounded Daily Scheduler
→ persisted one-plan-per-learner/date Daily Plan
→ exact reviewed Pilot Lesson Resolver
→ resumable/concurrent-safe Lesson Instance
```

Important failures were fixed rather than waived:

- CI #111: nullable Supabase/type-fixture issues;
- CI #117: Node 24 strip-only TypeScript constructor syntax;
- manual audit: fabricated `speaking_focus`, 20/50-minute Pilot/Blueprint incompatibility, stale replan race and Lesson checkpoint lost-update race;
- DB test expectation corrected to require PostgreSQL `42501` browser-write denial.

Final code CI #134 and final documentation head CI #139 passed both permanent jobs.

Development Draft PR #28 could not be transitioned to Ready because of a connector GraphQL response-field incompatibility. Protection was not bypassed: #28 was closed and the exact verified branch was reopened as non-Draft release PR #29.

Release PR #29 CI #144 passed; squash merge `149bf2d2aac1b3ee1a8426be4880fededf1c4f5b`; merged-main CI #145 double-green.

Therefore **P1-ENGINE-001 COMPLETE / merged-main verified**.

---

## 2026-09-02 — P1-UI-001A Today — COMPLETE / MERGED-MAIN VERIFIED

Implemented authenticated server-owned Today planning on top of the verified Engine.

A brand-new learner receives the exact reviewed two-node Pilot at the 14-minute target under the default 35-minute profile. Today exposes bounded budget/status/debt/selection/defer explanations while browser writes remain rejected.

PR #31 squash-merged as `cf099c14e097bbd3ffdc5a801d7e694db5ec333c`; merged-main CI #158 double-green.

---

## 2026-09-02 — P1-UI-001B Lesson Runner — COMPLETE / MERGED-MAIN VERIFIED

Implemented the real learner Lesson path:

```text
Today
→ Start/Resume
→ reviewed instruction/model
→ 5 recognition items
→ 5 controlled-production items
→ persisted deterministic feedback
→ practice-only speaking or skip
→ server-derived Exit Check
→ Lesson Summary
→ Finish
```

Exit failure remains diagnostic rather than fabricating retries or Mastery. Lesson completion itself cannot promote Mastery.

Staged CI #159/#163/#172/#176/#184/#187/#191/#195/#197/#201 validated each slice. Final documentation-synchronized head passed CI #214.

PR #32 squash-merged as `415fa68459423f3526d28e86a7308ec7b529bcc5`; merged-main CI #215 double-green.

---

## 2026-09-03 — P1-UI-001C Slice 1: Review queue + authoritative Review session backend — MERGED-MAIN VERIFIED

Implemented learner-owned Review queue and the first executable Review-session backend.

Behavior:

- dynamic priority from current `due_at` + Mastery;
- stale stored `review_status` is not wall-clock truth;
- deterministic `relearning > overdue > due > upcoming` ordering;
- reviewed `LESB-A1-SOCIAL-FORMULAS-02` Review Blueprint;
- authoritative Review Lesson resolver;
- fixed attempt slot and Review Unit revision binding;
- foreign/future/stale/multi-target resolution fails closed;
- exactly-once Review-session database coverage.

Feature head `5f5f545f8050d52897875dbfe6275afaed2eb1d7`; PR #34 CI #223 double-green.

PR #34 squash-merged as `911d9552cfc5586844d91f4d1ac7ded51c462363`; merged-main CI #226 double-green.

---

## 2026-09-03 — P1-UI-001C Slice 2: clickable authoritative Review UI — MERGED-MAIN VERIFIED

Added the learner-facing Review flow:

```text
Review queue
→ Start/Resume supported Review
→ raw learner answer
→ deterministic scoring
→ Attempt / Evidence / Mastery / exactly-once FSRS
→ persisted feedback / grade / next due
```

Only actionable deterministic reviewed-core single-target controlled-production items are startable. Multi-target Review Units remain visible but read-only; server resolver remains final authority.

Validation history:

- CI #224 correctly failed Biome a11y because the answer input used `autoFocus`; the attribute was removed, not suppressed;
- stacked PR #35 initially did not trigger CI because workflow PR filters target `main` only;
- after PR #34 squash merge, the #35 branch was reparented onto verified `main` while preserving the same final tree, producing a clean 1-commit / 8-file diff;
- clean head `1b0419442cfa8d36f4df82fd99c08b87b43d5f83` passed CI #227 double-green.

PR #35 squash-merged as `a525193a0520e512a970f7c1e7aa37331adf3aab`; merged-main CI #228 double-green.

---

## 2026-09-03 — P1-UI-001C Slice 3: live Review state reflected on Today — MERGED-MAIN VERIFIED

Audit found a valid but important state-model tension: a started Daily Plan must remain frozen to prevent concurrent/stale replanning, but its embedded Review counts may become stale after the learner completes a Review later that day.

The solution deliberately does not replan.

Each Today request now combines:

1. the frozen persisted Daily Plan;
2. a separate live authoritative Review snapshot.

The fresh-Supabase acceptance test uses the real Review Resolver + deterministic Review submission + FSRS update and proves:

- before review: `ready now = 1`, `upcoming = 0`;
- after review: `ready now = 0`, `upcoming = 1`;
- same Daily Plan ID/status remains;
- original 35-minute budget remains;
- original two-node new-learning selection remains.

PR #36 head `b8c8cdd4fd443d45f7d15607d4ffa3d1b7144ca8`; CI #229 double-green.

PR #36 squash-merged as `97cc2a42d864d58b36256b0f9764eccae20bdf34`; merged-main CI #230 double-green.

Therefore **P1-UI-001C and parent P1-UI-001 are COMPLETE / merged-main verified**.

Detailed handoff: `docs/P1_UI_001C_HANDOFF.md`.

---

## Current handoff — P1-PWA-001

The local/permanent-CI learning loop is complete through Today → Lesson → Review → later Today reflection.

Phase 1 still requires a real hosted/mobile release environment.

Next sequence:

```text
hosted Supabase
→ production env/secrets
→ hosted migrations + reviewed seed
→ Auth redirects / confirmation template
→ reachable HTTPS deployment
→ hosted desktop smoke
→ physical iPhone PWA smoke
→ P1-E2E-001 deployed vertical gate
```

Do not activate the remaining 733 draft curriculum nodes while solving deployment/PWA work.