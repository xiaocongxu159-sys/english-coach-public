# Decision Log

**Updated:** 2026-09-01

This file records durable project decisions.

---

## DEC-001 — CEFR is the proficiency backbone
Use CEFR levels/can-do outcomes for proficiency structure; adapt them into a product-owned teaching sequence.

## DEC-002 — IELTS is an exam layer, not the base curriculum
Build general English ability first and map suitable nodes/tasks into IELTS preparation.

## DEC-003 — Real communication and IELTS are equal long-term outcomes
Progress reporting must preserve both outcomes.

## DEC-004 — AI does not own the syllabus
Structured curriculum chooses targets; AI personalizes delivery within boundaries.

## DEC-005 — Hybrid exercise content
Use reviewed core content plus constrained/validated AI variants.

## DEC-006 — Productive evidence is required for productive mastery
Recognition-only success cannot prove usable language when a node has productive objectives.

## DEC-007 — PWA before native iOS
Validate sustained iPhone/desktop PWA use before investing in native distribution.

## DEC-008 — AI model selection stays configurable
Do not encode transient model names into curriculum architecture.

## DEC-009 — Original/licensed content by default
Use original, licensed, openly usable, or generated-and-reviewed learning content; do not republish protected IELTS banks without rights.

## DEC-010 — Curriculum is a graph of stable Knowledge Nodes
Stable nodes + typed prerequisites/applications preserve explainable sequencing and history.

## DEC-011 — Listening/reading skills are operation-driven
Main idea/detail/inference/reference etc. are skills; topics are scenario metadata.

## DEC-012 — Pronunciation target is intelligibility
Prioritize understandable speech, stress, connected speech, chunking and intonation rather than native-accent imitation.

## DEC-013 — Reuse infrastructure; own the learning core
Use mature infrastructure where appropriate while keeping curriculum, mastery, placement, scheduling, assessment and AI teaching product-owned.

## DEC-014 — Lesson Blueprint and Lesson Instance are separate
Reusable pedagogy is versioned separately from learner-specific execution. Lesson completion is not mastery.

## DEC-015 — Mastery is an evidence-driven state model
Use structured evidence and states rather than one opaque percentage. Low-confidence AI cannot promote/demote.

## DEC-016 — FSRS schedules memory; it does not define English mastery
Review scheduling is separate from language competence.

## DEC-017 — Placement Clearance can bypass lower prerequisites without fabricating mastery
Clearance is scheduling permission only, excludes direct gaps and is revocable.

## DEC-018 — Daily Scheduler uses bounded lexicographic priorities
Time budget is a hard boundary; unfinished/weak learning can outrank novelty; productive application is preserved.

## DEC-019 — Repeated listening is teaching; one-pass listening is assessment/exam behavior
Guided listening may use multiple passes and transcript diagnosis; one-pass behavior is progressively introduced and required for IELTS-style mode.

## DEC-020 — Exercise Template, Item and Attempt are separate; AI cannot self-certify scored truth
Only reviewed core or fully validated generated variants may create trusted state-changing evidence; low-confidence/unvalidated results cannot change Mastery or Review.

## DEC-021 — IELTS readiness is a separate estimated evidence model, not a CEFR conversion
IELTS progression is staged, four components remain separate, internal scores stay estimated/non-official, and repeated recent evidence is required for target readiness.

## DEC-022 — Implement a usable vertical slice before horizontal feature expansion

**Date:** 2026-09-01  
**Status:** Accepted for Phase 1

Phase 1 starts with a small reviewed A1 vertical slice:

`Today → Lesson → Exercise/production → Attempt → Evidence → Mastery → Review → persistent return/resume`.

Build only the infrastructure needed for that loop first. Broad feature/curriculum expansion cannot substitute for a usable learner flow.

---

## DEC-023 — Use Biome for Phase 1 linting instead of forcing an unstable ESLint combination

**Date:** 2026-09-01  
**Status:** Accepted

### Context

The initial scaffold tested both an unsupported ESLint 9 release and ESLint 10.9.1. ESLint 10 caused the React rule stack bundled through `eslint-config-next` 16.3.4 to crash during real CI.

### Decision

Use Biome 2.5.11 as the Phase 1 lint baseline, with Next and React domains enabled. Keep TypeScript typechecking and Next production build as separate gates.

### Why

- avoids starting the project on a version npm already reports unsupported;
- avoids forcing an ESLint 10/plugin combination that fails in the real toolchain;
- follows a supported path represented in the official `create-next-app` template family;
- keeps the lint gate simple and reproducible.

Re-evaluate only if a later Next/tooling upgrade creates a compelling reason; lint-tool choice is infrastructure, not product semantics.

---

## DEC-024 — Physical iPhone validation is a separate release gate, not a CI fiction

**Date:** 2026-09-01  
**Status:** Accepted for Phase 1

### Decision

P1-BOOT may close after reproducible Node 24 CI validates the scaffold, while real iPhone Safari/PWA behavior remains explicitly open under `P1-PWA-001` until a reachable deployment exists.

### Why

A responsive build and PWA manifest do not prove physical iOS behavior. The project must not claim microphone, installation, safe-area, resume or later WebRTC behavior was tested when no physical-device session occurred.

### Phase 1 boundary

The overall vertical-slice Phase 1 cannot pass `P1-E2E-001` until the same core learner loop is validated on the physical iPhone.

---

## DEC-025 — Frozen curriculum authoring stays human-readable; runtime registry is deterministically compiled

**Date:** 2026-09-01  
**Status:** Accepted for Phase 1

### Decision

