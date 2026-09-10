# Spaced Review Model v1

**Task:** P0-REV-001  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

The Spaced Review Model answers:

> When should a learner be asked to retrieve a learned item/ability again?

It does **not** answer:

> Does the learner truly master this Knowledge Node?

Mastery and memory scheduling are deliberately separate:

```text
Lesson / Review attempt
        ↓
Mastery Evidence Event
        ├─→ Mastery Model → unseen/developing/functional/secure/lapsed
        └─→ Review Adapter → Again/Hard/Good/Easy → next due time
```

A node can therefore be:

```text
Mastery: secure
Review: due
```

without contradiction.

## 2. Reuse decision: FSRS adapter

V1 should not invent a forgetting-curve scheduler from scratch.

Preferred implementation candidate: `open-spaced-repetition/ts-fsrs`.

Current research confirms:

- TypeScript implementation of FSRS;
- current repository documents FSRS v6;
- supports review ratings Again/Hard/Good/Easy;
- exposes scheduling, stability, difficulty and retrievability;
- allows configurable requested retention and related parameters;
- MIT licensed.

The product will isolate it behind a Review Scheduler Adapter so another implementation/version can be substituted without changing curriculum/mastery semantics.

## 3. Review Unit — scheduling granularity

FSRS should not schedule an entire Knowledge Node as if it were one flashcard.

A **Review Unit** is a reviewable retrieval task associated with one Knowledge Node and one primary evidence modality.

Examples:

- lexical chunk active recall;
- grammar retrieval prompt;
- short listening detail task;
- speaking retrieval prompt;
- reading microtask;
- short written production;
- pronunciation prompt;
- communication-repair prompt.

Machine schema:

`schemas/review-unit.schema.json`

A Knowledge Node may own several Review Units. This allows one grammar node, for example, to have both controlled-form retrieval and later spoken-reuse practice.

## 4. Review Unit lifecycle

```text
inactive
  ↓ reviewed content becomes available + node introduced
active
  ↓ temporarily disabled
suspended
  ↓ content/node retired
retired
```

Rules:

- do not create an active review schedule for `unseen` nodes;
- activate only when suitable reviewed/validated content exists;
- Review Units can exist for `introduced`, `developing`, `functional`, `secure` and `lapsed` nodes;
- retiring content must not erase historical Review State or Mastery Evidence.

## 5. Review State

Machine schema:

`schemas/review-state.schema.json`

The product-owned Review State stores the adapter boundary:

- algorithm = `fsrs`;
- FSRS algorithm version;
- implementation/library version when known;
- parameter version;
- due time;
- status;
- card state;
- stability;
- difficulty;
- scheduled/elapsed days;
- repetitions/lapses;
- optional retrievability;
- last review/grade.

Do not expose FSRS card state as English ability.

## 6. Review status shown to product logic

Allowed product status:

- `not_scheduled`
- `not_due`
- `due`
- `overdue`
- `relearning`
- `suspended`

V1 default: after a due timestamp passes, status is `due`; after 24 hours it may be labelled `overdue` for queue prioritization/UI. This label does not imply mastery loss.

A Mastery state of `lapsed` maps the review status to `relearning` until successful remediation evidence restores the node.

## 7. One attempt, two outputs

A review answer should create one assessment result that feeds two separate consumers:

### Mastery consumer

Stores the full Evidence Event:

- rating 0–4;
- evidence type;
- assistance;
- evaluator/confidence;
- error categories;
- context;
- scored status.

### FSRS consumer

Receives one normalized grade only when the event passes the FSRS update gate.

This prevents two independent scoring systems from disagreeing about what the learner actually did.

## 8. Mapping Mastery evidence to FSRS grade

Default mapping is configurable in `config/review-v1.config.json`.

### Independent retrieval

| Mastery rating | FSRS grade |
|---:|---|
| 0 | Again |
| 1 | Again |
| 2 | Hard |
| 3 | Good |
| 4 | Easy |

### Minor prompt

The learner needed help, so even a successful answer is capped at `Hard`.

### Major prompt / model then repeat

Treat as `Again` for memory scheduling because independent retrieval did not succeed.

This does not mean the learner receives “zero learning credit”; the Mastery Evidence still records the practice and assistance accurately.

## 9. FSRS update gate

Do **not** update the FSRS card when:

- `is_scored = false`;
- evaluator confidence is low;
- content is unvalidated practice;
- the event is merely exposure/modeling;
- a same-attempt retry duplicates the original review outcome.

Allowed state-changing sources in V1:

- reviewed core;
- validated variant;
- approved interactive rubric with medium/high confidence.

When the gate fails, the diagnostic evidence may still be stored, but it should not distort stability/difficulty/due calculations.

## 10. Same-session correction vs spaced review

Immediate retry belongs to the **Lesson Engine**, not FSRS.

Example:

```text
Learner says incorrect sentence
↓
AI explains
↓
Learner retries 20 seconds later
```

This correction loop is valuable learning, but it is not spaced retrieval.

Rules:

- same-session correction/retry does not create multiple FSRS updates for the same attempt;
- the final independent/eligible retrieval result may update FSRS once;
- a failed due review can be retried later in the same lesson for teaching purposes, but only one scheduling update is written for the attempt group;
- global spacing happens across future sessions/days.

