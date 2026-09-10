# Daily Lesson Generation Rules v1

**Task:** P0-SCH-001  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

The Daily Scheduler answers:

> Given this learner's current state and available time, what is the best bounded learning plan for today?

It prevents the learner from having to decide what to study or invent a conversation topic.

Inputs include:

- daily time budget;
- Placement Profile / Curriculum Clearance;
- Learner Node States;
- due/overdue Review Units;
- lapsed nodes;
- known gaps and repeated error categories;
- current curriculum frontier;
- recent lesson history;
- weekly skill balance;
- learner goal tags;
- content availability;
- device/session constraints such as voice availability.

Output is a validated `Daily Plan`, which is then resolved into one or more Lesson Instances.

Machine artifacts:

- `schemas/daily-plan.schema.json`
- `config/daily-scheduler-v1.config.json`

## 2. Non-negotiable constraints

The Scheduler must:

1. respect the learner's time budget;
2. handle lapsed/overdue knowledge before piling on excessive new material;
3. avoid making every day pure review;
4. preserve productive/application practice, especially speaking when available;
5. require prerequisite readiness or valid Placement Clearance for new scored learning;
6. never schedule content that is not ready/validated for its use;
7. keep a multi-day skill balance;
8. explain why important items were chosen or deferred.

## 3. Time budget

V1 presets:

- Quick: 20 min
- Standard: 35 min
- Extended: 50 min

Default: **35 min**.

The plan may use another user-selected budget between 10 and 120 minutes, but should never silently extend the session to clear a backlog.

## 4. Priority is lexicographic, not an opaque score

Primary priority tiers:

```text
P0  lapsed / relearning
P1  overdue review
P2  due review
P3  known placement gap / repeated error
P4  continuity for developing nodes
P5  new frontier nodes
P6  optional enrichment
```

A lower-number tier is considered before a higher-number tier.

Within a tier, tie-break using:

1. oldest/most overdue;
2. weekly skill deficit;
3. learner goal relevance;
4. curriculum frontier coherence;
5. avoid very recent repetition;
6. content readiness/quality.

This keeps scheduler decisions inspectable.

## 5. Review-debt bands

Estimate how many minutes today's due Review Units would consume relative to the learner's time budget.

Configurable V1 bands:

- `low`: due review ≤ 15% of budget
- `normal`: >15% and ≤35%
- `high`: >35% and ≤60%
- `severe`: >60%

This is a planning heuristic, not a memory-science constant.

A lapsed cluster or material known gap can also increase remediation priority even when raw due minutes are small.

## 6. Default allocation envelopes

### Low debt

- Review 15%
- Remediation 5%
- New learning 35%
- Application 40%
- Wrap-up 5%

### Normal debt

- Review 25%
- Remediation 10%
- New learning 30%
- Application 30%
- Wrap-up 5%

### High debt

- Review 40%
- Remediation 20%
- New learning 15%
- Application 20%
- Wrap-up 5%

### Severe debt

- Review 45%
- Remediation 30%
- New learning 0%
- Application 20%
- Wrap-up 5%

Percentages are starting defaults and may be rounded to whole minutes while preserving the total budget.

Important: even under severe review debt, keep a short communicative/application block when feasible. Language learning should not collapse into flashcard maintenance.

## 7. New-learning limits

Default maximum new primary nodes:

- 20-minute plan: 1
- 35-minute plan: 2
- 50-minute plan: 3
- high review debt: max 1
- severe review debt: 0

This limits superficial coverage.

A Lesson may use additional support nodes, but they are not automatically treated as new primary learning.

## 8. New frontier eligibility

A new Knowledge Node is eligible only when:

1. node/content status allows learning;
2. all hard prerequisites are ready through either:
   - Mastery state `functional`/`secure`, or
   - valid domain-scoped Placement Clearance;
3. the node is not blocked by a directly excluded placement gap;
4. no hard prerequisite is currently `lapsed`;
5. reviewed teaching content is available;
6. required scored exercises/content are validated;
7. the node is near the learner's active curriculum frontier rather than an arbitrary distant jump.

## 9. Lapsed and remediation behavior

A `lapsed` node is P0 priority.

Rules:

- pause dependent new scored learning that relies on it;
- schedule targeted review/remediation;
- pair remediation with a short real application where possible;
- after successful evidence restores Mastery, dependent progression can resume.

A placement/repeated-error gap is P3 rather than automatically lapsed, unless Mastery evidence independently qualifies it as lapsed.

## 10. Review backlog policy

A backlog must not hijack the learner's life.

Rules:

- respect the user-selected time budget;
- select the highest-priority due Review Units that fit;
- defer excess units explicitly;
- show backlog warning/summary when material;
- do not increase today's study time automatically;
- high/severe debt reduces or pauses new learning until debt falls.

The later implementation may allow the learner to opt into extra review, but it cannot be silently required.

## 11. Productive application is mandatory

A daily plan should normally include meaningful output.

V1 rule:

- require productive application every study day;
- prefer speaking when voice is available;
- if microphone/voice is unavailable, use writing/reading-linked production and record a speaking deficit for later scheduling;
- severe review debt does not remove application entirely.

