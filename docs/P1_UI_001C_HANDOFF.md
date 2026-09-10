# P1-UI-001C Handoff — Review Queue + Vertical Integration

**Status:** COMPLETE / MERGED-MAIN VERIFIED  
**Date:** 2026-09-03  
**Parent:** P1-UI-001 — Today + Lesson + Review vertical UI  
**Next gate:** P1-PWA-001 — reachable hosted deployment + physical iPhone PWA validation

## 1. What UI-C delivers

P1-UI-001C closes the learner-facing Review loop on top of the already verified deterministic Engine.

The merged learner path is now:

```text
authenticated learner
→ Today bounded persisted Daily Plan
→ reviewed Lesson Runner
→ deterministic Attempts
→ Evidence
→ Mastery
→ exactly-once FSRS Review Units
→ learner Review queue
→ Start/Resume one authoritative Review Lesson
→ submit one deterministic reviewed answer
→ persisted feedback + FSRS grade + next due time
→ return to Today
→ Today reflects current live Review state without replacing the started Daily Plan
```

## 2. Review queue

The Review queue is sourced only from learner-owned active `review_units`.

Current priority is derived on every read from authoritative `due_at` plus current Mastery; stale persisted `review_status` is not trusted as wall-clock truth.

Ordering remains deterministic:

1. relearning / lapsed;
2. overdue;
3. due;
4. upcoming / not scheduled.

The learner can see node/evidence/due information and an explanation for why an item has its current priority.

RLS continues to hide other learners' Review Units.

## 3. Clickable Review eligibility

A visible Review Unit is not automatically startable.

Phase 1 exposes `Start review` only when all of the following are true:

- current priority is actionable (`relearning`, `overdue`, or `due`);
- content is active deterministic `reviewed_core`;
- evidence type is `controlled_production`;
- the selected item targets exactly one node;
- the item/version exactly matches the Review Unit binding.

Multi-target reviewed items remain visible in the queue but are intentionally non-clickable. This prevents UI buttons from creating a Review Lesson the authoritative resolver must reject.

This UI eligibility is convenience only. The server resolver revalidates every boundary and fails closed if browser input is stale or forged.

## 4. Authoritative Review Lesson

The Review Lesson resolver:

- accepts the authenticated learner ID from the server session, not browser-owned identity;
- requires a learner-owned actionable Review Unit;
- resolves the reviewed `LESB-A1-SOCIAL-FORMULAS-02` Review Blueprint;
- resolves one deterministic single-target controlled-production item;
- stores a stable Review Unit + revision binding in Lesson state;
- reuses the same live Review Lesson for repeated start/resume;
- rejects foreign, future, stale-revision and multi-target requests.

The browser sends only the learner's raw answer. It does not send a grade, Mastery state, FSRS result, next due date or trusted Review transition.

## 5. Review submission

One Review submission flows through the existing deterministic learning engine:

```text
raw learner response
→ deterministic reviewed-item scoring
→ immutable/idempotent Attempt
→ Evidence
→ deterministic Mastery derivation
→ exactly-once FSRS Review Adapter
→ immutable Review Event
→ updated Review Unit
```

Exact replay is idempotent. A conflicting replay is rejected.

A stale Review Lesson whose bound Review Unit revision has already moved is rejected rather than applying against new scheduler state.

The completed Review page reads persisted feedback, persisted FSRS grade and current `due_at`; it does not recompute those values in the browser.

## 6. Today reflection boundary

A started/completed Daily Plan remains frozen. UI-C does **not** silently replan or overwrite it after a Lesson/Review changes learner state.

Instead, each Today request loads a separate live authoritative Review snapshot.

This gives both required properties:

1. Daily Plan identity/budget/content remain stable once started;
2. Review readiness shown on Today reflects current persisted Review state.

The fresh-Supabase acceptance test proves a real due Review changes from:

- `ready now = 1`, `upcoming = 0`

to:

- `ready now = 0`, `upcoming = 1`

after a real deterministic Review submission + FSRS update, while the same Daily Plan row/id, 35-minute budget and original two-node selection remain unchanged.

