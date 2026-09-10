# Phase 0 Cross-Document Design Review & Freeze

**Review:** P0-FREEZE-001  
**Date:** 2026-09-01  
**Result:** PASS — core learning architecture ready for implementation  
**Meaning of PASS:** design interfaces are coherent enough to implement; it does **not** mean the application or learner content is already production-ready.

## 1. Review scope

The review covers the full Phase 0 learning architecture:

- Product and AI Teaching specifications;
- A1–B2 Knowledge Node graph;
- Knowledge Node schema/prerequisites;
- Lesson Blueprint / Lesson Instance;
- Mastery Evidence / Learner Node State;
- Review Unit / FSRS adapter boundary;
- Placement / Curriculum Clearance;
- Daily Scheduler;
- Listening Asset specification;
- Exercise Template / Item / Attempt;
- IELTS Progression / Readiness;
- preliminary technical architecture and third-party reuse decisions.

## 2. Frozen end-to-end model

```text
A1–B2 Knowledge Graph (735 design nodes)
        ↓
Placement Profile
  + scoped Curriculum Clearance
        ↓
Daily Scheduler
        ↓
Lesson Blueprint
        ↓ resolve for learner
Lesson Instance
        ↓
Reviewed/validated learning content
Listening Asset / Exercise Item / speaking interaction
        ↓
Exercise Attempt / learner production
        ↓
Mastery Evidence Event
        ├──────────────→ Learner Node Mastery State
        └──eligible───→ Review Unit / FSRS Adapter state
                                ↓
                         future due retrieval

General-English evidence remains separate from:
IELTS checkpoint evidence → IELTS Readiness Profile
```

## 3. Cross-document invariants

| Invariant | Result | Evidence / resolution |
|---|---|---|
| Curriculum, not AI, decides what is learned | PASS | Knowledge graph + Daily Scheduler determine target nodes; AI Teaching is bounded |
| Lesson completion is not mastery | PASS | Lesson Instance emits evidence only; Mastery Model owns learner-node state |
| Recognition alone cannot prove productive mastery | PASS | Nodes declare required evidence types; Mastery keeps productive evidence dimensions |
| Low-confidence AI cannot change progression | PASS | Mastery and Exercise policies block low-confidence promotion/demotion |
| Unvalidated generated content cannot create trusted evidence | PASS | Exercise content classes and Listening QA gates block state-changing use |
| Review due date is not language mastery | PASS | FSRS adapter owns memory scheduling only; Mastery remains product-owned |
| Placement cannot fabricate historical mastery | PASS | Curriculum Clearance is scoped scheduling permission and is revocable |
| Daily study time is bounded and explainable | PASS | Daily Scheduler uses P0–P6 priorities and a hard user time budget |
| Guided listening and IELTS one-pass listening are distinct | PASS | Listening modes explicitly separate teaching scaffolds from one-pass exam behavior |
| IELTS readiness is not a direct CEFR conversion | PASS | Readiness uses separate component evidence, ranges/confidence and estimated-not-official flag |
| Accent identity is not treated as correctness | PASS | Pronunciation target is intelligibility; accent variation is receptive exposure |
| Model/provider names are not curriculum semantics | PASS | Architecture keeps AI model selection behind configurable service boundaries |

No blocking contradiction was found among these invariants.

## 4. Curriculum graph review

Frozen design baseline:

- A1: 124 nodes
- A2: 164 nodes
- B1: 206 nodes
- B2: 241 nodes
- total: **735**

Prior structural validation:

- duplicate IDs: 0 — PASS
- missing hard prerequisites: 0 — PASS
- circular hard-prerequisite chains: 0 — PASS
- topological ordering: 735/735 — PASS

Freeze interpretation:

The **semantics and dependency design** are frozen as the Phase 0 baseline. The detailed nodes are still `draft` until content/evidence requirements are reviewed for activation. Implementation must not silently mark all 735 nodes active merely because the graph exists.

## 5. Machine-contract review

Phase 0 defines machine schemas/configuration for:

- Lesson Blueprint;
- Lesson Instance;
- Mastery Evidence Event;
- Learner Node State;
- Review Unit;
- Review State;
- Placement Blueprint;
- Placement Result;
- Daily Plan;
- Listening Asset;
- Exercise Template;
- Exercise Item;
- Exercise Attempt;
- IELTS Readiness Profile.

Each schema was validated during its owning task against JSON Schema Draft 2020-12 and representative synthetic fixtures. Cross-document review found no conflicting shared enum/semantic ownership that blocks implementation.

