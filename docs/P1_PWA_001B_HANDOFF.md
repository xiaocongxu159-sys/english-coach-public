# P1-PWA-001B Handoff

**Date:** 2026-09-10  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Slice:** P1-PWA-001B — hosted environment, public-repository migration and production deployment  
**Status:** PARTIALLY COMPLETE — repository/CI/Vercel migration verified; hosted email-confirmation smoke BLOCKED  
**Canonical repository:** `xiaocongxu159-sys/english-coach-public`  
**Production branch:** `main`  
**Initial clean public snapshot:** `30fb6b5298f14654325ec7f0cefe93e163d451cf`  
**Production trigger commit:** `d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca`  
**Documentation release:** PR #1 squash-merged as `7642800b54939d203c83ab80352ec3f063f9ba3a`  
**Merged-main CI:** run `34482865644` — `validate` PASS + `database-integration` PASS

## 1. Repository migration decision

The original `xiaocongxu159-sys/english-coach` repository remains private because historical Git metadata contains a personal commit email. Directly changing that repository to Public would have exposed old commit/branch/PR history.

Migration therefore used:

```text
old private repository retained
→ exact old PR #45 source state selected
→ source exported without .git
→ sensitive-file and secret-pattern scans
→ brand-new Git history
→ GitHub noreply identity
→ new public repository
```

The old private repository is archive/history only. New development and Production delivery use `english-coach-public`.

## 2. Exact source state migrated

Old private PR #45 head:

```text
d2736c3ab666959b3bd8831ed6386e13191fcb6e
```

Source tree:

```text
0a76c785d4854e85361bb354e02cbdb3e06821c8
```

The clean public root commit pointed to the same source tree, preserving application content while removing old Git history.

PR #45 added the explicit verification result path:

```text
/auth/confirm
→ /verify-email?status=success|error
→ explicit Email verified / Verification failed page
```

## 3. Public privacy and secret checks

Verified before first public push:

- no tracked `.env`, `.env.local`, `.env.production`, private-key PEM or key file;
- no detected Supabase secret, Resend API key, GitHub token, AWS key, Google API key, JWT or private key material;
- `.env.example` contains placeholders only;
- `.gitignore` excludes `.env*` except `.env.example`, `.vercel`, PEM and local/generated paths;
- initial public history contained one root commit;
- commit identity used `users.noreply.github.com`;
- GitHub account email privacy and private-email push blocking were enabled.

No secret values are recorded here.

## 4. Public CI verification

Initial public CI run:

```text
34459279725
```

Result:

```text
validate              PASS
database-integration  PASS
```

The documentation handoff release was then merged through Public PR #1:

```text
7642800b54939d203c83ab80352ec3f063f9ba3a
```

Merged-main CI run:

```text
34482865644
```

Result:

```text
validate              PASS
database-integration  PASS
```

Therefore the Public repository and documentation baseline are merged-main verified.

## 5. Vercel Git migration

The existing Vercel project `english-coach` was preserved. Domains/project configuration were not intentionally recreated.

Sequence:

```text
disconnect old private Git repository
→ grant Vercel GitHub App access to english-coach-public
→ connect xiaocongxu159-sys/english-coach-public
→ keep Production branch main
→ preserve existing Vercel project environment variables
```

Environment-variable names present for Production and Preview:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Values remain secret and are not stored in Git documentation.

Because the initial public snapshot predated the new Vercel Git connection, a no-code-change commit was created to trigger Production:

```text
d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca
chore: trigger Vercel deployment
```

Vercel reported Production `Ready`, and GitHub reported Vercel `success`.

Verified path:

```text
english-coach-public/main
→ GitHub Actions
→ Vercel Git integration
→ Production
```

## 6. Auth source-of-truth clarification

Older P1-PWA-001A documentation stated that `signup()` passed `emailRedirectTo` built from `getAppUrl()`.

That was true at the 001A release commit, but it was later intentionally superseded by old private PR #44:

```text
fix: make Supabase Site URL the confirmation source of truth
```

PR #44 removed `emailRedirectTo` from both:

- `supabase.auth.signUp(...)`
- `supabase.auth.resend(...)`

Current production confirmation destination therefore depends on hosted Supabase Auth Site URL and the confirmation-email template. This is intentional current code, not an accidental omission from the public migration.

The application still owns confirmation verification/result handling:

```text
/auth/confirm?token_hash=<hash>&type=email
→ Supabase verifyOtp()
→ /verify-email?status=success|error
```

## 7. Hosted signup/email smoke — current blocker

Real Production signup was attempted after the Public-repository deployment.

Observed:

```text
Create account
→ “Check your email to confirm your account.”
→ no confirmation email received
```

Current signup code calls `supabase.auth.signUp(...)`. The application message means no immediate sign-up API error was surfaced; it does not prove that a confirmation email was accepted by the SMTP provider or delivered.

Repository Public/Private visibility does not control Supabase SMTP delivery. The mail path must be diagnosed independently.

Previously established production design used hosted Supabase Auth with Resend SMTP. Do not overwrite/reconfigure it speculatively before checking evidence.

## 8. Required diagnostic order

```text
1. Supabase Authentication → Users
   - verify whether the test signup created a user
   - inspect email confirmation state

2. Supabase Auth Logs
   - inspect the exact signup timestamp
   - identify SMTP, mail-hook, rate-limit or delivery errors

3. Supabase SMTP configuration
   - confirm custom SMTP remains enabled
   - verify sender/domain/config state without exposing credentials

4. Resend logs
   - verify whether Supabase handed a message to Resend
   - inspect delivered / bounced / rejected / failed status

5. Only after root cause is proven
   - make the narrowest configuration or code correction
   - run CI if code changes
   - deploy if required
   - repeat real signup → email → confirm → login → Today
```

Do not expose SMTP passwords, API keys, service-role keys or other secret values in screenshots, issues or Git commits.

## 9. Remaining 001B acceptance

```text
Production HTTPS reachable                 PASS
Public repository CI                       PASS
Vercel Production from public main         PASS
New learner signup request accepted        PASS
Confirmation email actually delivered      BLOCKED
/verify-email explicit success state       PENDING
Learner sign-in                            PENDING
Authenticated Today                        PENDING
```

P1-PWA-001B must not be marked COMPLETE until all remaining Auth smoke items pass.

## 10. Next slice

After 001B hosted desktop smoke passes, proceed to **P1-PWA-001C physical iPhone validation**:

- open final HTTPS origin;
- Add to Home Screen;
- launch standalone;
- verify auth/session persistence;
- verify Today/Lesson/Review responsive/touch behavior;
- interrupt/reopen Lesson and Review;
- test network interruption then Retry;
- confirm authoritative persisted state resumes correctly.

Then execute deployed **P1-E2E-001** before Phase 2.

## 11. Documentation discipline — mandatory

A slice is not formally complete until documentation and verification agree.

For every slice:

```text
implementation/configuration
→ verification evidence
→ update module HANDOFF
→ update DEVELOPMENT_LOG
→ update ISSUES_AND_SOLUTIONS if an issue/root cause/solution exists
→ PR CI
→ merge
→ merged-main CI
→ mark COMPLETE
```

If blocked, record the completed portion, blocker, evidence and exact next diagnostic step in the same work cycle.