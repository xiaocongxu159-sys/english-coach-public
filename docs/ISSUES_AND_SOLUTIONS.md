# Issues and Solutions

This is the active project issue ledger. Full pre-P1-UI historical issue prose is preserved under `docs/archive/ISSUES_AND_SOLUTIONS_BEFORE_P1_UI_COMPLETE.md`; current module handoffs preserve detailed implementation context.

## Historical issue index

| ID | Issue | Status |
| --- | --- | --- |
| ISSUE-001 | Curriculum source is not the same as a ready-made syllabus | Resolved by design |
| ISSUE-002 | Risk of AI-generated ambiguous scored questions | Mitigated by design |
| ISSUE-003 | Premature numeric mastery threshold in schema example | Resolved |
| ISSUE-004 | Next.js PWA manifest icon purpose failed typecheck | Resolved |
| ISSUE-005 | ESLint 10 incompatible with current Next.js React lint plugin | Resolved — Biome adopted |
| ISSUE-006 | Bootstrap lockfile needed a trustworthy reproducible source | Resolved |
| ISSUE-007 | Physical iPhone smoke requires a reachable deployment | Accepted limitation / P1-PWA gate |
| ISSUE-008 | One-time curriculum registry write-back had a concurrent CI race | Resolved |
| ISSUE-009 | Login action buttons failed accessibility lint | Resolved |
| ISSUE-010 | Supabase lockfile bootstrap rebase blocked by generated build files | Resolved |
| ISSUE-011 | Supabase local SMTP config has a temporary upstream compatibility mismatch | Accepted temporary warning |
| ISSUE-012 | Email-confirmation callback accepted unnecessary dynamic redirect target | Resolved before merge |
| ISSUE-013 | Biome recommended-rule syntax became deprecated while still passing lint | Resolved |
| ISSUE-014 | Green Pilot CI did not prove curriculum-semantic correctness | Resolved / release-verified |
| ISSUE-015 | `ts-fsrs` Rating broader than `next()` Grade contract | Resolved |
| ISSUE-016 | Review RPC initially trusted service-layer source binding too much | Resolved |
| ISSUE-017 | Generic scheduler output not always executable by reviewed Pilot | Resolved |
| ISSUE-018 | Started Daily Plan could be downgraded by stale concurrent replan | Resolved |
| ISSUE-019 | Lesson stage checkpoints could lose concurrent progress | Resolved |
| ISSUE-020 | Forbidden browser Lesson write returned DB permission error, not zero rows | Resolved in test |
| ISSUE-021 | Exit Gate failure could create unrecoverable Lesson dead-end | Resolved for Pilot |
| ISSUE-022 | Review queue actionability was not equal to executable Review eligibility | Resolved / main verified |
| ISSUE-023 | Stacked Review PR did not trigger normal PR CI and polluted child diff | Resolved |
| ISSUE-024 | Review answer `autoFocus` failed accessibility lint | Resolved |
| ISSUE-025 | Frozen Daily Plan conflicted with current Review state on Today | Resolved / main verified |
| ISSUE-026 | Production signup callback could silently fall back to localhost | Resolved / main verified |
| ISSUE-027 | Generic PWA checklist pressure conflicted with frozen iPhone contract | Resolved by scope + compatibility hardening; physical verification pending |
| ISSUE-028 | Directly publicizing the historical private repository would expose old metadata/history | Resolved with clean-snapshot public repository |
| ISSUE-029 | PowerShell instructions were accidentally executed in Ubuntu Bash | Resolved; accidental `/home/ubuntu/.git` removed before any push |
| ISSUE-030 | First migration secret scan produced broad false positives | Resolved with boundary-aware precise scanner |
| ISSUE-031 | Production signup appeared to succeed but no confirmation email arrived | Resolved — repeated-signup false alarm separated; fresh signup/delivery/callback verified, Gmail Spam placement observed |
| ISSUE-032 | Authenticated Today route reached root error boundary in Production | Resolved / Production verified — static scheduler/review config imports |
| ISSUE-033 | Lesson exercise submission reached root error boundary in Production | Resolved / Production verified — static Mastery config import |

Detailed Engine/UI/PWA context remains in:

- `docs/P1_ENGINE_001C_HANDOFF.md`
- `docs/P1_UI_001B_HANDOFF.md`
- `docs/P1_UI_001C_HANDOFF.md`
- `docs/P1_PWA_001_HANDOFF.md`
- `docs/P1_PWA_001B_HANDOFF.md`
- `docs/P1_PWA_001B_TODAY_RUNTIME_FIX_HANDOFF.md`
- `docs/P1_PWA_001B_LESSON_RUNTIME_FIX_HANDOFF.md`

