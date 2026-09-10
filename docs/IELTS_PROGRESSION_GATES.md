# IELTS Progression Gates v1

**Task:** P0-IELTS-001  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

IELTS is a major product goal, but it must remain an **exam layer on top of real English ability** rather than replacing the curriculum.

This specification answers:

- when IELTS-specific training should begin;
- how exam practice increases over time;
- how Academic vs General Training differences are handled;
- how Listening/Reading/Writing/Speaking readiness is estimated;
- when full mocks become useful;
- what evidence is required before the product says the learner appears ready for a target;
- how to avoid presenting AI estimates as official IELTS scores.

Machine/config artifacts:

- `schemas/ielts-readiness.schema.json`
- `config/ielts-progression-v1.config.json`

## 2. Official scoring boundary

English Coach uses current IELTS official definitions as the exam reference.

Key scoring facts used by the product:

- Listening and Reading each contain 40 scored questions and raw marks are converted to whole/half bands; exact raw marks for a band can vary slightly by test version.
- Academic and General Training Reading have different typical raw-score requirements.
- Writing is judged on four criteria: task achievement/response, coherence/cohesion, lexical resource, grammatical range/accuracy; Task 2 carries more weight than Task 1.
- Speaking is judged on four equally weighted criteria: fluency/coherence, lexical resource, grammatical range/accuracy, pronunciation.
- Overall band is the average of the four component bands rounded according to the official whole/half-band rule.

These rules belong to the exam layer. They do not replace Knowledge Node Mastery.

## 3. No direct CEFR → IELTS score conversion

Forbidden:

```text
B2 Mastery = IELTS 6.5
```

Allowed:

```text
General English profile: B2-range abilities
IELTS evidence: recent validated component practice
→ estimated IELTS readiness range
```

CEFR and IELTS overlap but are not one-to-one scales. IELTS band estimates require IELTS-style evidence.

## 4. Exam variant

Readiness profile stores:

- `academic`;
- `general_training`;
- `undecided`.

Listening and Speaking can be trained while variant is undecided because their test constructs/formats are shared.

Reading and Writing Task 1 require variant-aware content:

- Academic Reading differs from General Training Reading;
- Academic Writing Task 1 is visual-information description;
- General Training Writing Task 1 is a letter task.

Task 2 remains an essay/argument task in both variants, though prompts/context can differ.

## 5. IELTS progression stages

### Stage 0 — `general_foundation`

Primary focus: real English and A1/A2/early-B1 system learning.

IELTS share: 0% required.

Learner may learn what IELTS is, but daily learning does not become exam practice.

### Stage 1 — `format_familiarization`

Recommended around a B1 boundary when placement/mastery evidence has at least medium confidence.

Purpose:

- understand four components;
- understand task families;
- see example instructions;
- learn timing/one-pass concepts;
- no serious band estimate yet.

IELTS share: normally ≤10% of daily learning.

### Stage 2 — `guided_mini_tasks`

Default entry baseline:

- ≥50% of designated B1 IELTS-relevant prerequisite nodes functional/secure;
- no critical lapsed prerequisite in the tested skill.

Purpose:

- short IELTS-style Listening/Reading items;
- brief Speaking Part 1/2-like prompts;
- small Writing structures;
- teaching support still available.

IELTS share: normally ≤20%.

### Stage 3 — `timed_component_practice`

Default entry baseline:

- ≥75% designated B1 relevant nodes functional/secure;
- ≥25% designated B2 relevant nodes functional/secure;
- ≥2 validated mini checkpoints per component;
- no critical lapsed prerequisite.

Purpose:

- component-specific timing;
- section practice;
- one-pass Listening;
- Reading pacing;
- full Task 1/Task 2 writing practice;
- full three-part Speaking simulations begin.

IELTS share: normally ≤35%.

### Stage 4 — `full_mock_diagnostics`

Default entry baseline:

- ≥50% designated B2 IELTS-relevant nodes functional/secure;
- at least one timed component checkpoint in each skill;
- prior one-pass Listening experience;
- prior timed Writing experience;
- prior full Speaking simulation.

Purpose:

- full/near-full mock diagnostics;
- identify score-limiting component;
- measure endurance and time management;
- update estimated readiness range.

IELTS share: normally ≤50%.

### Stage 5 — `target_readiness`

This is not “officially passed.” It means the learner has repeated recent evidence near/above the configured target.

V1 default evidence gate:

