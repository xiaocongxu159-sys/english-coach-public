# Phase 1 Implementation Handoff

**Date:** 2026-09-10  
**Canonical repository:** `xiaocongxu159-sys/english-coach-public`  
**Current production branch:** `main`  
**Current verified main:** `7642800b54939d203c83ab80352ec3f063f9ba3a`  
**Merged-main CI:** run `34482865644` — `validate` PASS + `database-integration` PASS  
**Current module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Current slice:** P1-PWA-001B — PARTIALLY COMPLETE; repository/CI/Vercel migration verified, production confirmation-email smoke BLOCKED  
**Detailed current handoff:** `docs/P1_PWA_001B_HANDOFF.md`

## 1. Phase 1 objective

Phase 1 succeeds only when the trusted local learning loop also works as a deployed product:

```text
signup / confirm / login
→ Today
→ reviewed Lesson
→ deterministic Attempts
→ Evidence
→ Mastery
→ exactly-once FSRS Review
→ return / relogin
→ Today reflects persisted state
→ physical iPhone Home Screen validation
```

Phase 1 is **not complete**. Hosted repository/CI/Vercel delivery is working, but confirmation-email delivery is currently unresolved. Physical iPhone validation and the final deployed E2E gate remain pending.

## 2. Frozen learner truth

- Only the reviewed two-node A1 Pilot is learner-active:
  - `CF-A1-SOCIAL-GREET-01`
  - `VX-A1-SOCIAL-FORMULAS-01`
- Remaining curriculum registry nodes remain `draft`.
- Current scored state-changing truth remains deterministic reviewed content.
- Live AI scoring must not create Mastery/Review truth in Phase 1.
- Speaking rehearsal remains practice-only until a validated speech evaluator exists.

## 3. Completed implementation modules

- **P1-BOOT-001 — COMPLETE**: reproducible Next.js/TypeScript/Node 24 application shell and permanent CI.
- **P1-DATA-001 — COMPLETE**: deterministic 735-node curriculum registry and graph validation.
- **P1-DB-001 — COMPLETE**: Supabase Auth, migrations, RLS, and browser/server/service-role boundaries.
- **P1-PILOT-001 — COMPLETE**: reviewed prerequisite-free two-node A1 Pilot.
- **P1-ENGINE-001 — COMPLETE / MERGED-MAIN VERIFIED**: Curriculum → Daily Plan → Lesson → Attempt → Evidence → Mastery → exactly-once FSRS Review.
- **P1-UI-001 — COMPLETE / MERGED-MAIN VERIFIED**: Today + Lesson + Review + live later-Today review reflection.
- **P1-PWA-001A — COMPLETE / MERGED-MAIN VERIFIED**: deployable PWA shell hardening, app-origin validation, iPhone-compatible manifest, retry surface and touch-target readiness.

Detailed historical handoffs remain in:

- `docs/P1_ENGINE_001C_HANDOFF.md`
- `docs/P1_UI_001B_HANDOFF.md`
- `docs/P1_UI_001C_HANDOFF.md`
- `docs/P1_PWA_001_HANDOFF.md`

## 4. Public-repository migration — VERIFIED

The original repository `xiaocongxu159-sys/english-coach` remains private as historical/archive material because its Git history contains personal commit metadata that should not be exposed publicly.

The active repository is now:

```text
xiaocongxu159-sys/english-coach-public
```

Migration used a clean snapshot rather than a fork/mirror:

```text
old private PR #45 source state
→ export source without .git
→ sensitive-file + secret-pattern scans
→ brand-new Git history
→ GitHub noreply identity
→ public repository
```

Initial public root commit:

```text
30fb6b5298f14654325ec7f0cefe93e163d451cf
```

The source tree matched old PR #45 head `d2736c3ab666959b3bd8831ed6386e13191fcb6e`, so the application code was preserved without carrying the old Git history.

## 5. Public CI — VERIFIED

The clean public repository runs GitHub-hosted Actions successfully.

Initial public CI run `34459279725` passed:

```text
validate              PASS
database-integration  PASS
```

The documentation release PR #1 was squash-merged as:

```text
7642800b54939d203c83ab80352ec3f063f9ba3a
```

Merged-main CI run `34482865644` also passed:

```text
validate              PASS
database-integration  PASS
```

