# Architecture Baseline v1

**Updated:** 2026-09-01  
**Status:** Phase 0 frozen implementation baseline — application not yet implemented

## 1. Architecture goals

- iPhone-first usability through responsive PWA/browser for V1;
- one genuinely usable learning loop before horizontal feature expansion;
- structured learner state separate from raw chat history;
- auditable curriculum/planning/scoring/mastery/review decisions;
- server-authoritative state transitions;
- replaceable AI/model/provider interfaces where practical;
- secure API-key/session handling;
- reusable generic infrastructure without surrendering product-owned pedagogy.

## 2. Proposed implementation stack

Use current stable package/framework versions at implementation time and pin selected versions in a lockfile.

### Frontend/application

- Next.js + TypeScript
- PWA support
- responsive iPhone-first UI
- server/API capabilities in the same application initially to keep the pilot simple

### Data/auth

- Supabase Postgres
- Supabase Auth
- object storage only where needed for approved audio/content assets

### Validation

- JSON Schema runtime validation for Phase 0 machine contracts
- TypeScript domain types derived/aligned with schemas
- CI validation for schemas/configs/curriculum graph

### AI

OpenAI APIs behind application-owned interfaces for later stages:

- realtime speech interaction;
- text reasoning/generation;
- transcription/speech generation where useful;
- rubric evaluation where explicitly approved.

Do not hard-code curriculum semantics to one model name. Model/provider selection is configuration and can change without changing Knowledge Node meaning or learner history.

### Review scheduling

Preferred current candidate: `open-spaced-repetition/ts-fsrs`, isolated behind an app-owned Review Scheduler Adapter.

If the current package is used, the runtime must meet its current Node.js requirement (currently Node 20+). Re-check library version/license/requirements when implementation begins.

FSRS never owns English Mastery semantics.

## 3. Frozen learning flow

```text
                 iPhone / Desktop Browser
                         |
                     Next.js PWA
                         |
       +-----------------+-------------------+
       |                                     |
   Learning API                         Future AI/Voice
       |                                     |
       v                                     v
Knowledge Graph                        AI service boundary
Placement/Clearance                    explanation/voice/rubric
Daily Scheduler                              |
Lesson Resolver                               |
Exercise/Content Services <-------------------+
       |
Learner Attempt
       |
Mastery Evidence
       +------------------+
       |                  |
       v                  v
Mastery State       Review Scheduler Adapter
                          |
                        FSRS

Separate exam layer:
IELTS checkpoint evidence → IELTS Readiness Profile

Persistence/auth/version metadata → Supabase
```

## 4. Logical modules and ownership

### 4.1 Curriculum

Owns:

- Knowledge Nodes;
- hard/soft prerequisites;
- relationships;
- curriculum version;
- node lifecycle (`draft/reviewed/active/deprecated`);
- real-world/IELTS relevance metadata.

Phase 1 must convert the frozen 735-node design into a canonical machine-readable registry. Importing a node does not automatically activate it.

### 4.2 Placement

Owns:

- Placement Blueprint/Result;
- per-domain bands/confidence/gaps;
- scoped Curriculum Clearance.

Clearance is scheduling permission only and never writes fake Mastery.

### 4.3 Planning

Owns:

- Daily Plan;
- fixed time budget;
- P0–P6 selection priorities;
- review-debt behavior;
- weekly skill balance;
- selected/deferred explanations.

### 4.4 Lessons

Owns:

- reusable Lesson Blueprints;
- learner-specific Lesson Instances;
- staged execution;
- resume/checkpoint state;
- content/AI permissions.

Lesson completion does not change Mastery by itself.

### 4.5 Content/listening

Owns:

- approved learning content lifecycle;
- Listening Assets and audio/transcript metadata;
- source/copyright status;
- content/version references;
- QA status.

Unreviewed AI-generated content cannot produce trusted state-changing evidence.

### 4.6 Exercises

Owns:

- Exercise Templates;
- Exercise Items;
- Exercise Attempts;
- deterministic/rubric/hybrid scoring interfaces;
- validator results;
- evaluator confidence/assistance metadata.

Only reviewed core or validated variants passing all applicable gates may produce state-changing evidence.

### 4.7 Mastery

Owns:

