# Issues and Solutions

Use this file for meaningful product, curriculum, architecture or implementation problems.

Each issue should record symptoms, root cause, attempted solutions, final solution and remaining limitations.

---

## Template

### ISSUE-XXX — Short title

**Date:** YYYY-MM-DD  
**Module:**  
**Status:** Open / Resolved / Accepted limitation

#### Problem

Describe the observable problem.

#### Impact

What does it break or risk?

#### Root cause

State only when known. Do not guess.

#### Attempts

1. Attempt — result
2. Attempt — result

#### Final solution

What actually resolved it?

#### Verification

How was the fix tested?

#### Remaining limitations

What is still not solved?

---

## ISSUE-001 — Curriculum source is not the same as a ready-made syllabus

**Date:** 2026-09-01  
**Module:** Curriculum design  
**Status:** Resolved by design

### Problem

CEFR, English Grammar Profile and English Vocabulary Profile provide powerful proficiency/language references, but none should be treated as a complete fixed day-by-day course sequence.

### Impact

Blindly importing level labels could create an incoherent course with poor prerequisite ordering and weak integration between grammar, vocabulary and skills.

### Root cause

The reference frameworks are descriptive/research-oriented; the product still needs its own pedagogical sequencing and dependency model.

### Final solution

Separate the system into authoritative/reference frameworks, the product-owned knowledge tree, and learner-specific scheduling.

### Verification

This separation is documented in `CURRICULUM_SPEC.md` and `DECISIONS.md`.

---

## ISSUE-002 — Risk of AI-generated ambiguous scored questions

**Date:** 2026-09-01  
**Module:** Exercise engine  
**Status:** Mitigated by design; implementation pending

### Problem

A language model can generate questions with multiple acceptable answers, wrong answer keys, inappropriate level, or explanations inconsistent with the answer.

### Impact

Incorrect mastery data and learner confusion.

### Final solution

Use reviewed core items/templates, constrained AI variants, validation gates before generated items affect scored mastery, and mark uncertain content as unscored practice.

### Remaining limitation

Validator code and a reviewed item bank remain implementation/content work.

---

## ISSUE-003 — Premature numeric mastery threshold in schema example

**Date:** 2026-09-01  
**Module:** Knowledge-node schema  
**Status:** Resolved

### Problem

The first P0-CUR-001 schema draft included `minimum_evidence_events: 4` before the mastery model existed.

### Impact

A placeholder could accidentally become a product rule without evidence.

### Final solution

Changed the example to `minimum_evidence_events: null` and deferred thresholds to the Mastery Model.

### Verification

The final Mastery Model owns configurable thresholds and the Knowledge Node schema no longer invents one.

---

## ISSUE-004 — Next.js PWA manifest icon purpose failed typecheck

**Date:** 2026-09-01  
**Module:** P1-BOOT / PWA metadata  
**Status:** Resolved

### Problem

The initial manifest used `purpose: "any maskable"`.

### Impact

GitHub CI passed install, repository validation and lint, but failed TypeScript before tests/build.

### Root cause

Next.js 16.3.4's `MetadataRoute.Manifest` type accepts one icon-purpose enum value (`any`, `maskable`, or `monochrome`) rather than the combined manifest string used in some generic PWA examples.

### Final solution

Changed the icon purpose to `"maskable"`.

### Verification

Subsequent Node 24 CI passed TypeScript and production build.

---

## ISSUE-005 — ESLint 10 incompatible with current Next.js React lint plugin

**Date:** 2026-09-01  
**Module:** P1-BOOT / Tooling  
**Status:** Resolved

### Problem

ESLint 9.39.5 emitted an unsupported-version warning. Upgrading to ESLint 10.9.1 caused lint to crash with `react/display-name` / `contextOrFilename.getFilename is not a function`.

### Impact

A new repository would either start on an already unsupported lint version or use a newer version incompatible with the current Next.js plugin stack.

### Root cause

The React lint plugin bundled through `eslint-config-next` 16.3.4 was not compatible with ESLint 10's changed rule context API.

