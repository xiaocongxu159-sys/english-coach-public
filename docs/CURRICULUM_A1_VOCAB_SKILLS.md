# A1 Vocabulary + Skill Node Inventory

**Task:** P0-CUR-003  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Detailed A1 vocabulary/skills baseline

## 1. Purpose

This document completes the first node-level A1 curriculum draft by expanding:

- Vocabulary & lexical chunks (`VX`)
- Listening (`LS`)
- Speaking (`SP`)
- Reading (`RD`)
- Writing (`WR`)
- Pronunciation (`PR`)

It cross-links these nodes to the 50 A1 Grammar and Communicative Function nodes defined in `CURRICULUM_A1_GRAMMAR_FUNCTIONS.md`.

The design uses CEFR A1 communicative outcomes as the proficiency boundary. CEFR descriptors support very basic personal information exchange, understanding carefully delivered simple questions/instructions, very short simple texts, and simple production about matters of personal relevance. The exact node inventory and teaching order below are product-owned curriculum decisions.

Vocabulary level placement is informed by English Profile principles: meaning/use and lexical chunks matter more than treating a whole dictionary headword as belonging to one level. We do not copy proprietary vocabulary datasets wholesale.

---

# 2. Vocabulary & lexical chunks

Vocabulary nodes are small functional bundles rather than giant word lists. Exact reviewed item lists will be attached later as curriculum content.

| ID | Lexical bundle | Hard prerequisites | Productive target |
|---|---|---|---|
| `VX-A1-SOCIAL-FORMULAS-01` | Greetings, thanks, apologies, leave-taking | — | Use common social formulas appropriately in short interactions. |
| `VX-A1-CLARIFY-SURVIVAL-01` | Clarification and repair chunks | — | Use chunks such as asking for repetition, slower speech or meaning. |
| `VX-A1-PERSONAL-IDENTITY-01` | Name, age, address/basic contact, identity | — | Give and understand core personal information. |
| `VX-A1-COUNTRY-LANGUAGE-01` | Countries, nationalities, languages | — | State origin/language and understand common equivalents. |
| `VX-A1-FAMILY-PEOPLE-01` | Family and common person labels | — | Identify basic relationships and people. |
| `VX-A1-NUMBERS-CORE-01` | Core numbers | — | Understand/produce numbers used in age, phone, quantity and price. |
| `VX-A1-TIME-DATE-01` | Clock time, weekdays, months, common date expressions | `VX-A1-NUMBERS-CORE-01` | Give/understand routine time and date information. |
| `VX-A1-HOME-OBJECTS-01` | Rooms, furniture, everyday objects | — | Name common home objects and locations. |
| `VX-A1-ACTION-VERBS-CORE-01` | High-frequency concrete action verbs | — | Use common actions needed across routines, instructions and ability talk. |
| `VX-A1-DAILY-ROUTINE-01` | Daily routine chunks | `VX-A1-ACTION-VERBS-CORE-01` | Talk about common daily activities as chunks/collocations. |
| `VX-A1-WORK-STUDY-01` | Basic jobs, workplaces, study subjects/activities | `VX-A1-ACTION-VERBS-CORE-01` | State basic work/study identity and routine. |
| `VX-A1-FOOD-DRINK-01` | Common food, drink and meal language | — | Identify/order familiar food and drink. |
| `VX-A1-PLACES-TOWN-01` | Common places in town | — | Identify common local places and destinations. |
| `VX-A1-LOCATION-DIRECTION-01` | Basic location/direction chunks | `VX-A1-PLACES-TOWN-01` | Understand/give simple location and direction expressions. |
| `VX-A1-TRANSPORT-BASIC-01` | Basic transport language | `VX-A1-PLACES-TOWN-01` | Name common transport and simple travel actions. |
| `VX-A1-SHOPPING-CLOTHES-01` | Common shopping/clothing nouns and simple descriptors | — | Identify common products/clothes and basic choices. |
| `VX-A1-PRICE-QUANTITY-01` | Price and concrete quantity chunks | `VX-A1-NUMBERS-CORE-01` | Ask/understand simple price and quantity information. |
| `VX-A1-WEATHER-01` | Basic weather expressions | — | Describe common weather simply. |
| `VX-A1-BODY-HEALTH-BASIC-01` | Body parts and very simple health needs | — | Express a basic physical need/problem and identify body vocabulary. |
| `VX-A1-ADJECTIVES-CORE-01` | High-frequency concrete adjectives | — | Describe people/things/places with basic size, quality, feeling and appearance words. |
| `VX-A1-PREFERENCE-CHUNKS-01` | Likes/dislikes and simple preference chunks | `VX-A1-ADJECTIVES-CORE-01` | Express simple preferences with reusable chunks. |
| `VX-A1-SERVICE-REQUEST-CHUNKS-01` | Formulaic service/request language | `VX-A1-SOCIAL-FORMULAS-01` | Make simple polite requests/orders without requiring full analysis of every internal grammar form. |

