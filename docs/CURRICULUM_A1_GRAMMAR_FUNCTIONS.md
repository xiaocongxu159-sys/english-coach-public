# A1 Grammar + Communicative Functions Node Inventory

**Task:** P0-CUR-002  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Detailed A1 grammar/function baseline

## 1. Purpose

This document converts the A1 top-level curriculum taxonomy into a node-level prerequisite graph for:

- Grammar (`GR`)
- Communicative Functions (`CF`)

It is deliberately more detailed than a textbook table of contents. Each row is intended to become a schedulable/assessable knowledge node under `KNOWLEDGE_NODE_SCHEMA.md`.

The sequence is **product-designed**. CEFR provides the communicative ability target and English Profile research informs developmental plausibility, but neither is treated as a mandatory fixed grammar syllabus.

## 2. Design rules used here

1. A grammar node must represent a coherent teachable/assessable ability, not one quiz item.
2. A communicative-function node represents something the learner can actually do in communication.
3. Hard prerequisites must form an acyclic graph.
4. A function may depend on several grammar nodes, but grammar should not be taught only for the sake of grammar tests.
5. Formulaic language such as `I'd like...` or `Could you repeat that?` may support a function even before every internal grammar feature is analytically mastered.
6. Vocabulary dependencies are intentionally not hard-coded yet because the A1 lexical-node inventory is a later task.
7. American-English usage is the default teaching variety for examples, while learners should later be exposed to major international accents in listening.

---

# 3. Grammar nodes

## 3.1 Sentence foundation

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-SENT-WORDORDER-01` | Basic affirmative word order | — | Produce simple subject + verb + complement/object sentences. |
| `GR-A1-PRON-SUBJECT-01` | Subject pronouns | `GR-A1-SENT-WORDORDER-01` | Use I/you/he/she/it/we/they as sentence subjects. |
| `GR-A1-PRON-OBJECT-01` | Object pronouns | `GR-A1-PRON-SUBJECT-01`, `GR-A1-SENT-WORDORDER-01` | Use common object pronouns in simple sentences. |

## 3.2 `be`

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-BE-AFFIRMATIVE-01` | Present `be` affirmative | `GR-A1-SENT-WORDORDER-01`, `GR-A1-PRON-SUBJECT-01` | State identity, description and location with am/is/are. |
| `GR-A1-BE-NEGATIVE-01` | Present `be` negative | `GR-A1-BE-AFFIRMATIVE-01` | Negate simple identity/description/location statements. |
| `GR-A1-BE-YESNOQ-01` | `be` yes/no questions | `GR-A1-BE-AFFIRMATIVE-01` | Ask and answer simple yes/no questions with `be`. |
| `GR-A1-BE-WHQ-01` | `be` wh-questions | `GR-A1-BE-YESNOQ-01` | Ask common who/what/where/how questions using `be`. |

## 3.3 Nouns, determiners and possession

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-NOUN-PLURAL-01` | Singular/plural nouns | `GR-A1-SENT-WORDORDER-01` | Distinguish and produce common singular/plural forms. |
| `GR-A1-DET-ARTICLE-INDEF-01` | `a/an` with common singular count nouns | `GR-A1-NOUN-PLURAL-01` | Use `a/an` in frequent identity/description contexts. |
| `GR-A1-DET-ARTICLE-DEF-BASIC-01` | Basic high-frequency `the` use | `GR-A1-DET-ARTICLE-INDEF-01` | Use `the` in highly concrete shared/specified contexts without claiming full article mastery. |
| `GR-A1-DET-DEMONSTRATIVE-01` | this/that/these/those | `GR-A1-NOUN-PLURAL-01` | Point out and identify nearby/distant items. |
| `GR-A1-POSS-ADJ-01` | Possessive adjectives | `GR-A1-PRON-SUBJECT-01` | Use my/your/his/her/its/our/their in basic descriptions. |
| `GR-A1-POSS-GENITIVE-S-01` | Basic possessive `'s` | `GR-A1-POSS-ADJ-01`, `GR-A1-NOUN-PLURAL-01` | Express simple ownership/relationships such as `Maria's bag`. |
| `GR-A1-HAVE-POSSESSION-01` | `have` for possession/basic features | `GR-A1-PRON-SUBJECT-01`, `GR-A1-SENT-WORDORDER-01` | Say what people have and describe simple features. |

## 3.4 Adjectives and degree

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-ADJ-POSITION-01` | Common adjective position | `GR-A1-BE-AFFIRMATIVE-01` | Use common adjectives after `be` and before nouns in basic patterns. |
| `GR-A1-ADV-VERY-01` | `very + adjective` | `GR-A1-ADJ-POSITION-01` | Intensify common descriptions simply. |

