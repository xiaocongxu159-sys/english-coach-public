# P1-ENGINE-001B — Review Scheduler Adapter Release Review

**Date:** 2026-09-02  
**Status:** Complete and merged-main release-verified  
**Parent:** P1-ENGINE-001 remains in progress; 001C is still required

## Scope

This substage implements only the Review side of the Phase 1 state loop. It does not implement Daily planning, Lesson resolution, UI, hosted deployment, physical iPhone validation or full vertical E2E.

## Accepted implementation

- exact `ts-fsrs@5.4.2`; FSRS-6 product boundary; request retention 0.90; fuzz enabled;
- immediate same-session correction remains owned by the Lesson Engine;
- frozen Again/Hard/Good/Easy mapping with prompt caps;
- learner-specific Review Units by Knowledge Node + evidence modality + reviewed content reference;
- immutable Review Events with before/after FSRS state and reproducibility versions;
- same `attempt_group_id` exactly-once per Review Unit;
- distinct concurrent groups converge through database row lock + revision CAS;
- real Attempt time preserved separately from strictly monotonic FSRS scheduler time;
- Review RLS preserves own-row reads and blocks learner-authenticated writes;
- database RPC independently verifies Review gate, immutable Attempt-source binding, version binding and current before-state.

## Verification

Final accepted feature head before handoff-doc synchronization: `ccd8ca64b795548c16ce777f269222d0f5e0fa27`.

CI run #97 passed after the database trust-boundary hardening:

- locked install;
- Phase 0 schemas/configs;
- deterministic 735-node registry;
- reviewed A1 Pilot validator;
- Biome;
- TypeScript;
- node:test including Review adapter tests;
- Next production build;
- fresh local Supabase start/reset and all migrations;
- Auth/RLS regression;
- Pilot double seed and content-boundary regression;
- 001A Attempt/Evidence/Mastery + convergence regression;
- Review first-card/replay/prompt/multi-modal/concurrency/RLS integration;
- destructive Review RPC source-binding and before-state hardening tests.

A GitHub Actions-authored handoff synchronization commit later produced `action_required`; that status was not treated as a code failure or a release pass. A user-authored documentation-only commit retriggered the permanent CI against the exact final PR contents.

## Final release verification

- final feature CI run #100 — application + database jobs PASS;
- PR #26 — squash-merged to `main` as `274a856b5b27f4f426cef0c7460665e23ed58df1`;
- merged-main CI run #101 — application + database jobs PASS from the squash merge commit;
- P1-ENGINE-001B is therefore release-complete;
- parent P1-ENGINE-001 remains incomplete because 001C is still required.

## Manual review findings

Automated green status was not accepted by itself. Manual review added the database source-binding hardening after the first double-green Review implementation, then required a complete rerun. This mirrors the project rule established by the rejected first Pilot: passing CI proves encoded contracts, not that every necessary contract has already been encoded.

## Known intentional boundary for 001C

`review_status` stored on a Review Unit represents the status at its last authoritative transition. Daily planning must derive current `due`/`overdue` from `due_at` and current time, and map current Mastery `lapsed` to `relearning`. It must not assume a persisted status label automatically changes as time passes.

## Next

Begin **P1-ENGINE-001C — Curriculum service + bounded Daily Scheduler subset + Lesson resolver/resume** from merged-main commit `274a856b5b27f4f426cef0c7460665e23ed58df1`. Do not reopen 001A/001B design unless a new regression demonstrates a concrete defect.