Therefore the public repository is the verified canonical development repository.

## 6. Vercel production delivery — VERIFIED

The existing Vercel project `english-coach` was preserved. It was not recreated.

The Git connection was changed from the old private repository to:

```text
xiaocongxu159-sys/english-coach-public
```

Production branch remains:

```text
main
```

The existing environment-variable names were preserved for Production and Preview:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Secret values are intentionally not recorded in Git documentation.

A no-code-change commit was used to trigger the first deployment after reconnecting Git:

```text
d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca
chore: trigger Vercel deployment
```

Vercel reported Production `Ready`, and GitHub reported Vercel status `success`.

Verified delivery chain:

```text
english-coach-public/main
→ GitHub Actions
→ Vercel Git integration
→ Production
```

## 7. Hosted Auth source of truth — CURRENT

Important supersession note:

P1-PWA-001A originally added application-level `emailRedirectTo` using `getAppUrl()`. That behavior was intentionally superseded later by old private PR #44, **“fix: make Supabase Site URL the confirmation source of truth.”**

Current `signup()` and resend logic do **not** pass `emailRedirectTo` to Supabase. Production confirmation destination is therefore controlled by hosted Supabase Auth configuration and the confirmation email template.

Current server-owned confirmation path remains:

```text
/auth/confirm?token_hash=<hash>&type=email
→ verifyOtp()
→ /verify-email?status=success|error
```

Old private PR #45 added the explicit `/verify-email` result screen; it did not replace Supabase Auth email delivery.

## 8. Current blocker — confirmation email not received

Observed after the public-repository Production deployment:

```text
Create account
→ application shows “Check your email to confirm your account.”
→ confirmation email not received
```

The success message only proves that `supabase.auth.signUp(...)` returned without an immediate application-level error. It does not prove downstream mail delivery.

The repository visibility change itself does not control Supabase SMTP delivery. The remaining investigation must focus on the hosted Auth/mail path.

Required diagnostic order:

```text
1. Supabase Authentication → Users
   verify whether the new test user exists and whether email is unconfirmed

2. Supabase Auth Logs
   inspect the exact signup event for SMTP / delivery / rate-limit errors

3. Supabase SMTP configuration
   compare current configuration with the previously configured Resend SMTP state

4. Resend delivery/request logs
   determine whether Supabase attempted to hand the message to Resend and whether Resend accepted/rejected it

5. Only after root cause is proven
   make the narrowest configuration/code fix and repeat real signup → email → confirm → login → Today
```

Do not expose SMTP passwords, API keys, service-role keys or other secrets in screenshots or Git.

## 9. Remaining P1-PWA-001B acceptance

P1-PWA-001B can be marked COMPLETE only when all are true:

- Production HTTPS app reachable — **PASS**
- Public repository CI green — **PASS**
- Vercel Production deployment from public `main` Ready — **PASS**
- New learner signup accepted — **PASS**
- Confirmation email delivered — **BLOCKED**
- Confirmation link opens `/verify-email` success state — **PENDING**
- Learner can sign in — **PENDING**
- Learner reaches authenticated Today — **PENDING**

## 10. Next slices

After P1-PWA-001B passes:

**P1-PWA-001C — physical iPhone validation**

```text
open final HTTPS origin
→ Add to Home Screen
→ standalone launch
→ auth/session persistence
→ Today/Lesson/Review phone usability
→ interrupt/reopen Lesson and Review
→ network interruption + Retry
→ verify authoritative state resumes
```

Then run **P1-E2E-001** on the deployed environment:

```text
signup/confirm/login
→ Today
→ Lesson
→ deterministic Attempts
→ Evidence/Mastery/Review
→ leave/relogin
→ due Review
→ Review submission
→ later Today reflects update
```

Only those gates may close Phase 1 and allow Phase 2.

## 11. Mandatory documentation discipline

A slice is not formally complete merely because code or configuration works.

Every slice must follow:

```text
implementation/configuration
→ verification evidence
→ module HANDOFF update
→ DEVELOPMENT_LOG update
→ ISSUES_AND_SOLUTIONS update when applicable
→ PR CI
→ merge
→ merged-main CI
→ only then mark COMPLETE
```

If a blocker appears before completion, record the verified completed portion, the blocker, evidence, and the exact next diagnostic step in the same work cycle.