## 3.5 Present simple

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-PRES-SIMPLE-AFF-01` | Present simple affirmative | `GR-A1-SENT-WORDORDER-01`, `GR-A1-PRON-SUBJECT-01` | Talk about routines, common facts, likes and regular activities. |
| `GR-A1-PRES-SIMPLE-3SG-01` | Third-person singular `-s` | `GR-A1-PRES-SIMPLE-AFF-01` | Produce common he/she/it present-simple forms. |
| `GR-A1-PRES-SIMPLE-NEG-01` | Present simple negative | `GR-A1-PRES-SIMPLE-AFF-01` | Use don't/doesn't in familiar contexts. |
| `GR-A1-PRES-SIMPLE-YESNOQ-01` | Present simple yes/no questions | `GR-A1-PRES-SIMPLE-NEG-01` | Ask/answer routine factual questions with do/does. |
| `GR-A1-PRES-SIMPLE-WHQ-01` | Present simple wh-questions | `GR-A1-PRES-SIMPLE-YESNOQ-01` | Ask common questions about routine, work, place and preference. |
| `GR-A1-ADV-FREQ-01` | Basic adverbs of frequency | `GR-A1-PRES-SIMPLE-AFF-01` | Use always/usually/often/sometimes/never in common routine statements. |

## 3.6 Present continuous and present-time contrast

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-PRES-CONT-AFF-01` | Present continuous affirmative | `GR-A1-BE-AFFIRMATIVE-01` | Describe visible/current actions with `be + -ing`. |
| `GR-A1-PRES-CONT-NEGQ-01` | Present continuous negative/questions | `GR-A1-PRES-CONT-AFF-01`, `GR-A1-BE-YESNOQ-01` | Ask about and negate current actions. |
| `GR-A1-PRES-SIMPLE-VS-CONT-01` | Routine vs happening now | `GR-A1-PRES-SIMPLE-AFF-01`, `GR-A1-PRES-CONT-AFF-01` | Make a basic distinction between habitual and current action. |

## 3.7 Location, quantity and prepositions

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-THERE-ISARE-01` | `there is/there are` | `GR-A1-BE-AFFIRMATIVE-01`, `GR-A1-NOUN-PLURAL-01` | State that people/things exist in a place. |
| `GR-A1-DET-SOMEANY-BASIC-01` | Introductory `some/any` | `GR-A1-THERE-ISARE-01`, `GR-A1-NOUN-PLURAL-01` | Use `some/any` in frequent concrete affirmative/question/negative patterns with scaffolding. |
| `GR-A1-PREP-PLACE-01` | Basic place prepositions | `GR-A1-SENT-WORDORDER-01` | Express simple location relationships such as in/on/under/next to. |
| `GR-A1-PREP-TIME-01` | Basic time prepositions | `GR-A1-SENT-WORDORDER-01` | Use common at/on/in time expressions in high-frequency contexts. |

## 3.8 Modality, requests and instructions

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-CAN-ABILITY-01` | `can/can't` for ability | `GR-A1-SENT-WORDORDER-01`, `GR-A1-PRON-SUBJECT-01` | State simple abilities/non-abilities and ask about them. |
| `GR-A1-CAN-REQUESTPERM-01` | `can` for basic requests/permission | `GR-A1-CAN-ABILITY-01` | Make basic requests or permission questions with appropriate support. |
| `GR-A1-IMP-CORE-01` | Basic imperatives | `GR-A1-SENT-WORDORDER-01` | Give/follow short instructions such as `Open the door` or `Turn left`. |

## 3.9 Linking ideas

| ID | Concept | Hard prerequisites | A1 productive outcome |
|---|---|---|---|
| `GR-A1-COORD-AND-BUT-01` | Link simple ideas with `and/but/or` | `GR-A1-SENT-WORDORDER-01` | Combine two short ideas instead of producing only isolated sentences. |
| `GR-A1-COORD-BECAUSE-01` | Basic reason with `because` | `GR-A1-COORD-AND-BUT-01`, `GR-A1-PRES-SIMPLE-AFF-01` | Give a short reason for a preference/fact in familiar contexts. |

