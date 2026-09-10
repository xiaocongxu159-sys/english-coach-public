# B2 Grammar + Communicative Functions Node Inventory

**Task:** P0-CUR-006A  
**Version:** v1.0-draft  
**Date:** 2026-09-01  
**Status:** Detailed B2 grammar/function baseline

## 1. Purpose

This document extends the validated A1→B1 graph into B2 Grammar (`GR`) and Communicative Functions (`CF`).

B2 targets effective independent communication: understanding the main ideas of more complex concrete and abstract material, interacting with greater fluency/spontaneity, producing clear detailed language, and explaining/defending viewpoints with advantages and disadvantages. It is not treated as C1: highly sophisticated precision, dense abstraction and near-effortless flexibility remain later goals.

---

# 2. Grammar nodes

## 2.1 Tense and aspect integration

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-PERF-CONT-PRESENT-01` | Present perfect continuous | `GR-B1-PERF-SINCEFOR-01`, `GR-A1-PRES-CONT-AFF-01` |
| `GR-B2-PERF-SIMPLE-VS-CONT-01` | Present perfect simple vs continuous | `GR-B2-PERF-CONT-PRESENT-01`, `GR-B1-PERF-VS-PAST-01` |
| `GR-B2-PAST-PERF-CONSOLIDATE-01` | Past perfect consolidation | `GR-B1-PAST-PERF-INTRO-01` |
| `GR-B2-PAST-PERF-CONT-INTRO-01` | Past perfect continuous introduction | `GR-B2-PAST-PERF-CONSOLIDATE-01`, `GR-B2-PERF-CONT-PRESENT-01` |
| `GR-B2-NARRATIVE-TENSE-INTEGRATION-01` | Narrative tense integration | `GR-B1-PAST-NARRATIVE-CONSOLIDATE-01`, `GR-B2-PAST-PERF-CONSOLIDATE-01` |
| `GR-B2-FUT-CONTINUOUS-01` | Future continuous | `GR-B1-FUT-FORMS-CONSOLIDATE-01` |
| `GR-B2-FUT-PERFECT-INTRO-01` | Future perfect introduction | `GR-B2-FUT-CONTINUOUS-01`, `GR-B1-PERF-EXPERIENCE-CONSOLIDATE-01` |
| `GR-B2-FUTURE-INTEGRATION-01` | Future-form integration | `GR-B1-FUT-FORMS-CONSOLIDATE-01`, `GR-B2-FUT-CONTINUOUS-01`, `GR-B2-FUT-PERFECT-INTRO-01` |

## 2.2 Conditionals, wishes and hypothetical meaning

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-COND-SECOND-CONSOLIDATE-01` | Second conditional consolidation | `GR-B1-COND-SECOND-CORE-01` |
| `GR-B2-COND-THIRD-CORE-01` | Third conditional core | `GR-B2-COND-SECOND-CONSOLIDATE-01`, `GR-B2-PAST-PERF-CONSOLIDATE-01` |
| `GR-B2-COND-MIXED-INTRO-01` | Mixed conditional introduction | `GR-B2-COND-THIRD-CORE-01` |
| `GR-B2-COND-PROVIDED-ASLONGAS-01` | `provided/providing/as long as` | `GR-B1-LINK-UNLESS-01` |
| `GR-B2-COND-INCASE-01` | `in case` | `GR-B1-COND-FIRST-CONSOLIDATE-01` |
| `GR-B2-WISH-PAST-REGRET-01` | Wish/regret about past | `GR-B1-WISH-PRESENT-INTRO-01`, `GR-B2-COND-THIRD-CORE-01` |
| `GR-B2-IFONLY-INTRO-01` | `if only` introduction | `GR-B2-WISH-PAST-REGRET-01` |

