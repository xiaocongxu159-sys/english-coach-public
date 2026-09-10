# Curriculum Specification

**Baseline:** v0.2.0  
**Updated:** 2026-09-01  
**Status:** Top-level A1–B2 taxonomy and knowledge-node schema established; detailed node inventory pending

## 1. Curriculum philosophy

The curriculum must be **structured, explainable and adaptive**.

AI is not allowed to decide the global syllabus from scratch. It may personalize delivery and practice within approved learning objectives.

The curriculum has three layers:

1. **Proficiency framework** — what a learner at each level should be able to do.
2. **English-language profile** — grammar, vocabulary, functions and language features suitable for each level.
3. **Product curriculum** — our own ordered knowledge tree, prerequisites, lessons, exercises and mastery rules.

## 2. Authoritative/reference sources

### 2.1 CEFR

Primary proficiency framework: **Common European Framework of Reference for Languages (CEFR)** and the 2020 Companion Volume.

Use CEFR for:

- level definitions;
- receptive/interactive/productive ability goals;
- can-do outcomes;
- spoken interaction and production goals;
- listening and reading goals;
- mediation/online-interaction concepts when useful.

Important design rule: CEFR is descriptive and must be adapted to a specific teaching context. It is not a ready-made day-by-day English syllabus.

Reference:
- Council of Europe CEFR descriptors: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- CEFR uses/objectives: https://www.coe.int/en/web/common-european-framework-reference-languages/uses-and-objectives
- CEFR Companion Volume structure: https://book.coe.int/en/education-and-modern-languages/8150-common-european-framework-of-reference-for-languages-learning-teaching-assessment-companion-volume.html

### 2.2 English Grammar Profile (EGP)

Use EGP as a research-informed reference for which grammatical features learners tend to use at CEFR levels.

Use it to help answer:

- when a structure is developmentally appropriate;
- which feature can reasonably precede another;
- what complexity to expect at each level.

Do **not** treat EGP as a mandatory fixed teaching order. Cambridge explicitly describes it as a reference list rather than a syllabus.

Cambridge reports more than 1,200 grammar-feature descriptions developed using evidence from the Cambridge Learner Corpus.

Reference:
- https://www.cambridge.org/elt/blog/2015/11/11/introducing-english-grammar-profile-1-building-profile/
- https://www.cambridge.org/elt/blog/2015/11/16/introducing-english-grammar-profile-2-whats-use-egp/

### 2.3 English Vocabulary Profile (EVP)

Use EVP as a reference for vocabulary meanings, phrases, phrasal verbs and idioms associated with CEFR levels.

Important: CEFR level should be applied to **meaning/use**, not blindly to the headword. A common word may have basic meanings at a low level and more abstract uses at higher levels.

Use EVP to inform vocabulary selection, not to copy proprietary datasets wholesale.

Reference:
- https://www.cambridge.org/core/journals/english-profile-journal/article/completing-the-english-vocabulary-profile-c1-and-c2-vocabulary/418955FC7ED2455E98A499BC40C2C816

### 2.4 IELTS official materials

Use official IELTS sources for:

- test structure;
- task types;
- timing;
- speaking-part structure;
- official sample-test checkpoints;
- assessment-criterion interpretation where official guidance is available.

Do not copy commercial IELTS books or copyrighted test banks into the product without permission.

Reference:
- Academic sample questions: https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test
- General Training sample questions: https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test

## 3. Skill domains

The product curriculum covers:

- Grammar
- Vocabulary & lexical chunks
- Listening
- Speaking
- Reading
- Writing
- Pronunciation
- Communicative functions

IELTS is tracked as a separate exam layer across these domains.

The CEFR's broader reception/production/interaction/mediation model is used to prevent the product from treating language as seven isolated school subjects.

## 4. Level scope for V1

Detailed design target:

- A1
- A2
- B1
- B2

C1 may be represented as a future target but does not need a complete V1 content tree before development starts.

Top-level A1–B2 taxonomy is defined in:

- `docs/CURRICULUM_TREE_A1_B2.md`

## 5. Knowledge-node model v1

The stable schema is defined in:

- `docs/KNOWLEDGE_NODE_SCHEMA.md`

A knowledge node is the smallest curriculum unit that can be taught, assessed, scheduled, reviewed and linked to other skills.

Key design rules:

- node IDs are stable once active;
- each node has one primary domain;
- hard and soft prerequisites are distinct;
- scope/exclusions constrain AI-generated content;
- mastery evidence distinguishes receptive, controlled, productive and spontaneous use;
- external source basis and product-designed decisions must remain distinguishable;
- nodes follow `draft -> reviewed -> active -> deprecated`.

## 6. Curriculum ordering rules

A knowledge node may be scheduled when:

1. hard prerequisites meet the minimum readiness threshold;
2. the node is appropriate for the learner's active band/level;
3. required reviews do not consume the full available session;
4. weekly skill balance permits it;
5. the node is relevant to the learner's target path;
6. the node status is `active`.

The scheduler must not simply choose the “next item in a list”.

Numeric thresholds are intentionally deferred to the mastery-model task.

## 7. Vocabulary design rules

Prefer teaching:

- meaning in context;
- chunks;
- collocations;
- useful sentence frames;
- register;
- productive recall.