---

# 4. Communicative-function nodes

| ID | Communicative ability | Hard prerequisites | Observable A1 outcome |
|---|---|---|---|
| `CF-A1-SOCIAL-GREET-01` | Greet, respond and close | — | Open/close a basic interaction appropriately using common formulas. |
| `CF-A1-PERSONAL-INTRODUCE-01` | Introduce self/another person | `GR-A1-BE-AFFIRMATIVE-01`, `GR-A1-POSS-ADJ-01` | Give name, identity and a few basic facts in connected short utterances. |
| `CF-A1-PERSONAL-INFO-QA-01` | Exchange basic personal information | `GR-A1-BE-WHQ-01`, `GR-A1-PRES-SIMPLE-WHQ-01` | Ask/answer name, origin, work/study, home and routine questions. |
| `CF-A1-DESCRIBE-PEOPLE-01` | Describe a person simply | `GR-A1-BE-AFFIRMATIVE-01`, `GR-A1-HAVE-POSSESSION-01`, `GR-A1-ADJ-POSITION-01` | Give a short description using identity, features and common adjectives. |
| `CF-A1-ROUTINE-TALK-01` | Talk about a daily routine | `GR-A1-PRES-SIMPLE-AFF-01`, `GR-A1-ADV-FREQ-01` | Give several ordered statements about routine and frequency. |
| `CF-A1-PREFERENCE-LIKES-01` | Express likes/dislikes | `GR-A1-PRES-SIMPLE-AFF-01` | State a preference and answer a simple follow-up. |
| `CF-A1-LOCATION-ASKGIVE-01` | Ask/give basic location | `GR-A1-BE-WHQ-01`, `GR-A1-THERE-ISARE-01`, `GR-A1-PREP-PLACE-01` | Ask where something is and give a short understandable location answer. |
| `CF-A1-DESCRIBE-PLACE-01` | Describe a familiar place | `GR-A1-THERE-ISARE-01`, `GR-A1-PREP-PLACE-01`, `GR-A1-ADJ-POSITION-01` | Produce a short description of a room/home/local place. |
| `CF-A1-ABILITY-TALK-01` | Talk about abilities | `GR-A1-CAN-ABILITY-01` | Say what self/others can or cannot do and ask a basic ability question. |
| `CF-A1-REQUEST-BASIC-01` | Make/respond to a basic request | `GR-A1-CAN-REQUESTPERM-01` | Ask for a simple action/item and respond appropriately. |
| `CF-A1-INSTRUCTION-GIVE-01` | Give/follow a short instruction | `GR-A1-IMP-CORE-01` | Produce and understand a short sequence of familiar instructions. |
| `CF-A1-CLARIFY-REPEAT-01` | Ask for repetition/clarification | — | Use survival phrases to keep communication going when something is not understood. |
| `CF-A1-TIME-SCHEDULE-BASIC-01` | Ask/tell basic time and schedule information | `GR-A1-PREP-TIME-01`, `GR-A1-BE-WHQ-01`, `GR-A1-PRES-SIMPLE-WHQ-01` | Ask/answer when something happens and give basic time/date information. |
| `CF-A1-TRANSACTION-ORDER-01` | Order/request a simple item/service | `CF-A1-REQUEST-BASIC-01` | Complete a short predictable order/purchase exchange with formulaic support. |
| `CF-A1-TRANSACTION-PRICE-01` | Ask/understand basic price | `GR-A1-BE-WHQ-01`, `GR-A1-DET-DEMONSTRATIVE-01` | Ask how much a concrete item is and understand/respond to a simple price. |
| `CF-A1-REASON-SIMPLE-01` | Give a simple reason | `GR-A1-COORD-BECAUSE-01` | Extend a basic answer with one understandable reason. |

---

# 5. Recommended curriculum waves

The graph is authoritative for prerequisites; the waves below are a **recommended packaging order**, not an immutable lesson list.

## Wave A1.1 — Survival and identity

Focus:

- greetings/repair phrases;
- subject pronouns;
- `be` affirmative/negative/questions;
- basic sentence order;
- introductions and personal information.

High-value functions:

- `CF-A1-SOCIAL-GREET-01`
- `CF-A1-CLARIFY-REPEAT-01`
- `CF-A1-PERSONAL-INTRODUCE-01`