---

## ISSUE-026 — Production signup callback could silently fall back to localhost

**Date:** 2026-09-03  
**Module:** P1-PWA-001A / production Auth callback  
**Status:** Resolved / merged-main verified

### Problem

`signup()` previously used:

```text
NEXT_PUBLIC_APP_URL ?? http://localhost:3000
```

That fallback is convenient in local development but unsafe as a production default. If the production environment omitted `NEXT_PUBLIC_APP_URL`, account confirmation email generation could succeed while pointing the learner back to localhost.

### Final solution

Added application-owned `getAppUrl()` validation:

- development may fall back to localhost;
- production requires an explicit value;
- production requires HTTPS;
- only absolute http/https origins are accepted;
- credentials, query, hash and nested paths are rejected;
- value is normalized to the origin.

`signup()` used this helper at the P1-PWA-001A release. That application-level `emailRedirectTo` behavior was later intentionally superseded by old private PR #44, which made hosted Supabase Site URL the confirmation source of truth.

### Verification

`test/app-url.test.mts` permanently covers development fallback, production missing-variable rejection, HTTP rejection, normalized HTTPS and malformed/path/query/hash rejection. Feature code CI #236, final PR CI #242 and merged-main CI #243 all passed application + fresh-Supabase. PR #38 squash-merged as `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`.

---

## ISSUE-027 — Generic “PWA checklist” pressure conflicted with the frozen Phase 1 iPhone contract

**Date:** 2026-09-03  
**Module:** P1-PWA-001A / iPhone web-app readiness  
**Status:** Resolved by scope + compatibility hardening; physical verification pending

### Problem

The repository had a Web App Manifest and Apple web-app metadata but no Service Worker. A superficial PWA audit could therefore conclude that an offline cache must be added before iPhone validation.

At the same time, the existing manifest exposed its only icon as `purpose: "maskable"`, a weaker compatibility choice for older iOS manifest-icon handling than an icon whose purpose includes `any`.

### Final solution

Use the project contract rather than an external generic checklist:

- do **not** add Service Worker/offline cache in Phase 1;
- do not claim offline support;
- freeze manifest `id`, `scope`, `start_url` and standalone display at `/`;
- expose the existing SVG icon with `purpose: "any"`;
- keep Apple web-app metadata, safe-area layout and phone responsive rules;
- add permanent manifest tests;
- add learner-facing Retry for route/network failure;
- enforce 44px minimum height for common button/input/select controls.

### Remaining limitation

Only a real hosted HTTPS deployment on the user's physical iPhone can verify Add to Home Screen, standalone launch, session persistence, interruption/resume and actual network-retry behavior. That remains P1-PWA-001C.

---

## ISSUE-028 — Direct public conversion would expose historical repository metadata

**Date:** 2026-09-10  
**Module:** Repository governance / public CI migration  
**Status:** Resolved

### Problem

The historical private repository contained old Git commit metadata with a personal author email. Changing that repository's visibility directly to Public would expose its existing commit/branch/PR history.

### Solution

A new public repository, `xiaocongxu159-sys/english-coach-public`, was created. The selected reviewed source was exported without `.git`, scanned, then committed as a brand-new root commit using GitHub noreply identity.

The old private repository remains private as archive/history.

---

## ISSUE-029 — PowerShell instructions were executed in Ubuntu Bash

**Date:** 2026-09-10  
**Module:** Repository migration procedure  
**Status:** Resolved / no remote impact

### Problem

PowerShell-only commands were initially pasted into Ubuntu Bash, creating an accidental local `/home/ubuntu/.git` before the procedure was stopped.

### Resolution

The accidental Git directory was removed before any public push. The migration restarted in isolated `/tmp/english-coach-*` directories using Ubuntu/Bash commands only.

### Prevention

Operational instructions must state and use the exact shell environment. Do not mix PowerShell and Bash syntax.

---

## ISSUE-030 — Broad secret scan produced false positives

**Date:** 2026-09-10  
**Module:** Repository migration safety scan  
**Status:** Resolved

### Problem

The first grep-based secret scanner matched ordinary project strings and produced false positives.

### Resolution

