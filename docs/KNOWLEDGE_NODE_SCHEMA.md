# Knowledge Node Schema v1.1

**Original task:** P0-CUR-001  
**Updated by:** P0-MAS-001  
**Version:** v1.1-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

A Knowledge Node is the smallest curriculum unit that the learning engine can teach, assess, schedule, review and connect to other skills.

A node is **not** a page or a lesson. One lesson may cover several nodes, and one node may appear across many lessons, exercises, listening tasks, speaking sessions and reviews.

The schema supports:

1. a stable A1–B2 curriculum graph;
2. explainable prerequisites/progression;
3. mastery based on productive as well as receptive evidence;
4. mapping from general English to real-world communication and IELTS practice.

## 2. Stable ID convention

Format:

`<DOMAIN>-<LEVEL>-<FAMILY>-<CONCEPT>-<SEQ>`

Examples:

- `GR-A1-BE-PRESENT-01`
- `GR-B1-PERF-EXPERIENCE-01`
- `VX-A2-TRAVEL-BOOKING-01`
- `LS-B1-MAINIDEA-CONVERSATION-01`
- `SP-B2-OPINION-JUSTIFY-01`
- `PR-A2-STRESS-WORD-01`

Domain codes:

| Code | Domain |
|---|---|
| `GR` | Grammar |
| `VX` | Vocabulary & lexical chunks |
| `LS` | Listening |
| `SP` | Speaking |
| `RD` | Reading |
| `WR` | Writing |
| `PR` | Pronunciation |
| `CF` | Communicative function |

IDs are immutable after a node becomes `active`. Substantial semantic changes require a new node and deprecation/replacement metadata.

## 3. Canonical node shape

```yaml
id: GR-B1-PERF-EXPERIENCE-01
version: 1
status: draft
level: B1
domain: grammar
family: present-perfect
concept: Present perfect for life experience

source_basis:
  cefr: true
  english_grammar_profile: true
  english_vocabulary_profile: false
  ielts_official: false
  notes: "Level placement is informed by external frameworks; teaching order is product-designed."

prerequisites:
  hard:
    - GR-A2-PAST-SIMPLE-CORE-01
    - GR-A2-VERB-PASTPART-01
  soft:
    - VX-A2-TIME-EXPERIENCE-01

learning_objectives:
  receptive:
    - distinguish life experience from a finished past event in common contexts
  controlled:
    - form affirmative, negative and question forms with common verbs
  productive:
    - describe personal experiences using appropriate present-perfect forms
  spontaneous:
    - reuse the form during an unscripted conversation when context calls for it

language_scope:
  grammar_patterns:
    - "have/has + past participle"
  lexical_support:
    - ever
    - never
    - before
  register:
    - neutral
  exclusions:
    - advanced present-perfect-continuous contrasts

skill_links:
  listening:
    - LS-B1-EXPERIENCE-DETAIL-01
  speaking:
    - SP-B1-EXPERIENCE-FOLLOWUP-01
  reading: []
  writing: []
  pronunciation: []

real_world_relevance:
  - talking about experiences
  - discussing work history
  - social conversation

ielts_relevance:
  skills:
    - speaking
    - listening
  task_links:
    - speaking-part-1
    - speaking-part-2
  weight: medium

assessment_requirements:
  required_evidence_types:
    - recognition
    - controlled_production
    - free_spoken_production
    - spontaneous_reuse
  recognition: true
  controlled_production: true
  free_production: true
  spoken_production: true
  spontaneous_reuse: true

content_requirements:
  explanation_required: true
  core_examples_min: 4
  reviewed_core_items_min: 6
  ai_variant_allowed: true

metadata:
  created_at: 2026-09-01
  reviewed_at: null
  deprecated_at: null
  replacement_node_id: null
  notes: null
```

## 4. Field rules

### `level`

V1 values: `A1`, `A2`, `B1`, `B2`.

The level is the target stage at which the node becomes productively useful in this product; it is not a claim that a language feature belongs exclusively to one CEFR level.

### `domain`

One primary domain per node. Cross-skill applications belong in `skill_links` rather than duplicated semantic nodes.

### `source_basis`

Records why the node exists and how its level was chosen.

- CEFR supports communicative ability targets but does not prescribe lesson order.
- English Grammar Profile informs developmental plausibility but is not a mandatory syllabus.
- English Vocabulary Profile informs meaning/use level and is not copied wholesale.
- IELTS official sources justify exam-task mapping rather than the general-English sequence.

### `prerequisites`

**Hard prerequisite:** new scored learning is blocked until the prerequisite is ready according to the Mastery Model.

V1 prerequisite-ready states: `functional` or `secure`.

**Soft prerequisite:** absence adds support/scaffolding but does not block scheduling.

