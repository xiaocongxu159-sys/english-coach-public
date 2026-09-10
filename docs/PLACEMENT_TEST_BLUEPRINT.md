# Placement Test Blueprint v1

**Task:** P0-PLC-001  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

The placement test must answer:

> Where should this learner begin, and where are the important gaps?

It must **not** pretend to test every one of the 735 A1–B2 Knowledge Nodes.

The result is a multi-domain starting profile across:

- Grammar (`GR`)
- Vocabulary (`VX`)
- Listening (`LS`)
- Speaking (`SP`)
- Reading (`RD`)
- Writing (`WR`)
- Pronunciation (`PR`)
- Communicative Functions (`CF`)

A single global level is only a practical starting center. Domain profiles remain visible to the scheduler.

Machine artifacts:

- `schemas/placement-blueprint.schema.json`
- `schemas/placement-result.schema.json`
- `config/placement-v1.config.json`

## 2. Why placement is not a normal quiz

A learner may have:

- B1 reading;
- B1 vocabulary;
- A2/B1 listening;
- A2 speaking;
- weaker article grammar;
- strong practical work vocabulary.

A test that returns only “B1” hides important information.

The placement system therefore records:

- an observed band per domain;
- confidence per domain;
- directly tested Knowledge Nodes;
- direct gaps;
- a recommended overall starting band;
- optional curriculum clearance for lower-level prerequisites.

## 3. Three diagnostic phases

The operational flow is:

```text
1. Routing
      ↓
2. Boundary verification
      ↓
3. Productive confirmation
      ↓
Profile + starting route
```

There is also a short intake before scoring and profile generation after testing.

### Phase 1 — Routing

Use short anchor tasks to locate the approximate A1/A2/B1/B2 boundary efficiently.

The system starts around A2 rather than automatically beginning at A1.

If performance is clearly strong, move upward. If weak, move downward. If ambiguous, collect additional anchors near the boundary.

### Phase 2 — Boundary verification

Once a likely boundary is found, test:

- several anchors at the candidate level;
- selected lower-level prerequisites that are easy to miss;
- selected next-level anchors to avoid under-placement.

The goal is to distinguish, for example:

`strong A2` vs `early B1`, not simply count total correct answers.

### Phase 3 — Productive confirmation

Receptive multiple-choice performance alone cannot determine a starting route.

Confirm through:

- speaking;
- short writing;
- productive vocabulary;
- pronunciation intelligibility embedded in speech;
- communicative functions such as clarification, explanation and follow-up.

This is especially important for learners who have studied English for tests but cannot retrieve it in real conversation.

## 4. Target duration

V1 target: **about 45 minutes**, maximum 60 minutes.

The test should stop earlier when the boundary is clear enough and productive confirmation is sufficient.

It should not lengthen merely to create a more impressive-looking score.

## 5. Domain testing strategy

### Grammar

Adaptive receptive anchors plus selected controlled production.

The purpose is to find high-value structural gaps and approximate developmental boundary, not to test every grammar node.

### Vocabulary

Hybrid receptive + productive testing.

Test meanings/chunks in context and require some active recall. Do not estimate vocabulary from synonym multiple-choice alone.

### Listening

Use short graded recordings that test transferable operations such as:

- explicit detail;
- main idea;
- sequence;
- paraphrase;
- attitude/inference at higher levels.

Difficulty must later follow `P0-LIS-001` content specification.

### Speaking

Use adaptive prompts around the estimated boundary.

Observe:

- ability to answer and extend;
- grammar/vocabulary retrieval;
- interaction/follow-up;
- explanation/reasoning;
- repair behavior;
- fluency appropriate to level.

The AI must use an approved rubric. Low-confidence judgments reduce placement confidence.

### Reading

Use short texts near the candidate boundary and test main idea, detail, cohesion/context inference as appropriate.

### Writing

Use one or two short productive tasks rather than a long exam essay for every learner.

Higher-level candidates can receive a more developed opinion/explanation task.

### Pronunciation

Assess intelligibility primarily during speaking, supplemented by a short read/repeat or targeted prompt if necessary.

Do not penalize non-native accent merely for being non-native.

### Communicative Functions

Assess through actual interaction:

- clarify;
- request;
- narrate;
- explain;
- support an opinion;
- compare/recommend;
- manage interaction according to the tested level.

## 6. Anchor sets

Placement tasks come from reviewed **anchor sets**, not arbitrary live AI generation.

Each anchor must declare:

- target level;
- directly tested node ID(s);
- domain;
- task type;
- expected response/rubric;
- difficulty review status;
- content/source status.

AI may personalize non-essential surface context only when that does not change the tested construct.

Exact anchor content is produced/validated later in Content/Exercise tasks.

## 7. Routing heuristic — V1

Configurable values live in `config/placement-v1.config.json`.

V1 explainable routing heuristic:

- start probe around A2;
- level support ≥ 0.75: strong enough to probe upward;
- level support < 0.50: probe downward;
- 0.50–0.74: treat as boundary/ambiguous and collect more evidence;
- cap extra anchors so one uncertain domain cannot make the test endless.

These are **product heuristics**, not official CEFR pass scores.

They must be recalibrated against real users and reviewed anchor difficulty.

## 8. Confidence

Placement must expose uncertainty.

### High confidence

Requires, at minimum:

- enough direct evidence;
- boundary confirmation;
- no important contradictory evidence.

### Medium confidence

Enough evidence to choose a practical starting route, but boundary or productive confirmation is less complete.

### Low confidence

Examples:

- user stopped early;
- microphone/audio failed;
- evidence contradicts strongly;
- productive evidence is insufficient;
- AI rubric confidence is low.

The system should prefer a wider band such as `A2-B1` over pretending false precision.

## 9. Overall start band

Allowed outputs:

- A1
- A1-A2
- A2
- A2-B1
- B1
- B1-B2
- B2

The overall band is a **curriculum starting center**, not a claim that every domain is equal.

The later Daily Scheduler uses the per-domain profile and gaps when selecting actual lessons.

## 10. Critical initialization problem

If an experienced learner tests around B1, the Mastery Model cannot reasonably require them to complete hundreds of A1/A2 nodes across multiple sessions before any B1 lesson unlocks.

But it would also be dishonest to mark all untested lower-level nodes `functional` or `secure`.

V1 solves this with **Curriculum Clearance**.

## 11. Curriculum Clearance

Curriculum Clearance is an inferred scheduling permission, **not Mastery**.

Example:

```text
Grammar placement: B1, high confidence
Direct gaps: articles at A2

Placement clearance:
A1/A2 Grammar → inferred_ready
except identified article gap nodes
```

This lets the scheduler start around B1 while still inserting remediation for known holes.

### Clearance rules

- granted only with at least medium confidence;
- scoped by domain and lower level;
- directly identified gap nodes are excluded;
- does not create Mastery Evidence for untested nodes;
- does not set untested nodes to functional/secure;
- revocable after credible direct failure;
- future scheduler may use valid clearance as a hard-prerequisite bypass for initial placement routes.

### Normal prerequisite rule remains

For ordinary learning after nodes are encountered, `functional/secure` remain the normal hard-prerequisite readiness states.

Placement Clearance is a narrow initialization exception, not a replacement for Mastery.

## 12. Direct placement evidence and Mastery

Direct scored placement responses may create normal Mastery Evidence Events when:

- the target node is explicit;
- the task/rubric is approved;
- evaluator confidence is sufficient;
- content is reviewed/validated.

However, a brand-new learner completes placement in one session. Under Mastery Model v1, that one session **cannot by itself make a new node functional**, because functional requires evidence across multiple sessions.

This is intentional.

Placement can seed `introduced/developing` direct evidence while Clearance handles practical course entry.

## 13. Gaps

A placement gap is not every incorrect answer.

Flag a gap when evidence suggests a lower-level prerequisite/family may materially interfere with the recommended start route.

Examples:

- B1 candidate repeatedly fails basic article distinctions;
- strong reading but cannot form basic past questions;
- good vocabulary but poor listening of numbers/dates;
- fluent speech but systematic third-person or tense breakdown.

The scheduler later decides whether a gap needs a dedicated lesson, review, or embedded remediation.

## 14. IELTS handling

The placement test does **not** return an official or pseudo-official IELTS band.

It may set:

`ielts_diagnostic_eligible = true`

when the learner is around B1 or higher and enough skill evidence exists to make dedicated IELTS diagnostics useful.

Actual IELTS readiness mapping/scoring is deferred to `P0-IELTS-001`.

This avoids showing an “IELTS 5.8” number unsupported by IELTS-format evidence.

## 15. Retesting

Placement is primarily for initialization, not daily progress measurement.

A learner should not repeatedly retake the full placement test to chase a level label.

Later progress comes from:

- Mastery Evidence;
- Review history;
- domain checkpoints;
- IELTS checkpoints.

A full or partial re-placement may be allowed after long absence, major prior-data uncertainty, or manual reset.

## 16. Failure/resume behavior

The placement test must support checkpoint/resume.

If speaking cannot run because microphone permission fails:

- preserve completed receptive stages;
- mark SP/PR/CF confidence low/incomplete;
- do not fabricate productive scores;
- allow the learner to finish those sections later.

The test result may be provisional when key domains are incomplete.

## 17. Validation performed for P0-PLC-001

### Machine schema validation

- `placement-blueprint.schema.json`: Draft 2020-12 PASS
- `placement-result.schema.json`: Draft 2020-12 PASS

### Fixture validation

A synthetic B1-centered learner profile with uneven domains was created and validated.

PASS:

- eight domain records present;
- per-domain bands/confidence accepted;
- directly tested nodes recorded;
- gaps represented separately;
- lower-level clearance represented without changing Mastery;
- `untested_nodes_mastered = false` enforced;
- IELTS output limited to diagnostic eligibility, not a band.

## 18. Deferred decisions

P0-PLC-001 does not create:

- final anchor questions/audio;
- psychometrically calibrated CEFR cut scores;
- final AI scoring rubrics;
- daily lesson selection priorities;
- IELTS band estimates.

These depend on later Exercise/Listening/IELTS/Scheduler tasks and real data.

## 19. Exit result

P0-PLC-001 is complete when the system can represent an adaptive multi-domain initial diagnosis, find a practical curriculum boundary, preserve uncertainty/gaps, and let experienced learners start appropriately without falsely marking untested lower-level knowledge as mastered.

Next task: `P0-SCH-001 — Daily Lesson Generation Rules`.
