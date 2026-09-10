# Development Log

Chronological record of completed work. Detailed design decisions live in dedicated artifacts; this log records verified outcomes.

---

## 2026-09-01 — Phase 0 foundation and curriculum

Established project rules and built the A1–B2 graph across eight domains: A1 124, A2 164, B1 206, B2 241; total **735**. Structural validation 735/735 PASS. Merged through PRs #1–#5.

---

## 2026-09-01 — P0-LES-001 Lesson Unit Schema v1

Defined Lesson Blueprint/Instance, staged pedagogy, evidence opportunities, bounded AI/content and interruption-safe checkpoints. Validation passed. Merged through PR #6.

---

## 2026-09-01 — P0-MAS-001 Mastery Model v1

Defined Evidence Events and learner-node states unseen → introduced → developing → functional → secure plus lapsed. Trust, assistance and multi-session evidence matter. Validation passed. Merged through PR #7.

---

## 2026-09-01 — P0-REV-001 Spaced Review Model v1

Defined learner-specific Review Units and FSRS adapter boundary; validated `ts-fsrs`/FSRS v6 and MIT license. Merged through PR #8.

---

## 2026-09-01 — P0-PLC-001 Placement Test Blueprint v1

Defined adaptive multi-domain placement and scoped Curriculum Clearance without fabricated mastery. Validation passed. Merged through PR #9.

---

## 2026-09-01 — P0-SCH-001 Daily Lesson Generation Rules v1

Defined bounded time plans, P0–P6 priorities, review-debt behavior, skill balance/content gates and productive application. Synthetic fixtures passed. Merged through PR #10.

---

## 2026-09-01 — P0-LIS-001 Listening Content Specification v1

Defined multi-dimensional A1–B2 Listening Assets, progressive play/transcript/one-pass behavior, source/rights/QA gates and IELTS listening bridge. Schema/fixture validation passed. Merged through PR #11.

---

## 2026-09-01 — P0-EXE-001 Exercise Generation / Validation Specification v1

Defined Exercise Template → Item → Attempt, scoring modes, trusted content classes, AI variant validation gates, evaluator-confidence rules and Mastery/Review effect boundaries. Schema/fixture validation passed. Merged through PR #12.

---

## 2026-09-01 — P0-IELTS-001 IELTS Progression Gates v1

Defined six IELTS progression stages, component-specific estimated readiness, Academic/General boundaries, official-score structure references and conservative repeated-evidence target-readiness gates. Schema/fixture validation passed. Merged through PR #13.

---

## 2026-09-01 — P0-FREEZE-001 Phase 0 cross-document review

Created `PHASE0_FREEZE_REVIEW.md`, `IMPLEMENTATION_HANDOFF.md`, frozen Architecture v1 and DEC-022. Cross-document review found no design-level contradiction blocking implementation. Phase 0 was frozen through PR #14.

---

## 2026-09-01 — P1-BOOT-001 Application scaffold and CI baseline

Implemented the first application code on `feat/p1-boot-001`.

Stack baseline: Next.js 16.3.4, React 19.2.8, TypeScript 5.9.3, Node 24.20.0, Biome 2.5.11 and reproducible `npm ci`.

Added App Router/PWA shell, environment/config baselines, Phase 0 repository validation, node tests and permanent GitHub Actions CI.

Real CI fixed a Next manifest purpose type mismatch, ESLint 10/Next plugin incompatibility and initial uncommitted-lockfile reproducibility gap. Final locked CI passed install, validation, lint, TypeScript, tests and production build. Physical iPhone smoke remained P1-PWA-001.

---

## 2026-09-01 — P1-DATA-001 Canonical curriculum registry

Converted the frozen curriculum into a deterministic machine-readable registry.

Verified: A1 124 / A2 164 / B1 206 / B2 241; total 735; duplicate IDs 0; missing hard prerequisites 0; cycles 0; topological traversal 735/735. All canonical nodes remain `draft`.

A one-time concurrent CI write-back race was removed; permanent CI is read-only and deterministically checks the committed registry.

---

## 2026-09-01 — P1-DB-001 Supabase auth and learner-private data boundary

Implemented Supabase Auth/server/browser/service-role boundaries, minimum learning tables, RLS and fresh-database integration CI.

Verified anonymous blocking, learner own-row isolation, restricted profile writes, no browser mutation of trusted learning state, active/trusted shared-content visibility and migrations replay from an empty database.

CI/review fixed button accessibility lint, unnecessary lockfile rebase and dynamic auth redirect risk. Hosted Supabase/email and physical iPhone behavior remained explicitly unclaimed.

---

## 2026-09-01 — P1-PILOT-001 Corrected prerequisite-free A1 social-formula Pilot — COMPLETE

The first nine-node `Survival & Identity` draft passed automated CI but was rejected after semantic review found over-broad activation, zero-learner prerequisite readiness problems and missing explicit active-node evidence contracts. It was removed.

Released `PILOT-A1-SOCIAL-FORMULAS-01` with exactly two prerequisite-free learner-active root nodes:

