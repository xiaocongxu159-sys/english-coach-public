# P1-PWA-001B Completion-State Consistency Fix Handoff

**Date:** 2026-09-11  
**Parent slice:** P1-PWA-001B  
**Issue:** ISSUE-034 — completed Lesson still appears as `In progress` / `Resume lesson` on Today  
**Status:** FIX IN REVIEW — implementation and regression coverage added; CI/Production verification pending

## 1. Production evidence

The real hosted learner completed the reviewed Phase 1 Lesson and reached:

```text
8/8 stages
Lesson complete
Exit check: 9/10 · more practice needed
```

After choosing **Back to Today**, the same learner saw:

```text
Plan status: In Progress
CTA: Resume lesson
0 reviews ready now
14 reviews upcoming
```

The Lesson-complete screen and Today plan status therefore disagreed.

## 2. Root cause

The mismatch has two separate causes.

### Persistence gap

`SupabaseLessonResolver.updateStage()` correctly changes `lesson_instances.status` to `completed` when all required Lesson stages are finished, but no corresponding code changed the frozen `daily_plans.status` from `in_progress` to `completed`.

The Daily Plan store already supports a `completed` status, and Today intentionally preserves a plan once it has started, so the stale `in_progress` value persisted indefinitely.

### Today CTA bug

The Today page used this mapping:

```text
planned → Start lesson
anything else → Resume lesson
```

Therefore a correctly completed Daily Plan would still have rendered **Resume lesson**.

## 3. Phase 1 completion boundary

The current Phase 1 Pilot intentionally reduces the day's reviewed work to exactly one reviewed two-node Lesson Request. Therefore, for this frozen P1 scope:

```text
single reviewed Pilot Lesson completed
→ Daily Plan completed
```

This fix deliberately does **not** define completion semantics for future multi-request Daily Plans.

Lesson completion remains separate from Mastery. A learner may complete the Lesson with an Exit Check result such as `9/10 · more practice needed`; that outcome can generate future Review work without keeping today's single Lesson plan open.

## 4. Implementation

### Daily Plan store

Added an idempotent server-side transition:

```text
in_progress → completed
```

A replay returns the already-completed row instead of duplicating or reopening work.

### Lesson completion

`completeLessonSummary()` now reconciles the referenced P1 Daily Plan after the Lesson reaches `completed`.

It also runs that reconciliation when the Lesson is already completed, so a retry can repair state safely.

### Today repair path

`getOrCreateTodaySnapshot()` now detects the exact stale Production state:

```text
P1 Daily Plan = in_progress
sole resolved Lesson = completed
```

and repairs the plan to `completed` before rendering Today. This is required for learners whose Lesson completed before this fix was deployed.

### Today UI

CTA mapping is now:

```text
planned      → Start lesson
in_progress  → Resume lesson
completed    → View lesson summary
```

Completed Today copy also makes clear that future Review remains scheduled separately.

## 5. Review-count interpretation

The observed `14 reviews upcoming` is read from the live Review queue, not from the Daily Plan completion flag. Upcoming Review work may legitimately remain after today's Lesson is complete.

This fix therefore does not zero or delete future Review Units. It only prevents future Review scheduling from being misrepresented as an unfinished Lesson.

## 6. Regression coverage

`test/lesson-exit-ui-db.integration.mts` now verifies:

1. a completed P1 Lesson also closes its Daily Plan;
2. replaying Lesson completion is idempotent;
3. the observed stale state can be simulated by forcing the completed Lesson's plan back to `in_progress`;
4. the next Today load repairs that stale plan to `completed`;
5. the `9/10` required-item-fail path can still complete the Lesson/plan without falsely declaring Mastery.

## 7. Verification gates

Before merge:

```text
PR validate                     PENDING
PR database-integration         PENDING
Vercel Preview                  PENDING
```

After merge:

```text
merged-main validate            PENDING
merged-main database-integration PENDING
Vercel Production               PENDING
real Production stale-plan repair PENDING
Today badge = Completed         PENDING
Today CTA = View lesson summary PENDING
```

The issue is not closed until the existing real Production learner refreshes Today and the stale state is visibly repaired.

## 8. Next step after verification

Once ISSUE-034 is Production verified, continue to **P1-PWA-001C physical iPhone validation**. Broad UI/UX polish remains after the mobile functional acceptance gate.