- target overall/minimum component scores configured by learner;
- ≥3 recent four-skill mock/checkpoint sets within 42 days;
- ≥2 distinct test forms;
- component estimate confidence at least medium;
- median estimated overall at/above target;
- median each component at/above learner's required minimum;
- no unresolved critical recent gap;
- an official/approved external checkpoint is recommended before the real test.

IELTS share may rise to ≤65%, but real-world communication practice is still retained.

All numbers are V1 product defaults requiring calibration.

## 6. Why IELTS share never becomes 100%

Even close to the exam, the product should preserve:

- spontaneous speaking;
- real listening;
- vocabulary/grammar remediation;
- practical communication.

Exam practice reveals weaknesses, but general English repair often fixes them more effectively than repeating mock after mock.

## 7. IELTS Readiness Profile

The profile stores four separate components:

- Listening;
- Reading;
- Writing;
- Speaking.

Each records:

- estimated band low/high;
- confidence;
- validated checkpoint count;
- full-component count;
- last checkpoint date.

The UI should show the component bottleneck prominently.

Example:

```text
Listening   estimated 6.0–6.5
Reading     estimated 6.0–6.5
Writing     estimated 5.5–6.0  ← current bottleneck
Speaking    estimated 6.0–6.5
```

This is more useful than showing only “IELTS 6.0”.

## 8. Estimate labels are mandatory

Internally generated scores must be labeled:

- estimated;
- practice/mock;
- not an official IELTS result.

`ielts-readiness.schema.json` enforces `estimated_not_official: true`.

Do not use language such as:

- “You are officially Band 7”;
- “Guaranteed 6.5”;
- “This AI score equals an examiner score.”

## 9. Listening readiness

IELTS Listening practice uses the Listening Content Specification:

- one play;
- no segment replay;
- no speed adjustment;
- transcript after completion;
- multiple accent exposure;
- original/calibrated IELTS-style task sets.

Current official reference: four parts, ten questions per part, everyday/social contexts first and education/training contexts later.

### Raw score handling

Official raw-score examples may be displayed for official/appropriately matched tests, but official IELTS notes that exact marks needed for a band vary slightly by test version.

Therefore:

- do not map a random internal 30/40 directly to Band 7;
- an internal form needs calibration/approved equivalence before raw→band conversion;
- otherwise show raw accuracy + qualitative readiness, not a false band.

## 10. Reading readiness

Academic and General Training Reading are tracked separately after the user selects a variant.

Same safeguard:

- internal raw score → band requires a calibrated form;
- official conversion tables/version metadata must be updateable;
- General Training and Academic typical raw requirements must not be mixed.

Reading training tracks:

- timing;
- locating detail;
- main idea;
- paraphrase;
- reference;
- inference;
- matching/headings/completion task behavior;
- error source.

## 11. Writing readiness

Official criteria stored in the IELTS rubric layer:

1. Task Achievement (Task 1) / Task Response (Task 2);
2. Coherence and Cohesion;
3. Lexical Resource;
4. Grammatical Range and Accuracy.

Criteria are equally weighted within a task. Task 2 contributes more to the Writing score than Task 1; V1 stores the official relative weighting of 2:1.

AI can provide estimated descriptor-based evaluation only when using an approved IELTS rubric and sufficient evaluator confidence.

Writing evidence must keep:

- Task 1 vs Task 2 separate;
- Academic vs General Task 1 separate;
- timed vs untimed evidence separate;
- first draft vs revised draft separate.

A corrected rewrite after extensive AI guidance is useful learning but not independent IELTS readiness evidence.

## 12. Speaking readiness

Official assessment dimensions:

1. Fluency and Coherence;
2. Lexical Resource;
3. Grammatical Range and Accuracy;
4. Pronunciation.

They carry equal weighting in the official Speaking score.

English Coach simulations follow:

- Part 1 familiar questions;
- Part 2 extended individual turn;
- Part 3 more abstract discussion.

Readiness evidence should distinguish:

- coached practice;
- fresh independent simulation;
- full 11–14 minute style simulation;
- evaluator confidence.

Pronunciation remains about intelligibility and official communicative criteria, not imitating a native accent.

## 13. Productive-score confidence

Writing/Speaking AI scoring is inherently less deterministic than Listening/Reading.

Rules:

- low-confidence estimate is diagnostic only;
- repeated independent tasks are required;
- multiple prompts/topics reduce memorized-answer bias;
- target-readiness requires at least medium confidence;
- the system should show criterion-level reasons, not just a band number;
- a human/official checkpoint can increase confidence but does not rewrite general Mastery history.

## 14. Official overall-band calculation

