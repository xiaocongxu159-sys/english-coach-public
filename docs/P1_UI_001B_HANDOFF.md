# P1-UI-001B Lesson Runner Handoff

**Date:** 2026-09-02  
**Module:** P1-UI-001B — Lesson Runner  
**Status:** COMPLETE / MERGED-MAIN VERIFIED  
**Feature branch:** `feat/p1-ui-001b-lesson-runner`  
**Release PR:** #32  
**Final release PR head:** `cf5002c648ace77fb0d431f896eac5aed378c965`  
**Release PR CI:** #214 — application + fresh-Supabase double-green  
**Squash merge SHA:** `415fa68459423f3526d28e86a7308ec7b529bcc5`  
**Merged `main` CI:** #215 — application + fresh-Supabase double-green

## 1. What this module delivers

A logged-in learner can use the reviewed Phase 1 Pilot as a real resumable lesson without developer tools:

```text
Today
→ Start / Resume
→ one stable Lesson Instance
→ reviewed context / teaching / model dialogue
→ 5 recognition items
→ 5 controlled-production items
→ persisted deterministic feedback
→ speaking rehearsal or safe skip
→ server-derived Exit Check
→ Lesson Summary
→ Finish Lesson
```

This is a learner-facing shell over the already verified Engine. It does not recreate trusted planning, scoring, Evidence, Mastery or Review rules in browser state.

## 2. Start / resume boundary

- Today starts the first reviewed Daily Plan request through the existing server-owned `SupabaseLessonResolver`.
- Repeated Start/Resume converges on the same live Lesson Instance and stable `resolution_key`.
- `/lesson/[lessonId]` is authenticated and learner-private; another learner's Lesson ID does not expose the Lesson.
- Lesson stage state, completed checkpoints, allowed item IDs and prior Attempts are read from persisted state.
- Refresh/relogin restores the same Lesson rather than creating a client-only shadow lesson.

Verified first by CI #159 and retained through release and merged-main regression.

## 3. Reviewed teaching content

The page renders the canonical reviewed Pilot content from `content/pilots/a1-social-formulas-v1/`:

- lesson objectives;
- five reviewed social-formula teaching blocks;
- reviewed short dialogue;
- reviewed exercise items;
- reviewed speaking rehearsal prompt;
- frozen Exit Gate policy.

No live AI content is used as scored truth. The UI does not duplicate or silently broaden the two-node Pilot.

Generic Continue is allowed only for the three reviewed instruction stages. The browser submits only `lessonId`; the server reloads `current_stage_id`. Exercise stages therefore cannot be skipped by forging a later stage ID.

## 4. Deterministic exercise runner

The Lesson page presents exactly one server-derived next reviewed item at a time.

### Recognition

- 5 `multiple_choice_single` items;
- radio-button input;
- option must exist in the stored reviewed item.

### Controlled production

- 5 deterministic short-answer items;
- trimmed 1–240-character UI input;
- canonical Engine normalization/scoring remains authoritative.

### Trusted submission path

```text
browser form
→ authenticated Lesson ownership check
→ server reloads current stage + allowed items + persisted Attempts
→ derives next unanswered reviewed item
→ existing submitExerciseAttempt()
→ deterministic Scoring
→ Attempt
→ Evidence
→ Mastery derivation
→ exactly-once Review adapter
→ persisted feedback read back through learner RLS
```

The browser-provided stage/item values are only stale-request guards. They do not authorize the submission.

### Retry / replay safety

For each learner + lesson + stage + reviewed item, UI-B derives deterministic primary submission identity:

- stable submission key;
- stable UUID attempt group.

Exact network/browser replays reuse the existing Attempt and do not duplicate Evidence or Review effects. A conflicting replay with a different response is rejected. A request for a later item is rejected until earlier reviewed items are persisted.

The final item of each deterministic stage checkpoints that stage through the existing Lesson Resolver.

## 5. Feedback boundary

After submission, the page reads the persisted learner-owned Attempt evaluation. It does not re-score the answer in React/browser code.

The UI shows:

- `Correct.` for persisted correct deterministic evaluation;
- `Not quite.` plus the reviewed accepted answer when appropriate;
- persisted answer history survives reload.

Fresh-Supabase tests verify learner RLS can read own Attempts but cannot forge Attempt writes.

## 6. Speaking rehearsal boundary

The reviewed free-spoken item remains **practice only**.

`completeSpeakingRehearsal()` submits the reviewed speaking item through the same Attempt engine with a practice response and asserts all state-effect outputs remain neutral:

- `stateAffecting = false`;
- `isScored = false`;
- `trusted = false`;
- zero Evidence emitted;
- zero Review updates.

The UI offers:

- `I practiced aloud` — persists one state-neutral practice Attempt;
- `Skip for now` — uses the Resolver's optional-stage skip.

Repeated practice completion reuses the same Attempt. Fresh-Supabase CI #187 proved Evidence, Review Unit and Review Event counts are unchanged; the same invariant remained green in release CI #214 and merged-main CI #215.

## 7. Exit Check boundary

The reviewed Pilot gate is loaded from canonical `pilot.json`:

- 10 scored deterministic items;
- minimum 8 correct;
- `EI-A1-SOCIAL-CONTROLLED-001` must be correct;
- `EI-A1-SOCIAL-CONTROLLED-005` must be correct;
- speaking rehearsal is excluded from the score.

The browser never sends a score or pass/fail outcome.