Keep the eight reviewed Phase 0 curriculum inventory Markdown documents as the human-reviewable authoring source for the frozen graph, and deterministically compile them into committed `curriculum/registry.json` for application/runtime consumption.

### Contract

The compiler and validator must enforce:

- exactly 735 nodes with frozen per-level counts;
- unique stable IDs;
- valid domains/levels;
- all hard prerequisites resolve;
- no dependency cycles;
- complete topological traversal;
- deterministic committed output.

CI is permanently read-only: it never silently repairs a stale registry. If a source document changes without regenerating the committed registry, the build must fail visibly.

### Lifecycle boundary

Compilation imports curriculum structure only. Every Phase 0 node enters the registry as `draft`; activation to `reviewed` or `active` is a separate content-governance action.

### Why

Maintaining two hand-edited copies of 735 nodes would invite drift. A deterministic compiler preserves readable curriculum review while providing one typed machine-readable runtime artifact and an auditable mismatch gate.

---

## DEC-026 — Learner-facing high-trust learning state is server-authoritative

**Date:** 2026-09-01  
**Status:** Accepted for Phase 1

### Decision

Authenticated browser clients may read their own learner-private state, but they do not receive direct database write access to curriculum structure, Exercise Attempts that drive scoring, Mastery Evidence, learner-node Mastery state, Review state, Daily Plans or Curriculum Clearance.

Authoritative state changes must go through product-owned server logic using a server-only privileged client after the user/session and input have been validated.

### Why

If the browser could directly insert trusted evidence or set its own Mastery state, a learner—or a buggy client—could bypass scoring, evidence-trust and review invariants. RLS must defend user isolation, while the service boundary defends learning semantics.

### Phase 1 boundary

P1-DB establishes the database permission boundary. The actual scoring/evidence/mastery/review transition code remains P1-ENGINE-001.

---

## DEC-027 — Database presence is not learner activation; shared content is active-only

**Date:** 2026-09-01  
**Status:** Accepted for Phase 1

### Decision

Learner clients can read only explicitly `active` shared curriculum/content. Draft, reviewed-but-not-activated and deprecated rows stay unavailable to learner clients even when those rows exist in the canonical registry or database.

For Exercise Items, learner readability also requires a trusted content class (`reviewed_core` or `validated_variant`).

### Why

The project already distinguishes `draft → reviewed → active → deprecated`. Allowing every authenticated client to read draft content would weaken that governance boundary and make accidental UI exposure easier. Defense in depth belongs at the database layer as well as in scheduler/UI selection logic.

---

## DEC-028 — Database migrations and RLS require real local-Supabase CI, not SQL inspection alone

**Date:** 2026-09-01  
**Status:** Accepted for Phase 1

### Decision

Permanent CI includes a dedicated local Supabase integration job that starts a disposable stack, resets the database from empty state, replays migrations/seed, creates multiple users and executes authenticated/anonymous/service-role access tests.

### Required assertions

At minimum the gate must prove:

- migrations rebuild from zero;
- Auth sessions work;
- new-user profile creation works;
- cross-user reads/updates are isolated;
- anonymous application-table access is blocked;
- draft shared content is hidden while active content is readable;
- learner clients cannot mutate curriculum or directly create trusted Mastery state.

### Why

A migration can be syntactically valid while grants, policies, triggers or Auth behavior are wrong. Runtime database behavior is part of the product contract and must be tested as such.

---

## DEC-029 — The first learner-active Pilot must be schedulable from zero and preserve explicit evidence contracts

**Date:** 2026-09-01  
**Status:** Accepted for Phase 1

### Context

The first implementation draft of P1-PILOT used a nine-node `Survival & Identity` slice. Automated static and database CI passed, but manual semantic review found that some node meanings were broader than the lesson actually covered, some proposed first-lesson grammar nodes had hard prerequisites a brand-new learner would not yet have ready, and active-node evidence requirements were not explicitly persisted.

The draft was rejected and removed before merge.

### Decision

The first learner-active content slice is `PILOT-A1-SOCIAL-FORMULAS-01`, containing exactly two A1 root nodes with zero hard prerequisites:

- `CF-A1-SOCIAL-GREET-01`;
- `VX-A1-SOCIAL-FORMULAS-01`.

The Pilot must explicitly freeze and persist each active node's required evidence contract:

- CF node → `recognition`, `controlled_production`, `free_spoken_production`;
- VX node → `recognition`, `controlled_production`.

The static validator must reject unauthorized active-node expansion, evidence-contract downgrade, missing required evidence opportunities or item/template evidence that does not belong to its target-node contract.

### Scoring boundary

Scored Pilot items are original project-authored `reviewed_core` items with deterministic answer contracts. Live AI may not invent or self-certify scored truth for this slice.

The Pilot includes reviewed free-spoken practice because the communicative-function node genuinely requires spoken evidence. Until a speech/rubric evaluator is implemented and calibrated, that practice remains `may_change_mastery=false` and `may_update_review=false`.

### Lifecycle boundary

The canonical 735-node registry remains frozen with lifecycle `draft`. Pilot activation is a separate reviewed database/content lifecycle decision for only the selected root nodes and their reviewed lesson/exercise package.

### Why

A first lesson must be truly schedulable for a new learner, not merely dependency-closed inside its own bundle. Curriculum correctness also requires semantic coverage and explicit mastery evidence requirements; green code CI alone cannot prove those properties.

### Verification requirement

P1-PILOT may close only after the corrected final head passes static scope/evidence/answer/trust checks, destructive validator tests, an empty Supabase rebuild, base Auth/RLS regression, double-seed idempotency, exact stored evidence-contract checks, authenticated/anonymous/write-boundary checks, normal application regression, squash merge, and the same permanent CI again on merged `main`.
