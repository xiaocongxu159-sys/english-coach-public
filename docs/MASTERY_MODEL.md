# Mastery Model v1

**Task:** P0-MAS-001  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

The Mastery Model answers one question:

> Based on actual learner evidence, how usable and stable is this specific Knowledge Node right now?

It must not equate:

- opening a lesson with learning;
- finishing a lesson with mastery;
- one multiple-choice success with usable English;
- one good AI conversation with a stable skill;
- an overdue review with automatic loss of competence.

The model consumes structured Evidence Events emitted by lessons/reviews and maintains one Learner Node State per learner × Knowledge Node.

Machine artifacts:

- `schemas/mastery-evidence-event.schema.json`
- `schemas/learner-node-state.schema.json`
- `config/mastery-v1.config.json`

## 2. Internal mastery states

```text
unseen
  ↓
introduced
  ↓
developing
  ↓
functional
  ↓
secure

functional / secure
  ↓ credible repeated failure
lapsed
  ↓ successful remediation
 developing / functional / secure
```

### `unseen`

No meaningful learner event has been recorded.

### `introduced`

The learner has been exposed to the node, but scored evidence is insufficient.

### `developing`

Scored practice exists, but the learner has not yet satisfied the functional gate.

### `functional`

The learner has enough independent or lightly prompted evidence across required evidence types and more than one session to use the node as a hard prerequisite for later learning.

### `secure`

The learner has broader evidence across multiple sessions/days, independent success, delayed retrieval and context transfer where applicable. `secure` means strong current evidence, not permanent immunity from forgetting.

### `lapsed`

A previously functional/secure node has credible repeated failures in required evidence. The node should be refreshed before it unlocks new scored learning as a hard prerequisite.

UI language may later map these internal states to simpler labels such as Not learned / Learning / Usable / Strong / Needs refresh.

## 3. Evidence dimensions

The model preserves separate evidence dimensions rather than collapsing everything into one fake-precision score.

Allowed types:

- `recognition`
- `controlled_production`
- `free_written_production`
- `free_spoken_production`
- `spontaneous_reuse`
- `listening_comprehension`
- `reading_comprehension`
- `pronunciation_intelligibility`
- `communication_repair`

A Knowledge Node declares which evidence types are required for its own promotion.

Examples:

- grammar node: recognition + controlled production + relevant free production; spontaneous reuse when required;
- vocabulary/chunk node: recognition + active production + spontaneous reuse for high-value productive chunks;
- listening node: listening comprehension across suitable content/context;
- speaking node: free spoken production, plus spontaneous/interaction evidence when relevant;
- reading node: reading comprehension;
- writing node: free written production;
- pronunciation node: pronunciation intelligibility;
- repair/function node: spoken production and/or communication repair.

Exact per-node evidence requirements belong in Knowledge Node metadata before activation.

## 4. Evidence-event rating scale

Ratings are ordinal 0–4. They are not percentages and are not IELTS bands.

| Rating | Meaning |
|---|---|
| 0 | No usable performance / cannot perform the target |
| 1 | Major failure; target not achieved even with substantial support |
| 2 | Partial performance; important errors or support still needed |
| 3 | Adequate performance for the node level with independence or a minor prompt |
| 4 | Strong performance for the node level |

The rubric for a particular task must explain what 0–4 means for that evidence type.

## 5. Assistance matters

Evidence records one assistance level:

- `independent`
- `minor_prompt`
- `major_prompt`
- `model_then_repeat`

A learner who repeats a modeled sentence perfectly has produced useful practice, but not the same evidence as independent retrieval.

Promotion-eligible success in V1 requires rating ≥ 3 and assistance of `independent` or `minor_prompt`.

## 6. Evaluator confidence matters

Evaluator types:

- deterministic answer/rule;
- approved AI rubric;
- future human evaluation.

Confidence:

- high
- medium
- low

Low-confidence judgments are preserved for diagnostic context but cannot promote or demote node state. This prevents uncertain AI scoring from changing progression.

## 7. Scored vs unscored evidence

Evidence can be `is_scored: false` for:

- exposure;
- exploratory practice;
- uncertain AI evaluation;
- unvalidated generated items.

State-changing evidence must use approved content/evaluation modes:

- reviewed core;
- validated generated variant;
- interactive production with an approved rubric and sufficient evaluator confidence.

## 8. Required evidence per node

Before a node can become `active`, it must specify `required_evidence_types`.

The required list may differ by domain and concept. Mastery is therefore criterion-based per node, not a single universal quiz score.

Example:

```yaml
required_evidence_types:
  - recognition
  - controlled_production
  - free_spoken_production
  - spontaneous_reuse
```

for a high-value productive grammar node.

A listening-detail node might instead require only:

```yaml
required_evidence_types:
  - listening_comprehension
```

but still needs repeated evidence across sessions for higher states.

## 9. Functional gate — V1 default

Configurable defaults live in `config/mastery-v1.config.json`.

A node can become `functional` when all applicable conditions are satisfied:

- at least 3 state-affecting scored events;
- at least 2 promotion-eligible successes;
- at least 1 independent success;
- evidence spans at least 2 lesson/review sessions;
- every required evidence type has at least one promotion-eligible success;
- the latest credible event in every required evidence type is not a severe failure (rating floor 2).