### Attempts

1. ESLint 9.39.5 — lint passed but npm reported the version unsupported.
2. ESLint 10.9.1 — dependency installation completed but Next's React rule crashed at runtime.

### Final solution

Removed ESLint / `eslint-config-next` and adopted Biome 2.5.11 using the Next/React domains patterned after the official `create-next-app` Biome template.

### Verification

Locked Node 24 CI passed Biome lint, TypeScript, tests and Next production build.

---

## ISSUE-006 — Bootstrap lockfile needed a trustworthy reproducible source

**Date:** 2026-09-01  
**Module:** P1-BOOT / CI  
**Status:** Resolved

### Problem

The first full green build used `npm install` to generate `package-lock.json`, but the repository did not yet contain the generated lockfile.

### Impact

A green build without a committed lockfile does not prove future installs are reproducible.

### Final solution

After a fully green Node 24 run, bootstrap CI temporarily committed its own generated lockfile to the feature branch. The workflow was immediately restored to read-only repository permissions and changed to `npm ci` using `package-lock.json` as the cache key.

### Verification

A fresh CI run from the committed lockfile passed `npm ci`, Phase 0 validation, Biome lint, TypeScript, node tests and Next production build.

---

## ISSUE-007 — Physical iPhone smoke test requires a reachable deployment

**Date:** 2026-09-01  
**Module:** Phase 1 PWA validation  
**Status:** Accepted limitation / tracked gate

### Problem

The scaffold can be compiled and statically validated in CI, but this environment cannot truthfully claim that the user's physical iPhone has opened the PWA until a reachable deployment exists and the device is used.

### Impact

Marking physical-device behavior as passed now would create false project status, especially for Safari/PWA microphone, safe-area, install and resume behavior.

### Resolution

Keep P1-BOOT focused on reproducible application/tooling readiness. Preserve physical-device validation as explicit `P1-PWA-001` before Phase 1 can pass its full E2E gate.

### Remaining limitations

Safari/PWA installation, resume, audio and later WebRTC behavior remain unverified on physical iPhone hardware.

---

## ISSUE-008 — One-time curriculum registry write-back had a concurrent CI race

**Date:** 2026-09-01  
**Module:** P1-DATA / CI bootstrap  
**Status:** Resolved

### Problem

The first P1-DATA workflow temporarily allowed CI to generate and commit `curriculum/registry.json`. Both the feature-branch push workflow and the pull-request workflow ran against the same branch. One runner updated the remote branch first; the other runner later created the same generated-file commit locally but its push was rejected as non-fast-forward.

### Impact

The workflow run was marked failed even though curriculum compilation, graph validation, lint, TypeScript, tests and production build had all passed. Leaving this pattern in place would also make CI itself a source of repository mutation and race conditions.

### Root cause

Two concurrent workflow events were allowed to write to the same feature branch during the one-time bootstrap step.

### Final solution

Treat CI write-back as a one-time bootstrap mechanism only. After `registry.json` existed, remove all repository-write permissions/steps and restore permanent read-only CI. Permanent CI now runs `npm run curriculum:check`, which independently rebuilds the registry and fails if the committed JSON is stale or graph invariants fail.

### Verification

A fresh read-only CI run passed deterministic registry comparison, graph validation, Biome, TypeScript, all node tests and Next production build.

---

## ISSUE-009 — Login action buttons failed the accessibility lint gate

**Date:** 2026-09-01  
**Module:** P1-DB / Auth UI  
**Status:** Resolved

### Problem

The first Supabase dependency bootstrap reached Biome and failed because the sign-in and create-account `<button>` elements did not explicitly declare a button type.

### Root cause

HTML defaults a form button to submit, but Biome's accessibility rule requires intent to be explicit in React code.

### Final solution

Added `type="submit"` to both form-action buttons. The rule was kept enabled.

### Verification

Subsequent Node 24 bootstrap and permanent CI passed Biome, TypeScript, tests and production build.

---

## ISSUE-010 — Supabase lockfile bootstrap rebase was blocked by generated build files

