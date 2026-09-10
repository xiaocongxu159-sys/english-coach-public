# Listening Content Specification v1

**Task:** P0-LIS-001  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Design baseline

## 1. Purpose

This specification defines how English Coach creates, grades, stores, validates and uses listening content from A1 through B2 while supporting two long-term outcomes:

1. real-world listening and communication;
2. progressive readiness for IELTS Listening.

A Listening Asset is not defined only by topic or CEFR label. Its difficulty must be explainable through discourse, language, audio and task characteristics.

Machine/config artifacts:

- `schemas/listening-asset.schema.json`
- `config/listening-v1.config.json`

## 2. External reference boundary

The content system is informed by:

- CEFR/Companion Volume listening descriptors and reception/task-analysis principles;
- the project-owned A1–B2 Listening Knowledge Nodes;
- IELTS official Listening format and official sample materials for exam-task mapping.

CEFR informs communicative listening capability. It does not prescribe our exact WPM, duration, number of replays or daily teaching order.

IELTS official material defines the exam layer. Current IELTS Listening uses four parts / forty questions, moves from social/everyday contexts into educational/training contexts, uses multiple English accent varieties, and plays recordings once in the exam. English Coach must not copy protected official question banks into its own content library without rights.

## 3. Content ownership/source policy

Allowed content origins:

- original human-authored;
- AI-generated then reviewed;
- appropriately licensed;
- open-license content compatible with our use;
- official/reference material used for analysis/checkpoints only where rights permit.

No Listening Asset can become `active` unless copyright status is known.

Default V1 strategy:

```text
curriculum target
   ↓
original / AI-assisted script
   ↓
level + pedagogy review
   ↓
audio generation/recording
   ↓
audio QA
   ↓
exercise/task QA
   ↓
reviewed / active
```

AI generation is a production tool, not the final quality authority.

## 4. What a Listening Asset contains

Every asset records at least:

- stable asset ID/version/status;
- CEFR target level;
- learning mode;
- target Listening Knowledge Nodes;
- optional support nodes;
- scenario/topic and real-world relevance;
- discourse type and speaker count;
- duration and approximate speech rate;
- connected-speech level;
- accent profile;
- language difficulty profile;
- play/replay/transcript policy;
- listening operations assessed;
- source/copyright status;
- QA status.

This allows the scheduler and lesson engine to select audio by actual learning need instead of `topic = travel` alone.

## 5. Difficulty is multi-dimensional

The level of a listening task is controlled through at least ten axes:

1. lexical range;
2. grammatical range;
3. speech rate;
4. connected speech/reductions;
5. duration;
6. speaker count and turn-taking;
7. accent familiarity/variation;
8. information density and redundancy;
9. paraphrase/inference load;
10. task/operation difficulty.

Do not make a task harder by changing all axes at once. When introducing a new listening operation, keep other variables within an accessible range.

## 6. A1 listening profile

Typical goals:

- recognize key words and short phrases in very clear familiar contexts;
- understand basic personal information;
- identify simple numbers, times, prices, dates and locations;
- follow short linear exchanges or instructions;
- identify a very obvious main topic.

V1 content envelope:

- typical duration: 15–60 seconds;
- approximate QA speech-rate target: 85–115 WPM;
- usually 1–2 speakers;
- very controlled or controlled connected speech;
- high redundancy;
- low information density;
- essentially no inference burden;
- unfamiliar vocabulary kept extremely low;
- clean audio;
- one clear accent per asset.

Common scenarios:

- introductions;
- café/shop/service exchanges;
- basic directions;
- simple schedules;
- family/routine;
- short announcements.

Guided learning may use multiple listens and transcript support after an initial attempt. Scored practice is stricter but is not automatically one-pass.

## 7. A2 listening profile

Typical goals:

- follow short routine exchanges on familiar matters;
- understand straightforward instructions and announcements;
- track sequence and practical details;
- recognize simple paraphrase;
- follow familiar travel/service/work interactions.