Avoid making the primary learning unit a Chinese-English pair.

Example:

Instead of only:

`adjust = 调整`

Teach a bundle such as:

- adjust the settings
- adjust the bid
- make an adjustment
- adjust based on performance

Vocabulary topics are content lanes; knowledge nodes should be small enough to produce meaningful mastery evidence.

## 8. Grammar design rules

Each grammar node should have multiple mastery layers:

1. comprehension;
2. recognition;
3. controlled production;
4. sentence production;
5. spoken production;
6. spontaneous use where appropriate.

A user should not be marked “mastered” only because multiple-choice accuracy is high.

Grammar-level placement may use English Grammar Profile as evidence, but detailed teaching sequence remains a product decision informed by prerequisites, frequency, communicative value and learner data.

## 9. Listening-content policy

Listening content may come from:

1. original scripts written for the product;
2. AI-generated scripts that pass validation;
3. product-generated audio from approved scripts;
4. licensed/open material with compatible rights;
5. official IELTS material used as a checkpoint/link where permitted.

### Difficulty controls

Each listening item should declare:

- CEFR target;
- duration;
- speaker count;
- accent target;
- speech-rate band;
- lexical range;
- grammar range;
- discourse function;
- comprehension operation;
- question types;
- number of listens permitted;
- transcript availability stage.

### Progression concept

A1: concrete daily exchanges, names, numbers, times, prices, simple requests.  
A2: routine social situations, appointments, travel, short descriptions, simple reasons.  
B1: work, experiences, interviews, problem-solving, main ideas/details/reasons.  
B2: discussions, viewpoints, implied meaning, denser information, more natural speed and discourse.

Listening knowledge nodes primarily represent comprehension operations (detail, main idea, sequence, attitude, inference, reference) rather than topic labels.

IELTS listening simulations should be separately tagged and follow official task-format characteristics without copying protected test content.

## 10. Reading-content policy

Reading texts should be original/licensed/generated-and-reviewed, with controls for:

- length;
- lexical difficulty;
- grammar range;
- information density;
- genre;
- inference burden;
- question type.

Reading knowledge nodes primarily represent transferable comprehension operations. Topic/genre are separate metadata.

## 11. Speaking/writing policy

Speaking and writing nodes represent communicative production abilities, not duplicate grammar labels.

Examples:

- narrate a past event;
- compare alternatives and recommend;
- justify an opinion;
- repair a misunderstanding;
- organize a supported paragraph;
- summarize information in one's own words.

These nodes may depend on multiple grammar/vocabulary/function nodes.

## 12. Pronunciation policy

Pronunciation aims first at **intelligibility, listening discrimination and communicative control**, not native-accent imitation.

Progression includes:

- high-value sound contrasts;
- grammatical endings;
- word stress;
- sentence stress;
- connected speech;
- rhythm/chunking;
- functional intonation;
- accent tolerance in listening.

## 13. Exercise model

Core exercises should combine:

- recognition;
- gap fill;
- error correction;
- sentence transformation;
- recall;
- sentence creation;
- spoken response;
- listening comprehension;
- reading comprehension;
- short writing.

### Hybrid content policy

Use two content classes:

**A. Reviewed core items**  
Stable, quality-checked questions/templates for foundational concepts.

**B. AI variants**  
New scenarios/items generated inside approved templates and constraints.

AI-generated questions must pass validation before being used for scored mastery updates.

## 14. Content quality gates

A scored question must satisfy:

- exactly one defensible answer when single-answer;
- no unintroduced dependency unless intentionally diagnostic;
- level-appropriate language;
- clear task wording;
- no answer leakage;
- explanations consistent with the answer key;
- copyright-safe source status;
- metadata identifying the knowledge node assessed.

If automatic validation confidence is insufficient, the item must be treated as unscored practice or rejected.

A knowledge node also must pass the activation gates defined in `KNOWLEDGE_NODE_SCHEMA.md`.

## 15. IELTS relationship

IELTS should be mapped onto the curriculum rather than replace it.

Example:

```text
B1/B2 opinion language
   -> real conversation: explain a preference
   -> speaking practice: defend a view
   -> writing practice: paragraph with reasons/examples
   -> IELTS layer: Speaking Part 3 / Writing Task 2 relevance
```

The product must never present an internal CEFR-to-IELTS conversion as an exact official equivalence.

## 16. P0-CUR-001 status

Completed in this task:

- knowledge-node schema v1;
- stable ID convention;
- hard vs soft prerequisite convention;
- node relationship semantics;
- node lifecycle (`draft -> reviewed -> active -> deprecated`);
- A1–B2 top-level curriculum taxonomy across all core domains;
- progression rules connecting real-world communication and IELTS.

Still pending after P0-CUR-001:

- detailed node-by-node A1–B2 inventory;
- lesson-unit schema;
- numeric mastery thresholds;
- spaced-review algorithm;
- placement-test blueprint;
- daily lesson-generation algorithm;
- full listening-content specification;
- exercise-generation/validation specification;
- IELTS progression gates.

## 17. Next curriculum deliverable

**P0-CUR-002 — Detailed A1 grammar + communicative-function node inventory and prerequisite graph.**

The detailed curriculum should expand level by level rather than attempting to generate thousands of unreviewed nodes in one pass.