## 2.1 Vocabulary content rule

A vocabulary node should later include:

- target meanings/uses;
- common chunks/collocations;
- pronunciation support;
- at least one receptive example;
- at least one productive example;
- confusability/false-friend notes where relevant;
- scenario tags;
- register tags;
- review metadata.

A Chinese translation may be support metadata, but it should not be the primary learning representation.

---

# 3. Pronunciation nodes

The A1 pronunciation target is intelligibility, reliable basic word recognition/production and communication support—not accent imitation.

| ID | Ability | Hard prerequisites | Observable outcome |
|---|---|---|---|
| `PR-A1-ALPHABET-SPELLING-01` | Alphabet and spelling clarity | — | Spell names/basic words intelligibly and recognize spelled letters with support. |
| `PR-A1-WORD-STRESS-CORE-01` | Basic word-stress awareness | — | Place recognizable stress in frequent multi-syllable A1 words. |
| `PR-A1-NUMBERS-DATES-CLARITY-01` | Numbers/date pronunciation clarity | `VX-A1-NUMBERS-CORE-01`, `VX-A1-TIME-DATE-01` | Produce commonly confused numbers/times/dates clearly enough for transactions. |
| `PR-A1-GRAM-ENDINGS-S-01` | Audible plural / third-person `-s` endings | `GR-A1-NOUN-PLURAL-01`, `GR-A1-PRES-SIMPLE-3SG-01` | Produce common grammatical `-s` endings intelligibly. |
| `PR-A1-CONTRACTIONS-BE-01` | Common `be` contractions | `GR-A1-BE-AFFIRMATIVE-01`, `GR-A1-BE-NEGATIVE-01` | Recognize/produce frequent contractions in short natural utterances. |
| `PR-A1-SENT-STRESS-CORE-01` | Basic sentence stress | `GR-A1-SENT-WORDORDER-01` | Give key content words more prominence in short statements. |
| `PR-A1-QUESTION-INTONATION-01` | Basic question intonation | `GR-A1-BE-YESNOQ-01`, `GR-A1-PRES-SIMPLE-YESNOQ-01` | Produce understandable yes/no and common wh-question contours. |
| `PR-A1-CHUNKING-SHORT-01` | Chunking short connected utterances | `GR-A1-COORD-AND-BUT-01` | Group 2–3 short ideas into understandable speech chunks. |
| `PR-A1-SOUND-CLARITY-PERSONAL-01` | Personalized high-impact sound clarity | — | Improve learner-specific sound contrasts/errors that materially reduce intelligibility. |

### Personalized sound node rule

`PR-A1-SOUND-CLARITY-PERSONAL-01` is a family-level diagnostic node. The actual sound targets are selected from observed learner evidence rather than forcing the same accent-error list on every learner.

---

# 4. Listening nodes

Listening nodes represent transferable comprehension operations. Topics are scenario metadata rather than the skill itself.