For actual component band scores, IELTS overall is the average of Listening, Reading, Writing and Speaking, rounded using the official whole/half-band rule.

For internal estimated ranges:

- use the same arithmetic only as an **estimated overall**;
- preserve uncertainty/range;
- do not imply an official Test Report Form result.

## 15. Scheduler integration

Daily Scheduler receives `ielts_stage` and optional exam date/target.

Rules:

- Stage 0: no IELTS allocation required;
- Stage 1: format familiarization only;
- Stage 2: small mini-task blocks;
- Stage 3: scheduled component work;
- Stage 4: periodic full diagnostics, not daily mocks;
- Stage 5: targeted maintenance + bottleneck repair.

IELTS work competes with other study under the same fixed daily time budget. It cannot silently extend study time.

## 16. Bottleneck-first IELTS planning

If target profile is:

```text
Overall target: 6.5
Minimum component: 6.0
```

and current estimated medians are:

```text
L 7.0
R 6.5
W 5.5
S 6.5
```

Scheduler should not keep allocating equal IELTS time to all skills. Writing remediation/checkpoints receive higher exam-layer priority, while Listening/Reading continue via maintenance/review.

The exam layer remains explainable: “Writing is currently below your required component floor.”

## 17. General Mastery vs IELTS readiness

Keep two models:

```text
Knowledge Node Mastery
    ≠
IELTS Readiness Evidence
```

Examples:

- A learner can have strong B2 speaking ability but be unfamiliar with Speaking Part 2 timing.
- A learner can memorize IELTS templates and temporarily score well on a narrow task while lacking broad spontaneous speech.

The product must detect both cases rather than merging them into one score.

## 18. Checkpoint source classes

Store evidence provenance:

- internal guided IELTS-style;
- internal validated timed component;
- internal calibrated mock;
- official sample/approved external result entered or linked by the learner where supported;
- actual historical official score supplied by the learner.

Confidence depends on source, calibration and recency.

Never relabel an internal mock as “official”.

## 19. Recency and stability

Target readiness should reflect recent repeatability, not one peak result.

V1 uses a 42-day target-readiness window and requires several sets/forms.

A single exceptional estimated 7.0 does not erase three recent 5.5 results.

Conversely, an old weak result should eventually carry less weight after sustained improvement.

Exact aggregation/calibration remains configurable.

## 20. Reading/Listening official raw references

The official site currently gives average raw marks associated with selected bands while warning that exact requirements vary slightly by test version.

English Coach should store raw conversion as versioned external configuration/reference data rather than hard-code it into curriculum nodes.

That lets the product update exam scoring references without changing learner Mastery or lesson semantics.

## 21. Writing/Speaking descriptors

Official band-descriptor criteria are external exam rubrics, not content to improvise from memory.

Implementation should version the rubric reference and periodically verify the current official descriptor documents.

AI feedback can paraphrase criterion-based weaknesses and give practice, but should avoid reproducing long protected descriptor text in product content.

## 22. IELTS task content policy

Default:

- original IELTS-style tasks built from approved Templates;
- licensed/open material where permitted;
- official sample material used according to rights/links rather than copied wholesale.

The product name/UI must clearly distinguish:

- IELTS-style practice;
- official IELTS material.

## 23. Validation performed for P0-IELTS-001

Machine validation:

- `ielts-readiness.schema.json`: Draft 2020-12 PASS;
- synthetic Academic learner profile with uneven component ranges: PASS;
- half-band values enforced;
- four component records required;
- `estimated_not_official: true` enforced.

Policy consistency:

- direct CEFR→IELTS band conversion forbidden;
- uncalibrated internal raw→band conversion forbidden;
- Academic/General Reading and Writing Task 1 separated;
- official Speaking four-criteria equal-weight rule represented;
- Writing four criteria and Task 2 greater weighting represented;
- overall rounding references official rule;
- Stage 5 requires repeated recent multi-form evidence, not one mock.

## 24. Limitations

Gate percentages and checkpoint counts are V1 product defaults, not official IELTS rules.

Before learner-facing score estimates are trusted, implementation must calibrate:

- internal Listening/Reading forms;
- AI Writing/Speaking rubrics;
- confidence aggregation;
- readiness ranges against official/real outcomes where feasible.

## 25. Exit result

P0-IELTS-001 is complete when IELTS training has clear entry/progression stages, component-specific evidence, variant-aware Reading/Writing behavior, conservative estimated scoring and a target-readiness gate that requires repeated recent performance while preserving real-English learning.

Next task: **Phase 0 cross-document design review and freeze**.