## 2.3 Modal nuance and past modality

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-MODAL-DEDUCTION-PRESENT-CONSOLIDATE-01` | Present deduction consolidation | `GR-B1-MODAL-DEDUCTION-PRESENT-INTRO-01` |
| `GR-B2-MODAL-DEDUCTION-PAST-01` | Past deduction | `GR-B2-MODAL-DEDUCTION-PRESENT-CONSOLIDATE-01`, `GR-B2-PAST-PERF-CONSOLIDATE-01` |
| `GR-B2-MODAL-PAST-POSSIBILITY-01` | Past possibility | `GR-B1-MODAL-POSSIBILITY-01`, `GR-B2-PAST-PERF-CONSOLIDATE-01` |
| `GR-B2-MODAL-SHOULDHAVE-01` | Past advice/criticism with `should have` | `GR-B1-MODAL-ADVICE-EXPANDED-01`, `GR-B2-PAST-PERF-CONSOLIDATE-01` |
| `GR-B2-MODAL-NEEDNT-DIDNTHAVETO-01` | Past/current necessity contrasts | `GR-B1-MODAL-OBLIGATION-CONSOLIDATE-01` |
| `GR-B2-MODAL-NUANCE-CERTAINTY-01` | Certainty/probability nuance | `GR-B2-MODAL-DEDUCTION-PRESENT-CONSOLIDATE-01`, `GR-B2-MODAL-PAST-POSSIBILITY-01` |

## 2.4 Expanded passive

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-PASSIVE-CONTINUOUS-01` | Continuous passive | `GR-B1-PASSIVE-PRESENT-01`, `GR-A1-PRES-CONT-AFF-01` |
| `GR-B2-PASSIVE-PERFECT-01` | Perfect passive | `GR-B1-PASSIVE-PRESENT-01`, `GR-B1-PERF-EXPERIENCE-CONSOLIDATE-01` |
| `GR-B2-PASSIVE-MODAL-01` | Modal passive | `GR-B1-PASSIVE-PRESENT-01`, `GR-B1-MODAL-POSSIBILITY-01` |
| `GR-B2-PASSIVE-IMPERS-INTRO-01` | Introductory impersonal reporting passive | `GR-B2-PASSIVE-PERFECT-01`, `GR-B1-NOUNCLAUSE-THAT-01` |
| `GR-B2-PASSIVE-INTEGRATION-01` | Active/passive integration | `GR-B1-PASSIVE-USE-CONTRAST-01`, `GR-B2-PASSIVE-CONTINUOUS-01`, `GR-B2-PASSIVE-PERFECT-01`, `GR-B2-PASSIVE-MODAL-01` |

## 2.5 Expanded reported speech

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-REPORTED-BACKSHIFT-CONSOLIDATE-01` | Backshift consolidation | `GR-B1-REPORTED-STATEMENTS-INTRO-01` |
| `GR-B2-REPORTED-QUESTIONS-CONSOLIDATE-01` | Reported questions consolidation | `GR-B1-REPORTED-QUESTIONS-INTRO-01` |
| `GR-B2-REPORTED-COMMANDREQUEST-01` | Reported commands/requests | `GR-B1-VERB-OBJECT-INFINITIVE-01`, `GR-B2-REPORTED-BACKSHIFT-CONSOLIDATE-01` |
| `GR-B2-REPORTING-VERBS-INTRO-01` | Broader reporting verbs | `GR-B1-REPORTED-SAYTELL-01`, `GR-B1-GERUND-INFINITIVE-EXPANDED-01` |
| `GR-B2-REPORTED-INTEGRATION-01` | Integrated reporting | `GR-B2-REPORTED-BACKSHIFT-CONSOLIDATE-01`, `GR-B2-REPORTED-QUESTIONS-CONSOLIDATE-01`, `GR-B2-REPORTED-COMMANDREQUEST-01` |

## 2.6 Relative and participle structures

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-RELATIVE-NONDEFINING-CONSOLIDATE-01` | Non-defining relatives consolidation | `GR-B1-RELATIVE-NONDEFINING-INTRO-01` |
| `GR-B2-RELATIVE-OMISSION-01` | Relative-pronoun omission | `GR-B1-RELATIVE-DEFINING-CONSOLIDATE-01` |
| `GR-B2-RELATIVE-PREPOSITION-01` | Relative clauses with prepositions | `GR-B2-RELATIVE-NONDEFINING-CONSOLIDATE-01` |
| `GR-B2-PARTICIPLE-CLAUSE-ING-INTRO-01` | Selected `-ing` participle clauses | `GR-B2-RELATIVE-OMISSION-01`, `GR-B1-ADJ-EDING-CONTRAST-01` |
| `GR-B2-PARTICIPLE-CLAUSE-ED-INTRO-01` | Selected `-ed` participle clauses | `GR-B2-PARTICIPLE-CLAUSE-ING-INTRO-01`, `GR-B1-PASSIVE-PRESENT-01` |

