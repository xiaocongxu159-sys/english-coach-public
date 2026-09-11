# P1-PWA-001B Handoff

**Date:** 2026-09-11  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Slice:** P1-PWA-001B — hosted environment, public-repository migration and Production desktop/browser smoke  
**Status:** COMPLETE / PRODUCTION VERIFIED  
**Canonical repository:** `xiaocongxu159-sys/english-coach-public`  
**Production branch:** `main`

## 1. Repository migration

The historical private repository remains private because old Git metadata contains a personal commit email. Directly publicizing it would expose historical metadata, branches and PR history.

The project therefore moved to a clean public repository without carrying old `.git` history:

```text
old private repository retained as archive
→ exact reviewed source snapshot selected
→ export without .git
→ secret/sensitive-file scan
→ new Git history
→ GitHub noreply identity
→ english-coach-public
```

Initial clean public snapshot:

```text
30fb6b5298f14654325ec7f0cefe93e163d451cf
```

## 2. Public CI + Vercel Production path

The existing Vercel project was preserved, disconnected from the historical private repo, granted access to `english-coach-public`, and reconnected to public `main`.

Production environment-variable names remained in Vercel rather than Git:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

A no-code commit first verified the new Git→Vercel path:

```text
d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca
chore: trigger Vercel deployment
```

Public GitHub Actions repeatedly passed both permanent gates:

```text
validate
 database-integration
```

Vercel Production reported Ready/success from the public repository.

## 3. Auth confirmation chain — PASS

The first mail smoke reused an existing account. Supabase Auth audit logs recorded:

```text
user_repeated_signup
```

That was correctly treated as a repeated-signup false alarm rather than an SMTP failure.

A never-before-registered address then created a real Production learner. Read-only Production evidence showed:

```text
auth user created
learner profile created
users_missing_profile = 0
confirmation_sent_at populated
email_confirmed_at initially null
```

Resend independently showed the confirmation transaction as `delivered`. Gmail received the message but classified it as Spam. The learner opened the message, clicked the confirmation link and reached the deployed explicit success screen:

```text
Email verified
Your email address has been confirmed successfully.
Your account is ready. Sign in to continue learning.
```

Verified chain:

```text
fresh signup
→ Auth user
→ learner profile trigger
→ Supabase confirmation generation
→ SMTP / Resend delivery
→ Gmail receipt
→ /auth/confirm
→ verifyOtp()
→ /verify-email success
```

Gmail Spam placement is a deliverability/reputation observation, not an SMTP transport failure.

## 4. Production Today runtime failure — RESOLVED

Both the historical confirmed account and the fresh confirmed account could sign in, but `/` initially reached the root error boundary.

Vercel captured:

```text
GET / → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

Supabase request logs showed the Today database-read chain succeeding with HTTP 200, which localized the failure after data loading and before returning the Today snapshot.

Root cause: immutable scheduler/review JSON configuration was being loaded with runtime `import.meta.url` + `readFileSync()`, which is not a safe assumption for the bundled Vercel server runtime.

Fix: convert the scheduler and review configuration loaders to static JSON imports so Next/Vercel bundles them into the server module graph.

After CI, merge and Production deploy, authenticated Today loaded successfully for the fresh learner with the expected reviewed Phase 1 plan:

```text
35 min profile budget
14 min reviewed work
2 new nodes
0 reviews ready now
0 reviews upcoming
```

ISSUE-032 is therefore resolved.

Detailed runtime handoff: `docs/P1_PWA_001B_TODAY_RUNTIME_FIX_HANDOFF.md`.

## 5. Production Lesson runtime failure — RESOLVED

After Today was fixed, the learner successfully started the reviewed Lesson, then a later Lesson server-action POST failed with the same Node path-error class:

```text
POST /lesson/<lesson-instance-id> → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

The failing path was deterministic exercise submission → `submitExerciseAttempt()` → `getMasteryConfig()`.

`mastery-v1.config.json` was still being loaded through runtime filesystem resolution. It was converted to the same static JSON import pattern.

PR #6 passed:

```text
validate                  PASS
database-integration      PASS
Vercel Preview            PASS
```

and squash-merged as:

```text
557acfb43944490f991fb1f723299cce70e4e8d8
```

Merged-main verification also passed both GitHub Actions jobs and Vercel Production.

Most importantly, the learner resumed the existing Production Lesson and completed the entire reviewed flow:

```text
8/8 stages
Lesson complete
Exit check: 9/10 · more practice needed
```

No account reset, Lesson reset or Production data rewrite was required. This verifies that persisted Lesson state survived the interruption and that the previously failing submission path now progresses through completion.

ISSUE-033 is therefore resolved.

Detailed runtime handoff: `docs/P1_PWA_001B_LESSON_RUNTIME_FIX_HANDOFF.md`.

## 6. P1-PWA-001B acceptance matrix

```text
Production HTTPS reachable                 PASS
Public repository canonical                PASS
Public GitHub Actions                      PASS
Vercel Production from public main         PASS
Fresh learner signup                       PASS
Learner profile trigger                    PASS
Confirmation generated                     PASS
Resend delivery                            PASS
Gmail receipt                              PASS — Spam classification observed
/auth/confirm callback                      PASS
/verify-email explicit success             PASS
Fresh-account sign-in                       PASS
Authenticated Today                         PASS
Start reviewed Lesson                       PASS
Resume after runtime interruption           PASS
Deterministic exercise submission           PASS
Lesson stage progression                    PASS
Exit check                                  PASS — 9/10
Lesson completion                           PASS — 8/8 stages
```

Therefore **P1-PWA-001B is COMPLETE / PRODUCTION VERIFIED**.

## 7. What remains outside 001B

P1-PWA-001B proves the hosted desktop/browser path and the real Production Auth→Today→Lesson chain.

The next slice is **P1-PWA-001C physical iPhone validation**:

- open final HTTPS origin on the physical iPhone;
- Add to Home Screen;
- launch standalone;
- verify auth/session persistence;
- verify Today/Lesson/Review responsive/touch behavior;
- interrupt/reopen Lesson and Review;
- test a real network interruption followed by Retry;
- confirm authoritative persisted state resumes correctly.

After 001C, execute deployed **P1-E2E-001** before Phase 2.

## 8. Documentation discipline

A slice is only complete when implementation, verification and documentation agree.

For each future slice:

```text
implementation/configuration
→ verification evidence
→ update module HANDOFF
→ update DEVELOPMENT_LOG
→ update ISSUES_AND_SOLUTIONS when a root cause/fix exists
→ PR CI
→ merge
→ merged-main CI
→ mark COMPLETE
```
