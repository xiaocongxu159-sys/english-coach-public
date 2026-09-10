# Lesson Unit Schema v1

**Task:** P0-LES-001  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

The curriculum graph tells the system **what can be learned**. A Lesson Unit tells the system **how a selected set of knowledge nodes becomes one learnable session**.

A lesson must not become another owner of curriculum meaning. Knowledge Nodes remain the stable source of scope, prerequisites and learning objectives. Lessons package nodes into an experience that can:

- retrieve prior knowledge;
- explain/model new material;
- practice recognition and production;
- apply language through listening/reading/speaking/writing/pronunciation;
- run correction + retry loops;
- capture structured evidence for the later mastery model;
- pause/resume safely;
- finish without falsely declaring mastery.

## 2. Two-layer model

A single object is not enough because the product needs both reusable pedagogy and user-specific scheduling.

### Lesson Blueprint

A versioned reusable pattern that defines:

- lesson type;
- duration envelope;
- node-selection limits;
- stage sequence;
- evidence types to capture;
- AI/content permissions;
- personalization boundaries;
- resume behavior.

Machine schema:

`schemas/lesson-blueprint.schema.json`

### Lesson Instance

A learner-specific resolved lesson created by the scheduler. It contains:

- the selected primary/support/review nodes;
- resolved stages and content references;
- runtime learner context;
- completion state;
- captured evidence-event references.

Machine schema:

`schemas/lesson-instance.schema.json`

This separation lets the same teaching pattern serve different learners without copying or mutating the curriculum graph.

## 3. Lesson types

V1 supports:

- `new_learning`
- `mixed_learning`
- `review`
- `speaking_focus`
- `listening_focus`
- `reading_focus`
- `writing_focus`
- `pronunciation_focus`
- `assessment_checkpoint`
- `ielts_practice`

The everyday default is expected to be `mixed_learning`: required review + limited new learning + productive application.

## 4. Node roles inside a lesson

### Primary nodes

The main learning targets. A blueprint allows 1–4, but normal daily lessons should usually remain small enough for meaningful production rather than superficial coverage.

### Support nodes

Already available or lightly scaffolded knowledge needed to perform the lesson. Support nodes do not automatically become learning targets.

### Review nodes

Previously studied nodes due for retrieval/review. The future scheduler/review model chooses them.

A node must not occupy multiple roles in the same Lesson Instance.

## 5. Stage vocabulary

Approved stage kinds:

- `review_retrieval`
- `activate_context`
- `teach_explain`
- `model`
- `recognition`
- `controlled_production`
- `listening_application`
- `reading_application`
- `speaking_application`
- `writing_application`
- `pronunciation_application`
- `correction_retry`
- `exit_check`
- `summary_reflection`

Blueprints do not need every stage. Stage composition depends on lesson type and active node domains.

## 6. Default pedagogical flow

A common integrated lesson should resemble:

```text
Retrieval review
      ↓
Context activation
      ↓
Explain / model
      ↓
Recognition
      ↓
Controlled production
      ↓
Real receptive/productive application
      ↓
Correction + retry
      ↓
Exit check
      ↓
Summary / next review signal
```

This is a default flow, not a fixed UI page order.

## 7. Evidence types emitted by lessons

The Lesson Unit records evidence opportunities but does not define mastery weights or thresholds.

Allowed evidence categories:

- `recognition`
- `controlled_production`
- `free_written_production`
- `free_spoken_production`
- `spontaneous_reuse`
- `listening_comprehension`
- `reading_comprehension`
- `pronunciation_intelligibility`
- `communication_repair`

The future mastery task decides how evidence is weighted, aged and combined.

**Important:** Lesson completion is not node mastery.

## 8. AI/content permissions

Each stage declares an `ai_content_mode`:

- `none`
- `reviewed_only`
- `bounded_variant`
- `interactive_teacher`

Rules:

1. AI may not expand beyond the active node scope.
2. Core teaching content can require reviewed material.
3. AI-generated scored variants are `validated_only` or forbidden.
4. Interactive speaking/correction may be dynamic but remains bounded by lesson context.
5. The AI receives node IDs, lesson goals, recent learner errors and difficulty/support settings rather than a generic “teach English” prompt.

## 9. Personalization envelope

Blueprints can permit:

- scenario choice;
- learner-interest context;
- bounded difficulty adjustment;
- adaptive Chinese support;
- AI-created variants.

They must set `forbid_scope_expansion: true`.

Personalization changes the **route/example/scenario**, not the approved learning target.

## 10. Runtime context contract

A Lesson Instance carries a compact learner context:

- recent error categories;
- scenario tags;
- language-support mode;
- difficulty band;
- optional learner-interest tags.

The lesson should not depend on raw conversation history as its only learner memory.

## 11. Resume and interruption behavior

A lesson is checkpointed after stages rather than only at final completion.

Required behavior:

- preserve completed-stage state;
- preserve attempts/evidence already captured;
- resume at the next safe stage;
- do not duplicate scored evidence simply because the app reopened;
- allow a learner to abandon a lesson without corrupting mastery history.

This is especially important for iPhone/PWA use where sessions may be interrupted.

## 12. Example Blueprint

```yaml
id: LESB-A1-ROUTINE-INTEGRATED-01
version: 1
status: draft
level: A1
name: "Daily routine: learn, use, speak"
lesson_type: mixed_learning

duration_minutes:
  min: 25
  target: 35
  max: 45

node_selection:
  primary_domains: [GR, VX, SP]
  primary_count: {min: 1, max: 3}
  support_count_max: 5
  review_count_max: 6
  require_hard_prerequisites_ready: true

stages:
  - key: retrieval
    kind: review_retrieval
    required: true
    minutes: {min: 3, max: 6}
    target_role: review
    evidence_types: [recognition]
    ai_content_mode: bounded_variant

  - key: teach
    kind: teach_explain
    required: true
    minutes: {min: 4, max: 8}
    target_role: primary
    evidence_types: []
    ai_content_mode: interactive_teacher

  - key: controlled
    kind: controlled_production
    required: true
    minutes: {min: 5, max: 8}
    target_role: primary
    evidence_types: [controlled_production]
    ai_content_mode: bounded_variant

  - key: speak
    kind: speaking_application
    required: true
    minutes: {min: 8, max: 15}
    target_role: mixed
    evidence_types: [free_spoken_production, spontaneous_reuse]
    ai_content_mode: interactive_teacher

  - key: retry
    kind: correction_retry
    required: true
    minutes: {min: 3, max: 6}
    target_role: primary
    evidence_types: [controlled_production, free_spoken_production]
    ai_content_mode: interactive_teacher

  - key: summary
    kind: summary_reflection
    required: true
    minutes: {min: 2, max: 4}
    target_role: none
    evidence_types: []
    ai_content_mode: interactive_teacher

personalization:
  scenario_tags_allowed: [routine, work/study identity, home]
  learner_interest_allowed: true
  chinese_support: adaptive
  difficulty_adjustment: bounded
  forbid_scope_expansion: true

content_policy:
  reviewed_core_required: true
  ai_variants_allowed: true
  scored_ai_variant_policy: validated_only

resume_policy:
  checkpoint_after_each_stage: true
  preserve_attempts: true
```

A resolved Lesson Instance may select:

```text
Primary:
GR-A1-PRES-SIMPLE-AFF-01
VX-A1-DAILY-ROUTINE-01
SP-A1-ROUTINE-SHORTTALK-01

Support:
GR-A1-ADV-FREQ-01

Review:
VX-A1-TIME-DATE-01
```

## 13. Semantic validation rules

JSON Schema validates shape/type/enums. A separate semantic validator must enforce cross-field rules that standard JSON Schema does not conveniently express.

Required semantic checks:

1. Blueprint ID level matches `level`.
2. `duration.min <= duration.target <= duration.max`.
3. stage `minutes.min <= minutes.max`.
4. stage keys are unique.
5. primary-count min <= max.
6. sum of required-stage minimum minutes cannot exceed lesson maximum.
7. Lesson Instance primary/support/review node sets do not overlap.
8. all selected Knowledge Node IDs resolve.
9. selected primary nodes have required hard prerequisites ready before new scored learning.
10. instance target nodes are contained within selected nodes.
11. all required Blueprint stages resolve into the instance unless an approved adaptation rule explicitly permits otherwise.
12. evidence types requested by the lesson are compatible with the target node assessment requirements.
13. reviewed/active lesson content references resolve and have known source/licensing status.
14. completion of a Lesson Instance does not directly mutate a node to `mastered`; it only emits evidence events.

## 14. Validation performed for P0-LES-001

The two JSON schemas were checked as valid JSON Schema Draft 2020-12 definitions.

Test fixtures were constructed for:

- an A1 integrated routine Lesson Blueprint;
- a learner-specific Lesson Instance using real A1 node IDs.

Validation result:

- Blueprint schema validation: PASS
- Instance schema validation: PASS
- ID/level consistency: PASS
- duration ordering: PASS
- stage uniqueness: PASS
- stage min/max ordering: PASS
- selected-node role overlap: 0 — PASS
- stage targets outside selected nodes: 0 — PASS
- required stages missing: 0 — PASS

## 15. Deferred decisions

P0-LES-001 intentionally does not define:

- mastery weights/thresholds;
- exact evidence-event scoring;
- spaced-review intervals;
- daily scheduler priorities;
- placement-test scoring;
- listening content calibration;
- IELTS scoring/readiness formulas.

Those belong to the next dedicated Phase 0 tasks.

## 16. Exit result

P0-LES-001 is complete when the project can represent and validate a reusable lesson pattern and a learner-specific lesson instance without inventing mastery rules or bypassing the Knowledge Node graph.

The next task is `P0-MAS-001 — Mastery Model v1`.