- Mastery Evidence Events;
- Learner Node State;
- promotion/lapse derivation;
- hard-prerequisite readiness from direct evidence.

States:

`unseen → introduced → developing → functional → secure`, plus `lapsed`.

Low-confidence AI cannot promote/demote.

### 4.8 Review

Owns:

- learner-specific Review Units;
- Review State;
- adapter mapping to FSRS ratings;
- due/stability/difficulty/retrievability metadata;
- algorithm/library/parameter versions.

Review due/overdue is not automatic Mastery loss.

### 4.9 IELTS readiness

Owns:

- exam variant;
- IELTS progression stage;
- validated checkpoint evidence;
- per-component estimated ranges/confidence;
- target-readiness gate.

It does not overwrite general-English Mastery. Internal results are explicitly estimated/non-official.

### 4.10 AI teaching / realtime voice

Owns AI execution only within product constraints:

- explanation adaptation;
- bounded examples/variants;
- correction/retry coaching;
- later realtime conversation;
- approved rubric evaluation.

AI never chooses arbitrary syllabus progression or bypasses state-effect validators.

## 5. Minimum persistent entities

Phase 1 database design should map the frozen semantics, likely including:

- learner_profiles
- curriculum_versions
- knowledge_nodes
- knowledge_prerequisites / relationships
- curriculum_clearances
- placement_runs / placement_results
- daily_plans
- lesson_blueprints
- lesson_instances
- listening_assets / content_assets
- exercise_templates
- exercise_items
- exercise_attempts
- mastery_evidence_events
- learner_node_states
- review_units
- review_states / review_logs
- ielts_readiness_profiles / checkpoints
- version/config metadata

Later phases may add:

- realtime_speaking_sessions
- speaking_error_events
- prompt/evaluator traces where necessary
- reporting aggregates

Exact relational schema belongs to implementation migrations; semantic ownership above is frozen.

## 6. Security rules

- Never expose long-lived OpenAI/service keys in client JavaScript.
- Keep authoritative scoring, Mastery and Review transitions server-side.
- Validate all IDs, ownership and state-effect requests server-side.
- Apply appropriate Supabase row-level access controls to learner-owned data.
- Persist generated-content trust status explicitly.
- Do not accept a client-submitted `mastery_state` as authoritative.
- Record versions needed to explain consequential learning decisions.

## 7. Versioning requirements

Version separately where applicable:

- application release;
- curriculum/node version;
- Lesson Blueprint;
- content/Listening Asset;
- Exercise Template/Item;
- Mastery config/algorithm;
- Review adapter/library/parameters;
- Placement configuration;
- Daily Scheduler configuration;
- IELTS readiness configuration/rubric reference;
- AI instruction/prompt/model reference when material to diagnostic/scored evidence.

## 8. Observability from first usable slice

At minimum capture:

- application/database errors;
- plan selection/defer reasons;
- lesson stage/resume failures;
- exercise validator/scoring failures;
- Mastery before/after + evidence reason;
- Review before/after + normalized rating;
- AI request/evaluator failures when AI is introduced;
- content/version references.

The system must be able to answer “why was this assigned/scored this way?”

## 9. iPhone/PWA validation

Do not infer iPhone behavior from desktop.

Phase 1 physical-device tests:

- add to Home Screen;
- responsive Today/Lesson/Review flow;
- auth/session persistence;
- audio playback when included;
- interruption/resume;
- network error/retry.

Later realtime phase adds:

- microphone permissions;
- WebRTC connect/reconnect;
- Bluetooth/headset switching;
- screen-lock/background suspension;
- audio routing;
- transcript/event continuity.

## 10. Vertical-slice implementation rule

Phase 1 must not build all infrastructure horizontally before proving a learning loop.

Use a small reviewed A1 pilot to validate:

```text
Today → Lesson → Attempt → Evidence → Mastery → Review → return/resume
```

on desktop and real iPhone PWA.

The complete task order and acceptance gates live in `docs/IMPLEMENTATION_HANDOFF.md`.

## 11. Phase 0 freeze meaning

This document freezes **ownership and interfaces**, not every table column or dependency version.

Implementation may evolve technical details, but changes that alter core semantic ownership require a recorded Decision and compatibility/migration analysis.
