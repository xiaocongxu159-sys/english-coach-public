# Development Log

Chronological record of verified implementation outcomes. Detailed contracts live in module-specific handoffs and frozen design documents.

---

## 2026-09-01 — Phase 0 foundation / freeze

Built and froze the product/curriculum baseline: A1→B2 graph **735 nodes** (A1 124 / A2 164 / B1 206 / B2 241), Lesson/Mastery/Review/Placement/Scheduler/Listening/Exercise/IELTS contracts and cross-document freeze review. Phase 0 merged through PRs #1–#14.

---

## 2026-09-01 — P1-BOOT-001 / P1-DATA-001 / P1-DB-001 / P1-PILOT-001 — COMPLETE

Established the Next.js/TypeScript/Node 24/Biome/PWA shell and permanent CI; compiled and verified the canonical 735-node registry; implemented Supabase Auth/RLS/server-browser-service-role boundaries; then released the corrected prerequisite-free two-node reviewed A1 Pilot.

Pilot active roots:

- `CF-A1-SOCIAL-GREET-01`;
- `VX-A1-SOCIAL-FORMULAS-01`.

Pilot PR #21 squash-merged as `6b2992381244530eb7654ddaf5ec0bdb94363c20`; main CI #83 double-green.

---

## 2026-09-02 — P1-ENGINE-001 — COMPLETE / MERGED-MAIN VERIFIED

Delivered deterministic Attempt → Evidence → Mastery, exactly-once FSRS Review, Curriculum eligibility, bounded/persisted Daily Plan and exact resumable reviewed Lesson resolution.

Important failures/races were fixed rather than waived: nullable/type fixtures, Node 24 strip-only syntax, unsupported scheduler→Blueprint requests, stale replanning, Lesson checkpoint lost updates and browser-write test semantics.

Release PR #29 squash-merged as `149bf2d2aac1b3ee1a8426be4880fededf1c4f5b`; merged-main CI #145 double-green.

Detailed planning/resume handoff: `docs/P1_ENGINE_001C_HANDOFF.md`.

---

## 2026-09-02 — P1-UI-001A Today — COMPLETE / MERGED-MAIN VERIFIED

Implemented authenticated server-owned Today planning and explanations. Brand-new learner receives the exact reviewed two-node Pilot at 14 minutes under the default 35-minute profile.

PR #31 squash-merged as `cf099c14e097bbd3ffdc5a801d7e694db5ec333c`; main CI #158 double-green.

---

## 2026-09-02 — P1-UI-001B Lesson Runner — COMPLETE / MERGED-MAIN VERIFIED

Implemented real reviewed teaching → 10 deterministic exercises → persisted feedback → practice-only speaking → server Exit Check → Summary/Finish. Lesson completion remains separate from Mastery.

PR #32 squash-merged as `415fa68459423f3526d28e86a7308ec7b529bcc5`; main CI #215 double-green.

Detailed handoff: `docs/P1_UI_001B_HANDOFF.md`.

---

## 2026-09-03 — P1-UI-001C Review + vertical integration — COMPLETE / MERGED-MAIN VERIFIED

Delivered in three verified slices:

1. authoritative Review queue/session backend — merge `911d9552cfc5586844d91f4d1ac7ded51c462363`; main CI #226;
2. clickable deterministic Review UI — merge `a525193a0520e512a970f7c1e7aa37331adf3aab`; main CI #228;
3. live authoritative Review readiness reflected on Today while started Daily Plan stays frozen — merge `97cc2a42d864d58b36256b0f9764eccae20bdf34`; main CI #230.

Final P1-UI documentation/status PR #37 squash-merged as `b0a300f86e54808604665c5a582c40a9106ca4e3`; merged-main CI #232 double-green.

Therefore parent **P1-UI-001 is COMPLETE / merged-main verified**.

Detailed Review handoff: `docs/P1_UI_001C_HANDOFF.md`.

---

## 2026-09-03 — P1-PWA-001A deployment/PWA code readiness — COMPLETE / MERGED-MAIN VERIFIED

A deployment-readiness audit compared the actual application against the frozen Phase 1 physical-iPhone criteria before creating hosted infrastructure.

### Findings

- Phase 1 requires Add to Home Screen, responsive Today/Lesson/Review, session persistence, interruption/resume and network error/retry; it does **not** require offline content caching.
- Existing PWA shell already had Apple web-app metadata, `viewport-fit=cover`, safe-area handling and phone-responsive CSS.
- The manifest icon was maskable-only, which is a weaker compatibility choice for older iOS Home Screen manifest-icon handling.
- production signup could silently fall back to `http://localhost:3000` when `NEXT_PUBLIC_APP_URL` was missing.
- no learner-facing App Router retry surface existed for route/network failure.
- critical generic form controls did not have a frozen minimum touch-target height.

### Implementation

- added production-safe `getAppUrl()` validation: production requires configured HTTPS origin root and fails closed otherwise;
- routed signup `emailRedirectTo` through that validated origin;
- froze manifest root `id/start_url/scope`, standalone display and `purpose: any` icon;
- added permanent app-URL and manifest unit tests;
- added root Retry error boundary with server-authoritative persistence language;
- set `button`, `input`, `select` minimum height to 44px;
- intentionally did **not** add Service Worker/offline cache outside the frozen Phase 1 requirement.