If a node requires more than three evidence types, the per-required-type rule naturally raises the effective event minimum.

### Why this gate exists

The goal is not to prove permanent mastery. It establishes enough evidence that a hard prerequisite can support later learning without requiring every prior node to be fully secure first.

## 10. Secure gate — V1 default

A node can become `secure` after satisfying `functional` plus:

- at least 6 state-affecting scored events;
- at least 4 promotion-eligible successes;
- at least 3 independent successes;
- at least 3 distinct sessions;
- at least 3 distinct calendar days;
- at least one successful delayed retrieval ≥ 7 days after a prior success;
- at least 2 context/scenario tags for context-sensitive nodes;
- all required evidence types still have successful evidence;
- if the node requires spontaneous reuse, at least one promotion-eligible spontaneous event must exist.

These numbers are **conservative product defaults**, not psychometrically validated natural constants. They remain configurable and must be calibrated from real product data.

## 11. Hard-prerequisite readiness

V1 rule:

```text
functional → ready
secure     → ready
lapsed     → not ready until refreshed
```

The scheduler may continue to review secure nodes but does not force every prerequisite to reach secure before progression.

## 12. Lapse rule

A `functional` or `secure` node becomes `lapsed` only after credible repeated failure, not simply because time passes.

Default trigger:

- 2 consecutive state-affecting failures in required evidence types;
- failure rating ≤ 1;
- scored event;
- high/medium evaluator confidence;
- independent/minor-prompt attempt.

One bad attempt does not erase prior learning.

Low-confidence failures do not demote.

## 13. Mastery vs review/forgetting

Mastery state and review scheduling are separate systems.

Example:

```text
Node state: secure
Review status: due
```

This is valid. A review becoming due does not automatically mean the skill has vanished.

The later review engine can estimate retrievability and schedule review. Only actual credible failed evidence can move mastery into `lapsed`.

This separation is important if the project adopts FSRS: FSRS can help schedule retrieval practice without becoming the definition of English ability.

## 14. Evidence diversity and anti-gaming rules

The model must not let one easy exercise generate dozens of mastery points.

Rules:

- multiple events from the same attempt share an `attempt_group_id`;
- distinct-session gates prevent one lesson from producing secure state;
- distinct-day/delayed-success gates prevent same-day cramming from producing secure state;
- context diversity prevents one memorized scenario from proving general communicative use where transfer matters;
- model-then-repeat evidence cannot independently promote;
- low-confidence AI evidence cannot promote/demote;
- unvalidated generated scored content cannot promote;
- lesson completion is never a mastery event by itself.

## 15. Domain-specific examples

### Grammar

Present simple routine node:

```text
recognize correct form
→ controlled sentence production
→ free spoken routine description
→ later spontaneous reuse
```

### Vocabulary

A work-performance lexical bundle:

```text
recognize meaning in context
→ active recall/use
→ use in a work explanation
→ later spontaneous reuse in another context
```

### Listening

Main-idea node:

```text
success on one recording
≠ secure

multiple recordings / different topics / later review
→ functional / secure evidence
```

### Speaking

Opinion-support node:

The learner must independently state and support a view. A memorized model answer may be practice, but it cannot substitute for free production.

## 16. State transition behavior

Evaluation order:

1. collect state-affecting scored events;
2. summarize evidence per required type;
3. check explicit lapse condition if prior state was functional/secure;
4. check secure gate;
5. check functional gate;
6. otherwise classify as developing/introduced/unseen.

A high prior state should not silently collapse from a single weak or low-confidence event. Demotion uses the explicit lapse rule.

Historical `highest_state_achieved` is retained even when current state becomes lapsed.

## 17. Validation performed for P0-MAS-001

Two machine schemas were validated as Draft 2020-12 JSON Schema definitions.

Synthetic evidence sequences were run through a reference state-transition check.

Expected transitions passed:

- no events → `unseen`
- unscored exposure only → `introduced`
- one credible success → `developing`
- required evidence across two sessions → `functional`
- repeated independent evidence across multiple days + delayed retrieval → `secure`
- two credible core failures after secure → `lapsed`
- two low-confidence failures after secure → remains `secure`

This validates internal consistency of the V1 rules. It does not claim psychometric validation; real-user calibration is still required.

## 18. Knowledge Node schema change

`Knowledge Node Schema` should add explicit `required_evidence_types` under `assessment_requirements` before nodes can move to `active`.

The earlier boolean fields can remain as design hints, but the mastery engine consumes the explicit evidence-type list.

## 19. Deferred to P0-REV-001

The Mastery Model intentionally does not define:

- exact review due dates;
- memory stability/retrievability equations;
- FSRS parameters;
- same-day learning steps;
- review priority competition across nodes.

Those belong to the Spaced Review Model.

## 20. Exit result

P0-MAS-001 is complete when evidence can be stored, learner-node state can be derived conservatively and explainably, and hard-prerequisite readiness can be resolved without using lesson completion or a single quiz score as mastery.

Next task: `P0-REV-001 — Spaced Review Model v1`.
