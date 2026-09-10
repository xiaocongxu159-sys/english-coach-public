# P1-PILOT-001 Content Review

**Date:** 2026-09-01  
**Status:** Final pre-merge review baseline  
**Pilot:** `PILOT-A1-SOCIAL-FORMULAS-01`

## Why the first implementation draft was rejected

The first P1-PILOT implementation draft activated nine A1 nodes around greetings, `be`, possessives, personal identity and self-introduction. Its static validation and database integration tests were green, but a manual curriculum-semantic review found two blocking problems before merge:

1. several activated nodes represented broader abilities than the lesson actually taught — for example, broader personal-identity/self-introduction semantics were being represented by a name-only lesson;
2. grammar nodes in the proposed first lesson had hard prerequisites that a genuinely brand-new learner would not yet have in a prerequisite-ready Mastery state.

The draft also had not stored each active Knowledge Node's explicit `required_evidence_types`, even though `KNOWLEDGE_NODE_SCHEMA.md` v1.1 makes that an activation requirement.

The nine-node bundle was therefore removed rather than patched around. Green code CI is necessary but is not proof of curriculum correctness.

## Final pilot selection

The learner-active slice is intentionally reduced to two A1 root nodes with no hard prerequisites:

1. `CF-A1-SOCIAL-GREET-01`
2. `VX-A1-SOCIAL-FORMULAS-01`

Both remain `draft` in the canonical generated registry. Learner activation happens only in the reviewed Pilot bundle/database seed; this does not mutate the frozen registry lifecycle.

This gives a true first lesson that can be scheduled for a brand-new learner without inventing prerequisite clearance or pretending that broader beginner grammar has already been learned.

## Frozen node evidence contracts

Phase 0 requires `assessment_requirements.required_evidence_types` to be explicit before activation. The Pilot manifest therefore freezes equivalent runtime evidence contracts:

- `CF-A1-SOCIAL-GREET-01` → `recognition`, `controlled_production`, `free_spoken_production`;
- `VX-A1-SOCIAL-FORMULAS-01` → `recognition`, `controlled_production`.

These are not editable convenience flags. The Pilot validator rejects any manifest that silently removes or downgrades them.

Every required evidence type must have a reviewed exercise opportunity. For recognition and controlled production, the Pilot also requires deterministic state-eligible reviewed items. `free_spoken_production` is present as reviewed practice, but remains non-state-changing until a validated speech evaluator exists.

The service-role seed persists the same arrays in `knowledge_nodes.metadata.required_evidence_types`, and the database integration test verifies exact equality between stored rows and the checked-in manifest.

## Lesson scope

Lesson Blueprint: `LESB-A1-SOCIAL-FORMULAS-01`

Learner-facing title:

**Essential Social Formulas: Hello, Thanks, Sorry, Goodbye**

Core reviewed language:

- `Hello` / `Hi`;
- `Nice to meet you` / `Nice to meet you, too`;
- `Thank you` / `You're welcome`;
- `Sorry`;
- `Goodbye` / `Bye`.

Core outcomes:

- recognize an appropriate formula in short familiar situations;
- produce reviewed formulas in tightly controlled written prompts;
- rehearse appropriate formulas aloud without fabricating a trusted speech score.

Deliberately excluded:

- names and wider personal-information exchange;
- present `be` or other grammar analysis;
- broader self-introduction;
- pronunciation scoring;
- open-ended AI-generated scored questions.

## Reviewed core exercise set

The Pilot contains:

- 5 deterministic single-choice recognition items;
- 5 deterministic short-answer controlled-production items;
- 1 reviewed free-spoken rehearsal item.

Total: **10 deterministic state-eligible scored items** plus **1 practice-only spoken item**.

Where natural English has more than one reviewed answer, the answer key preserves that variation rather than pretending there is only one valid phrase. Examples:

- greeting → `Hello` or `Hi`;
- closing → `Goodbye` or `Bye`.

The exit gate requires at least 8/10 scored items correct and specifically requires the controlled greeting and full first-meeting response items.

## Speaking boundary

The free-spoken item targets `CF-A1-SOCIAL-GREET-01`; the vocabulary node is support only.

It has:

- `evidence_type = free_spoken_production`;
- `may_change_mastery = false`;
- `may_update_review = false`.

This is intentional. The communicative-function node correctly requires spoken evidence, but Phase 1 does not yet have a calibrated speech evaluator. The product may let the learner rehearse the evidence type without falsely claiming trusted productive Mastery.

A later validated evaluator may create state-changing spoken evidence; the current Pilot must not.

## Listening boundary

No listening asset is claimed in this Pilot version. This is deliberate. The selected root-node lesson can be taught and exercised without audio, and adding placeholder TTS merely to tick a feature box would weaken the quality bar.

Therefore P1-PILOT-001 must not be reported as validating listening/audio.

## Content provenance

The content is original project-authored material, AI-assisted and reviewed in explicit root-node/prerequisite, node-semantic, evidence-contract and deterministic-answer/ambiguity passes.

It is not copied from Cambridge IELTS books, official IELTS question banks, textbooks, podcasts or third-party audio. `externalHumanReview=false` is explicit; the project must not claim external teacher/editor review.

## Required review passes

**Pass 1 — root-node/prerequisite review:** every active node must exist in the canonical A1 registry and have zero hard prerequisites. The exact reviewed two-node slice is frozen in the validator.

**Pass 2 — node-semantic and evidence review:** lesson content must not represent broader grammar/personal-information nodes; every active node must have its exact reviewed `required_evidence_types`; every required evidence kind must have a reviewed opportunity.

**Pass 3 — answer and ambiguity review:** single-choice items must have exactly one existing correct option; deterministic production items must have one or more explicit normalized accepted answers; natural alternatives must be accepted when the prompt permits them; state-changing content must be deterministic reviewed core.

**Automated contract review:** CI verifies IDs, exact active-node set, root status, evidence contracts, template/item targeting, state-effect boundaries, sequence/exit-gate integrity, provenance/QA flags and corruption fixtures.

**Database contract review:** after an empty Supabase reset and double seed, CI verifies active learner visibility, anonymous blocking, learner write blocking, zero Pilot hard-prerequisite edges, stored node evidence contracts, bundle checksum and spoken practice non-state behavior.

## Acceptance for P1-PILOT-001

This milestone may close only if all conditions pass on the final PR head:

1. the exact two-node root slice passes static validation;
2. every node evidence contract exactly matches the reviewed frozen contract;
3. corruption tests prove the validator rejects unauthorized node activation, downgraded evidence requirements, missing evidence opportunities, invalid answer keys, unreviewed content and state-changing rubric speech;
4. normal lint/typecheck/node tests/production build remain green;
5. a clean local Supabase reset succeeds from empty state;
6. base Auth/RLS integration still passes;
7. the Pilot seed succeeds twice without duplication or corruption;
8. authenticated learners can read the active Pilot nodes/blueprint/templates/items;
9. anonymous users cannot read Pilot application content;
10. learner clients cannot mutate reviewed content;
11. stored `required_evidence_types` and Pilot bundle checksum match the checked-in bundle exactly.

After PR merge, the same permanent CI must also pass on `main` before `P1-ENGINE-001` begins.
