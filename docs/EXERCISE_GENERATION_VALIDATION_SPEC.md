# Exercise Generation / Validation Specification v1

**Task:** P0-EXE-001  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

This specification defines how English Coach creates exercises that are useful for learning **and trustworthy enough for Mastery/Review evidence**.

The central rule is:

> AI may help create and evaluate exercises, but no unvalidated AI output may silently become scored truth.

Machine/config artifacts:

- `schemas/exercise-template.schema.json`
- `schemas/exercise-item.schema.json`
- `schemas/exercise-attempt.schema.json`
- `config/exercise-v1.config.json`

## 2. Three-layer exercise model

### Exercise Template

A reviewed reusable specification that defines:

- target Knowledge Node(s);
- task type;
- evidence type;
- scoring mode;
- what AI variants may change;
- what AI variants may never change;
- validation requirements.

### Exercise Item

A concrete question/activity generated or authored from a Template.

It contains:

- prompt/stimulus/options;
- exact target node(s);
- answer or rubric specification;
- provenance/content class;
- validation results;
- whether it may affect Mastery/Review.

### Exercise Attempt

One learner response to one Item.

It records:

- learner/item/attempt-group IDs;
- response;
- score/rating;
- evaluator type/confidence;
- assistance level;
- emitted Mastery Evidence references.

This separation prevents one model call from inventing the task, deciding the answer and judging its own quality with no audit trail.

## 3. Supported V1 task families

Recognition / objective:

- single-choice MCQ;
- multi-select;
- true/false;
- matching;
- ordering;
- listening/reading choice.

Controlled production:

- fill blank;
- short answer;
- error correction;
- sentence transformation;
- controlled production;
- listening/reading completion.

Free production / interaction:

- free writing;
- free speaking;
- pronunciation production;
- communication role-play.

The app should prefer the simplest task that can validly elicit the required evidence. Fancy interaction is not automatically better assessment.

## 4. Scoring modes

### Deterministic

Use when a defensible exact/accepted answer set exists.

Examples:

- MCQ;
- form/word completion;
- many grammar transformations;
- ordering;
- spelling/number/date tasks.

Deterministic scoring is preferred where possible because it is reproducible.

### Rubric

Use when language output has many valid forms.

Examples:

- free speaking;
- free writing;
- pronunciation intelligibility;
- communication repair;
- open response.

Rubric evaluation must identify the target feature and cannot require one exact native-like sentence.

### Hybrid

Use when part can be deterministically verified but quality also requires a rubric.

Example: a required grammatical form plus broader communicative adequacy.

## 5. Evidence type must be explicit

Each Template and Item maps to one primary Mastery evidence type:

- recognition;
- controlled production;
- free written production;
- free spoken production;
- spontaneous reuse;
- listening comprehension;
- reading comprehension;
- pronunciation intelligibility;
- communication repair.

One easy MCQ cannot claim `free_spoken_production` evidence simply because the target node is a speaking-related concept.

## 6. Content classes

### `reviewed_core`

Human-reviewed stable items/examples. May be scored and affect Mastery/Review when all normal gates pass.

### `validated_variant`

Generated/varied item created from an active Template and passed the full automated/independent QA pipeline. May be scored.

### `unvalidated_variant`

Useful for exploratory practice only. Cannot change Mastery or FSRS Review state.

### `exploratory`

Open coaching/drill content. Feedback is allowed, but the system must not treat it as trusted scored evidence.

## 7. AI generation boundary

Forbidden pattern:

```text
"Make me a B1 grammar question"
        ↓
AI returns question + answer
        ↓
score learner and update mastery
```

Required pattern:

```text
active Exercise Template
+ target node IDs
+ level/scope/exclusions
+ allowed variant fields
+ answer constraints
        ↓
AI drafts variant
        ↓
Schema validator
        ↓
Curriculum-scope validator
        ↓
Answer validator
        ↓
Ambiguity/distractor validator
        ↓
Level validator
        ↓
Independent QA
        ↓
validated_variant
```

Generation provenance must preserve Template version plus generator/model/prompt-version reference and a seed/variant key where available.

## 8. Validation pipeline

A scored generated Item must pass all applicable gates.

### V1 — Schema

Required fields, enums, IDs, limits and structure are valid.

### V2 — Target/scope

The Item actually tests the supplied node(s), stays within the node language scope and does not silently require later-level knowledge.

### V3 — Answer correctness

For deterministic tasks:

