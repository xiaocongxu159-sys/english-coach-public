# Issues and Solutions

This is the project issue ledger for meaningful product, curriculum, architecture, tooling and implementation problems. Detailed module context may live in dedicated handoff documents; this file preserves the problem → root cause → final resolution trail.

## Historical issue index

| ID | Issue | Status |
| --- | --- | --- |
| ISSUE-001 | Curriculum source is not the same as a ready-made syllabus | Resolved by design |
| ISSUE-002 | Risk of AI-generated ambiguous scored questions | Mitigated by design; validator/content work remains bounded |
| ISSUE-003 | Premature numeric mastery threshold in schema example | Resolved |
| ISSUE-004 | Next.js PWA manifest icon purpose failed typecheck | Resolved |
| ISSUE-005 | ESLint 10 incompatible with current Next.js React lint plugin | Resolved — Biome adopted |
| ISSUE-006 | Bootstrap lockfile needed a trustworthy reproducible source | Resolved |
| ISSUE-007 | Physical iPhone smoke requires a reachable deployment | Accepted limitation / P1-PWA gate |
| ISSUE-008 | One-time curriculum registry write-back had a concurrent CI race | Resolved — permanent CI read-only |
| ISSUE-009 | Login action buttons failed accessibility lint | Resolved |
| ISSUE-010 | Supabase lockfile bootstrap rebase blocked by generated build files | Resolved |
| ISSUE-011 | Supabase local SMTP config has a temporary upstream compatibility mismatch | Accepted temporary warning |
| ISSUE-012 | Email-confirmation callback accepted unnecessary dynamic redirect target | Resolved before merge |
| ISSUE-013 | Biome recommended-rule syntax became deprecated while still passing lint | Resolved before merge |
| ISSUE-014 | Green automated Pilot CI did not prove curriculum-semantic correctness | Resolved and release-verified |
| ISSUE-015 | `ts-fsrs` Rating is broader than the `next()` Grade contract | Resolved |
| ISSUE-016 | Review RPC initially trusted service-layer source binding too much | Resolved before merge |
| ISSUE-017 | Generic Daily Scheduler output was not always executable by the reviewed Pilot | Resolved before Engine merge |
| ISSUE-018 | Started Daily Plans could be downgraded by a stale concurrent replan | Resolved before Engine merge |
| ISSUE-019 | Lesson stage checkpoints could lose concurrent progress | Resolved before Engine merge |
| ISSUE-020 | Forbidden browser Lesson write returned DB permission error rather than zero-row success | Resolved in test; production permission was correct |
| ISSUE-021 | Exit Gate failure could create an unrecoverable Lesson dead-end | Resolved for the reviewed Phase 1 Pilot |

The historical ledger above is retained as the stable index. The most important design outcomes remain encoded in permanent tests, frozen specs and module handoffs, including `docs/P1_ENGINE_001C_HANDOFF.md`, `docs/P1_UI_001B_HANDOFF.md` and `docs/P1_UI_001C_HANDOFF.md`.

---

## ISSUE-022 — Review queue actionability was not the same as executable Phase 1 Review eligibility

**Date:** 2026-09-03  
**Module:** P1-UI-001C / Review queue → Review Lesson  
**Status:** Resolved / merged-main verified

### Problem

The Review queue correctly classified Review Units as actionable when they were relearning, overdue or due. But the reviewed Pilot content inventory contains both single-target and multi-target controlled-production items.

The Phase 1 Review Lesson resolver intentionally permits only a single Review Unit bound to deterministic reviewed-core content whose item targets exactly one node. If every actionable queue row showed `Start review`, some buttons would lead to requests the authoritative resolver was required to reject.

### Impact

A learner could see a clickable action that was structurally impossible to execute under the reviewed content/trust contract. Weakening the resolver to make those buttons work would have allowed a single Review Unit to be scored through content that affects multiple nodes, creating ambiguous Evidence/Review semantics.

### Root cause

Two concepts were initially conflated:

- **scheduler actionability** — whether a Review Unit is due now;
- **current reviewed executability** — whether the activated Phase 1 content inventory contains an approved one-unit deterministic Review exercise for that exact binding.

### Final solution

Add a separate UI startability layer while keeping the resolver as final authority.

`Start review` is shown only when the Review Unit is:

- currently actionable;
- bound to active deterministic `reviewed_core` content;
- `controlled_production`;
- single-target;
- exact item/version match for the Review Unit.

Unsupported multi-target units remain visible in the queue but read-only. The server revalidates all conditions so forged URLs/forms still fail closed.

### Verification

Fresh-Supabase Review-session integration proves the supported single-target item is startable while multi-target content is excluded. Clean PR #35 CI #227 and merged-main CI #228 passed both permanent jobs.

### Remaining limitation

Phase 1 does not yet provide a reviewed executable Review lesson for every possible multi-target Review Unit. Future content expansion should add an explicit pedagogically reviewed strategy rather than weakening one-unit source binding.

---

## ISSUE-023 — Stacked PR did not trigger the repository's permanent PR CI and squash history polluted the child diff

**Date:** 2026-09-03  
**Module:** P1-UI-001C / GitHub release administration  
**Status:** Resolved without weakening CI