| ID | Listening operation | Hard prerequisites | Observable outcome |
|---|---|---|---|
| `LS-A1-SPELLING-NAME-01` | Recognize spelled names/basic words | `VX-A1-PERSONAL-IDENTITY-01`, `PR-A1-ALPHABET-SPELLING-01` | Capture a slowly/clearly spelled familiar name or short word. |
| `LS-A1-NUMBER-DETAIL-01` | Identify number detail | `VX-A1-NUMBERS-CORE-01` | Extract a phone number, age or simple number from clear short speech. |
| `LS-A1-TIME-DATE-DETAIL-01` | Identify time/date detail | `VX-A1-TIME-DATE-01` | Extract a clearly stated time/day/date in a familiar context. |
| `LS-A1-PRICE-QUANTITY-DETAIL-01` | Identify price/quantity detail | `VX-A1-PRICE-QUANTITY-01` | Extract a simple price or quantity from a predictable exchange. |
| `LS-A1-SOCIAL-FORMULA-01` | Understand common social formulas | `VX-A1-SOCIAL-FORMULAS-01` | Recognize greeting/thanks/apology/closing intent in clear speech. |
| `LS-A1-SIMPLE-QA-01` | Understand a carefully delivered basic question/answer | `CF-A1-PERSONAL-INFO-QA-01`, `VX-A1-PERSONAL-IDENTITY-01` | Identify what personal fact is being asked or answered. |
| `LS-A1-INSTRUCTION-SHORT-01` | Follow a short simple instruction | `CF-A1-INSTRUCTION-GIVE-01`, `VX-A1-ACTION-VERBS-CORE-01` | Carry out/sequence one or two familiar instructions delivered clearly. |
| `LS-A1-LOCATION-DETAIL-01` | Identify simple location/direction detail | `CF-A1-LOCATION-ASKGIVE-01`, `VX-A1-LOCATION-DIRECTION-01` | Understand a basic location or short direction with support. |
| `LS-A1-DESCRIPTION-SHORT-01` | Understand a very short concrete description | `GR-A1-BE-AFFIRMATIVE-01`, `GR-A1-HAVE-POSSESSION-01`, `VX-A1-ADJECTIVES-CORE-01` | Pick out key familiar description details about a person/object/place. |
| `LS-A1-ROUTINE-DETAIL-01` | Identify routine detail | `CF-A1-ROUTINE-TALK-01`, `VX-A1-DAILY-ROUTINE-01` | Extract familiar activities/frequency from short clear routine speech. |

## 4.1 A1 listening delivery constraints

Early A1 scored listening should generally use:

- short duration;
- clear, cooperative speech;
- familiar vocabulary;
- limited distractor density;
- concrete contexts;
- deliberate control of numbers/names/spelling difficulty;
- replay/scaffolding rules appropriate to whether the task is learning or assessment.

Natural speed exposure may appear as unscored acclimatization before it is appropriate as scored evidence.

---

# 5. Speaking nodes

Speaking nodes represent communicative production, not just spoken grammar drills.

| ID | Speaking ability | Hard prerequisites | Observable outcome |
|---|---|---|---|
| `SP-A1-INTRODUCE-SELF-01` | Introduce self | `CF-A1-PERSONAL-INTRODUCE-01`, `VX-A1-PERSONAL-IDENTITY-01` | Give a brief understandable self-introduction without reading a full script. |
| `SP-A1-PERSONAL-QA-01` | Ask/answer basic personal questions | `CF-A1-PERSONAL-INFO-QA-01`, `VX-A1-PERSONAL-IDENTITY-01`, `VX-A1-COUNTRY-LANGUAGE-01`, `VX-A1-WORK-STUDY-01` | Exchange several simple personal facts with a cooperative interlocutor. |
| `SP-A1-DESCRIBE-PERSON-01` | Describe a familiar person | `CF-A1-DESCRIBE-PEOPLE-01`, `VX-A1-FAMILY-PEOPLE-01`, `VX-A1-ADJECTIVES-CORE-01` | Produce a short understandable person description. |
| `SP-A1-ROUTINE-01` | Talk about routine | `CF-A1-ROUTINE-TALK-01`, `VX-A1-DAILY-ROUTINE-01` | Give several short routine statements with basic frequency information. |
| `SP-A1-PREFERENCE-01` | Express a preference | `CF-A1-PREFERENCE-LIKES-01`, `VX-A1-PREFERENCE-CHUNKS-01` | State likes/dislikes and respond to a simple follow-up. |
| `SP-A1-LOCATION-01` | Ask/give simple location | `CF-A1-LOCATION-ASKGIVE-01`, `VX-A1-PLACES-TOWN-01`, `VX-A1-LOCATION-DIRECTION-01` | Complete a short location exchange. |
| `SP-A1-DESCRIBE-PLACE-01` | Describe a familiar place | `CF-A1-DESCRIBE-PLACE-01`, `VX-A1-HOME-OBJECTS-01`, `VX-A1-ADJECTIVES-CORE-01` | Produce several short statements about a room/home/local place. |
| `SP-A1-ABILITY-01` | Talk about ability | `CF-A1-ABILITY-TALK-01`, `VX-A1-ACTION-VERBS-CORE-01` | Say what self/others can/cannot do and ask a simple ability question. |
| `SP-A1-REQUEST-BASIC-01` | Make/respond to a basic request | `CF-A1-REQUEST-BASIC-01`, `VX-A1-SERVICE-REQUEST-CHUNKS-01` | Make a clear basic request and respond appropriately. |
| `SP-A1-ORDER-SERVICE-01` | Complete a basic order/service exchange | `CF-A1-TRANSACTION-ORDER-01`, `VX-A1-FOOD-DRINK-01`, `VX-A1-SERVICE-REQUEST-CHUNKS-01` | Order a familiar item/service in a predictable interaction. |
| `SP-A1-PRICE-EXCHANGE-01` | Ask/respond about price | `CF-A1-TRANSACTION-PRICE-01`, `VX-A1-PRICE-QUANTITY-01` | Ask how much something is and handle a simple price response. |
| `SP-A1-CLARIFY-REPAIR-01` | Repair a communication breakdown | `CF-A1-CLARIFY-REPEAT-01`, `VX-A1-CLARIFY-SURVIVAL-01` | Ask for repetition/clarification instead of abandoning the interaction. |
| `SP-A1-INSTRUCTION-01` | Give a short instruction | `CF-A1-INSTRUCTION-GIVE-01`, `VX-A1-ACTION-VERBS-CORE-01`, `VX-A1-LOCATION-DIRECTION-01` | Give one or more basic instructions/directions intelligibly. |
| `SP-A1-FOLLOWUP-BASIC-01` | Ask a simple follow-up | `SP-A1-PERSONAL-QA-01` | Extend a basic interaction with at least one relevant follow-up question. |
| `SP-A1-SHORTTALK-FAMILIAR-01` | Produce a short familiar-topic mini-talk | `SP-A1-INTRODUCE-SELF-01`, `SP-A1-ROUTINE-01`, `SP-A1-PREFERENCE-01` | Produce roughly 3–6 connected simple sentences on a highly familiar topic with support as needed. |

