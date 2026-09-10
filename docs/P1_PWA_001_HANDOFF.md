# P1-PWA-001 Handoff

**Updated:** 2026-09-10  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**P1-PWA-001A:** COMPLETE / MERGED-MAIN VERIFIED  
**P1-PWA-001B:** PARTIALLY COMPLETE — repository/CI/Vercel migration verified; confirmation-email smoke BLOCKED  
**P1-PWA-001C:** PENDING — physical iPhone validation  
**Canonical repository:** `xiaocongxu159-sys/english-coach-public`  
**Detailed current handoff:** `docs/P1_PWA_001B_HANDOFF.md`

## 1. Purpose

P1-PWA-001 proves that the verified server-authoritative learning loop works as a real hosted, iPhone-first product without weakening Auth/RLS, deterministic scoring, Mastery, Review or persistence guarantees.

Target learner path:

```text
hosted HTTPS app
→ signup / confirm / login
→ Today
→ reviewed Lesson
→ deterministic Attempt / Evidence / Mastery / Review
→ return / refresh / relogin
→ Today reflects persisted state
→ physical iPhone Home Screen validation
```

## 2. P1-PWA-001A — COMPLETE

001A hardened deployment/PWA readiness:

- production app-origin validation;
- stable root manifest `id`, `scope`, `start_url`;
- standalone display and `purpose: any` icon;
- Apple web-app metadata and safe-area/phone layout support;
- 44px minimum common form controls;
- learner-facing Retry behavior;
- no unplanned Service Worker/offline cache;
- permanent app-origin and manifest tests.

Release history remains preserved in Git and the Development Log. The original 001A release was PR #38, merged as `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`, with application + fresh-Supabase CI green.

## 3. Auth configuration supersession note

The original 001A implementation added `emailRedirectTo` in `signup()` using the validated application origin.

That specific behavior was **later intentionally superseded** by old private PR #44:

```text
fix: make Supabase Site URL the confirmation source of truth
```

PR #44 removed application-level `emailRedirectTo` from both signup and resend flows. Therefore the current production system relies on hosted Supabase Auth Site URL + email-template configuration for the confirmation destination.

Current application behavior is intentionally:

```text
signup()
→ supabase.auth.signUp(... without emailRedirectTo)
→ hosted Supabase Auth chooses confirmation destination
```

The confirmation endpoint remains application-owned:

```text
/auth/confirm?token_hash=<hash>&type=email
→ verifyOtp()
→ /verify-email?status=success|error
```

Old private PR #45 added the explicit `/verify-email` success/error page.

This supersession is important because older 001A documentation stated that `signup()` still passed `emailRedirectTo`; that statement is no longer true in the current production code.

## 4. P1-PWA-001B — verified portion

The repository/CI/Vercel portion is complete and verified:

```text
old private repository retained as archive
→ clean source snapshot exported without old .git history
→ new public repository created
→ secret/privacy scan passed
→ GitHub noreply commit identity
→ public GitHub Actions runs successfully
→ Vercel existing project reconnected to english-coach-public/main
→ Production deployment Ready
```

Canonical repository:

```text
xiaocongxu159-sys/english-coach-public
```

Initial clean snapshot:

```text
30fb6b5298f14654325ec7f0cefe93e163d451cf
```

Production trigger commit:

```text
d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca
```

Initial public CI run `34459279725` passed both permanent jobs. Documentation PR #1 was later squash-merged as `7642800b54939d203c83ab80352ec3f063f9ba3a`, and merged-main CI run `34482865644` again passed `validate` and `database-integration`.

## 5. P1-PWA-001B — current blocker

Real hosted signup currently reaches:

```text
Create account
→ “Check your email to confirm your account.”
```

but the confirmation email was not received.

That means hosted signup/confirmation/login/Today smoke is not complete yet.

Do not infer that GitHub Public visibility caused the mail failure. GitHub repository visibility does not control Supabase SMTP delivery. Diagnose the hosted mail path directly.

Required order:

```text
1. Supabase Authentication → Users
2. Supabase Auth Logs
3. Supabase SMTP configuration
4. Resend delivery/request logs
5. narrow fix only after root cause is proven
6. repeat signup → email → confirm → login → Today
```

Do not expose SMTP passwords, API keys or service-role values.

## 6. P1-PWA-001B completion gate

001B is COMPLETE only when:

- public `main` CI green;
- Vercel Production from public `main` Ready;
- new learner signup works;
- confirmation email is delivered;
- confirmation opens explicit `Email verified` state;
- learner signs in;
- learner reaches Today.

Current status:

```text
repository migration      PASS
public CI                 PASS
Vercel Git migration      PASS
Production deployment     PASS
signup accepted           PASS
confirmation delivery     BLOCKED
verification result       PENDING
login                     PENDING
Today                     PENDING
```

## 7. P1-PWA-001C — physical iPhone target

Only after 001B hosted desktop smoke passes:

- open final HTTPS URL;
- Add to Home Screen;
- launch standalone;
- verify auth/session persistence;
- verify Today/Lesson/Review touch/responsive behavior;
- interrupt and reopen Lesson/Review;
- test network interruption then Retry;
- confirm authoritative persisted state resumes correctly.

## 8. Final Phase 1 gate

After P1-PWA-001 passes, run P1-E2E-001:

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

Only deployed E2E + physical iPhone verification may close Phase 1.

## 9. Documentation rule

Each completed slice must update its handoff and Development Log in the same work cycle. Any issue/root cause/solution must also be recorded in `docs/ISSUES_AND_SOLUTIONS.md` before the slice is marked complete.