## 2.7 Verb patterns, causative and dependent prepositions

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-GERUND-INFINITIVE-MEANING-01` | Meaning-changing gerund/infinitive patterns | `GR-B1-GERUND-INFINITIVE-EXPANDED-01` |
| `GR-B2-CAUSATIVE-HAVEGET-01` | `have/get something done` | `GR-B1-PASSIVE-PRESENT-01`, `GR-B1-VERB-OBJECT-INFINITIVE-01` |
| `GR-B2-DEPENDENT-PREPOSITIONS-01` | Common dependent prepositions | `GR-B1-GERUND-INFINITIVE-EXPANDED-01` |
| `GR-B2-VERB-PATTERN-INTEGRATION-01` | Verb-pattern integration | `GR-B2-GERUND-INFINITIVE-MEANING-01`, `GR-B2-DEPENDENT-PREPOSITIONS-01` |

## 2.8 Articles, determiners and substitution

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-ARTICLE-ABSTRACT-GENERAL-01` | General/abstract article contrasts | `GR-B1-ARTICLE-SYSTEMATIC-CORE-01` |
| `GR-B2-ARTICLE-INSTITUTION-GEOGRAPHY-01` | High-value institution/geography patterns | `GR-B1-ARTICLE-SYSTEMATIC-CORE-01` |
| `GR-B2-DETERMINER-FEW-LITTLE-NUANCE-01` | `few/a few`, `little/a little` nuance | `GR-A2-QUANT-AFEWALITTLE-01` |
| `GR-B2-DETERMINER-ALL-WHOLE-01` | `all/whole` | `GR-B1-QUANT-EACH-EVERY-01` |
| `GR-B2-REFERENCE-ONEONES-01` | `one/ones` substitution | `GR-B1-DETERMINER-OTHER-ANOTHER-01` |
| `GR-B2-SUBSTITUTION-SO-NEITHER-01` | `so/neither` substitution | `GR-B1-QUESTION-TAGS-CORE-01` |

## 2.9 Discourse linking

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-LINK-DESPITE-INSPITEOF-01` | `despite/in spite of` | `GR-B1-LINK-ALTHOUGH-EVEN-THOUGH-01` |
| `GR-B2-LINK-WHEREAS-01` | `whereas` | `GR-B1-LINK-WHILE-CONTRAST-01` |
| `GR-B2-LINK-NEVERTHELESS-01` | `nevertheless` | `GR-B1-LINK-HOWEVER-INTRO-01` |
| `GR-B2-LINK-THEREFORE-CONSEQUENTLY-01` | `therefore/consequently` | `GR-B1-LINK-BECAUSEOF-DUETO-01` |
| `GR-B2-LINK-INADDITION-MOREOVER-01` | `in addition/moreover` | `GR-B1-LINK-HOWEVER-INTRO-01` |
| `GR-B2-LINK-ONONEHAND-OTHERHAND-01` | `on the one hand/on the other hand` | `GR-B1-LINK-WHILE-CONTRAST-01` |
| `GR-B2-LINK-REGARDLESS-EVENIF-INTRO-01` | Introductory `regardless/even if` | `GR-B2-LINK-DESPITE-INSPITEOF-01`, `GR-B2-COND-SECOND-CONSOLIDATE-01` |
| `GR-B2-CAUSE-PURPOSE-RESULT-INTEGRATION-01` | Cause/purpose/result integration | `GR-B1-PURPOSE-TO-SOTHAT-01`, `GR-B1-RESULT-SO-SUCH-INTRO-01`, `GR-B2-LINK-THEREFORE-CONSEQUENTLY-01` |

## 2.10 Comparison and degree

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-COMP-THEMORE-THEMORE-01` | Correlative comparison | `GR-B1-COMP-ASAS-01`, `GR-B1-COMP-MODIFIERS-01` |
| `GR-B2-COMP-BYFAR-NOWHERENEAR-01` | Strong comparative modifiers | `GR-B1-COMP-MODIFIERS-01`, `GR-B1-COMP-LESSLEAST-01` |
| `GR-B2-DEGREE-QUITE-RATHER-FAIRLY-01` | Degree nuance | `GR-A2-ADV-DEGREE-CORE-01` |
| `GR-B2-DEGREE-SO-SUCH-ENOUGH-INTEGRATION-01` | Degree/result integration | `GR-B1-RESULT-SO-SUCH-INTRO-01`, `GR-B1-QUANT-ENOUGH-OF-01` |