## 11. Requested retention

`ts-fsrs` supports configurable requested retention. V1 config uses **0.90 as a starting baseline**.

Important:

- 0.90 is not claimed to be the scientifically optimal value for English learning;
- higher retention increases review workload;
- the setting remains configurable;
- real pilot data should determine whether vocabulary, productive grammar, listening etc. need different retention profiles later.

V1 starts simple with one baseline rather than pretending we already have enough data for domain-specific optimization.

## 12. Fuzz and load smoothing

Enable schedule fuzzing where supported so many items learned together do not all mature on exactly the same date.

The later Daily Scheduler, not the Review Model, decides:

- how many due Review Units fit into today's time budget;
- which overdue items get priority;
- how much new learning is allowed when review debt is high.

## 13. Sibling/group rules

Review Units have a `sibling_group_id`.

Use it to avoid weak test artifacts such as:

- showing the same answer in two formats back-to-back;
- asking three nearly identical prompts from one Knowledge Node consecutively;
- repeating the exact content reference multiple times in one day by default.

V1 rules:

- avoid the same sibling group back-to-back;
- same exact content reference normally appears at most once per day;
- varied Review Units may still test the same node when the Daily Scheduler deliberately needs multiple modalities.

## 14. Creating Review Units

Do not create thousands of scheduled cards for all 735 curriculum nodes at account creation.

A Review Unit becomes active only when:

1. the Knowledge Node has been introduced;
2. reviewed/validated review content exists;
3. the review modality is relevant to the node/evidence requirement;
4. the learner has actually encountered that content/ability.

This keeps review state learner-specific and prevents an empty account from carrying a huge meaningless queue.

## 15. Review Unit examples

### Vocabulary chunk

```yaml
id: RU-user1-VX-A1-DAILY-ROUTINE-01-001
node_id: VX-A1-DAILY-ROUTINE-01
review_type: lexical_retrieval
evidence_type: controlled_production
content_ref: review/vx-a1-routine/get-up-001
sibling_group_id: VX-A1-DAILY-ROUTINE-01-active-recall
```

### Grammar → speaking retrieval

```yaml
id: RU-user1-GR-B1-PERF-EXPERIENCE-01-002
node_id: GR-B1-PERF-EXPERIENCE-01
review_type: speaking_retrieval
evidence_type: free_spoken_production
content_ref: review/gr-b1-perfect-experience/speaking-002
sibling_group_id: GR-B1-PERF-EXPERIENCE-01-spoken
```

The Knowledge Node remains the conceptual target; Review Units are replaceable retrieval instruments.

## 16. Lapse interaction

FSRS `Again` and Mastery `lapsed` are related but not identical.

One failed Review Unit may receive FSRS `Again` and a short future interval while Mastery remains functional/secure.

Only the Mastery Model's repeated credible-failure rule can change the Knowledge Node to `lapsed`.

When Mastery becomes `lapsed`:

- dependent new scored learning is paused;
- relevant Review Units are prioritized as `relearning`;
- successful remediation emits Mastery Evidence and continues updating Review State;
- once Mastery leaves `lapsed`, ordinary due scheduling resumes.

## 17. Content/version changes

Review scheduling state is tied to a Review Unit, not blindly to a prompt string.

If content changes only cosmetically, keep the Review Unit/content version.

If a prompt changes the retrieval target materially, create a new Review Unit or deliberately migrate/reset its scheduling state. Do not carry high stability from an easier old task into a substantially harder new task without review.

## 18. Parameter/version reproducibility

Persist:

- FSRS algorithm version;
- library implementation/version;
- parameter-set version.

This allows later parameter changes or optimizer training without making historical review decisions unauditable.

Parameter optimization from real logs is a future option; it is not enabled merely because the library provides an optimizer.

## 19. Validation performed for P0-REV-001

### External reuse validation

Confirmed current `ts-fsrs` repository/documentation:

- TypeScript FSRS toolkit;
- FSRS v6 documented;
- Again/Hard/Good/Easy review outcomes;
- configurable requested retention;
- stability/difficulty/retrievability support;
- MIT license.

### Machine schema validation

- `review-unit.schema.json`: Draft 2020-12 PASS
- `review-state.schema.json`: Draft 2020-12 PASS

### Grade adapter tests

PASS:

- independent 0/1 → Again;
- independent 2 → Hard;
- independent 3 → Good;
- independent 4 → Easy;
- minor-prompt success capped at Hard;
- major prompt/model-repeat → Again;
- low-confidence evidence → no FSRS update;
- unscored evidence → no FSRS update;
- unvalidated content → no FSRS update.

## 20. Deferred to later tasks

P0-REV-001 does not decide:

- daily review time budget;
- overdue/new-learning priority tradeoff;
- the number of Review Units selected per lesson;
- placement-test initialization;
- exact domain-specific retention settings;
- optimized FSRS parameters;
- content creation for every node.

Those decisions belong to Daily Scheduling, Content/Exercise, and real-user calibration tasks.

## 21. Exit result

P0-REV-001 is complete when the product can represent reviewable learner-specific units, safely map trustworthy learning evidence into a mature scheduling algorithm, and keep retention scheduling separate from real-language mastery.

Next task: `P0-PLC-001 — Placement Test Blueprint`.