The push was blocked before publication. The scanner was replaced with boundary-aware checks for concrete credential formats. The precise scan passed before the clean root commit was pushed.

---

## ISSUE-031 — Production signup appeared successful but no confirmation email arrived

**Date closed:** 2026-09-11  
**Module:** P1-PWA-001B / hosted Supabase Auth signup smoke  
**Status:** Resolved

### First root cause

The initial smoke reused an already-registered email. Supabase Auth audit logs showed:

```text
user_repeated_signup
```

That was not a valid fresh-signup mail-delivery test.

### Fresh-account evidence

A never-before-registered address then created a second Auth user and learner profile. `confirmation_sent_at` populated, Resend showed `delivered`, and the confirmation link targeted the production callback.

### Final verification

The learner found the confirmation message in Gmail Spam, opened it, clicked **Confirm email address**, and reached:

```text
Email verified
Your email address has been confirmed successfully.
```

The hosted chain is verified:

```text
fresh signup
→ Auth user + learner profile
→ confirmation generation
→ SMTP / Resend delivered
→ Gmail receipt
→ /auth/confirm
→ verifyOtp
→ /verify-email success
```

Gmail Spam placement is a deliverability/reputation observation, not an SMTP transport failure.

---

## ISSUE-032 — Authenticated Today route reached root error boundary in Production

**Date closed:** 2026-09-11  
**Module:** P1-PWA-001B / hosted authenticated Today smoke  
**Status:** Resolved / Production verified

### Observed behavior

Both an existing confirmed learner and a newly confirmed learner could authenticate, but `/` reached the root error boundary.

Vercel captured:

```text
GET / → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

Supabase request logs showed the Today read chain succeeding with HTTP 200, ruling out the primary database/auth hypotheses.

### Root cause

`daily-scheduler-v1.config.json` and `review-v1.config.json` were loaded with runtime `import.meta.url` + `readFileSync()` logic that worked in local/CI Node but was unsafe inside the bundled Vercel server runtime.

### Solution

Convert both immutable JSON configuration loaders to static JSON imports so they are included in the server bundle.

### Production verification

After CI, merge and deployment, the fresh learner loaded Today successfully and saw the expected reviewed Phase 1 plan:

```text
35 min profile budget
14 minutes reviewed work
2 new nodes
0 reviews ready now
0 reviews upcoming
```

The learner then started the Lesson successfully. ISSUE-032 is resolved.

---

## ISSUE-033 — Lesson exercise submission reached root error boundary in Production

**Date closed:** 2026-09-11  
**Module:** P1-PWA-001B / hosted Lesson progression  
**Status:** Resolved / Production verified

### Observed behavior

After Today loaded and the reviewed Lesson started, a later Lesson server-action POST failed:

```text
POST /lesson/<lesson-instance-id> → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

The learner-facing error boundary showed Reference `246545820`.

### Root cause

Deterministic exercise submission reaches `submitExerciseAttempt()`, which loads Mastery configuration through `getMasteryConfig()`.

`mastery-v1.config.json` still used the same runtime `import.meta.url` + `readFileSync()` pattern.

### Solution

Replace the remaining runtime filesystem Mastery loader with a static JSON import. No Mastery thresholds, scoring rules, Review semantics, learner rows or Lesson checkpoints changed.

### Verification

PR #6 passed:

```text
validate                  PASS
database-integration      PASS
Vercel Preview            PASS
```

and squash-merged to main as:

```text
557acfb43944490f991fb1f723299cce70e4e8d8
```

Merged-main `validate`, `database-integration` and Vercel Production passed.

The learner then resumed the same Production Lesson and completed it:

```text
8/8 stages
Lesson complete
Exit check: 9/10 · more practice needed
```

No account reset, Lesson reset or Production data rewrite was required. This confirms the prior Lesson POST runtime failure is resolved and persisted Lesson state survives interruption/redeployment.

---

## Current open / accepted deployment limitations

- P1-PWA-001A is COMPLETE / merged-main verified;
- P1-PWA-001B hosted desktop/browser Production smoke is COMPLETE / Production verified;
- ISSUE-031 Auth confirmation is resolved;
- ISSUE-032 Today runtime failure is resolved;
- ISSUE-033 Lesson/Mastery runtime failure is resolved;
- Gmail Spam placement remains a deliverability/reputation observation;
- P1-PWA-001C physical iPhone Home Screen/install/session/interruption/network-retry validation is pending;
- full deployed P1-E2E-001 remains pending.
