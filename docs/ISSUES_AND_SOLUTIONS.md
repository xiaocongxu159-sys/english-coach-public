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
| ISSUE-031 | Production signup appeared to succeed but no confirmation email arrived | Root cause proven: repeated signup of existing account; fresh-account smoke still pending |

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
**Status:** Root cause proven; fresh-account acceptance test still pending

### Observed behavior

The Production signup form returned:

```text
Check your email to confirm your account.
```

but no new confirmation email arrived.

### Evidence

Read-only production diagnostics showed:

1. `Authentication → Users` contained only the pre-existing account; no new user was created by the test attempt.
2. Unified Supabase Auth audit logs for the attempted signup contained:

```text
action = user_repeated_signup
```

3. The audit event actor matched the already-existing account used for the test.

### Root cause

The smoke test reused an email address that was already registered. Supabase intentionally treats repeated signup in a way that avoids revealing whether an account exists. The application-level `signUp()` call therefore did not surface a normal “already registered” error to the learner-facing UI, and the page continued to show the generic confirmation-email message.

This was **not evidence of a Public GitHub repository regression**, Vercel deployment failure, or SMTP outage.

### Resolution / next acceptance test

No SMTP, Resend, Vercel or application-code change is justified from this incident.

The next test must use an email address that has never been registered in this Supabase project:

```text
fresh email
→ Create account
→ new user appears with current Created at timestamp
→ confirmation email arrives
→ open confirmation link
→ explicit /verify-email success state
→ sign in
→ authenticated Today
```

Only if that fresh-account test creates a new unconfirmed user but the email still fails to arrive should SMTP/Resend delivery diagnostics resume.

### Prevention

Production Auth smoke procedures must distinguish:

- **fresh-signup test** — always use a never-before-registered address;
- **existing-account test** — use sign-in or password-recovery/resend behavior appropriate to that account state, not signup.

Do not use an existing confirmed account to test first-time signup email delivery.

---

## Current open / accepted deployment limitations

- P1-PWA-001A is COMPLETE / merged-main verified;
- P1-PWA-001B repository migration, public CI and Vercel production path are verified;
- ISSUE-031 root cause is proven as repeated signup of an existing account; fresh-account delivery/confirmation smoke is still pending;
- hosted fresh signup/confirmation/login/Today smoke is not yet complete;
- physical iPhone Home Screen/install/session/interruption/network-retry tests are pending;
- full deployed P1-E2E-001 remains pending.