## 7. Important trust boundaries preserved

- browser clients cannot directly write authoritative Review Units, Review Events or Lesson state;
- browser-provided grade/FSRS/Mastery truth does not exist;
- current scored truth is deterministic reviewed content only;
- spoken practice remains state-neutral;
- due/overdue is derived dynamically from `due_at`;
- Review transitions remain behind the exactly-once adapter and PostgreSQL source-binding checks;
- repeated Review starts/submissions are idempotent where required;
- refresh/relogin reconstructs the learner's Review state from persisted rows;
- a started Daily Plan is never silently replaced to make Today look fresh.

## 8. Validation and release history

### Slice 1 — queue + authoritative Review session backend

PR #34 implemented the queue, Review Blueprint, authoritative Review Lesson resolver, fixed attempt slot, stale-revision protection and exactly-once Review-session DB coverage.

Accepted feature head: `5f5f545f8050d52897875dbfe6275afaed2eb1d7`  
PR CI #223: application + fresh-Supabase PASS  
Squash merge: `911d9552cfc5586844d91f4d1ac7ded51c462363`  
Merged-main CI #226: application + fresh-Supabase PASS

### Slice 2 — learner-facing clickable Review UI

PR #35 added start/resume, answer submission, persisted feedback, grade/next-due rendering and fail-closed startable eligibility.

An initial CI run correctly failed accessibility lint because the Review answer input used `autoFocus`; the attribute was removed rather than suppressing the rule.

The PR was originally stacked on the feature branch. Because the repository CI listens to PRs targeting `main`, it was temporarily retargeted for validation. After PR #34 was squash-merged, #35 was rebased by rewriting only its parent while preserving the verified final file tree; this removed duplicated historical commits and produced a clean 8-file diff.

Clean head: `1b0419442cfa8d36f4df82fd99c08b87b43d5f83`  
Clean PR CI #227: application + fresh-Supabase PASS  
Squash merge: `a525193a0520e512a970f7c1e7aa37331adf3aab`  
Merged-main CI #228: application + fresh-Supabase PASS

### Slice 3 — live Review state reflected on Today

PR #36 kept started/completed Daily Plans frozen while adding a separate live Review snapshot to Today.

PR head: `b8c8cdd4fd443d45f7d15607d4ffa3d1b7144ca8`  
PR CI #229: application + fresh-Supabase PASS  
Squash merge: `97cc2a42d864d58b36256b0f9764eccae20bdf34`  
Merged-main CI #230: application + fresh-Supabase PASS

Therefore **P1-UI-001C is COMPLETE / merged-main verified**.

## 9. Parent P1-UI-001 audit

P1-UI-001A Today: COMPLETE / merged-main verified.  
P1-UI-001B Lesson Runner: COMPLETE / merged-main verified.  
P1-UI-001C Review queue + vertical integration: COMPLETE / merged-main verified.

The learner-facing vertical UI now covers Today → Lesson → Review → later Today reflection while preserving server-owned truth and RLS.

Therefore **P1-UI-001 is COMPLETE / merged-main verified**.

## 10. What is still intentionally incomplete

P1-UI completion does not mean Phase 1 is complete.

Still required:

- hosted Supabase project/environment;
- production environment variables/secrets;
- hosted signup email-confirmation callback template and browser verification;
- reachable HTTPS deployment;
- physical iPhone install/open/offline-shell/resume smoke;
- full deployed vertical E2E release gate.

No document should imply those are already verified.

## 11. Exact next starting point

Proceed to **P1-PWA-001**.

The first sub-gate is deployment readiness, because physical iPhone validation and hosted E2E require a reachable HTTPS app and hosted Supabase.

Recommended sequence:

```text
hosted Supabase project
→ production env/secrets
→ apply migrations from empty hosted state
→ seed reviewed Pilot + Review Blueprint
→ configure Auth redirect + confirmation email template
→ deploy reachable HTTPS app
→ desktop hosted smoke
→ physical iPhone PWA smoke
→ P1-E2E-001 full vertical release gate
```

Do not activate the remaining 733 draft curriculum nodes during this work.