A self-review corrected the first network-error wording: a browser can lose the response after a server commit, so the UI must not claim that no state changed. Final wording instructs retry to reload authoritative persisted state and relies on existing idempotency for exact replay safety.

Verification chain:

- feature code head `87182c39a845f53aa470e0001afaf6e97c42eb08` → CI #236 double-green;
- final code+documentation head → CI #242 double-green;
- PR #38 squash-merged as `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`;
- merged-main CI #243 application + fresh-Supabase double-green.

Therefore **P1-PWA-001A is COMPLETE / merged-main verified**.

Detailed handoff: `docs/P1_PWA_001_HANDOFF.md`.

---

## 2026-09-10 — P1-PWA-001B public repository + CI + Vercel production path — VERIFIED PORTION COMPLETE

The project was migrated from the historical private repository to a clean public canonical repository without carrying old Git history or personal commit-email metadata into the public history.

Verified sequence:

```text
old private repository retained as history/archive
→ PR #45 source head d2736c3 selected
→ source exported without `.git`
→ sensitive-file and precise-secret scans PASS
→ new public repository `xiaocongxu159-sys/english-coach-public`
→ one clean root commit `30fb6b5...` with GitHub noreply identity
→ public GitHub Actions run 34459279725
→ validate PASS
→ database-integration PASS
→ existing Vercel project disconnected from old private repo
→ Vercel GitHub App granted access to public repo
→ existing Vercel project connected to `english-coach-public/main`
→ production environment variable names preserved
→ no-code trigger commit `d65900b...`
→ Vercel Production deployment Ready / GitHub Vercel status success
```

The clean public root commit and the selected private PR #45 source state share the same Git tree, so source content was preserved while the old repository history was not published.

The repository/CI/Vercel portion of P1-PWA-001B is therefore verified complete.

Detailed handoff: `docs/P1_PWA_001B_HANDOFF.md`.

---

## 2026-09-11 — P1-PWA-001B repeated-signup diagnosis — ROOT CAUSE PROVEN

The first missing-email smoke reused an already-registered address. Supabase unified Auth audit logs recorded `user_repeated_signup`, proving that attempt did not represent a fresh signup. No SMTP, Resend, Vercel or code change was justified from that incident.

---

## 2026-09-11 — P1-PWA-001B fresh signup + confirmation — VERIFIED PORTION COMPLETE

A never-before-registered address was then used for a true Production signup.

Read-only Supabase evidence proved:

```text
auth_users = 2
learner_profiles = 2
users_missing_profile = 0
pilot blueprint = present + active
Pilot nodes = 2 present + 2 active
Review schema = present
fresh user email_confirmed_at = NULL at the pre-confirmation checkpoint
fresh user confirmation_sent_at = populated
fresh user last_sign_in_at = NULL
```

Resend transactional logs independently matched the signup event. The confirmation email was recorded as `delivered`, and its confirmation URL targeted the production `english.ctjfyrdian.com/auth/confirm` path. Recipient address, token and message ID are intentionally omitted from project docs.

The learner then located the message in Gmail **Spam**, opened it, clicked the confirmation link and reached the deployed explicit success page:

```text
Email verified
Your email address has been confirmed successfully.
Your account is ready. Sign in to continue learning.
```

Therefore the complete hosted confirmation chain is verified:

```text
fresh signup
→ Auth user
→ learner profile trigger
→ confirmation generation
→ SMTP / Resend delivery
→ Gmail receipt (Spam classification)
→ /auth/confirm
→ verifyOtp
→ /verify-email success
```

This closes the mail-transport and confirmation-callback portion of P1-PWA-001B. Gmail spam placement remains a deliverability/reputation observation, not an SMTP failure. No SMTP configuration change is justified from this test.

---

## 2026-09-11 — Authenticated Today Production error — OPEN

The previously confirmed account can sign in successfully, but the root Today page immediately reaches the application error boundary (`We could not load this step.`).

The sign-in timestamp updates in `auth.users`, proving Auth itself succeeded.

Production database diagnostics also rule out the first data-shape hypotheses:

```text
learner profile exists
users_missing_profile = 0
Pilot blueprint present + active
2 Pilot nodes present + active
Review lifecycle column present
review_events table present
old-account daily_plan_count = 0
old-account review_unit_count = 0
```

Therefore this is not an old stale Daily Plan being deserialized after the migration. The failure occurs while creating/loading the first authenticated Today snapshot.

The newly confirmed fresh account is now the next discriminator:

```text
fresh-account sign in
→ Today succeeds: investigate old-account-specific state
→ Today also fails: hosted Today/runtime problem is system-wide
```

If Today fails, reproduce once with **Retry**, then capture the matching Vercel Production runtime exception for `/`. Do not mutate production learner data before obtaining that exception.

---

## Current handoff — P1-PWA-001B

Verified:

```text
public repository + CI
→ Vercel Production
→ fresh Supabase user creation
→ learner profile trigger
→ confirmation generation
→ Resend delivery
→ Gmail receipt
→ production confirmation callback
→ explicit Email verified success
```

Still required:

```text
fresh-account sign in
→ diagnose/fix authenticated Today runtime exception if reproduced
→ authenticated Today PASS
→ P1-PWA-001C physical iPhone smoke
→ P1-E2E-001 deployed vertical gate
```

Documentation discipline remains mandatory: every completed slice must update its handoff and this Development Log in the same work cycle; new issues/root causes/solutions must also update `docs/ISSUES_AND_SOLUTIONS.md` before the slice is marked complete.