## 2.11 Noun phrases and stance

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-NOUNPHRASE-MODIFICATION-01` | Expanded noun-phrase modification | `GR-B1-RELATIVE-DEFINING-CONSOLIDATE-01`, `GR-B1-ARTICLE-SYSTEMATIC-CORE-01` |
| `GR-B2-NOMINALIZATION-INTRO-01` | Introductory nominalization | `GR-B2-NOUNPHRASE-MODIFICATION-01`, `GR-B1-NOUNCLAUSE-THAT-01` |
| `GR-B2-STANCE-SEEM-APPEAR-01` | `seem/appear` stance | `GR-B1-NOUNCLAUSE-THAT-01`, `GR-B1-MODAL-POSSIBILITY-01` |
| `GR-B2-STANCE-LIKELY-UNLIKELY-01` | `likely/unlikely` | `GR-B2-STANCE-SEEM-APPEAR-01` |
| `GR-B2-HEDGING-TEND-TO-01` | `tend to` and basic hedging | `GR-B2-STANCE-SEEM-APPEAR-01`, `GR-B1-ADJ-INFINITIVE-01` |

## 2.12 Emphasis and embedded structures

| ID | Concept | Hard prerequisites |
|---|---|---|
| `GR-B2-CLEFT-IT-INTRO-01` | Introductory `It is/was ... that/who` cleft | `GR-B1-RELATIVE-DEFINING-CONSOLIDATE-01`, `GR-B1-NOUNCLAUSE-THAT-01` |
| `GR-B2-CLEFT-WHAT-INTRO-01` | Introductory `What ... is ...` cleft | `GR-B2-CLEFT-IT-INTRO-01` |
| `GR-B2-EMPHATIC-DO-01` | Emphatic `do` | `GR-A1-PRES-SIMPLE-AFF-01`, `GR-A2-PAST-SIMPLE-IRREG-AFF-01` |
| `GR-B2-QUESTION-EMBEDDED-CONSOLIDATE-01` | Embedded-question consolidation | `GR-B1-INDIRECT-Q-WORDORDER-01`, `GR-B1-NOUNCLAUSE-WHETHERIF-INTRO-01` |

---

# 3. Communicative Function nodes

| ID | Communicative ability | Hard prerequisites |
|---|---|---|
| `CF-B2-OPINION-DEVELOP-01` | Develop a viewpoint with multiple supporting points | `CF-B1-OPINION-SUPPORT-01`, `GR-B2-LINK-INADDITION-MOREOVER-01` |
| `CF-B2-ARGUE-VIEWPOINT-01` | Present and defend a viewpoint | `CF-B2-OPINION-DEVELOP-01`, `GR-B2-LINK-NEVERTHELESS-01` |
| `CF-B2-COUNTERARGUMENT-01` | Respond to a counterargument | `CF-B2-ARGUE-VIEWPOINT-01`, `GR-B2-LINK-DESPITE-INSPITEOF-01` |
| `CF-B2-PROS-CONS-DEVELOP-01` | Develop advantages/disadvantages | `CF-B1-ADVANTAGE-DISADVANTAGE-BASIC-01`, `GR-B2-LINK-ONONEHAND-OTHERHAND-01` |
| `CF-B2-QUALIFY-STANCE-01` | Qualify/soften a stance | `CF-B2-OPINION-DEVELOP-01`, `GR-B2-STANCE-LIKELY-UNLIKELY-01` |
| `CF-B2-SPECULATE-DEDUCE-01` | Speculate/deduce from evidence | `CF-B1-SPECULATE-LIMITED-01`, `GR-B2-MODAL-DEDUCTION-PRESENT-CONSOLIDATE-01` |
| `CF-B2-HYPOTHESIZE-CONSEQUENCE-01` | Discuss hypothetical consequence | `GR-B2-COND-THIRD-CORE-01`, `CF-B1-EXPLAIN-REASON-CONSEQUENCE-01` |
| `CF-B2-PAST-REGRET-REFLECT-01` | Reflect on alternative past outcomes | `GR-B2-WISH-PAST-REGRET-01`, `GR-B2-MODAL-SHOULDHAVE-01` |
| `CF-B2-EVALUATE-OPTIONS-01` | Evaluate options using criteria | `CF-B1-COMPARE-RECOMMEND-01`, `GR-B2-COMP-BYFAR-NOWHERENEAR-01` |
| `CF-B2-NEGOTIATE-DEVELOPED-01` | Negotiate a developed solution | `CF-B1-NEGOTIATE-ROUTINE-01`, `CF-B2-QUALIFY-STANCE-01` |
| `CF-B2-PERSUADE-01` | Persuade with reasons/evaluation | `CF-B2-ARGUE-VIEWPOINT-01`, `CF-B2-EVALUATE-OPTIONS-01` |
| `CF-B2-DISCUSSION-ACTIVE-01` | Take active part in familiar discussion | `CF-B1-SOCIAL-CONVERSATION-UNPREPARED-01`, `CF-B2-OPINION-DEVELOP-01` |
| `CF-B2-DISCUSSION-TURN-01` | Manage/extend discussion turns | `CF-B2-DISCUSSION-ACTIVE-01`, `CF-B1-FOLLOWUP-EXTEND-01` |
| `CF-B2-CLARIFY-NUANCE-01` | Clarify a nuanced point | `CF-B1-CLARIFY-REFORMULATE-01`, `CF-B2-QUALIFY-STANCE-01` |
| `CF-B2-SUMMARIZE-EXTENDED-01` | Summarize extended straightforward material | `CF-B1-SUMMARIZE-SIMPLE-01`, `CF-B2-OPINION-DEVELOP-01` |
| `CF-B2-SYNTHESIZE-TWO-SOURCES-INTRO-01` | Introductory synthesis of two sources | `CF-B2-SUMMARIZE-EXTENDED-01` |
| `CF-B2-PRESENTATION-DETAILED-01` | Give a clear detailed presentation | `CF-B1-PRESENTATION-SHORT-STRUCTURED-01`, `CF-B2-OPINION-DEVELOP-01` |
| `CF-B2-PRESENTATION-QA-01` | Handle presentation Q&A | `CF-B2-PRESENTATION-DETAILED-01`, `CF-B2-CLARIFY-NUANCE-01` |
| `CF-B2-MEETING-PARTICIPATE-ACTIVE-01` | Participate actively in routine professional discussion | `CF-B1-MEETING-SUGGEST-RESPOND-01`, `CF-B2-DISCUSSION-ACTIVE-01` |
| `CF-B2-MEETING-PROPOSAL-DEFEND-01` | Present/defend a proposal | `CF-B2-MEETING-PARTICIPATE-ACTIVE-01`, `CF-B2-PERSUADE-01` |
| `CF-B2-WORK-EXPLAIN-COMPLEXPROBLEM-01` | Explain a moderately complex work problem | `CF-B1-WORK-PROGRESS-PROBLEM-01`, `CF-B2-CLARIFY-NUANCE-01` |
| `CF-B2-WORK-TECHNICAL-FAMILIAR-01` | Explain familiar technical/professional information | `CF-B1-INSTRUCTION-PROCESS-01`, `CF-B2-PRESENTATION-DETAILED-01` |
| `CF-B2-CUSTOMER-ESCALATION-01` | Handle an escalated service issue | `CF-B1-COMPLAINT-RESOLVE-01`, `CF-B2-NEGOTIATE-DEVELOPED-01` |
| `CF-B2-INTERVIEW-DEVELOPED-01` | Give developed interview answers | `CF-B1-INTERVIEW-ANSWER-01`, `CF-B2-OPINION-DEVELOP-01` |
| `CF-B2-CURRENT-ISSUE-DISCUSS-01` | Discuss current issue with counterpoint | `CF-B1-CURRENT-EVENT-DISCUSS-01`, `CF-B2-COUNTERARGUMENT-01` |
| `CF-B2-ABSTRACT-TOPIC-DISCUSS-01` | Discuss moderately abstract topic | `CF-B2-OPINION-DEVELOP-01`, `CF-B2-SPECULATE-DEDUCE-01` |
| `CF-B2-TREND-DATA-EXPLAIN-01` | Explain trend/data pattern | `CF-B1-DESCRIBE-CHANGE-TREND-BASIC-01`, `CF-B2-EVALUATE-OPTIONS-01` |
| `CF-B2-CAUSE-EFFECT-COMPLEX-01` | Explain multi-step cause/effect | `CF-B1-EXPLAIN-REASON-CONSEQUENCE-01`, `GR-B2-CAUSE-PURPOSE-RESULT-INTEGRATION-01` |
| `CF-B2-NARRATE-REFLECT-01` | Narrate and reflect/evaluate | `CF-B1-NARRATE-DETAILED-01`, `CF-B2-PAST-REGRET-REFLECT-01` |
| `CF-B2-RELAY-INFORMATION-01` | Relay/report information accurately | `CF-B2-SUMMARIZE-EXTENDED-01`, `GR-B2-REPORTED-INTEGRATION-01` |
| `CF-B2-COMPARE-SOURCES-01` | Compare information from two sources | `CF-B2-SYNTHESIZE-TWO-SOURCES-INTRO-01`, `CF-B2-EVALUATE-OPTIONS-01` |
| `CF-B2-EXPLAIN-PROCESS-FORMAL-01` | Explain a process in more formal/technical style | `CF-B1-INSTRUCTION-PROCESS-01`, `GR-B2-PASSIVE-INTEGRATION-01` |
| `CF-B2-EMAIL-REGISTER-ADAPT-01` | Adapt tone/register in practical correspondence | `CF-B1-PHONE-CALL-MANAGE-01`, `CF-B2-CLARIFY-NUANCE-01` |
| `CF-B2-CONFLICT-MANAGE-01` | Manage disagreement/conflict constructively | `CF-B2-NEGOTIATE-DEVELOPED-01`, `CF-B2-CLARIFY-NUANCE-01` |
| `CF-B2-DECISION-JUSTIFY-01` | Justify a decision against alternatives | `CF-B2-EVALUATE-OPTIONS-01`, `CF-B2-ARGUE-VIEWPOINT-01` |

---

# 4. Recommended B2 waves

1. Aspect/timeline integration and reflective narration.
2. Developed viewpoint, concession, counterargument and stance.
3. Hypothetical reasoning, deduction and past alternatives.
4. Expanded passive/reporting and information relay.
5. Professional discussion, negotiation, meetings and escalation.
6. Source comparison, synthesis, trend/data and process explanation.
7. Detailed presentation, Q&A and sustained moderately abstract discussion.

---

# 5. B2 boundary decisions

Primarily deferred to C1:

- dense academic nominalization as a core productive system;
- broad stylistic inversion and literary emphasis;
- highly nuanced idiomatic stance across unfamiliar domains;
- near-effortless handling of fast overlapping discussion;
- sophisticated synthesis of multiple complex sources;
- precision expected for specialized academic/professional writing beyond the learner's field;
- accent imitation as a goal.

---

# 6. Validation — P0-CUR-006A

Validated against the complete **494-node A1→B1 graph**.

New B2 nodes:

- Grammar: **67**
- Communicative Functions: **35**
- subtotal: **102**

Combined graph after this subtask:

- A1→B1: 494
- B2 Grammar/Functions: 102
- Total: **596**

Programmatic checks:

- duplicate IDs: **0** — PASS
- missing hard prerequisites: **0** — PASS
- circular hard prerequisites: **0** — PASS
- topological ordering: **596/596** — PASS

P0-CUR-006 is not complete until B2 Vocabulary, Pronunciation, Listening, Speaking, Reading and Writing nodes are added and the full A1→B2 graph passes again.
