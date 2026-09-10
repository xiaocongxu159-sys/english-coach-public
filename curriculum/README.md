# Canonical Curriculum Registry

`registry.json` is the machine-readable runtime registry compiled from the frozen Phase 0 curriculum inventories.

## Source of truth

Authoring source remains the eight reviewed curriculum inventory documents under `docs/`:

- A1 Grammar + Communicative Functions
- A1 Vocabulary + Skills
- A2 Grammar + Communicative Functions
- A2 Vocabulary + Skills
- B1 Grammar + Communicative Functions
- B1 Vocabulary + Skills
- B2 Grammar + Communicative Functions
- B2 Vocabulary + Skills

The committed registry is generated deterministically with:

```bash
npm run curriculum:build
```

CI verifies that the committed file exactly matches a fresh deterministic rebuild:

```bash
npm run curriculum:check
```

## Frozen graph contract

The Phase 0 Freeze v1 graph must contain exactly:

- A1: 124 nodes
- A2: 164 nodes
- B1: 206 nodes
- B2: 241 nodes
- Total: 735 nodes

Validation also requires:

- unique stable IDs;
- every hard prerequisite resolves;
- no dependency cycle;
- full topological traversal of all 735 nodes;
- valid CEFR/domain metadata.

## Lifecycle boundary

Every node imported from the Phase 0 design is intentionally emitted with lifecycle `draft`.

Being present in the canonical registry does **not** mean a node is ready for learner-facing use. Promotion to `reviewed` or `active` requires reviewed teaching content and the later content-activation process. This preserves the project rule that importing curriculum structure must not silently activate unfinished lessons.

## Application access

Typed application access is exposed by `src/lib/curriculum/registry.ts` and `src/lib/curriculum/types.ts`.

The registry is infrastructure for scheduling and prerequisite resolution; it is not itself a lesson bank, exercise bank, or proof of learner mastery.
