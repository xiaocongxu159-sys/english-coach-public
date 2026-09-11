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
| ISSUE-031 | Production signup appeared to succeed but no confirmation email arrived | Repeated-signup false alarm resolved; fresh mail transport verified delivered; inbox/confirmation click pending |
| ISSUE-032 | Confirmed user can sign in but authenticated Today route reaches root error boundary | Open — runtime exception not yet captured |

Detailed Engine/UI/PWA context remains in:

- `docs/P1_ENGINE_001C_HANDOFF.md`
- `docs/P1_UI_001B_HANDOFF.md`
- `docs/P1_UI_001C_HANDOFF.md`
- `docs/P1_PWA_001_HANDOFF.md`
- `docs/P1_PWA_001B_HANDOFF.md`

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

### Impact

A deployed signup flow could appear healthy until the user opened the confirmation email, then fail outside the developer machine. This would create an environment-dependent Auth failure that normal application compilation could not detect.

### Root cause

Development convenience and production deployment requirements shared the same fallback behavior. Supabase URL/key configuration already failed fast when missing, but application-origin configuration did not.

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

### Impact

Two opposite mistakes were possible:

1. add an unplanned Service Worker/cache layer and create new stale-state/offline complexity simply to satisfy a generic checklist;
2. leave a real iPhone Home Screen icon compatibility risk because the app already “had a manifest.”

### Root cause

“PWA” is an umbrella term, while the project already froze an explicit Phase 1 physical-device acceptance contract. That contract requires Add to Home Screen, responsive flow, session persistence, interruption/resume and network error/retry; it does not require offline learning content.

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

### Verification

`test/pwa-manifest.test.mts` locks the manifest contract. Feature code CI #236, final PR CI #242 and merged-main CI #243 passed application and fresh-Supabase double-green, proving the PWA shell hardening did not alter Engine/UI persistence semantics.

### Remaining limitation

Only a real hosted HTTPS deployment on the user's physical iPhone can verify Add to Home Screen, standalone launch, session persistence, interruption/resume and actual network-retry behavior. That remains P1-PWA-001B/C.

---

## ISSUE-028 — Direct public conversion would expose historical repository metadata

**Date:** 2026-09-10  
**Module:** Repository governance / public CI migration  
**Status:** Resolved

### Problem

The historical private repository contained old Git commit metadata with a personal author email. Changing that repository's visibility directly to Public would expose its existing commit/branch/PR history, even though the current source tree itself did not contain an obvious live secret.

### Solution

A new public repository, `xiaocongxu159-sys/english-coach-public`, was created. PR #45 source was exported without `.git`, scanned, then committed as a brand-new root commit using GitHub noreply identity.

### Verification

The initial public root commit is `30fb6b5298f14654325ec7f0cefe93e163d451cf`; its source tree matches the selected PR #45 source tree while parents are empty. Public GitHub Actions passed both permanent jobs.

The old private repository remains private as historical/archive context.

---

## ISSUE-029 — PowerShell instructions were executed in Ubuntu Bash

**Date:** 2026-09-10  
**Module:** Repository migration procedure  
**Status:** Resolved / no remote impact

### Problem

An initial migration command block was written for PowerShell, but the active terminal was Ubuntu Bash. PowerShell-only commands such as `Set-Location` and `Remove-Item` were not recognized. Bash then initialized an accidental Git repository at `/home/ubuntu/.git` before the mistake was stopped.

### Risk

Running `git add .` from `/home/ubuntu` could have staged unrelated server files if allowed to continue. This was a local-only risk at that point; no public push occurred.

### Resolution

The terminal was stopped, `/home/ubuntu/.git` was explicitly removed, and the public repository was independently verified to remain empty. The migration was restarted with Ubuntu-only commands in isolated `/tmp/english-coach-*` directories.

### Prevention

For this project, server-side operational instructions must state and use the exact shell environment. Do not mix PowerShell and Bash syntax in the same operational path.

---

## ISSUE-030 — Broad secret scan produced false positives

**Date:** 2026-09-10  
**Module:** Repository migration safety scan  
**Status:** Resolved