### Speaking evidence rule

A grammar or vocabulary node may contribute to speaking, but `SP` nodes are where the system records whether the learner can perform the communicative act in speech.

---

# 6. Reading nodes

| ID | Reading operation | Hard prerequisites | Observable outcome |
|---|---|---|---|
| `RD-A1-LAYOUT-CUES-01` | Use basic visual/layout cues | — | Use headings, icons, position and format to predict/locate simple information. |
| `RD-A1-SIGNS-LABELS-01` | Understand common signs/labels | `VX-A1-PLACES-TOWN-01`, `VX-A1-ACTION-VERBS-CORE-01` | Recognize the practical meaning of familiar short signs/labels. |
| `RD-A1-FORM-FIELDS-01` | Understand basic form fields | `VX-A1-PERSONAL-IDENTITY-01`, `VX-A1-NUMBERS-CORE-01` | Identify what information a simple form asks for. |
| `RD-A1-NAME-NUMBER-DETAIL-01` | Extract names/numbers | `VX-A1-PERSONAL-IDENTITY-01`, `VX-A1-NUMBERS-CORE-01` | Locate a familiar name, phone/room/order number or similar explicit detail. |
| `RD-A1-TIME-PRICE-DETAIL-01` | Extract time/date/price detail | `VX-A1-TIME-DATE-01`, `VX-A1-PRICE-QUANTITY-01` | Locate explicit practical details in a short text/display. |
| `RD-A1-SHORT-PERSONAL-MESSAGE-01` | Understand a very short personal message | `GR-A1-BE-AFFIRMATIVE-01`, `GR-A1-PRES-SIMPLE-AFF-01`, `VX-A1-SOCIAL-FORMULAS-01` | Understand the basic purpose and key familiar facts in a short message. |
| `RD-A1-MENU-SCHEDULE-01` | Use simple menus/schedules | `VX-A1-FOOD-DRINK-01`, `VX-A1-TIME-DATE-01` | Find a needed item/time/basic detail in predictable structured text. |
| `RD-A1-DESCRIPTION-SHORT-01` | Understand a short concrete description | `GR-A1-BE-AFFIRMATIVE-01`, `GR-A1-HAVE-POSSESSION-01`, `VX-A1-ADJECTIVES-CORE-01` | Pick out familiar descriptive details one phrase/sentence at a time. |
| `RD-A1-INSTRUCTION-SHORT-01` | Understand a short written instruction | `GR-A1-IMP-CORE-01`, `VX-A1-ACTION-VERBS-CORE-01` | Follow a very short familiar instruction/sequence. |