### Implementation requirement

Phase 1 must add an automated repository validation command/CI job so future schema/config changes are validated continuously instead of relying on one-time Phase 0 validation notes.

## 6. Blocking issues found and resolved during Phase 0

### A. Premature mastery event count

An early Knowledge Node example accidentally implied a fixed minimum evidence count before the Mastery Model existed.

Resolution: removed/deferred, then defined configurable Mastery v1 gates in the proper task.

### B. Experienced-user prerequisite deadlock

Mastery normally requires multiple sessions, which would force a genuine B1 learner through every A1/A2 prerequisite after signup.

Resolution: Curriculum Clearance can satisfy initial scheduling gates without inventing Mastery and can be revoked by later direct failure.

### C. Review scheduler ownership

A spaced-repetition library could have accidentally become the definition of English ability.

Resolution: FSRS is isolated behind a Review Adapter and owns memory scheduling only.

### D. AI-generated scored item self-certification

A model could otherwise create a flawed item, define its own answer and permanently score the learner from it.

Resolution: Template → Item → Attempt separation plus independent validation gates; unvalidated content cannot alter state.

### E. IELTS exam method leaking into all listening instruction

One-pass exam constraints could make beginner/intermediate listening less teachable.

Resolution: guided repeated listening is explicitly separate from one-pass readiness/IELTS mode.

## 7. Non-blocking implementation/content debt

These items are **not complete** and must not be represented as complete to the learner:

1. The 735-node curriculum is not yet stored as a canonical machine-readable registry/database seed.
2. Knowledge Nodes are not all content-reviewed/active.
3. There is no complete reviewed Lesson Blueprint library.
4. There is no complete reviewed exercise bank.
5. There is no complete reviewed Listening audio/script bank.
6. Placement anchor items and productive rubrics need actual content plus calibration.
7. AI Writing/Speaking/Pronunciation rubrics need real-user reliability calibration.
8. Internal IELTS forms need calibration before band estimates can receive high confidence.
9. Realtime voice/session lifecycle has not been implemented or tested on iPhone.
10. Supabase/database/auth/PWA application code has not yet been created.
11. Reading passage corpus and later writing-task corpus remain content/implementation work even though their node/evidence/exercise contracts are defined.
12. Real-user data is required to tune Mastery thresholds, FSRS parameters, review-debt envelopes and weekly skill-balance defaults.

None of the above is hidden by the Phase 0 completion status.

## 8. Architecture issue found in freeze review

The original `ARCHITECTURE.md` still used preliminary entity names such as `lesson_templates`, `mastery_state` and `review_schedule`, written before the final Phase 0 contracts existed.

Resolution in this freeze task:

- update Architecture to the final Blueprint/Instance, Evidence/State, Review Unit/State, Placement/Clearance, Daily Plan and IELTS Readiness terminology;
- make machine-readable curriculum registry/import a Phase 1 task;
- keep AI providers configurable;
- preserve secure server-side state transitions.

## 9. Implementation strategy change: vertical slice first

A layer-by-layer implementation could produce weeks of infrastructure without a usable learning loop.

Phase 1 therefore adopts a **vertical-slice-first** acceptance strategy.

The first usable technical milestone must allow a small approved A1 pilot subset to complete this loop:

```text
user/session
   ↓
Today plan
   ↓
resolved Lesson Instance
   ↓
reviewed exercise/content
   ↓
learner Attempt
   ↓
Mastery Evidence
   ↓
Learner Node State update
   ↓
Review Unit/due state
   ↓
resume/return tomorrow
```

It must work in desktop browser and on a real iPhone PWA before the system expands horizontally across all features.

## 10. Phase 0 freeze rule

After this review is merged:

- Phase 0 documents are the implementation baseline;
- semantic changes to frozen contracts require a recorded Decision and migration/compatibility analysis;
- implementation may add fields/tables/adapters, but may not silently change core ownership rules;
- configurable V1 thresholds remain configurable and are expected to evolve through calibration;
- content activation remains a reviewed lifecycle, not automatic generation.

## 11. Phase 0 exit verdict

**PASS.**

The project has a coherent, auditable design for a systematic English-learning engine that can support both real communication and IELTS preparation.

Phase 1 may begin after the freeze branch is merged.

The next deliverable is `docs/IMPLEMENTATION_HANDOFF.md` and the first Phase 1 vertical slice.