- answer exists;
- accepted-answer set is explicit;
- correct option IDs resolve;
- word limits/normalization are known;
- no second defensible answer is omitted.

For rubric tasks:

- approved rubric exists;
- rubric dimensions match target evidence;
- required evaluator confidence is defined.

### V4 — Ambiguity

Check whether a competent learner could reasonably produce/select another answer that should also be accepted.

Ambiguous scored items are rejected, not explained away after the learner answers.

### V5 — Level

Question instructions, distractors, stimulus and required output must remain appropriate for target level unless a support gloss is deliberately provided.

### V6 — Source support

Listening/reading questions must be answerable from the final source asset, not draft text or outside world knowledge.

### V7 — Independent QA

Scored AI variants receive a second validation path independent from the generation call. In V1 this may be deterministic/rule validation plus a separate approved model/rubric review; higher-risk core templates receive human review before activation.

## 9. MCQ rules

For single-choice:

- exactly one defensible correct answer;
- option text must be unique;
- distractors must be plausible for the target misconception but still wrong;
- avoid `all of the above` / `none of the above` by default;
- do not make the correct option obvious through length/grammar/style;
- do not test obscure vocabulary when the target is grammar;
- avoid trick questions unrelated to the target learning objective.

A distractor should diagnose a likely misconception, not punish test-taking style.

## 10. Fill-blank / short-answer rules

- define accepted answers before activation;
- specify normalization rules;
- ignore case/punctuation unless they are the construct being tested;
- specify whether spelling matters;
- list natural alternative answers where appropriate;
- IELTS-style completion must store the exact word/number limit;
- do not reject a linguistically valid answer just because the generator expected a different surface form.

## 11. Error-correction rules

An error-correction item must contain a genuine target-relevant error.

It cannot depend on arbitrary stylistic preference.

Validation must verify:

- source sentence is actually incorrect or clearly unnatural for the stated target;
- correction is compatible with the intended meaning;
- target node is the reason for correction;
- multiple equally valid rewrites are accepted where the task permits them.

## 12. Sentence-transformation rules

The learner must preserve core meaning while using the target structure.

Do not require one exact surface string if several transformations are correct.

Scoring may combine deterministic required elements with rubric-based meaning preservation.

## 13. Listening/reading item rules

Scored comprehension Items must link to an active/final source asset.

Validator must confirm:

- evidence exists in final audio/text;
- location can be internally traced for QA;
- question does not reveal the answer;
- outside specialist knowledge is unnecessary;
- paraphrase/distractor difficulty matches level;
- corrections/change-of-mind in audio are intentional and level-appropriate;
- answer order matches official IELTS behavior when an IELTS-style item requires it.

Source-support locators may be implementation-internal and need not be shown to learners.

## 14. Free speaking/writing rules

Free output cannot use exact-answer matching.

Rubrics should normally separate:

1. target-node achievement;
2. meaning/communicative success;
3. relevant accuracy;
4. fluency/coherence when the task actually measures it.

Do not let unrelated small mistakes overwhelm evidence for the current target.

Example:

A learner correctly uses Present Perfect for experience but makes one article error. The target Present Perfect evidence can still be successful; the article issue should be logged separately if useful.

## 15. Pronunciation rules

Pronunciation scoring prioritizes intelligibility and the specific target (sound contrast/stress/chunking/intonation).

Do not score accent identity as an error.

AI pronunciation judgments require sufficient audio quality and evaluator confidence. Low-confidence judgments remain diagnostic/unscored.

## 16. Role-play / spontaneous-use rules

Spontaneous evidence is higher-value because the learner is not explicitly told which exact phrase/grammar structure to produce.

A role-play used for `spontaneous_reuse` must:

- create a realistic need for the target;
- avoid telling the learner the answer;
- allow multiple natural responses;
- use an approved rubric;
- distinguish independent target use from model-then-repeat.

## 17. Assistance and retries

Exercise Attempt records:

- independent;
- minor prompt;
- major prompt;
- model then repeat.

Immediate retry after feedback stays in the same `attempt_group_id` by default.

This means:

- retry is pedagogically valuable;
- it does not masquerade as a completely independent new retrieval event;
- the Review Engine receives at most one state update per attempt group;
- Mastery Evidence preserves assistance level.

A later fresh task/context can create new independent evidence.

## 18. Evaluator confidence

Deterministic valid scoring normally yields high confidence.