---

# 7. Writing nodes

| ID | Writing ability | Hard prerequisites | Observable outcome |
|---|---|---|---|
| `WR-A1-SPELL-PERSONAL-01` | Spell core personal information | `PR-A1-ALPHABET-SPELLING-01`, `VX-A1-PERSONAL-IDENTITY-01` | Write/spell name and familiar personal items accurately enough for forms/messages. |
| `WR-A1-FORM-PERSONAL-01` | Complete a simple personal-information form | `WR-A1-SPELL-PERSONAL-01`, `VX-A1-NUMBERS-CORE-01`, `VX-A1-TIME-DATE-01` | Enter common personal data into clear form fields. |
| `WR-A1-SIMPLE-SENTENCE-01` | Produce a basic complete sentence | `GR-A1-SENT-WORDORDER-01`, `GR-A1-PRON-SUBJECT-01` | Write an understandable basic clause using learned language. |
| `WR-A1-PUNCTUATION-BASIC-01` | Basic capitalization/end punctuation | `WR-A1-SIMPLE-SENTENCE-01` | Apply sentence-initial capitalization and common final punctuation reliably enough for short texts. |
| `WR-A1-SHORT-PERSONAL-MESSAGE-01` | Write a very short personal message | `WR-A1-SIMPLE-SENTENCE-01`, `VX-A1-SOCIAL-FORMULAS-01` | Write a brief greeting/information/closing message using simple language. |
| `WR-A1-DESCRIBE-SELF-01` | Write basic information about self | `WR-A1-SIMPLE-SENTENCE-01`, `CF-A1-PERSONAL-INTRODUCE-01`, `VX-A1-PERSONAL-IDENTITY-01` | Write several simple statements about personal facts. |
| `WR-A1-ROUTINE-SENTENCES-01` | Write simple routine statements | `WR-A1-SIMPLE-SENTENCE-01`, `GR-A1-PRES-SIMPLE-AFF-01`, `VX-A1-DAILY-ROUTINE-01` | Write a short group of routine sentences with familiar verbs. |
| `WR-A1-DESCRIBE-PLACE-01` | Write a simple place description | `WR-A1-SIMPLE-SENTENCE-01`, `GR-A1-THERE-ISARE-01`, `VX-A1-HOME-OBJECTS-01` | Write several concrete sentences about a familiar place. |
| `WR-A1-PREFERENCE-REASON-01` | Write a simple preference + reason | `WR-A1-SIMPLE-SENTENCE-01`, `CF-A1-REASON-SIMPLE-01`, `VX-A1-PREFERENCE-CHUNKS-01` | Extend a simple preference with one short reason. |

---

# 8. Cross-domain learning loops

The following are examples of how A1 lessons should integrate nodes instead of teaching seven disconnected subjects.

## 8.1 Personal introduction loop

```text
VX-A1-PERSONAL-IDENTITY-01
VX-A1-COUNTRY-LANGUAGE-01
GR-A1-BE-AFFIRMATIVE-01
GR-A1-POSS-ADJ-01
        ↓
CF-A1-PERSONAL-INTRODUCE-01
        ↓
SP-A1-INTRODUCE-SELF-01
RD-A1-FORM-FIELDS-01
WR-A1-DESCRIBE-SELF-01
LS-A1-SIMPLE-QA-01
        ↓
spontaneous self-introduction / personal Q&A evidence
```

## 8.2 Daily routine loop

```text
VX-A1-ACTION-VERBS-CORE-01
VX-A1-DAILY-ROUTINE-01
GR-A1-PRES-SIMPLE-AFF-01
GR-A1-ADV-FREQ-01
        ↓
CF-A1-ROUTINE-TALK-01
        ↓
SP-A1-ROUTINE-01
LS-A1-ROUTINE-DETAIL-01
WR-A1-ROUTINE-SENTENCES-01
        ↓
SP-A1-SHORTTALK-FAMILIAR-01
```

## 8.3 Location loop