**Date:** 2026-09-01  
**Module:** P1-DB / dependency bootstrap  
**Status:** Resolved

### Problem

A bootstrap run successfully installed the Supabase dependencies and passed the full application validation chain, then failed only when trying to push the generated lockfile.

### Root cause

The workflow committed `package-lock.json` and then unnecessarily ran `git pull --rebase`. The preceding Next.js build left generated working-tree changes, so Git correctly refused to start a rebase with unstaged changes.

### Final solution

Changed the one-time bootstrap to a single PR writer and removed the unnecessary rebase. After the validated lockfile was committed successfully, the temporary write-capable workflow was deleted.

### Verification

Permanent read-only CI now uses the committed lockfile with `npm ci` and passes application and database integration jobs.

---

## ISSUE-011 — Supabase local SMTP config has a temporary upstream compatibility mismatch

**Date:** 2026-09-01  
**Module:** P1-DB / local Supabase config  
**Status:** Accepted temporary compatibility warning

### Problem

Supabase CLI 2.116.0 warns that the `[inbucket]` config section is deprecated and recommends `[local_smtp]`.

### Constraint

Current Supabase hosted Branching/GitHub integration has a reported parser incompatibility with `[local_smtp]` (tracked upstream in `supabase/cli#5801` and related Supabase issue reports). Blindly migrating the local config could remove a local warning while creating a hosted-branching compatibility problem later.

### Decision

Keep `[inbucket]` temporarily, disabled, and record the warning. Revisit after the hosted parser supports the current CLI config shape.

### Impact

The warning is noisy but non-blocking. It does not affect Auth/RLS integration behavior; the full local database test passed.

---

## ISSUE-012 — Email-confirmation callback accepted an unnecessary dynamic redirect target

**Date:** 2026-09-01  
**Module:** P1-DB / Auth security review  
**Status:** Resolved before merge

### Problem

The first `/auth/confirm` route read a `next` query parameter and used it to construct the post-verification redirect.

### Risk

Dynamic redirect inputs are unnecessary for the Phase 1 vertical slice and can become an open-redirect surface if URL parsing or validation is too permissive.

### Final solution

Removed dynamic `next` handling. A successful email confirmation now redirects to the fixed same-origin `/` path. If deep-link continuation becomes necessary later, it must be implemented with an explicit same-origin/allow-list contract and tests.

### Verification

The route passes TypeScript and production build; the broader Auth/RLS integration suite remains green. Hosted email-template/callback E2E is deliberately deferred until a hosted Supabase deployment exists.

---

## ISSUE-013 — Biome recommended-rule syntax became deprecated while still passing lint

**Date:** 2026-09-01  
**Module:** P1-PILOT / Tooling hygiene  
**Status:** Resolved before merge

### Problem

The first fully green P1-PILOT CI run printed a Biome 2.5 deprecation notice for the existing `linter.rules.recommended` configuration. Lint still returned success, so a pass/fail-only check would have ignored it.

### Impact

Leaving the warning would put the repository on a configuration key scheduled for removal in the next major Biome release, creating avoidable future breakage and noisy CI.

### Root cause

Biome 2.5 migrated the recommended-rule setting to the preset form while still accepting the old field temporarily.

### Final solution

Changed the repository-owned configuration to `linter.rules.preset: "recommended"` while preserving the Next and React domain settings.

### Verification

The complete P1-PILOT validation was rerun after the change. Biome reported no repository-owned deprecation warning; TypeScript, tests, production build, empty Supabase reset, double Pilot seed, Auth/RLS regression and Pilot DB integration also passed.

---

## ISSUE-014 — Green automated Pilot CI did not prove curriculum-semantic correctness

**Date:** 2026-09-01  
**Module:** P1-PILOT / Curriculum activation  
**Status:** Resolved and release-verified

### Problem

The first nine-node P1-PILOT implementation passed its automated static validator, production build, empty Supabase reset, double seed, RLS checks and content database integration. A later manual curriculum-semantic review still found the Pilot should not be merged.

