# Product Specification

**Baseline:** v0.1.0  
**Updated:** 2026-09-01

## 1. Product definition

English Coach is an **AI Adaptive English Learning System**, not an open-ended chatbot.

The system combines:

- structured curriculum progression;
- grammar and vocabulary knowledge building;
- listening, speaking, reading and writing practice;
- AI realtime conversation;
- correction and retry;
- mistake tracking;
- spaced review;
- IELTS preparation;
- progress and readiness reporting.

## 2. Primary learner problem

Typical AI conversation practice leaves the learner with three problems:

1. the learner must decide what to talk about;
2. practice is not guaranteed to cover missing grammar/vocabulary systematically;
3. corrections are often forgotten because they are not revisited.

English Coach should instead answer:

- What should I learn today?
- Why am I learning this now?
- What do I already know?
- What do I repeatedly get wrong?
- Can I actually use this knowledge in speech?
- When should I review it again?
- How is this helping my real communication and IELTS readiness?

## 3. V1 navigation

Recommended bottom navigation:

1. **Today** — automatically generated daily learning plan
2. **Learn** — structured lessons and knowledge map
3. **Speak** — guided realtime speaking
4. **Review** — spaced review and mistakes
5. **Me** — progress, reports, goals, settings

## 4. First-run experience

The learner should not enter an empty chat screen.

First run:

1. Set target (real communication + IELTS target).
2. Complete a placement assessment.
3. Build an initial learner profile.
4. Generate starting knowledge gaps.
5. Generate the first learning path.
6. Start Day 1.

## 5. Daily learning experience

Default session target: approximately 30–45 minutes, adjustable later.

Example structure:

1. **Review** — previously learned material due for review
2. **New grammar / function** — one bounded target
3. **Vocabulary chunks** — small set of usable expressions
4. **Controlled practice** — recognition and controlled production
5. **Listening or reading** — input at the active level
6. **Speaking** — must elicit target language naturally
7. **Correction + retry** — user produces improved version
8. **Lesson recap** — what improved, what remains weak

Not every day must include every skill at equal length. The scheduler should balance the week while respecting due reviews and weaknesses.

## 6. Core V1 capabilities

### 6.1 Systematic learning

- CEFR-aligned progression
- knowledge dependencies
- mastery states
- learning path

### 6.2 Vocabulary

Teach primarily as meanings, chunks and collocations rather than isolated translation pairs.

Each vocabulary unit may include:

- target meaning;
- common collocations;
- register/context;
- pronunciation;
- example;
- controlled recall;
- speaking use;
- later review.

### 6.3 Grammar

Each grammar unit should progress through:

- explanation;
- recognition;
- controlled production;
- correction;
- spoken production;
- spontaneous reuse.

### 6.4 Speaking

Speaking should be curriculum-driven.

AI conversations should know:

- current CEFR level;
- active lesson targets;
- recently learned vocabulary;
- repeated errors;
- forbidden/unintroduced targets when relevant;
- desired conversation difficulty.

### 6.5 Listening

V1 listening content should primarily use original, licensed, or generated material. The product should not republish copyrighted exam books or third-party audio without permission.

### 6.6 IELTS

IELTS is an exam layer, not the base curriculum.

V1 should eventually provide:

- official-format familiarization;
- original IELTS-style practice;
- staged readiness checks;
- speaking/writing feedback framed as estimated rather than official scores.

## 7. Real English measurement

In addition to IELTS readiness, track practical ability categories such as:

- conversation;
- listening comprehension;
- fluency;
- grammar accuracy;
- lexical range and appropriacy;
- pronunciation intelligibility;
- explaining problems;
- expressing opinions;
- storytelling;
- workplace communication.

## 8. Non-goals for V1

Do not build these before the core learning loop works:

- social community;
- rankings/leaderboards;
- teacher marketplace;
- course marketplace;
- multiplayer practice;
- complex gamification economy;
- native iOS app;
- App Store billing;
- broad commercial multi-tenant administration.

## 9. Product success test

The first version is successful if one learner can use it consistently and answer “yes” to all four:

1. I always know what to study next.
2. The system remembers and revisits my weaknesses.
3. I am speaking more accurately and fluently over time.
4. My IELTS readiness is improving without sacrificing real communication ability.