```text
VX-A1-PLACES-TOWN-01
VX-A1-LOCATION-DIRECTION-01
GR-A1-THERE-ISARE-01
GR-A1-PREP-PLACE-01
        ↓
CF-A1-LOCATION-ASKGIVE-01
        ↓
SP-A1-LOCATION-01
LS-A1-LOCATION-DETAIL-01
RD-A1-SIGNS-LABELS-01
```

## 8.4 Service transaction loop

```text
VX-A1-SOCIAL-FORMULAS-01
VX-A1-SERVICE-REQUEST-CHUNKS-01
VX-A1-FOOD-DRINK-01
VX-A1-PRICE-QUANTITY-01
GR-A1-CAN-REQUESTPERM-01
        ↓
CF-A1-REQUEST-BASIC-01
CF-A1-TRANSACTION-ORDER-01
CF-A1-TRANSACTION-PRICE-01
        ↓
SP-A1-ORDER-SERVICE-01
SP-A1-PRICE-EXCHANGE-01
LS-A1-PRICE-QUANTITY-DETAIL-01
RD-A1-MENU-SCHEDULE-01
```

## 8.5 Communication repair loop

```text
VX-A1-CLARIFY-SURVIVAL-01
        ↓
CF-A1-CLARIFY-REPEAT-01
        ↓
SP-A1-CLARIFY-REPAIR-01
```

This repair ability should be taught early because it enables the learner to remain in English even when knowledge is incomplete.

---

# 9. Scenario tags for A1 content

The following are content/scenario tags, not primary skill nodes:

- self/personal details;
- family;
- home;
- routine;
- work/study identity;
- food/cafe;
- shopping;
- town/location;
- transport;
- time/appointments;
- weather;
- simple health need;
- basic online/personal messages.

A listening or reading skill should be tested across more than one scenario before being considered robust.

---

# 10. A1 integrated exit profile

A learner approaching completion of this A1 curriculum should be able, with a cooperative interlocutor and familiar contexts, to:

- introduce themselves and exchange basic personal information;
- understand carefully delivered simple questions/instructions;
- talk briefly about routine, likes, ability, people and familiar places;
- complete predictable basic requests/orders/location exchanges;
- ask for repetition/clarification rather than immediately switching language;
- extract names, numbers, times, dates, prices and simple details from short clear speech/text;
- read very short practical texts one phrase/sentence at a time;
- write forms, short messages and several simple sentences about matters of personal relevance;
- produce intelligible basic pronunciation for spelling, numbers, common word stress, grammatical endings and short utterance chunking.

This is an A1 proficiency boundary, not an IELTS score conversion. IELTS remains a later application/assessment layer.

---

# 11. Validation results

P0-CUR-003 nodes were validated together with all P0-CUR-002 A1 nodes.

New nodes in this task:

- Vocabulary: **22**
- Pronunciation: **9**
- Listening: **10**
- Speaking: **15**
- Reading: **9**
- Writing: **9**
- New total: **74**

Combined A1 design graph after P0-CUR-003:

- Previous Grammar + Functions: **50**
- New Vocabulary + Skills: **74**
- Combined candidate nodes: **124**

Programmatic graph checks:

- duplicate IDs: **0** — PASS
- missing hard prerequisite IDs: **0** — PASS
- circular hard-prerequisite chains: **0** — PASS
- full graph topological ordering: **124/124** — PASS

These checks validate structural consistency only. They do not yet prove content difficulty calibration, exercise quality, pronunciation-scoring accuracy, or mastery thresholds.

---

# 12. Remaining work before A1 is learner-ready

The A1 curriculum is now node-complete at the design level, but not yet content-complete or production-active.

Still required later:

- exact reviewed lexical item sets per vocabulary node;
- reviewed explanations/examples;
- reviewed core exercises;
- listening script/audio specifications and calibrated samples;
- reading passages/items;
- speaking prompts and rubric/evidence logic;
- pronunciation diagnostic/feedback implementation;
- mastery thresholds;
- spaced review integration;
- lesson-unit packaging;
- placement-test mapping;
- content QA before node lifecycle can move from `draft` toward `reviewed`/`active`.

## Exit result

P0-CUR-003 completes the **A1 node-level curriculum graph design** across Grammar, Vocabulary, Listening, Speaking, Reading, Writing, Pronunciation and Communicative Functions.

The next curriculum step should move to A2 rather than adding arbitrary extra A1 topics. Content production and mastery mechanics will be handled by their dedicated Phase 0 tasks.