- `CF-A1-SOCIAL-GREET-01`;
- `VX-A1-SOCIAL-FORMULAS-01`.

Released content: 1 reviewed Blueprint, 3 reviewed Templates, 11 reviewed Items, 10 deterministic state-eligible items and 1 state-neutral free-spoken practice item.

Frozen evidence contracts: CF → recognition + controlled production + free spoken production; VX → recognition + controlled production.

Feature CI #82 passed. PR #21 squash-merged as `6b2992381244530eb7654ddaf5ec0bdb94363c20`; merged-main CI #83 double-green.

---

## 2026-09-02 — P1-ENGINE-001A Deterministic Attempt/Evidence/Mastery core — COMPLETE

Implemented deterministic reviewed-item Scoring → immutable/idempotent Attempt → auditable Evidence → deterministic Mastery.

Hardening added submission-key idempotency, immutable source snapshots, Lesson Stage item authorization, one state-affecting retrieval per attempt group, retry neutralization, cross-user ownership and monotonic convergence under concurrent evidence.

A first green version was held after manual concurrency/traceability review found retry, content-drift, authorization and stale-write risks; these were fixed and made real Supabase regressions.

PR #25 squash-merged as `7fef601a8cb5d5d0f29bef071de2b5db7fef87d6`; merged-main CI #94 double-green.

---

## 2026-09-02 — P1-ENGINE-001B Exactly-once FSRS Review Scheduler Adapter — COMPLETE

Pinned `ts-fsrs@5.4.2` and implemented the frozen FSRS-6 adapter with request retention 0.90, product grade mapping and Lesson-owned same-session correction.

Added learner-specific Review Units, immutable Review Events, algorithm/library/parameter audit, same-group exactly-once behavior and concurrent distinct-group revision convergence.

Verification fixed the `Rating` vs `Grade` type mismatch, strengthened PostgreSQL Attempt→Review Unit source binding and separated truthful Attempt time from monotonic scheduler time.

Feature CI #97/#100 passed. PR #26 squash-merged as `274a856b5b27f4f426cef0c7460665e23ed58df1`; merged-main CI #101 double-green.

---

## 2026-09-02 — P1-ENGINE-001C Curriculum / Daily Plan / Lesson Resume — FEATURE ACCEPTED

Implemented the remaining planning/resume layer on `feat/p1-engine-001c-planning-resume` without broadening the reviewed two-node Pilot.

### C1 — Curriculum Service

Only learner-active nodes enter new learning; hard prerequisite requires `functional`/`secure` Mastery or explicit Clearance; lapsed prerequisite blocks; soft prerequisite does not fabricate a hard block; block reasons are explicit. CI #104 double-green.

### C2 — bounded Daily Scheduler + persisted Daily Plan

Added dynamic due/overdue from `due_at`, frozen debt/budget rules, C1-bound eligibility, explicit deferred work and server-authoritative one-plan-per-learner/date persistence.

CI #111 caught nullable/type-fixture issues; #117 caught Node 24 strip-only constructor syntax; both were fixed. CI #118 became the first C2 double-green acceptance.

Manual cross-layer review then fixed unsupported separate speaking-focus request generation, current Pilot 20/50-minute Blueprint incompatibility and a stale replan race. A 50-minute preference caps reviewed content at 18 minutes; a 20-minute partial two-node first lesson is rejected rather than fabricated; started Plans cannot be downgraded by a racing replan.

### C3 — reviewed Lesson Resolver / Resume

Added exact Pilot policy, stable `resolution_key`, unique live resolution, resumable Lesson state, exact 001A stage-item authorization and real Attempt preservation across refresh/relogin.

The first new DB test correctly exposed that browser Lesson UPDATE is denied with PostgreSQL `42501`; the test, not production permissions, was corrected. Manual concurrency review then found checkpoint lost-update risk; server-owned `revision` optimistic CAS/retry plus real concurrent-stage integration fixed it.

Final code CI #134 passed the entire application + fresh-Supabase chain, including 001A/001B regressions, Daily Plan, exact Lesson resolution, real Attempt resume and concurrent checkpoint convergence.

Repository handoff docs were then synchronized; final development/documentation head CI #139 passed both permanent jobs again.

### Outcome at this point

001C was feature accepted; parent Engine remained release-pending until the verified branch could merge through the normal PR path and `main` could be revalidated.

---

## 2026-09-02 — P1-ENGINE-001 release administration: Draft PR #28 replaced by non-Draft PR #29

After CI #139 passed, development PR #28 was still Draft because it had intentionally been created that way while C1/C2/C3 were incomplete.

The GitHub connector's `mark ready for review` GraphQL mutation failed because its response selection referenced an unavailable `Repository.fullDatabaseId` field. A follow-up PR read confirmed #28 remained Draft. GitHub's actual merge endpoint then correctly returned HTTP 405: `Pull Request is still a draft`.

The project did **not** bypass this protection by force-updating `main`.

Safe administrative replacement:

