# Open-Source Reference Plan

**Date:** 2026-09-01  
**Status:** Accepted reference baseline  
**Purpose:** Reuse mature infrastructure patterns where appropriate while keeping the English curriculum, mastery semantics, lesson logic, assessment logic, and learner model product-owned.

## 1. Principle

We will **not** build every technical subsystem from scratch.

We will reuse or adapt mature open-source libraries and reference implementations when all of the following are true:

1. the component solves a generic infrastructure problem rather than defining our pedagogy;
2. the license is compatible with the intended product use;
3. the project is maintained or technically understandable enough to own after adoption;
4. we can isolate it behind our own interface so it can be replaced later;
5. adopting it reduces implementation risk without making our core learning engine dependent on someone else's course design.

The product-owned core remains:

- A1–B2/C1 curriculum graph;
- knowledge-node semantics and prerequisites;
- mastery model and evidence rules;
- daily lesson generation;
- placement and progression logic;
- exercise validation policy;
- listening/reading content specifications;
- AI teaching policy;
- real-English + IELTS mapping;
- learner error model and progress interpretation.

## 2. Candidate references

### 2.1 Spaced repetition — Open Spaced Repetition / `ts-fsrs`

Repository: `open-spaced-repetition/ts-fsrs`  
License: MIT  
Role: **candidate dependency/reference for scheduling review intervals**.

Why it is useful:

- mature TypeScript implementation of FSRS;
- designed specifically as a reusable scheduling library;
- compatible with a TypeScript/Next.js application;
- avoids inventing a memory-decay algorithm without evidence.

What we may reuse:

- scheduling primitives;
- card/memory-state concepts where compatible;
- interval computation;
- parameter optimization later if justified by enough review data.

What we will NOT delegate to FSRS:

- whether a language knowledge node is mastered;
- which evidence types count as mastery;
- prerequisite unlocking;
- lesson composition;
- speaking/grammar correctness;
- IELTS readiness.

Important architectural rule: FSRS may schedule **review opportunities**, but our mastery engine determines **what the learner knows**.

### 2.2 Realtime voice — OpenAI Realtime reference implementations

Repositories:

- `openai/openai-realtime-console`
- `openai/openai-realtime-agents`
- `openai/openai-agents-js`

License: MIT for the referenced OpenAI repositories.

Role: **reference implementation for browser voice plumbing and realtime-agent architecture**.

What we may reuse/adapt:

- WebRTC session setup patterns;
- ephemeral/server-issued credential patterns;
- realtime event handling;
- audio session lifecycle;
- transcript/event state management;
- interruption handling;
- tool-call patterns;
- separation between fast realtime conversation and deeper supervisor analysis.

What remains product-owned:

- English-teacher instructions;
- active lesson constraints;
- correction timing;
- retry rules;
- learner-error extraction;
- knowledge-node links;
- speaking assessment evidence;
- conversation scenario selection.

We should prefer current OpenAI SDK/API guidance at implementation time rather than permanently copying an example application's internal structure.

### 2.3 iOS conversational UX reference — OpenLanguage

Repository: `challenga-org/openlanguage`  
License: MIT  
Stack: Expo / React Native with iOS-oriented voice interaction.

Role: **UX and future native-iOS reference**, not a V1 codebase dependency.

Useful ideas to inspect later:

- conversation-first mobile interaction;
- voice controls;
- provider abstraction;
- pre-made topic selection;
- native iOS interaction patterns.

Why we are not adopting it as the product base now:

- V1 remains PWA-first;
- its product goal is primarily conversational practice, while our product requires a structured curriculum and mastery graph;
- switching to its native stack now would create unnecessary implementation scope.

### 2.4 PWA + FSRS UX references — Recall / No BS FSRS

Repositories/examples:

- `Madlezz/Recall`
- `anton-bregolas/nobs-fsrs-cards`

Role: **reference for review-session UX, offline/PWA patterns, and FSRS integration**.

Potentially useful patterns:

- mobile-friendly PWA review flows;
- offline/local persistence strategies;
- review interaction design;
- FSRS state visualization;
- touch/gesture study interactions.

We should not inherit their card-only learning model as our curriculum model.

### 2.5 Supabase / study-app reference — Openlet + official Supabase Next.js starter

References:

- `ChloeVPin/openlet`
- Supabase official Next.js `with-supabase` starter/documentation

Role: **reference for authentication/session patterns and learning-app data plumbing**.

Potentially useful patterns:

- Supabase Auth with Next.js;
- SSR/cookie session handling;
- protected routes;
- simple learning-content persistence.

The official Supabase starter should take priority over third-party auth code when implementation begins.

## 3. Adoption categories

Every external component must be classified before use.

### A — Direct dependency

Install and use the package behind our own interface.

Likely candidate:

- `ts-fsrs`

### B — Reference implementation

Study patterns and rewrite/adapt only the necessary pieces.

Likely candidates:

- OpenAI Realtime Console;
- OpenAI Realtime Agents;
- OpenLanguage;
- Recall;
- Openlet.

### C — Product inspiration only

Use UX/product ideas but no source-code dependency.

This should be the default for complete language-learning applications, because their data model and pedagogy are not our curriculum.

## 4. License gate

Before copying or incorporating meaningful source code:

1. record repository + exact license;
2. record the version/commit inspected;
3. determine whether attribution/notice is required;
4. avoid GPL/AGPL code in the core product unless we explicitly accept its obligations;
5. prefer permissive MIT/BSD/Apache-2.0 dependencies for generic infrastructure;
6. record external dependencies in a future `THIRD_PARTY_NOTICES.md` when implementation begins.

A repository being public on GitHub does **not** automatically mean its code can be copied freely.

## 5. Core-vs-borrowed boundary

```text
BORROW / REFERENCE                       OWN
──────────────────────────────────      ───────────────────────────────
Auth/session implementation patterns    Curriculum graph
PWA installation/offline patterns       Knowledge-node semantics
Realtime WebRTC plumbing                Mastery evidence model
FSRS interval scheduling                Placement/progression logic
Generic UI primitives                   Daily lesson generator
Database client patterns                Exercise quality rules
Audio state/event patterns              AI teacher behavior
                                        IELTS + Real English mapping
                                        Learner error model
```

## 6. Implementation rule

When a Phase 1+ technical task starts, the task plan must include a short **reuse check**:

- Is there a mature official/open-source implementation?
- What can be adopted safely?
- What must remain product-owned?
- What license applies?
- What acceptance tests prove the adopted component works for our actual use case, especially on iPhone?

Do not adopt an external framework merely because it has many stars. Validate it against our requirements first.

## 7. Current recommendation

For the first usable version:

- **Frontend/product shell:** Next.js PWA, product-owned.
- **Auth/data:** Supabase using official Next.js patterns.
- **Review interval engine:** evaluate `ts-fsrs` as the leading candidate during the spaced-review implementation task.
- **Realtime speaking:** use current OpenAI Realtime WebRTC/Agents reference patterns when Phase 3 begins.
- **Native iOS:** defer; study OpenLanguage only if PWA limitations justify native work.

No whole third-party language-learning application should become the foundation of English Coach. The reusable value lies in infrastructure and interaction patterns, while our differentiation and correctness depend on the curriculum/mastery system.
