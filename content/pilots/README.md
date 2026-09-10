# Phase 1 Pilot Content

This directory contains the first learner-active reviewed content slice for the Phase 1 vertical learning loop.

## Canonical pilot bundle

`a1-social-formulas-v1/`

- `pilot.json` — reviewed node activation, explicit per-node evidence requirements, Lesson Blueprint, teaching content and exit gate;
- `templates.json` — reviewed Exercise Templates;
- `items-1.json` / `items-2.json` — reviewed Exercise Items.

The frozen `curriculum/registry.json` remains the canonical source for Knowledge Node structure and prerequisites. Pilot activation does **not** edit registry lifecycle values; selected nodes are activated only when the service-role seed importer writes them to the database.

## Current scope

Pilot: `PILOT-A1-SOCIAL-FORMULAS-01`

The first learner-active slice intentionally uses only two A1 root nodes with **no hard prerequisites**:

- `CF-A1-SOCIAL-GREET-01`
- `VX-A1-SOCIAL-FORMULAS-01`

It teaches and practices a tightly bounded set of everyday formulas:

- `Hello` / `Hi`;
- `Nice to meet you` / `Nice to meet you, too`;
- `Thank you` / `You're welcome`;
- `Sorry`;
- `Goodbye` / `Bye`.

Names, personal-information exchange, `be` grammar and broader self-introduction are deliberately excluded. Those concepts require additional prerequisite/content coverage and must not be smuggled into the first lesson merely because they are familiar beginner topics.

## Frozen evidence contracts

Before a Knowledge Node can be learner-active, Phase 0 requires explicit `required_evidence_types`. This pilot therefore freezes the following contracts:

- `CF-A1-SOCIAL-GREET-01` → `recognition`, `controlled_production`, `free_spoken_production`;
- `VX-A1-SOCIAL-FORMULAS-01` → `recognition`, `controlled_production`.

The validator rejects a manifest that removes or silently downgrades these requirements. It also verifies that every required evidence type has a reviewed exercise opportunity and that deterministic requirements have state-eligible reviewed items.

The service-role seed stores the same arrays in `knowledge_nodes.metadata.required_evidence_types`, and database integration tests verify exact agreement with the checked-in manifest.

## Trust boundary

- 10 scored items are deterministic `reviewed_core` content.
- 1 `free_spoken` item is reviewed practice only.
- The spoken item targets the communicative-function node; vocabulary is support only.
- Spoken practice cannot change Mastery or Review state because Phase 1 does not yet have a validated speech evaluator.
- AI-generated scored variants are disabled.
- Content provenance is recorded as `ai_assisted`; this repository does **not** claim external teacher/editor review.
- Content is original project-authored material and does not copy an IELTS bank, textbook, podcast or third-party audio.

## Why the earlier nine-node draft was removed

An earlier implementation draft activated grammar, personal-identity and self-introduction nodes together. Automated code/database checks were green, but a manual semantic review found two problems:

1. some activated node meanings were broader than the lesson content actually covered;
2. the first lesson could depend on hard prerequisites that a brand-new learner had not yet made ready.

That draft was removed before merge. Green CI is necessary but not sufficient for curriculum correctness.

## Deliberate non-scope

This pilot does not yet claim listening/audio coverage, personal-information exchange, grammar instruction, pronunciation scoring, open-ended AI scoring or trusted spoken Mastery. The small scope is intentional: Phase 1 must prove the learning loop before curriculum breadth expands.

## Validation

```bash
npm run pilot:check
npm run pilot:seed
npm run test:pilot-db
```

Permanent CI runs static pilot validation and corruption tests. In a disposable local Supabase stack it then resets from an empty database, runs base Auth/RLS integration checks, seeds the reviewed pilot twice, and verifies active-content visibility, explicit evidence contracts, idempotency and learner trust boundaries.