1. updated #28 with the final scope/CI history and the connector failure explanation;
2. closed #28 unmerged, retaining the complete development and CI record;
3. opened PR #29 as a normal **non-Draft** PR from the exact same verified branch;
4. corrected repository handoff docs to identify #28 as development history and #29 as the release PR;
5. required #29 to run both permanent CI jobs again before squash merge.

This event changed no Engine behavior.

---

## 2026-09-02 — P1-ENGINE-001 parent release — COMPLETE / MERGED-MAIN VERIFIED

Release PR #29 ran both permanent jobs on the final verified head. CI #144 passed the full application chain and fresh-Supabase chain.

PR #29 was then squash-merged to `main` as:

`149bf2d2aac1b3ee1a8426be4880fededf1c4f5b`

GitHub automatically ran permanent push CI #145 on that exact merge SHA. CI #145 completed `success` and repeated both jobs:

- application validation: Phase 0 contracts, 735-node registry, reviewed Pilot validation, Biome, TypeScript, complete node tests and Next production build — PASS;
- fresh Supabase: start, empty reset/migrations, Auth/RLS, double Pilot seed, Pilot trust/evidence contracts, 001A Attempt/Evidence/Mastery, 001B FSRS/RPC hardening, Daily Plan persistence and C3 Lesson resolution/resume/concurrency regressions — PASS.

Therefore parent **P1-ENGINE-001 is COMPLETE / merged-main verified**.

The next implementation module is **P1-UI-001 — Today + Lesson + Review vertical UI**. It must consume the verified server-owned planning/Lesson/Attempt/Mastery/Review boundaries rather than recreate trusted rules in browser state.

---

## 2026-09-02 — P1-UI-001A Today — COMPLETE / MERGED-MAIN VERIFIED

Implemented the learner-facing Today surface on top of the verified planning Engine rather than creating client-side planning truth.

The authenticated server path loads learner Profile/Mastery/Clearance/Review/Pilot state, generates or reuses one persisted bounded Daily Plan, and renders its learner-local date, budget, plan status, review debt, selected/deferred work and `Why this today?` explanations.

A brand-new learner fresh-Supabase integration verifies the exact reviewed two-node Pilot request at the 14-minute target under the default 35-minute profile and preserves browser write rejection for authoritative planning state.

PR #31 squash-merged to `main` as `cf099c14e097bbd3ffdc5a801d7e694db5ec333c`; merged-main CI #158 passed both permanent application and fresh-Supabase jobs.

---

## 2026-09-02 — P1-UI-001B Lesson Runner — COMPLETE / MERGED-MAIN VERIFIED

Implemented the minimum real Lesson runner needed to exercise the merged Engine end-to-end without developer tools.

Verified learner-facing path:

`Today → Start/Resume → reviewed instruction/model stages → 5 recognition items → 5 controlled-production items → persisted deterministic feedback → practice-only speaking or skip → server-derived Exit Check → Lesson Summary → Finish Lesson`.

Key boundaries:

- Start/Resume reuses one stable server-owned Lesson Instance and persisted stage state;
- reviewed teaching content and exercise items come from the active Pilot, not browser-authored copies;
- every state-changing exercise flows through the existing Attempt → Evidence → Mastery → exactly-once Review Engine;
- feedback is loaded from persisted Attempt evaluation rather than recalculated in the browser;
- deterministic submission identity makes exact replays idempotent and rejects conflicting replay/jump-ahead requests;
- speaking rehearsal stays state-neutral and may be skipped;
- Exit Check reads only the Lesson's persisted trusted/state-affecting deterministic Attempts and uses the canonical reviewed gate: at least 8/10 correct plus both required controlled-production items correct;
- Exit failure is diagnostic: it persists the failed gate result and proceeds to summary without falsely promoting Mastery;
- Lesson Summary requires a stored Exit result before Finish and Lesson completion itself does not create Mastery.

Important validation history:

- staged CI #159/#163/#172/#176/#184/#187/#191 verified Start/Resume, real reviewed content, sequential deterministic exercises, persisted feedback and speaking neutrality;
- first Exit integration CI #194 correctly failed TypeScript because the test imported a nonexistent speaking skip symbol; production service was not weakened, the test import was corrected;
- CI #195 passed application + fresh-Supabase Exit scenarios, including 10/10 PASS and 9/10 FAIL when a required item was wrong, stored-result replay and learner RLS anti-forgery;
- CI #197 verified Lesson Summary/Finish requires stored Exit state and remains Mastery-neutral;
- final integrated learner-facing head `f9b921786e82862d1cf53e2c1459bc730cf40e50` passed CI #201 double-green before documentation synchronization;
- final documentation-synchronized PR head `cf5002c648ace77fb0d431f896eac5aed378c965` passed release CI #214 application + fresh-Supabase double-green;
- PR #32 squash-merged normally to `main` as `415fa68459423f3526d28e86a7308ec7b529bcc5`;
- merged-main push CI #215 passed both permanent jobs on that exact SHA.

Therefore **P1-UI-001B is COMPLETE / merged-main verified**. The next implementation module is **P1-UI-001C — Review queue + vertical integration**, starting from authoritative Review Units rather than creating browser-owned Review truth.