`evaluateAndCheckpointExitGate()` derives the result only from persisted Attempts that are:

- owned by the learner and Lesson;
- expected deterministic Pilot items;
- `trusted = true`;
- `state_affecting = true`;
- persisted with deterministic scored evaluation.

The service requires the complete expected scored set, rejects duplicate/malformed inputs, stores an auditable `exit_gate_result` in Lesson state using `revision` CAS, and then checkpoints `exit_check`.

Permanent fresh-database regressions cover:

1. 10/10 correct → gate passes;
2. 9/10 correct but required `CONTROLLED-001` wrong → gate fails.

Both proceed to Lesson Summary. The failure result remains diagnostic; it does **not** fabricate Mastery. Learner RLS can read the result but cannot update/forge it.

## 8. Lesson Summary / completion boundary

A Lesson can finish only after a persisted Exit Gate result exists.

`completeLessonSummary()`:

- requires the current `lesson_summary` stage unless already completed;
- requires a stored Exit Gate result;
- completes the final stage through the existing Resolver;
- is idempotent when repeated;
- changes Lesson completion state only.

A failed Exit Gate does not create a dead-end because the current Pilot does not yet provide a dedicated correction/retry stage. The failed diagnostic is retained and the Lesson may still be completed; later Review/planning can remediate it.

This follows the frozen rule that **Lesson completion is not Mastery**. Mastery remains derived only from trusted Evidence across the required dimensions, sessions and time. In particular, the communicative-function node cannot become fully mastered merely because the learner clicked the speaking practice button.

## 9. Permanent database gates added by UI-B

`package.json` keeps these UI-B regressions in `test:engine-db`:

- `test/lesson-ui-service-db.integration.mts`;
- `test/lesson-exercise-ui-db.integration.mts`;
- `test/lesson-exercise-view-db.integration.mts`;
- `test/lesson-speaking-ui-db.integration.mts`;
- `test/lesson-exit-ui-db.integration.mts`.

They run after the existing Auth/RLS, Pilot, 001A, 001B, Daily Plan, Lesson Resume and Today tests on a database rebuilt from empty state.

## 10. Verification and release history

- **CI #159** — Start/Resume service + stable Lesson Instance: PASS / PASS.
- **CI #163** — canonical reviewed content + safe instruction-stage advance: PASS / PASS.
- **CI #172** — clickable Today → Lesson page: PASS / PASS.
- **CI #176** — all 10 deterministic items through authoritative Engine: PASS / PASS.
- **CI #184** — real one-at-a-time exercise forms + persisted feedback: PASS / PASS.
- **CI #187** — speaking practice state-neutrality: PASS / PASS.
- **CI #191** — clickable speaking practice/skip UI: PASS / PASS.
- **CI #195** — canonical persisted Exit Gate pass/fail cases: PASS / PASS.
- **CI #197** — guarded Summary completion for pass and fail outcomes: PASS / PASS.
- **CI #201** — final integrated learner-facing Lesson UI before documentation synchronization: PASS / PASS.
- **CI #214** — final documentation-synchronized PR #32 head `cf5002c648ace77fb0d431f896eac5aed378c965`: PASS / PASS.
- **PR #32** — squash-merged normally to `main` as `415fa68459423f3526d28e86a7308ec7b529bcc5`.
- **Merged `main` CI #215** — exact squash merge SHA: application + fresh-Supabase PASS / PASS.

Failures caught and fixed rather than waived included:

- Biome ARIA/lint issues in early Lesson page iterations;
- Node/TypeScript test narrowing and import-name mistakes;
- `autoFocus` accessibility rejection;
- the cross-layer discovery that speaking must remain inside the reviewed Blueprint and cannot be trusted evidence;
- the Exit Gate dead-end risk when no correction/retry stage exists in the current Pilot.

## 11. Invariants preserved

1. All 735 canonical registry nodes remain `draft`; UI-B activates nothing.
2. Learner-active scope remains the exact two-node reviewed Pilot.
3. Browser code cannot write authoritative Attempt/Evidence/Mastery/Review/Lesson state directly.
4. Deterministic reviewed content remains the only current state-changing scored truth.
5. Speaking rehearsal is state-neutral practice only.
6. Retry/replay cannot duplicate trusted state effects.
7. Lesson stage/item authorization remains server-owned.
8. Exit Gate outcome is server-derived from persisted trusted Attempts.
9. Lesson completion is not Mastery.
10. Existing Auth/RLS and empty-database replay remain permanent gates.

## 12. What is not complete yet

UI-B is complete, but **P1-UI-001 and Phase 1 are not complete**.

Still required:

- **P1-UI-001C** simple authoritative Review queue + vertical integration;
- ensure Today after Lesson/Review reflects persisted prior state as intended;
- hosted Supabase/environment configuration;
- hosted auth/email-confirmation browser E2E;
- reachable deployment;
- physical iPhone PWA validation;
- full P1-E2E-001 release gate.

## 13. Exact next step

Begin **P1-UI-001C — Review queue + vertical integration** from a `main` that contains UI-B merge `415fa68459423f3526d28e86a7308ec7b529bcc5` and has passed merged-main CI #215.

UI-C must consume authoritative Review Units and existing Today/Lesson state. It must not invent client-side scheduler, grade mapping or Mastery truth. The first UI-C slice should establish a read-only learner Review queue/service with dynamic due/overdue classification from `due_at`, then add a reviewed Review-attempt path only through the existing exactly-once Review adapter.