Approved AI rubric evaluation must record high/medium/low confidence.

Rules already aligned with Mastery Model:

- low-confidence AI cannot promote/demote;
- `needs_review` cannot change state;
- free production with evaluator uncertainty should remain diagnostic until resolved.

The learner should not lose progression because the evaluator is unsure.

## 19. Mastery / Review effect gate

`may_change_mastery` and `may_update_review` are not determined solely by task type.

For a generated scored variant they require:

- active Template;
- Item content class `validated_variant` or `reviewed_core`;
- all validation gates pass;
- source asset active when required;
- Attempt is scored;
- evaluator confidence sufficient;
- assistance handled according to Mastery/Review policies.

Unvalidated/exploratory content can teach but cannot change learner state.

## 20. Item exposure and memorization

Avoid repeatedly proving mastery with the same item.

The system should track exposure history and prefer fresh surface variants/contexts while preserving the same target construct.

Rules:

- do not use exact repeated Item as the sole evidence for secure state;
- a Review Unit should have multiple valid retrieval instruments over time where practical;
- randomized numbers/names/context must not alter the target difficulty unpredictably;
- generated variation should vary surface form, not construct semantics.

## 21. Error taxonomy feedback

Wrong answers should generate a useful diagnosis where possible:

- target grammar misconception;
- lexical misunderstanding;
- listening recognition failure;
- paraphrase miss;
- careless detail error;
- instruction/word-limit violation;
- production retrieval failure;
- pronunciation intelligibility issue;
- evaluator uncertainty.

This information can feed P3 remediation in the Daily Scheduler.

## 22. Feedback timing

Learning mode may provide immediate feedback.

Assessment/placement/IELTS simulation may delay feedback until the required block completes.

Feedback should:

- explain the target issue briefly;
- show a corrected/natural form when useful;
- invite retry for productive tasks;
- avoid teaching ten unrelated errors at once.

## 23. Content lifecycle

Template:

```text
draft → reviewed → active → deprecated
```

Item:

```text
draft → validated → active
             ↘ rejected
active → deprecated
```

A Template change that changes scoring/construct semantics increments version and requires variant revalidation where affected.

## 24. Generated scored variant safety

V1 rule: no “generate and immediately trust.”

A variant may enter scored circulation only after all validators pass and independent QA succeeds.

If automatic validators cannot establish answer correctness, mark it:

- exploratory/unscored, or
- needs human review.

Availability is less important than trustworthy learning data.

## 25. IELTS-style exercises

IELTS-specific task behavior is implemented through approved Templates rather than special ad-hoc prompts.

Examples include:

- multiple choice;
- matching;
- map/plan/diagram labels;
- form/note/table/flow-chart/summary completion;
- sentence completion;
- short answer;
- Reading-specific item families later.

Official format constraints such as word limits, ordered listening answers and one-play audio are stored/validated explicitly.

The product does not claim an item is official IELTS merely because it resembles the format.

## 26. Validation performed for P0-EXE-001

Machine schemas:

- `exercise-template.schema.json`: Draft 2020-12 PASS;
- `exercise-item.schema.json`: Draft 2020-12 PASS;
- `exercise-attempt.schema.json`: Draft 2020-12 PASS.

Synthetic integrated fixture:

- active B1 Present Perfect vs Past Simple fill-blank Template: PASS;
- AI-assisted `validated_variant` Item: PASS;
- deterministic high-confidence independent Attempt: PASS;
- node IDs/template links/provenance/state-effect fields represented: PASS.

Policy checks:

- unvalidated/exploratory content cannot change Mastery/FSRS: PASS by config;
- independent QA required for scored generated variant: PASS by config;
- low-confidence state change disabled: PASS by config;
- same attempt group limited to one Review update: PASS by config.

## 27. Known limitation

P0-EXE-001 defines trustworthy exercise structure and gates, not the entire reviewed content bank.

Before production use we still need:

- actual active Templates for curriculum nodes;
- reviewed core Item sets;
- automated validator implementation;
- approved AI rubrics and calibration;
- real-user item statistics and retirement rules.

Those become implementation/content operations after Phase 0.

## 28. Exit result

P0-EXE-001 is complete when the system can distinguish approved exercise design, concrete content and learner attempt; can constrain AI generation; can reject ambiguous/unvalidated items; and can determine whether an Attempt is trusted enough to influence Mastery/Review.

Next task: `P0-IELTS-001 — IELTS Progression Gates`.