V1 envelope:

- duration: 30–100 seconds;
- approximate QA rate: 100–130 WPM;
- generally 1–2 speakers; selected short 3-speaker tasks allowed;
- controlled → natural-clear speech;
- moderate/high redundancy;
- light paraphrase;
- only light inference;
- clean audio for scored tasks;
- gradual accent rotation rather than sudden accent difficulty.

New operations can include:

- simple map/location following;
- sequence/process;
- simple reason;
- paraphrase matching;
- short note completion.

## 8. B1 listening profile

Typical goals:

- follow main points of clear standard speech on familiar work/study/life topics;
- recover important details from longer exchanges;
- follow narrative sequence;
- recognize reasons/examples and common paraphrase;
- track speaker positions in routine discussions;
- begin note-taking and contextual inference.

V1 envelope:

- duration: 60–180 seconds;
- approximate QA rate: 120–150 WPM;
- 1–3 speakers;
- natural-clear and selected natural speech;
- moderate information density/redundancy;
- moderate paraphrase;
- light inference;
- regular North American/British exposure plus selected Australian/international-clear audio;
- occasional one-pass checkpoints.

Typical content:

- work meeting/project update;
- interview;
- travel problem/resolution;
- short news/media item;
- personal story;
- education/study discussion;
- familiar-topic presentation.

## 9. B2 listening profile

Typical goals:

- understand main ideas and important detail in extended clear-to-natural speech;
- follow developed arguments and multiple speaker positions;
- identify stance, agreement/disagreement and moderate implication;
- track discourse structure and reference;
- take structured notes;
- understand data/trend description and familiar academic/professional presentations;
- handle wider accent variation.

V1 envelope:

- duration: 90–300 seconds for normal curriculum assets;
- approximate QA rate: 135–170 WPM;
- 1–4 speakers;
- natural-clear → natural connected speech;
- moderate/high information density;
- lower redundancy;
- high paraphrase permitted;
- moderate inference permitted;
- systematic North American, British, Australian and New Zealand exposure for IELTS preparation;
- regular one-pass scored checkpoints.

B2 is the bridge into serious IELTS Listening practice, but B2 curriculum completion is not an IELTS band guarantee.

## 10. Speech-rate policy

WPM ranges are **product QA targets, not CEFR standards**.

Rules:

- do not artificially stretch pauses just to hit a low-level number;
- natural prosody and intelligibility are more important than mechanical WPM;
- measure rate on the final audio, not only the script;
- level QA considers connected speech, density and redundancy together with WPM;
- a slow recording with dense unfamiliar language may still be too hard;
- a faster recording with high redundancy may remain accessible.

## 11. Connected speech progression

A1:

- clear word boundaries;
- limited reduction;
- natural but pedagogically clear rhythm.

A2:

- common contractions and weak forms;
- simple linking;
- still high intelligibility.

B1:

- common reductions/linking;
- more realistic turn-taking;
- learners must increasingly recognize familiar words in connected speech.

B2:

- natural reductions and chunking;
- more authentic interruption/repair in discussions where appropriate;
- natural speech remains intelligible rather than deliberately mumbled.

## 12. Accent policy

Goal: receptive flexibility, not accent ranking.

Rules:

- accents are not scored as better/worse;
- pronunciation training still targets intelligibility;
- A1 should not combine accent novelty with major lexical/grammar difficulty;
- A2 rotates familiar accent varieties across sessions;
- B1 broadens exposure;
- B2 systematically prepares for the accent variety used in IELTS-style listening;
- every generated/recorded voice must be reviewed for intelligibility and consistency.

The system should not claim precise regional accent authenticity unless the asset has actually been reviewed for it.

## 13. Background-noise policy

Default scored curriculum audio is clean.

Optional light environmental sound may be used for **guided real-world listening** at later levels, but:

- it cannot obscure target information;
- it is not used merely to make content harder;
- A1 scored assets have no noise;
- IELTS-style assets use clean audio unless official format changes;
- environmental noise difficulty is separate from language competence.

