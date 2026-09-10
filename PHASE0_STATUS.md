# Phase 0 Status — FROZEN

**Date:** 2026-09-01  
**Phase 0 result:** COMPLETE / PASS  
**Application status:** NOT YET IMPLEMENTED

| Item | Status |
|---|---|
| Project goal | Complete |
| IELTS + real communication dual target | Complete |
| PWA-first direction | Complete |
| Documentation baseline | Complete |
| Curriculum source policy | Complete |
| AI teaching baseline | Complete |
| Architecture baseline v1 | Complete |
| Open-source/reference reuse policy | Complete |
| Knowledge-node schema v1.1 | Complete |
| Complete A1→B2 graph | Complete — 735 design nodes |
| Lesson-unit schema v1 | Complete |
| Mastery model v1 | Complete |
| Spaced-review model v1 | Complete |
| Placement test blueprint v1 | Complete |
| Daily lesson algorithm v1 | Complete |
| Listening-content specification v1 | Complete |
| Exercise generation/validation specification v1 | Complete |
| IELTS progression gates v1 | Complete |
| Phase 0 cross-document design review/freeze | Complete — PASS |
| Application code | Not started — Phase 1 next |

## Freeze artifacts

- `docs/PHASE0_FREEZE_REVIEW.md`
- `docs/IMPLEMENTATION_HANDOFF.md`
- updated `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md` through DEC-022

## Frozen core invariants

- Curriculum chooses learning targets; AI does not own the syllabus.
- Lesson completion is not Mastery.
- Productive abilities require productive evidence.
- Low-confidence AI cannot change learner progression.
- Unvalidated generated content cannot create trusted scored evidence.
- FSRS/review due status is separate from English Mastery.
- Placement Clearance never fabricates Mastery.
- Daily study time is bounded and explainable.
- Guided repeated listening is separate from IELTS one-pass assessment.
- IELTS readiness is separate, estimated and non-official; it is not a CEFR conversion.
- Pronunciation targets intelligibility rather than native-accent imitation.
- PWA/iPhone is the first delivery target; native iOS remains deferred.

## What Phase 0 completion does NOT mean

The following are not yet implemented/completed:

- Next.js/PWA application;
- Supabase database/auth;
- canonical machine-readable runtime registry for the 735 nodes;
- full reviewed lesson/exercise/audio banks;
- real-user calibration of Mastery/Review/Scheduler defaults;
- calibrated IELTS forms / AI Writing-Speaking scoring;
- realtime voice/WebRTC;
- real iPhone end-to-end learning test.

These are Phase 1+ implementation/content tasks and are explicitly tracked in the handoff.

## Phase 1 next milestone

**Usable vertical slice, not infrastructure volume.**

Start with a small reviewed A1 subset and prove:

`Today → Lesson → Attempt → Evidence → Mastery → Review → persistent return/resume`

on desktop and a physical iPhone PWA.

See `docs/IMPLEMENTATION_HANDOFF.md` for task order and acceptance gates.