### Impact

If accepted, a brand-new learner could receive a first lesson containing active grammar nodes whose hard prerequisites were not Mastery-ready. The lesson also activated broader personal-identity/self-introduction semantics while only teaching a subset, and active nodes did not persist the Phase 0-required explicit evidence contracts.

### Root cause

The original validator checked dependency closure inside the bundle, but not whether the first learner-active slice was schedulable from zero. It also checked item evidence without freezing Knowledge Nodes' own evidence requirements, and structural checks could not detect semantic under-coverage.

### Final solution

Removed the entire nine-node bundle and released `PILOT-A1-SOCIAL-FORMULAS-01` with exactly two true root nodes. Validation now freezes exact active nodes, zero hard prerequisites, exact per-node evidence contracts, reviewed opportunities for every evidence type, deterministic state-eligible non-spoken items, non-state-changing free-spoken practice and exact evidence persistence in the database.

### Verification

Feature CI #82 and merged-main CI #83 passed application + fresh-Supabase gates. Future curriculum activation still requires manual semantic review in addition to machine checks.

---

## ISSUE-015 — ts-fsrs Rating is broader than the next() Grade contract

**Date:** 2026-09-02  
**Module:** P1-ENGINE-001B / Review adapter  
**Status:** Resolved

### Problem

The first FSRS adapter mapped product grades to the library `Rating` enum and passed that value to `fsrs.next()`. Current `ts-fsrs@5.4.2` types require `Grade`, which excludes non-review values such as Manual.

### Impact

The adapter could not pass strict TypeScript even though the four intended values were Again/Hard/Good/Easy.

### Final solution

Pin `ts-fsrs@5.4.2`, import the library `Grade` type, and make the product mapping return only the four frozen `Grade` outcomes.

### Verification

The final 001B TypeScript/unit/build and fresh-database gates passed.

---

## ISSUE-016 — Review RPC initially trusted service-layer source binding too much

**Date:** 2026-09-02  
**Module:** P1-ENGINE-001B / Review persistence security  
**Status:** Resolved before merge

### Problem

The first `apply_review_update()` RPC required service-role access and a legitimate state-affecting Attempt, but it did not independently prove that the supplied Review Unit matched the Attempt's immutable target node, evidence type and content version, nor that `before_state` matched the current database card.

### Impact

A future server bug with service credentials could pair valid objects incorrectly or calculate a transition from a forged/stale FSRS snapshot.

### Final solution

A hardening migration now revalidates inside PostgreSQL: trusted/scored Review gate, `mayUpdateReview`, immutable source target/evidence/content binding, algorithm/library/parameter versions, row ownership/lifecycle, expected revision and exact current before-state. Wrong source binding raises an error; stale before-state returns conflict before any event is written.

### Verification

Destructive DB integration intentionally exercises wrong Attempt→Review Unit binding and forged before-state. Feature and merged-main 001B regressions passed.

### Remaining limitation resolved by 001C

Persisted `review_status` is a transition-time snapshot. 001C now classifies due/overdue dynamically from `due_at` and current planning time instead of expecting wall-clock passage to mutate a stored status label.

---

## ISSUE-017 — Generic Daily Scheduler output was not always executable by the reviewed Pilot

**Date:** 2026-09-02  
**Module:** P1-ENGINE-001C / Planning → Lesson boundary  
**Status:** Resolved before parent Engine merge

### Problem

The first C2 scheduler implementation was internally valid but could emit requests that the current reviewed content inventory could not execute:

1. it emitted a separate `speaking_focus` application Lesson even though only one reviewed `new_learning` Blueprint exists and that Blueprint already contains practice-only speaking;
2. the frozen 20-minute new-primary limit could select only one of the two Pilot nodes even though the reviewed Blueprint is semantically an inseparable two-node lesson;
3. a 50-minute plan could request more core Lesson minutes than the Blueprint's reviewed 18-minute maximum.

### Impact

