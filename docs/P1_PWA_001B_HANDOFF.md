# P1-PWA-001B Handoff

**Date:** 2026-09-10  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Slice:** P1-PWA-001B — hosted environment, public-repository migration and production deployment  
**Status:** PARTIALLY COMPLETE — repository/CI/Vercel migration verified; hosted email-confirmation smoke is BLOCKED  
**Canonical repository:** `xiaocongxu159-sys/english-coach-public`  
**Current production branch:** `main`  
**Initial clean public snapshot:** `30fb6b5298f14654325ec7f0cefe93e163d451cf`  
**Current production trigger commit:** `d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca`  
**Public CI run:** `34459279725` — `validate` PASS + `database-integration` PASS  

## 1. Why the repository migration was done

The original `xiaocongxu159-sys/english-coach` repository remained private and had historical Git metadata that included a personal commit email. Making that repository public directly would have exposed old commit/branch/PR history.

The migration therefore used a clean-snapshot strategy:

```text
private historical repository retained
→ exact PR #45 source state selected
→ source exported without `.git`
→ secret/file-name safety scans
→ brand-new Git history
→ GitHub noreply commit identity
→ new public repository
```

The old private repository remains an archive/history source and is not the active production repository.

## 2. Exact source state migrated

The source snapshot was taken from old private PR #45 head:

```text
d2736c3ab666959b3bd8831ed6386e13191fcb6e
```

Its Git tree was:

```text
0a76c785d4854e85361bb354e02cbdb3e06821c8
```

The clean public root commit `30fb6b5...` points to the same tree, so code content is identical while old Git history is not carried into the public repository.

The migrated source includes the dedicated email verification result page from PR #45:

```text
/auth/confirm
→ /verify-email?status=success|error
→ explicit learner-visible verification result
```

## 3. Public repository privacy/safety verification

Verified before push:

- no `.env`, `.env.local`, `.env.production`, private-key PEM, or key files in the exported snapshot;
- precise pattern scan found no Supabase secret key, Resend API key, GitHub token, AWS access key, Google API key, JWT, or private key material;
- `.env.example` contains placeholders only;
- `.gitignore` continues to exclude `.env*` except `.env.example`, `.vercel`, PEM files and generated/local tooling paths;
- initial public commit count was exactly one;
- commit author email used GitHub `users.noreply.github.com` identity;
- GitHub account setting `Keep my email addresses private` was enabled;
- `Block command line pushes that expose my email` was enabled.

No secret values are recorded in this document.

## 4. Public CI verification

The first public push triggered GitHub Actions normally on GitHub-hosted runners.

Run:

```text
34459279725
```

Result:

```text
validate              PASS
database-integration  PASS
```

`validate` passed:

- dependency install;
- Phase 0 validation;
- canonical curriculum registry verification;
- reviewed A1 Pilot validation;
- lint;
- typecheck;
- tests;
- production build.

`database-integration` passed:

- minimal local Supabase startup;
- empty-state database rebuild;
- local credential export;
- Auth/RLS isolation verification;
- reviewed Pilot seed twice/idempotency;
- visibility/trust-boundary checks;
- deterministic learning-engine persistence and Mastery transition checks;
- clean Supabase shutdown.

Therefore the repository migration did not break the permanent application or fresh-database gates.

## 5. Vercel Git migration

The existing Vercel project `english-coach` was preserved. The project itself was not deleted or recreated.

Migration sequence:

```text
disconnect old Git repository
→ grant Vercel GitHub App access to `english-coach-public`
→ connect `xiaocongxu159-sys/english-coach-public`
→ keep production branch `main`
→ preserve existing project settings/environment variables
```

The following environment variable names remained present for Production and Preview:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Values remain secret and are intentionally not recorded here.

Git LFS remains disabled because the current repository does not require it. `Require Verified Commits` remains disabled/inherited; no change was required for this migration.

## 6. Production deployment verification

Because the initial clean snapshot was pushed before the new Git connection was attached, Vercel did not retrospectively create a production deployment.

A no-code-change commit was therefore created only to trigger the newly connected Git integration:

```text
d65900bf7873f8d8ac38a1dbb617dd82ffe5fdca
chore: trigger Vercel deployment
```

The commit used GitHub noreply identity and changed no files.

Vercel then created a deployment from:

```text
repository: english-coach-public
branch: main
environment: Production
commit: d65900b...
status: Ready
```

GitHub commit status also reported Vercel `success`.

Therefore the new canonical delivery path is verified:

```text
english-coach-public/main
→ GitHub Actions
→ Vercel Git integration
→ Production deployment
```

## 7. Hosted signup/email smoke — current blocker

A real production signup was attempted after the public-repository deployment.

Observed application result:

```text
Create account
→ `Check your email to confirm your account.`
→ no confirmation email received
```

The application signup action still calls `supabase.auth.signUp(...)`. The success message means the sign-up call returned without an immediate application-level error; it does not independently prove downstream email delivery.

The repository migration itself did not intentionally change the email-sending mechanism. PR #45 changed the confirmation-result UX after a learner opens a confirmation link; it did not replace Supabase Auth email delivery.

**Current status:** unresolved. Do not claim P1-PWA-001B complete until production email delivery and confirmation are proven.

## 8. Investigation rule for the email blocker

Do not make speculative SMTP/code changes first.

Required diagnostic order:

```text
1. Supabase Authentication → Users
   - verify whether the test signup created a user
   - inspect confirmation state

2. Supabase Auth Logs
   - inspect the exact signup timestamp
   - look for mail/SMTP/rate-limit/delivery errors

3. Supabase Auth SMTP configuration
   - inspect current configuration only
   - compare with the previously working state if evidence exists

4. Only after root cause is proven:
   - change SMTP/Auth configuration or code as narrowly as required
   - re-run CI if code changes
   - redeploy if required
   - repeat real signup/confirmation/login smoke
```

Do not expose SMTP passwords, service-role keys or API keys in screenshots, Git commits or documentation.

## 9. Remaining P1-PWA-001B acceptance

P1-PWA-001B can be marked COMPLETE only when all of the following are true:

- production HTTPS app reachable;
- public repository CI remains green;
- Vercel production deployment from public `main` is Ready;
- a new learner can sign up;
- confirmation email is actually delivered;
- learner opens the confirmation link;
- `/verify-email` shows explicit `Email verified` success state;
- learner can sign in;
- learner reaches authenticated Today successfully.

Repository/CI/Vercel items are complete. Email delivery/confirmation/login/Today smoke remains pending.

## 10. Next slice after hosted desktop smoke

After P1-PWA-001B passes, proceed to **P1-PWA-001C physical iPhone validation**:

- open final HTTPS origin;
- Add to Home Screen;
- launch standalone;
- verify auth/session persistence;
- verify Today/Lesson/Review responsive/touch behavior;
- interrupt/reopen Lesson and Review;
- test network interruption then Retry;
- confirm authoritative persisted state resumes correctly.

Only after 001C should the full deployed P1-E2E-001 vertical gate be closed.

## 11. Documentation discipline — mandatory going forward

A slice is not considered formally complete until the repository documentation is updated in the same work cycle.

For every completed slice:

```text
implementation/configuration work
→ verification evidence
→ update module handoff
→ update DEVELOPMENT_LOG
→ update ISSUES_AND_SOLUTIONS when a new issue/root cause/solution exists
→ CI/release verification
→ then mark the slice COMPLETE
```

Do not defer handoff documentation to a later phase. If a blocker appears before completion, record the verified completed portion plus the blocker and exact next diagnostic step, as done in this handoff.