### Problem

Clickable Review PR #35 was intentionally stacked on the Review backend feature branch. The repository workflow listens to `pull_request` only when the PR base is `main`, so the stacked PR did not trigger permanent CI.

After backend PR #34 was squash-merged, #35 still had the pre-squash feature commits in its ancestry. GitHub therefore displayed backend files again in the child PR even though the final file tree was correct.

### Impact

Merging without cleanup would make the release history harder to audit and could cause confidence to depend on a CI configuration exception rather than the repository's normal gates.

### Root cause

Two normal Git/GitHub behaviors interacted:

1. branch filters are evaluated against the PR base;
2. squash merge creates a new commit identity, so old child-branch ancestry does not automatically become ancestry of the squash commit.

### Attempts

1. Leave #35 stacked — rejected because permanent PR CI would not run.
2. Expand/loosen the workflow solely for the stacked PR — rejected because release mechanics should conform to the permanent gate, not weaken it.

### Final solution

- temporarily target `main` to exercise the normal workflow;
- validate the combined state;
- after #34 merged and main was double-green, rebuild #35's parent on the verified main commit while preserving the exact final file tree;
- force-move only the feature branch, never `main`;
- confirm #35 became a clean 1-commit / 8-file PR;
- rerun full application + fresh-Supabase CI on the clean head.

### Verification

Clean head `1b0419442cfa8d36f4df82fd99c08b87b43d5f83` passed CI #227. PR #35 squash-merged as `a525193a0520e512a970f7c1e7aa37331adf3aab`; merged-main CI #228 double-green.

---

## ISSUE-024 — Review answer `autoFocus` failed the accessibility lint gate

**Date:** 2026-09-03  
**Module:** P1-UI-001C / Review UI accessibility  
**Status:** Resolved

### Problem

The first clickable Review page used the React `autoFocus` attribute on the answer input.

### Impact

Biome's accessibility rule correctly failed PR CI #224. Keeping forced focus can also create poor assistive-technology/mobile behavior.

### Root cause

The initial UI optimized for immediate keyboard entry without respecting the repository's a11y rule.

### Final solution

Remove `autoFocus`. Do not suppress or disable the rule. The input remains normally focusable and the Review flow is unchanged.

### Verification

The next CI passed Biome, TypeScript, tests and production build; subsequent clean PR CI #227 and merged-main CI #228 both passed the complete permanent suite.

---

## ISSUE-025 — Frozen Daily Plan history conflicted with the need for Today to show current Review state

**Date:** 2026-09-03  
**Module:** P1-UI-001C / Today vertical integration  
**Status:** Resolved / merged-main verified

### Problem

The hardened Daily Plan correctly stops replanning once its status is `in_progress` or `completed`. This prevents a stale concurrent planner from replacing work the learner has already started.

However, Today originally rendered Review counts embedded in that persisted plan. If the learner completed a Review later the same day, the authoritative Review Unit changed but the frozen Daily Plan snapshot did not. Today could therefore display stale Review readiness.

### Impact

Two valid requirements appeared to conflict:

1. started plan history must stay stable;
2. later Today must reflect current learner Review state.

Simply rerunning/upserting the plan would reintroduce the stale-replan race already fixed in ISSUE-018.

### Root cause

Historical scheduling intent and live learner state were being represented by the same persisted Daily Plan snapshot.

### Attempts

1. Replan every time Today opens — rejected because it can mutate started work and destroy historical/explainable plan identity.
2. Mutate only the plan's Review counters — rejected because the JSON would no longer represent the original plan decision coherently.

### Final solution

Separate the two responsibilities:

- keep the started/completed Daily Plan frozen;
- on every Today request, independently load the learner's live authoritative Review queue snapshot;
- render current `ready now` / `upcoming` Review counts from that live snapshot;
- continue rendering plan budget/status/lesson selection from the persisted Daily Plan.

### Verification

The upgraded fresh-Supabase Today integration creates a real due Review Unit, proves Today shows `ready now = 1`, resolves/submits the Review through the real deterministic Review path, applies FSRS, then reloads Today and proves `ready now = 0`, `upcoming = 1` while the same Daily Plan ID, `in_progress` status, 35-minute budget and original two-node selection remain unchanged.

PR #36 CI #229 passed application + fresh-Supabase; squash merge `97cc2a42d864d58b36256b0f9764eccae20bdf34`; merged-main CI #230 double-green.

### Remaining limitation

This resolves live Review freshness, not general same-day replanning. Any future feature that wants to modify started plans must define a new explicit version/supersession contract rather than mutating them implicitly.

---

## Current open / accepted deployment limitations

The local/permanent-CI vertical slice is complete through P1-UI-001, but these release-platform items remain intentionally open:

- ISSUE-007 physical iPhone validation requires a reachable deployment;
- hosted Supabase is not yet connected;
- production secrets and hosted Auth redirects are not yet configured;
- hosted signup confirmation email flow is not yet browser-E2E verified;
- physical iPhone PWA install/open/resume has not yet been performed;
- full deployed P1-E2E-001 is pending.

These are the current P1-PWA-001 / P1-E2E-001 gates, not hidden technical debt.