C3 would have been forced either to fail at runtime or fabricate a Blueprint/content variant that had never been reviewed. Filling a learner's selected time budget would have taken precedence over content trust.

### Root cause

The generic Daily Scheduler contract owns budget/debt/priority, while executable content is constrained by the currently activated reviewed inventory. The first integration treated scheduler output as if every valid abstract request already had matching reviewed content.

### Attempts

1. Let C3 resolve each generic request by type — rejected because no reviewed `speaking_focus` Blueprint exists.
2. Silently manufacture one-node/longer variants — rejected because it would bypass the Pilot's semantic/content review.

### Final solution

Added a Phase-1 Pilot planning boundary after generic scheduling:

- recompute new-learning eligibility through C1;
- if current planning selects Pilot new learning, require the exact two-node Pilot set;
- keep productive speaking inside the reviewed Blueprint's existing optional speaking stage;
- clamp the reviewed Pilot Lesson to its frozen 10–18 minute range;
- for a 50-minute preference, leave excess study time explicitly unused;
- for a 20-minute first-session result that would select only one Pilot node, reject the plan rather than fabricate a one-node Lesson.

### Verification

`planning-service.test.mts` permanently covers 35-minute target, 50-minute cap/unused-time warning, 20-minute partial-bundle rejection and C1 prerequisite non-bypass. Final 001C code CI #134 passed application + fresh-Supabase regression.

### Remaining limitations

The 20-minute first-session preset is not currently executable with this exact reviewed two-node Pilot. That is an intentional content-scope limitation, not hidden by invented content. A later reviewed content expansion may add a coherent shorter Blueprint.

---

## ISSUE-018 — Started Daily Plans could be downgraded by a stale concurrent replan

**Date:** 2026-09-02  
**Module:** P1-ENGINE-001C / Daily Plan persistence  
**Status:** Resolved before parent Engine merge

### Problem

The initial Daily Plan store first read the existing row and then used a general upsert. A planner could read `planned`, a Lesson could concurrently mark the row `in_progress`, and the stale planner could then upsert `status='planned'` again.

### Impact

The system could lose the authoritative indication that a learner had already started the plan and could overwrite the JSON associated with an active learning session.

### Root cause

Read-then-upsert did not include the previously observed status as a write precondition.

### Final solution

For an existing row, only refresh it with a conditional update requiring `status='planned'`. If the conditional update affects no row, reread the authoritative row. For a first insert, handle the unique learner/date race by rereading after PostgreSQL `23505`.

### Verification

Fresh-Supabase Daily Plan integration proves a started plan is preserved, and the hardened path was rerun in final 001C CI #134.

---

## ISSUE-019 — Lesson stage checkpoints could lose concurrent progress

**Date:** 2026-09-02  
**Module:** P1-ENGINE-001C / Lesson Resume  
**Status:** Resolved before parent Engine merge

### Problem

The first checkpoint implementation used an ordinary read → modify JSON → write cycle. If two different Lesson stages completed at nearly the same time, both could read the same state and the later write could erase the earlier stage completion.

### Impact

Refresh/relogin could show a learner that previously completed work was incomplete. This would break the interruption-safe resume contract even though each individual checkpoint request was valid.

### Root cause

`lesson_instances.state` is a shared aggregate JSON document and had no optimistic concurrency revision for checkpoint mutations.

### Final solution

Added server-owned `lesson_instances.revision bigint` and made checkpoint writes compare-and-set on the observed revision. A successful update increments the revision; a conflict rereads the newest state, reapplies the requested stage transition and retries up to the bounded convergence limit. Repeating an already completed/skipped stage remains idempotent.

### Verification

The real Supabase Lesson Resume test completes two different stages concurrently with `Promise.all` and verifies both stage IDs survive, the revision advances monotonically and the same state remains after a fresh authenticated session. Final 001C CI #134 passed.

---

## ISSUE-020 — Forbidden browser Lesson write returned a database error rather than zero-row success

**Date:** 2026-09-02  
**Module:** P1-ENGINE-001C / RLS and integration-test semantics  
**Status:** Resolved in test; production permissions were already correct