### Problem

The first grep-based secret scanner matched ordinary project strings containing sequences such as `re_`, producing false positives in configuration names and learning-content fields.

### Resolution

The push was correctly blocked before any publication. The scanner was replaced with a boundary-aware Python pattern check for concrete credential formats including private keys, Supabase secret keys, Resend API keys, GitHub tokens, AWS access keys, Google API keys and JWT-shaped values.

The precise scan returned `PRECISE_SECRET_SCAN_OK` before the clean root commit was pushed.

---

## ISSUE-031 — Production signup appeared successful but no confirmation email arrived

**Date diagnosed:** 2026-09-11  
**Module:** P1-PWA-001B / hosted Supabase Auth signup smoke  
**Status:** Repeated-signup false alarm resolved; fresh mail transport verified delivered; inbox/confirmation click pending

### First observed behavior

The Production signup form returned:

```text
Check your email to confirm your account.
```

but no confirmation email was visible.

### First root cause

The initial smoke reused an already-registered email. Unified Supabase Auth audit logs showed:

```text
action = user_repeated_signup
```

That attempt did not create a new user and therefore was not a valid first-signup delivery test.

### Fresh-account evidence

A never-before-registered address was then used.

Production SQL showed:

- second Auth user created;
- second learner profile created automatically;
- `users_missing_profile = 0`;
- fresh user's `confirmation_sent_at` populated;
- fresh user's `email_confirmed_at` remained null;
- fresh user's `last_sign_in_at` remained null.

Resend logs independently showed a matching confirmation transaction with status `delivered`. The confirmation URL targets the production `/auth/confirm` route. Recipient address, message ID and token are omitted from this public document.

### Current conclusion

The Auth mail transport is healthy for the fresh test:

```text
Supabase generates confirmation
→ SMTP handoff
→ Resend accepts/sends
→ recipient mail server accepts (delivered)
```

The message was not initially visible in the mailbox UI, so the remaining task is inbox/filtering discovery and then confirmation-link acceptance. This is not evidence of an SMTP outage.

### Current action

Search the mailbox by sender/subject and check Spam, All Mail and Promotions. Do not change SMTP while transport is already proven delivered.

---

## ISSUE-032 — Confirmed user signs in but Today route reaches root error boundary

**Date opened:** 2026-09-11  
**Module:** P1-PWA-001B / hosted authenticated Today smoke  
**Status:** Open — runtime exception not yet captured

### Observed behavior

A previously confirmed account can authenticate successfully. Immediately after sign-in, `/` renders the root error boundary:

```text
Connection problem
We could not load this step.
```

The user's `last_sign_in_at` updates, proving the failure is after Auth sign-in.

### Evidence collected

Read-only production checks prove:

- Auth user exists and is confirmed;
- learner profile exists;
- no user is missing a learner profile;
- Phase 1 Pilot blueprint exists and is active;
- both exact Pilot nodes exist and are active;
- upgraded Review schema exists;
- old account `daily_plan_count = 0`;
- old account `review_unit_count = 0` in the observed result.

### Ruled-out hypothesis

The failure is **not** caused by deserializing a stale pre-migration Daily Plan, because no Daily Plan exists for the affected account.

### Next evidence gate

Do not mutate production rows yet.

Reproduce once by pressing **Retry**, then immediately inspect Vercel Production runtime logs for the matching `/` request and capture the actual server exception/stack. The digest shown to the learner is insufficient by itself to choose a safe fix.

Only after the runtime exception is known should a code or data change be proposed.

---

## Current open / accepted deployment limitations

- P1-PWA-001A is COMPLETE / merged-main verified;
- P1-PWA-001B repository migration, public CI and Vercel production path are verified;
- repeated-signup false alarm is resolved;
- fresh Supabase signup + learner-profile creation is verified;
- confirmation email transport is verified through Resend `delivered`, but inbox discovery/confirmation click remains pending;
- ISSUE-032 authenticated Today runtime error is open;
- physical iPhone Home Screen/install/session/interruption/network-retry tests are pending;
- full deployed P1-E2E-001 remains pending.
