# P1-PWA-001B Handoff

**Date:** 2026-09-11  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Slice:** P1-PWA-001B — hosted environment, public-repository migration and production deployment  
**Status:** PARTIALLY COMPLETE — repository/CI/Vercel migration verified; fresh signup created; confirmation email transport delivered; confirmation click and authenticated Today remain blocked/pending  
**Canonical repository:** `xiaocongxu159-sys/english-coach-public`  
**Production branch:** `main`  
**Initial clean public snapshot:** `30fb6b5298f14654325ec7f0cefe93e163d451cf`  
**Production trigger commit:** `d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca`  
**Documentation sync release:** PR #2 squash-merged as `df252d39a24055195e802e9d7be41e34096155d8`  
**Merged-main CI:** run `34484320527` — `validate` PASS + `database-integration` PASS

## 1. Repository migration decision

The original `xiaocongxu159-sys/english-coach` repository remains private because historical Git metadata contains a personal commit email. Directly changing that repository's visibility to Public would expose old commit/branch/PR history.

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

## 7. Repeated-signup false alarm — diagnosed

The first hosted smoke reused an already-registered account. Unified Auth audit logs recorded:

```text
action = user_repeated_signup
```

That explained why the page showed the generic confirmation message without creating a new learner. No SMTP/Vercel/code change was justified from that attempt.

## 8. Fresh-account signup — transport path verified

A second smoke used a never-before-registered address.

Read-only production evidence showed:

```text
auth_users = 2
learner_profiles = 2
users_missing_profile = 0
pilot_blueprint_rows = 1
pilot_blueprint_active = 1
pilot_node_rows = 2
pilot_nodes_active = 2
review_units_lifecycle_column = 1
review_events_table = 1
```

For the fresh account:

- `created_at` is current;
- `email_confirmed_at` is still null;
- `confirmation_sent_at` is populated at signup time;
- `last_sign_in_at` is null;
- `daily_plan_count = 0`.

Resend delivery logs independently matched the same signup event within about one second. The transactional email status is `delivered`, with the expected subject and sender identity, and the confirmation link points to the production `english.ctjfyrdian.com/auth/confirm` path. Token values and recipient addresses are intentionally omitted from this public document.

### Conclusion

The fresh-account confirmation message was generated by Supabase, handed to Resend, and accepted by the recipient mail server. Therefore the hosted Auth SMTP/Resend transport path is **PASS** for this test.

The learner reported that the message was not visible in the inbox at first inspection. That is now an inbox/filtering/visibility question rather than evidence of SMTP transport failure. Search Spam/All Mail/Promotions and by sender/subject before changing SMTP configuration.

## 9. Authenticated Today blocker — separate issue

The pre-existing confirmed account can now sign in successfully. After sign-in, loading `/` reaches the root error boundary and displays:

```text
Connection problem
We could not load this step.
```

This proves Auth login succeeds; the failure occurs while loading the authenticated Today snapshot.

Read-only production diagnostics rule out several earlier hypotheses:

- learner profile exists;
- `users_missing_profile = 0`;
- exact Pilot blueprint exists and is active;
- both Pilot nodes exist and are active;
- current Review schema exists;
- the old account has `daily_plan_count = 0`, so the failure is **not** caused by loading a stale historical Daily Plan;
- the account has no existing Review Units in the observed result.

The next required evidence is the corresponding Vercel Production runtime exception for a fresh retry of `/`. Do not mutate learner state or database content before capturing that exception.

## 10. Remaining 001B acceptance

```text
Production HTTPS reachable                 PASS
Public repository CI                       PASS
Vercel Production from public main         PASS
Repeated-signup false alarm                PASS / diagnosed
Fresh new learner signup                   PASS
New learner profile trigger                PASS
Confirmation message generated             PASS
Supabase → Resend handoff                   PASS
Recipient mail-server acceptance           PASS / Resend delivered
Learner inbox visibility                    PENDING
/verify-email explicit success state       PENDING
Fresh-account sign-in                       PENDING
Authenticated Today                        BLOCKED — runtime exception under diagnosis
```

P1-PWA-001B must not be marked COMPLETE until the confirmation-click, sign-in and authenticated Today smoke pass end to end.

## 11. Exact next diagnostics

### Confirmation email

Search the fresh test mailbox for the exact sender/subject shown in Resend and check Spam, All Mail and Promotions. Do not change SMTP configuration while Resend already reports this message as delivered.

### Today route

1. Sign in with the confirmed existing account.
2. On the root error page click **Retry** once to create a fresh request.
3. Immediately open Vercel → `english-coach` → Logs.
4. Filter Production + Error around the retry time / root route.
5. Capture the server exception message/stack associated with that request.

Only after the runtime exception is known should a code or data fix be proposed.

## 12. Next slice

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

## 13. Documentation discipline — mandatory

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