### Problem

The first C3 integration test expected an authenticated learner's forbidden `lesson_instances UPDATE` to return no error with zero rows. PostgreSQL instead returned `42501 permission denied for table lesson_instances`.

### Impact

The new C3 database job failed even though the security boundary was stronger than the test expected. Misdiagnosing the failure could have led to unnecessarily granting browser UPDATE permission merely to make the test green.

### Root cause

The base schema grants authenticated learners SELECT on their private Lesson rows but intentionally does not grant UPDATE. PostgreSQL privilege rejection occurs before an RLS zero-row update pattern can apply.

### Final solution

Keep production permissions unchanged. Fix the integration test to require a non-null error with code `42501`, then read the row through service role and prove status/revision were not altered.

### Verification

Final 001C fresh-Supabase CI #134 passed the corrected destructive browser-write test together with own-row resume and cross-user isolation.

---

## ISSUE-021 — Exit Gate failure could create an unrecoverable Lesson dead-end

**Date:** 2026-09-02  
**Module:** P1-UI-001B / Exit Check → Lesson Summary  
**Status:** Resolved for the reviewed Phase 1 Pilot

### Problem

The reviewed Pilot Exit Gate requires at least 8/10 scored deterministic answers plus two required controlled-production items. The current Pilot, however, does not contain a dedicated `correction_retry` stage after `exit_check`, and each primary state-changing reviewed item has one deterministic primary submission identity.

Treating Exit Gate failure as “the learner may not finish the Lesson until they pass” would therefore leave a failed learner at `exit_check` with no approved stage or submission path that could change the result.

### Impact

A learner could complete all available reviewed work and still become permanently stuck in one Lesson Instance. A tempting workaround would be to invent ad-hoc retries, overwrite Attempts, or promote completion/Mastery directly from UI state, any of which would violate the frozen trust and evidence contracts.

### Root cause

The frozen lesson model distinguishes Lesson completion from Mastery and allows correction/retry stages, but this very small reviewed Pilot intentionally did not ship a dedicated retry stage. The Exit Gate was initially easy to misread as a hard completion lock rather than a persisted diagnostic gate for this content slice.

### Attempts

1. Require pass before Lesson completion — rejected because there is no reviewed remediation path and it creates a dead-end.
2. Re-submit or overwrite the original trusted Attempts — rejected because it would break immutable/idempotent Attempt history and exactly-once Evidence/Review effects.
3. Let the browser declare a pass or manually change Mastery — rejected because trusted state must remain server-authoritative.

### Final solution

Make Exit Check a server-derived persisted diagnostic gate for the current Pilot:

- compute it only from the Lesson's complete set of trusted, state-affecting deterministic Attempts;
- load the canonical gate from reviewed `pilot.json` rather than duplicating thresholds in the page;
- persist pass/fail plus correct count, required-item failures, incorrect items and Attempt references into Lesson state using the existing revision CAS boundary;
- advance both pass and fail outcomes to `lesson_summary`;
- allow Summary to complete the Lesson only after a stored Exit result exists;
- keep Lesson completion independent from Mastery so a failed gate cannot fabricate proficiency;
- leave remediation to later Review/planning until a reviewed correction/retry stage is deliberately added.

### Verification

Fresh-Supabase CI #195 permanently covers 10/10 PASS and 9/10 FAIL when required `EI-A1-SOCIAL-CONTROLLED-001` is wrong, verifies stored-result replay and learner RLS anti-forgery, and confirms the failed learner is not falsely `functional`/`secure`. CI #197 verifies both pass and fail summaries can finish only after a stored Exit result and that finishing remains Mastery-neutral. Final integrated UI CI #201 passed application + fresh-Supabase double-green.

### Remaining limitations

This is the correct behavior for the current reviewed Pilot, not a claim that remediation is complete. A future reviewed Lesson Blueprint may add an explicit correction/retry stage and new immutable attempt groups; that work must preserve the existing Attempt/Evidence/Review contracts rather than silently changing this gate.