This enforces the project goal of real communication rather than only recognition practice.

## 12. Weekly skill balance

Scheduler examines a 7-day rolling window.

Configurable starting targets (days containing meaningful evidence/practice):

- Speaking: 5 days / 7
- Listening: 4
- Reading: 3
- Writing: 3
- Pronunciation: 3

These are communication-focused product defaults, not universal pedagogy laws.

A deficit does not override P0/P1 safety priorities, but it breaks ties and shapes the application block.

Example:

If Reading has already appeared 5 times this week but Speaking only once, equivalent candidate activities should prefer Speaking.

## 13. Grammar/vocabulary vs skill domains

Grammar/Vocabulary do not need isolated days.

Prefer integrated loops:

```text
new grammar/vocabulary
     ↓
controlled practice
     ↓
listening/reading exposure
     ↓
speaking/writing use
     ↓
Mastery Evidence + future Review Unit
```

This is why the Scheduler chooses both knowledge nodes and application nodes.

## 14. Continuation beats needless novelty

A node in `developing` with incomplete required evidence can have P4 priority over a fresh P5 node.

Do not continually introduce new knowledge while older nodes remain half-learned.

Examples:

- grammar recognition succeeded yesterday but free speaking evidence is missing;
- vocabulary meaning is known but active recall has not been demonstrated;
- listening detail node has only one recording/context.

The scheduler should generate the missing evidence type rather than teaching another unrelated node.

## 15. Placement Clearance in scheduling

Valid Clearance can make a lower-level hard prerequisite schedulably ready even if its Mastery state is `unseen`/`introduced`.

But:

- excluded gap nodes still block where they are actual prerequisites;
- revoked clearance cannot be used;
- direct later failure can revoke clearance;
- the UI must not display placement-cleared nodes as mastered.

## 16. Content availability gate

Scheduler does not solve missing-content problems by letting AI improvise scored material.

For new primary learning:

- approved explanation/example content must exist;
- scored practice must use reviewed/validated content or an allowed validated generation path;
- required listening/audio/reading assets must resolve before selecting a blueprint that depends on them.

If content is unavailable, defer with reason `content_unavailable` and choose another eligible node.

## 17. Daily Plan output

`Daily Plan` contains:

- time budget;
- debt band;
- minute allocations;
- selected Review Units;
- remediation nodes;
- continuation nodes;
- new nodes;
- application nodes;
- Lesson Requests;
- deferred counts/reasons;
- weekly skill deficits;
- short explanations/warnings.

The Scheduler does **not** directly render UI or run the lesson. Lesson Resolver converts requests into valid Lesson Instances.

## 18. Lesson Request strategy

A 35-minute normal day will typically become one or two blocks, for example:

```text
24 min mixed core
  - due review
  - one developing node
  - one new node
  - controlled/receptive practice

11 min speaking application
  - use today's target naturally
  - correction/retry
```

A severe-debt day might become:

```text
26 min review/remediation
9 min speaking application
0 min new learning
```

The learner sees one coherent day's lesson, not the internal scheduler complexity.

## 19. Explainability

The system should be able to answer:

> Why am I learning this today?

Examples:

- “This expression is due for review and you missed it twice recently.”
- “Your present-perfect recognition is strong, but you still need spoken-use evidence.”
- “Speaking has been under-practiced this week, so today's application is voice-based.”
- “New learning is paused today because 17 high-priority reviews remain.”

Avoid exposing opaque numerical ranking scores when a simple reason is available.

## 20. User constraints

Scheduler should account for temporary constraints:

- microphone unavailable;
- headphones unavailable;
- user selected Quick session;
- interruption/resume;
- quiet environment requested later.

Constraints adapt modality/plan but do not silently create fake evidence.

## 21. Validation performed for P0-SCH-001

### Machine schema

`daily-plan.schema.json`: Draft 2020-12 PASS.

### Normal 35-minute fixture

Included:

- two due reviews;
- a developing B1 grammar node;
- one new vocabulary node;
- a speaking application because speaking had a weekly deficit.

Checks:

- allocations sum to 35 — PASS
- Lesson Request minutes sum to 35 — PASS
- valid node/review references shape — PASS
- deferred work represented explicitly — PASS

### Severe-debt 35-minute fixture

Included:

- overdue review units;
- one remediation node;
- no new nodes;
- short speaking application;
- 17 deferred due units.

Checks:

- allocations sum to 35 — PASS
- new nodes empty — PASS
- time budget not exceeded — PASS
- application preserved — PASS
- backlog explicitly deferred/warned — PASS

## 22. Deferred decisions

P0-SCH-001 does not define:

- exact content assets;
- listening difficulty calibration;
- exercise validators;
- IELTS-specific session frequency;
- notification/reminder behavior;
- empirically optimized weekly skill ratios.

Those belong to later specifications/calibration.

## 23. Exit result

P0-SCH-001 is complete when the system can deterministically choose a bounded, explainable day's work from Placement, Mastery, Review, gaps and time constraints, without overwhelming the learner or reverting to random chat.

Next task: `P0-LIS-001 — Listening Content Specification`.