Circular hard dependencies are forbidden.

### `learning_objectives`

Objectives may cover:

1. receptive understanding;
2. controlled use;
3. productive use;
4. spontaneous reuse.

A node cannot be considered secure from recognition evidence alone when productive objectives exist.

### `language_scope`

Defines intended scope/exclusions so AI-generated teaching cannot silently introduce later material.

### `skill_links`

Directional application links to listening, speaking, reading, writing and pronunciation nodes. They do not become prerequisites unless also declared under `prerequisites`.

### `assessment_requirements.required_evidence_types`

Added in v1.1 for the Mastery Model.

Allowed values:

- `recognition`
- `controlled_production`
- `free_written_production`
- `free_spoken_production`
- `spontaneous_reuse`
- `listening_comprehension`
- `reading_comprehension`
- `pronunciation_intelligibility`
- `communication_repair`

This explicit list is the source consumed by mastery-state promotion rules.

The older boolean fields may remain as human-readable design hints, but **before a node can become active, `required_evidence_types` must be explicit and internally consistent with its learning objectives/domain**.

Examples:

- listening-detail node → `listening_comprehension`;
- productive grammar node → recognition + controlled production + applicable free production, with spontaneous reuse when the objective requires it;
- pronunciation node → `pronunciation_intelligibility`;
- repair strategy node → `communication_repair` plus spoken evidence when appropriate.

Numeric evidence counts and state thresholds live in `config/mastery-v1.config.json`, not inside each node.

### `content_requirements`

Defines minimum reviewed content required before activation. AI variants may supplement reviewed content but must follow the exercise/content validation policy before generating state-changing scored evidence.

## 5. Node lifecycle

```text
draft
  -> reviewed
  -> active
  -> deprecated
```

`draft`: semantics may change; not scheduled.  
`reviewed`: curriculum/content metadata reviewed; not necessarily published.  
`active`: may be scheduled; stable ID/core meaning frozen.  
`deprecated`: no new assignment; historical evidence/mastery remains auditable.

## 6. Relationship types

Supported semantics:

- `hard_prerequisite`
- `soft_prerequisite`
- `builds_on`
- `contrasts_with`
- `commonly_confused_with`
- `skill_application_of`
- `ielts_application_of`

Only hard prerequisites block new scored learning.

## 7. Granularity rules

Too broad:

`GR-B1-PRESENT-PERFECT`

Better:

- present perfect for life experience;
- present perfect with `since/for`;
- present perfect with `already/yet`;
- present perfect vs past simple in common contexts.

A node is too narrow if it represents one sentence or one quiz item.

## 8. Vocabulary-node rule

Vocabulary nodes may represent a lexical chunk, a meaning/use, collocation family or a small functionally coherent set.

Example:

```yaml
id: VX-B1-CHANGE-TRENDS-01
concept: Describing change and trends
items:
  - increase gradually
  - decline significantly
  - remain stable
  - compared with
  - as a result
```

High-value individual items can later become child nodes if learner-error/review data requires finer granularity.

## 9. Listening/reading node rule

Listening/reading nodes primarily represent transferable comprehension operations rather than topics:

- explicit detail;
- main idea;
- sequence;
- attitude;
- context inference;
- reference/cohesion.

Travel, work, education and services are scenario metadata.

## 10. Speaking/writing node rule

Speaking/writing nodes represent communicative production abilities such as:

- personal description;
- narrative sequence;
- opinion + support;
- comparing alternatives;
- coherent paragraph organization;
- communication repair.

They can depend on grammar/vocabulary but should not simply duplicate grammar labels.

## 11. Pronunciation node rule

Prioritize intelligibility and communicative value:

- high-value sound contrasts;
- word/sentence stress;
- reductions/connected speech;
- rhythm/chunking;
- function-related intonation;
- receptive discrimination linked to production.

Native-like accent is not a mastery requirement.

## 12. Validation gates before `active`

A node cannot become active until:

- ID is unique/convention-compliant;
- level/source basis are recorded;
- hard-prerequisite graph is acyclic;
- objectives are observable;
- language scope/exclusions are explicit;
- `required_evidence_types` are explicit and coherent;
- reviewed core content requirements are met;
- content source/licensing status is known;
- linked nodes resolve or are approved future placeholders.

## 13. Boundaries with later systems

Knowledge Nodes define **what** is learned and what evidence is required.

They do not define:

- lesson packaging (Lesson Unit Schema);
- learner evidence history/state transitions (Mastery Model);
- review intervals/retrievability (Spaced Review Model);
- placement-test scoring;
- daily scheduling priority;
- exact IELTS-readiness scoring;
- database table implementation.

This separation keeps curriculum semantics stable even when algorithms evolve.
