# P1-ENGINE-001A Release Note

**Scope:** deterministic Scoring → Attempt → Evidence → Mastery core  
**Date:** 2026-09-01  
**Status:** acceptance candidate passed on feature branch; P1-ENGINE-001 remains incomplete until Review + planning/lesson engine are delivered.

## What this slice implements

- deterministic scoring for reviewed/validated deterministic Exercise Items;
- explicit answer normalization for reviewed alternatives;
- server-authoritative Attempt persistence;
- per-user `submission_key` idempotency;
- immutable accepted-source snapshot on each accepted Attempt:
  - Exercise Item version;
  - target Knowledge Node IDs;
  - evidence type;
  - content/trust class;
  - Mastery/Review state-effect policy;
- Lesson Instance ownership and stage/item authorization;
- authoritative Evidence Event creation from the frozen Attempt source snapshot;
- evidence-contract validation against active Knowledge Nodes;
- deterministic Mastery derivation from the frozen Mastery v1 config;
- `functional`, `secure`, `lapsed` and prerequisite-readiness behavior required by the Pilot;
- practice-only spoken activity remains non-scored and cannot change Mastery/Review;
- at most one state-affecting retrieval per learner `attempt_group_id`;
- same-group concurrent retries are persisted only as state-neutral retries after the database state-effect slot is won;
- different attempt groups updating the same Knowledge Node converge monotonically: a derivation based on fewer/older scored Evidence Events cannot overwrite a richer/newer learner-node state.

## Database integrity additions

`20260901000300_engine_integrity.sql` aligns runtime vocabulary with the frozen Phase 0 contracts and adds:

- assistance levels: `independent`, `minor_prompt`, `major_prompt`, `model_then_repeat`;
- evaluator-confidence labels: `high`, `medium`, `low`;
- Attempt idempotency/source-trace columns;
- one-state-affecting-attempt-per-group unique index;
- unique Evidence identity `(attempt_id, node_id, evidence_type)`;
- service-role-only `apply_learner_node_state(...)` function for monotonic concurrent state application;
- learning-engine system-version metadata.

## Acceptance behavior proved

Feature head `5b9c9a9d81b38d0c8c164b707af7893527684e1a`, PR #24, CI run #91:

### Application job — PASS

- Phase 0 contract validation;
- canonical 735-node curriculum registry validation;
- reviewed Pilot validation;
- Biome lint;
- TypeScript typecheck;
- node:test suite;
- Next.js production build.

### Empty-Supabase database job — PASS

- local Supabase boot;
- database rebuild from empty state;
- Auth/RLS regression;
- Pilot double seed;
- Pilot visibility/trust boundaries;
- deterministic Engine persistence and Mastery transitions;
- concurrent same-group retry protection;
- immutable-source replay after Exercise Item drift;
- Lesson Stage item authorization;
- different-group concurrent Mastery convergence;
- cleanup.

## Problems found before acceptance

### 1. Green CI did not cover semantic trust boundaries

The first implementation passed CI, but manual audit found three gaps:

- immediate retries could masquerade as new state-affecting retrievals;
- accepted Attempts did not freeze the content/version facts needed for trustworthy replay;
- Lesson ownership was checked, but Stage → Item authorization was not.

Fix: add Attempt source snapshots, Stage allow-lists, one state-effect slot per attempt group, and real DB tests.

### 2. PR head synchronization anomaly

The connected GitHub PR object repeatedly remained pinned to an older branch head after the branch ref advanced.

Verified workaround: close and reopen the same Draft PR, then confirm `head_sha` equals the branch head before accepting CI. Old green runs must never be treated as coverage for a newer branch head.

### 3. Strict TypeScript failure after hardening

The first hardened CI failed TypeScript on optional test fixtures/user IDs; Biome also reported optional-chain warnings.

Fix: make post-creation learner IDs non-optional, guard the saved fixture before restore, and remove the warnings. A later run passed all application gates.

### 4. Cross-group stale Mastery overwrite race

Even after same-group retry protection, two independent attempt groups could update one Knowledge Node concurrently. A smaller/older derivation could theoretically be written after the richer state.

Fix: database-side monotonic learner-node-state application compares scored-evidence count and last evidence time. A dedicated empty-Supabase integration test proves the final VX Pilot node converges to `functional` after concurrent independent recognition attempts.

## Explicitly not implemented in 001A

- FSRS / Review Scheduler Adapter;
- Review Unit activation/state updates;
- Daily Scheduler / bounded Today plan;
- Lesson resolver/resume service beyond submission authorization;
- learner-facing Today/Lesson/Review UI;
- hosted deployment/iPhone PWA E2E.

These remain part of P1-ENGINE-001 and later Phase 1 tasks. No document should interpret this release note as Phase 1 completion.

## Next internal slice

**P1-ENGINE-001B — Review Scheduler Adapter + exactly-once Review state effect.**

Use the frozen `SPACED_REVIEW_MODEL.md` and `config/review-v1.config.json`. Preserve the one-attempt-group state-effect invariant established here.
