# P1-PWA-001B Handoff

**Date:** 2026-09-11  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Slice:** P1-PWA-001B — hosted environment, public-repository migration and production deployment  
**Status:** PARTIALLY COMPLETE — repository/CI/Vercel migration verified; repeated-signup false alarm diagnosed; fresh-account confirmation smoke pending  
**Canonical repository:** `xiaocongxu159-sys/english-coach-public`  
**Production branch:** `main`  
**Initial clean public snapshot:** `30fb6b5298f14654325ec7f0cefe93e163d451cf`  
**Production trigger commit:** `d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca`  
**Documentation sync release:** PR #2 squash-merged as `df252d39a24055195e802e9d7be41e34096155d8`  
**Merged-main CI:** run `34484320527` — `validate` PASS + `database-integration` PASS

## 1. Repository migration decision

The original `xiaocongxu159-sys/english-coach` repository remains private because historical Git metadata contains a personal commit email. Directly changing that repository to Public would have exposed old commit/branch/PR history.

Migration used a clean snapshot:

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

Initial public CI run `34459279725` passed:

```text
validate              PASS
database-integration  PASS
```

Documentation PR #1 squash-merged as `7642800b54939d203c83ab80352ec3f063f9ba3a`, followed by merged-main run `34482865644`, also double-green.

Canonical-handoff sync PR #2 squash-merged as:

```text
df252d39a24055195e802e9d7be41e34096155d8
```

Merged-main CI run `34484320527` also passed:

```text
validate              PASS
database-integration  PASS
```

Therefore the Public repository and current documentation baseline are merged-main verified.

## 5. Vercel Git migration

The existing Vercel project `english-coach` was preserved.

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

A no-code-change commit triggered the first deployment after reconnecting Git:

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

PR #44 removed `emailRedirectTo` from both signup and resend. Current production confirmation destination therefore depends on hosted Supabase Auth Site URL and the confirmation-email template.

The application still owns confirmation verification/result handling:

```text
/auth/confirm?token_hash=<hash>&type=email
→ Supabase verifyOtp()
→ /verify-email?status=success|error
```

## 7. Signup-email diagnosis — root cause proven

Initial Production smoke showed:

```text
Create account
→ “Check your email to confirm your account.”
→ no confirmation email received
```

The first hypothesis space included SMTP/provider failure, rate limiting, duplicate-user behavior and environment mismatch. No configuration was changed before collecting evidence.

Read-only production evidence then showed:

### Users evidence

`Authentication → Users` contained only the already-existing account. The attempted smoke test did not create a new learner row.

### Audit-log evidence

Unified Auth audit logs contained:

```text
action = user_repeated_signup
```

The actor matched the same already-existing account used for the smoke test.

### Conclusion

The missing-email symptom was caused by **reusing an email address that was already registered**, not by the GitHub Public migration, Vercel, or proven SMTP/Resend failure.

Supabase intentionally does not expose a simple “this account already exists” signal in the normal signup response, so the application-level `signUp()` path can still reach the generic learner-facing confirmation message during a repeated signup attempt.

No SMTP, Resend, Vercel or application-code change is justified from this incident.

## 8. Exact next diagnostic/acceptance step

The next Production Auth smoke must use a **never-before-registered email address**.

Required evidence sequence:

```text
fresh email
→ Create account
→ new Authentication → Users row with current Created at timestamp
→ confirmation email arrives
→ open confirmation link
→ /verify-email shows explicit Email verified success state
→ sign in
→ authenticated Today
```

Only if a truly fresh user is created but the email still fails to arrive should SMTP/Resend delivery diagnostics resume.

Do not delete or repurpose an existing learner account merely to simulate first-time signup unless there is a separate data-retention decision.

## 9. Remaining 001B acceptance

```text
Production HTTPS reachable                 PASS
Public repository CI                       PASS
Vercel Production from public main         PASS
Repeated-signup root cause                 PASS / diagnosed
Fresh new learner signup                   PENDING
Confirmation email actually delivered      PENDING
/verify-email explicit success state       PENDING
Learner sign-in                            PENDING
Authenticated Today                        PENDING
```

P1-PWA-001B must not be marked COMPLETE until the fresh-account Auth smoke passes end to end.

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