## 14. Play-count policy

### Guided learning

Purpose: learn how to listen.

Possible sequence:

1. first listen for gist without transcript;
2. answer/recall;
3. second listen for detail;
4. optional segment replay;
5. transcript unlocked;
6. diagnose why information was missed;
7. listen again with target feature awareness.

A1/A2 may use up to 3 guided listens by default; B1/B2 normally 2.

### Scored practice/review

- no transcript before scored attempt;
- no speed control;
- no segment replay;
- A1–B1 may use 2 plays for non-one-pass tasks;
- B1 introduces one-pass checkpoints;
- B2 uses one-pass checkpoints regularly.

### IELTS-style

- one play only;
- no segment replay;
- no speed control;
- transcript only after completion;
- tasks should reflect official-format operations without copying protected question banks.

## 15. Transcript policy

Transcript is a **teaching tool**, not a default subtitle.

Do not show the transcript before initial listening unless the stage explicitly teaches pronunciation/connected speech rather than comprehension.

When unlocked, the transcript may support diagnosis:

- unknown vocabulary;
- known word not recognized in speech;
- connected-speech issue;
- attention/detail miss;
- grammar-processing issue;
- paraphrase miss;
- inference/stance issue.

The remediation must depend on the cause rather than giving the same advice for every wrong answer.

## 16. Listening operations and Knowledge Nodes

Listening tasks primarily test transferable operations, including:

- explicit detail;
- gist/main idea;
- sequence;
- number/name/date;
- directions/location;
- paraphrase;
- reference tracking;
- speaker attitude;
- inference;
- speaker position;
- agreement/disagreement;
- note-taking;
- data/trend following;
- lexical meaning in context.

Topics are scenario metadata. `Listening about travel` is not itself a listening skill.

## 17. Task construction boundary

This specification defines **what listening evidence a task should elicit**. P0-EXE-001 will define generic item schemas, distractor rules, answer validation, scoring and AI-generated-item QA.

Listening-specific principles already fixed here:

- the answer must be supported by audio;
- language in the question must not accidentally reveal the answer;
- assessed information must not depend on inaccessible world knowledge;
- distractors may use natural corrections/changes at appropriate levels;
- paraphrase difficulty must match level;
- every scored item must be checked for one defensible answer or an explicit accepted-answer set;
- spelling/word-limit behavior for IELTS-style tasks follows official format when simulated.

## 18. Content progression vs exam progression

General-English listening develops first.

```text
A1/A2
clear real-life listening
      ↓
B1
standard speech + longer discourse + paraphrase
      ↓
B2
natural-clear extended input + stance/inference + accent variation
      ↓
IELTS-style mini tasks
      ↓
section simulations
      ↓
full official-format practice/checkpoints
```

Do not make every B1/B2 listening exercise look like IELTS.

## 19. IELTS bridge

Official IELTS Listening currently has:

- four parts;
- ten questions per part;
- Parts 1–2 in everyday/social contexts;
- Parts 3–4 in education/training contexts;
- one-play recordings;
- multiple English accent varieties including British, Australian, New Zealand and North American.

English Coach uses this as an **exam-layer blueprint**.

Progression:

### B1 late stage

- first one-pass mini tasks;
- form/note/detail-style operations;
- directions/map listening where curriculum-ready;
- basic paraphrase awareness.

### B2 early/mid

- Part 1/2-style original tasks;
- selected Part 3-style discussions;
- structured note completion;
- stronger distractor/paraphrase control.

### B2 strong / IELTS track

- Part 1–4-style original simulations;
- multiple accents across a set;
- one-play policy;
- ordered-question behavior where appropriate;
- dedicated IELTS readiness scoring handled by P0-IELTS-001.

## 20. Script-generation constraints

If AI is used to draft a script, the generation request must specify:

- target LS node(s);
- level;
- duration range;
- discourse type/speaker count;
- allowed grammar/lexical range;
- target lexical chunks;
- paraphrase/inference load;
- information density/redundancy;
- prohibited content/advanced features;
- real-world scenario;
- intended assessment operations.

The model may not be prompted only with “write a B1 listening passage.”

## 21. Audio-generation constraints

Model/provider stays configurable.

Required output QA:

- no skipped/added words that change answers;
- numbers/names/dates intelligible;
- natural but level-appropriate pace;
- no accidental answer emphasis;
- voices sufficiently distinguishable in multi-speaker audio;
- no clipping/dropouts;
- accent metadata does not claim more specificity than reviewed;
- transcript matches final audio.

For scored assets, final audio—not draft script—is the source of truth.

## 22. Asset lifecycle

```text
draft
  ↓ script review
reviewed-script
  ↓ audio produced
  ↓ audio + level + task QA
reviewed
  ↓ activation gate
active
  ↓ replacement/retirement
deprecated
```

Machine schema simplifies lifecycle to `draft / reviewed / active / deprecated`; implementation may keep internal production substates.

## 23. Activation gate

No scored Listening Asset becomes active unless all applicable checks pass:

- target node IDs resolve;
- script reviewed;
- copyright/source status known;
- final audio reviewed;
- duration/rate within approved envelope or justified exception;
- lexical/grammar scope reviewed;
- answerability reviewed;
- ambiguity reviewed;
- audio intelligibility reviewed;
- task/item validator passed;
- transcript synchronized with final audio.

AI-generated-but-unreviewed audio can be exploratory practice only, never state-changing scored evidence.

## 24. Asset reuse and variation

Avoid memorization masquerading as listening skill.

A Listening Knowledge Node needs evidence across multiple assets/contexts for higher Mastery states.

Variation may change:

- scenario;
- speaker voices;
- accent;
- surface vocabulary;
- information order/values;
- discourse context;

while keeping the assessed operation stable.

The same underlying audio should not be repeatedly used to claim independent secure evidence.

## 25. Learner-facing diagnostic loop

After a listening failure, classify the likely cause:

```text
Did not know language
or
Knew it in writing but did not recognize audio
or
Lost attention/detail
or
Missed paraphrase
or
Could not follow grammar/reference
or
Could not infer stance/meaning
```

Then choose remediation:

- vocabulary/chunk review;
- connected-speech replay;
- dictation/partial transcription;
- focused detail replay;
- paraphrase comparison;
- discourse/reference highlighting;
- fresh transfer asset.

This prevents listening practice from becoming “play it again until the answer is obvious.”

## 26. Validation performed for P0-LIS-001

Machine validation:

- `listening-asset.schema.json`: JSON Schema Draft 2020-12 PASS;
- synthetic B1 three-speaker work-meeting asset: schema PASS;
- target node IDs use LS namespace: PASS;
- source/copyright/QA fields mandatory: PASS;
- play/transcript rules represented explicitly: PASS.

Specification consistency checks:

- learning vs scored vs IELTS play rules separated;
- level difficulty controlled on multiple axes;
- IELTS one-pass behavior isolated to IELTS/readiness practice rather than all learning;
- accent exposure progresses without making accent identity a mastery criterion;
- protected IELTS content is not assumed reusable.

## 27. Limitations and calibration

Numeric WPM, duration and unknown-word ranges are configurable V1 product baselines, not official CEFR constants.

They require calibration using:

- actual learner comprehension;
- completion/drop-off patterns;
- error causes;
- target-node performance;
- audio-provider behavior;
- later IELTS diagnostic results.

Do not treat hitting a WPM number as proof an asset is correctly leveled.

## 28. Exit result

P0-LIS-001 is complete when listening content can be represented, generated under bounded specifications, quality-reviewed, selected by node/level/mode, and progressed from guided real-world listening toward one-pass IELTS-style practice without conflating exam simulation with daily learning.

Next task: `P0-EXE-001 — Exercise Generation / Validation Specification`.