## Wave A1.2 — People, things and possession

Focus:

- nouns/plurals;
- a/an and introductory `the`;
- demonstratives;
- possessive adjectives / possessive `'s`;
- `have`;
- adjectives.

High-value function:

- `CF-A1-DESCRIBE-PEOPLE-01`

## Wave A1.3 — Routine and preference

Focus:

- present simple;
- third-person singular;
- negatives/questions;
- frequency;
- basic linking.

High-value functions:

- `CF-A1-ROUTINE-TALK-01`
- `CF-A1-PREFERENCE-LIKES-01`
- later `CF-A1-REASON-SIMPLE-01`

## Wave A1.4 — What is happening / where things are

Focus:

- present continuous;
- routine vs now;
- `there is/are`;
- place prepositions;
- introductory some/any.

High-value functions:

- `CF-A1-LOCATION-ASKGIVE-01`
- `CF-A1-DESCRIBE-PLACE-01`

## Wave A1.5 — Ability, requests and actions

Focus:

- `can/can't`;
- basic request/permission use;
- imperatives.

High-value functions:

- `CF-A1-ABILITY-TALK-01`
- `CF-A1-REQUEST-BASIC-01`
- `CF-A1-INSTRUCTION-GIVE-01`

## Wave A1.6 — Time and simple transactions

Focus:

- time prepositions;
- integrated `be` and present-simple questions;
- demonstratives + price;
- formulaic service language.

High-value functions:

- `CF-A1-TIME-SCHEDULE-BASIC-01`
- `CF-A1-TRANSACTION-ORDER-01`
- `CF-A1-TRANSACTION-PRICE-01`

## Wave A1.7 — Integration

Focus:

- combine previously learned forms;
- give 3–6 connected sentences on highly familiar topics;
- ask a follow-up question;
- repair misunderstandings;
- reuse language without a visible grammar prompt.

This wave should generate evidence for spontaneous reuse but should not invent new A2 structures just to make the lesson harder.

---

# 6. Cross-skill expectations

Grammar/function nodes must later link to Vocabulary, Listening, Speaking, Reading, Writing and Pronunciation nodes.

Examples:

```text
GR-A1-PRES-SIMPLE-AFF-01
  + GR-A1-ADV-FREQ-01
  + future A1 routine lexical nodes
        ↓
CF-A1-ROUTINE-TALK-01
        ↓
future SP-A1-ROUTINE-SHORTTALK-01
future LS-A1-DETAIL-ROUTINE-01
future WR-A1-ROUTINE-SENTENCES-01
```

```text
GR-A1-THERE-ISARE-01
  + GR-A1-PREP-PLACE-01
        ↓
CF-A1-LOCATION-ASKGIVE-01
        ↓
future speaking + listening location tasks
```

The future skill-node IDs above are illustrative placeholders and are **not active nodes yet**.

---

# 7. A1 boundary decisions

The following are intentionally deferred primarily to A2 or later rather than forcing too much grammar into A1:

- systematic past simple;
- comparatives/superlatives as a full system;
- future forms as a system;
- present perfect;
- full article-system accuracy;
- broad countability/quantifier system;
- relative clauses;
- first conditional;
- broad gerund/infinitive patterns;
- passive/reporting structures.

Learners may encounter formulaic examples of later language in real content, but these do not become scored A1 grammar nodes unless separately approved.

---

# 8. Validation results

The P0-CUR-002 baseline was checked programmatically against the declared prerequisite graph.

Results:

- Grammar nodes: **34**
- Communicative-function nodes: **16**
- Total nodes: **50**
- Duplicate IDs: **0**
- Missing hard prerequisite IDs inside this inventory: **0**
- Circular hard-prerequisite chains: **0**
- All 50 nodes can be topologically ordered: **PASS**

This validation proves graph consistency only. It does **not** claim the nodes are already learner-ready content. Before activation, each node still needs the examples, exercises, skill links, review metadata and curriculum review required by `KNOWLEDGE_NODE_SCHEMA.md`.

# 9. Exit check for P0-CUR-002

This task is complete when:

- A1 grammar is represented as stable candidate nodes;
- A1 communicative functions are represented as stable candidate nodes;
- hard prerequisites resolve;
- graph is acyclic;
- boundaries with A2 are documented;
- the next task can build A1 vocabulary/skill nodes without redefining the grammar foundation.

All conditions above are satisfied for this draft baseline.
