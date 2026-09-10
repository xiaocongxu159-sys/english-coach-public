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

Detailed Engine/UI/PWA context remains in:

- `docs/P1_ENGINE_001C_HANDOFF.md`
- `docs/P1_UI_001B_HANDOFF.md`
- `docs/P1_UI_001C_HANDOFF.md`
- `docs/P1_PWA_001_HANDOFF.md`

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

`signup()` now derives `emailRedirectTo` from this helper.

### Verification

`test/app-url.test.mts` permanently covers development fallback, production missing-variable rejection, HTTP rejection, normalized HTTPS and malformed/path/query/hash rejection. Feature code CI #236, final PR CI #242 and merged-main CI #243 all passed application + fresh-Supabase. PR #38 squash-merged as `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`.

### Remaining limitation

The actual hosted production origin and confirmation email behavior still require P1-PWA-001B deployment verification.

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

## Current open / accepted deployment limitations

- ISSUE-007: physical iPhone validation still requires a reachable HTTPS deployment;
- P1-PWA-001A is COMPLETE / merged-main verified;
- hosted Supabase project is not yet connected;
- production secrets and hosted Auth URLs/template are not configured;
- hosted migration + reviewed seed have not run;
- Vercel production deployment does not yet exist;
- hosted signup/confirmation smoke is not verified;
- physical iPhone Home Screen/install/session/interruption/network-retry tests are pending;
- full deployed P1-E2E-001 remains pending.