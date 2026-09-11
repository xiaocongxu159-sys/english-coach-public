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

PR #31 squash-merged as `cf099c14e097bbd3ff5a801d7e694db5ec333c`; main CI #158 double-green.

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

Detailed handoff: `docs/P1_PWA_001B_HANDOFF.md`.

---

## 2026-09-11 — P1-PWA-001B repeated-signup diagnosis — ROOT CAUSE PROVEN

The first missing-email smoke reused an already-registered address. Supabase unified Auth audit logs recorded `user_repeated_signup`, proving that attempt did not represent a fresh signup. No SMTP, Resend, Vercel or code change was justified from that incident.

---

## 2026-09-11 — P1-PWA-001B fresh signup + confirmation — VERIFIED

A never-before-registered address was used for a real Production signup. Supabase created the Auth user and learner profile, Resend recorded the confirmation as delivered, Gmail received the message in Spam, and the learner clicked the confirmation link successfully.

The deployed result page showed:

```text
Email verified
Your email address has been confirmed successfully.
Your account is ready. Sign in to continue learning.
```

Verified chain:

```text
fresh signup
→ Auth user
→ learner profile
→ confirmation generation
→ SMTP / Resend delivery
→ Gmail receipt
→ /auth/confirm
→ verifyOtp
→ /verify-email success
```

Gmail Spam placement is a deliverability/reputation observation, not an SMTP failure.

---

## 2026-09-11 — Authenticated Today Production runtime error — RESOLVED / VERIFIED

Both old and fresh confirmed accounts reproduced the same Today error after successful sign-in. Vercel captured:

```text
GET / → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

Supabase reads were healthy. The root cause was runtime filesystem loading of immutable scheduler/review JSON through `import.meta.url` + `readFileSync()` inside the bundled Vercel server runtime.

The loaders were converted to static JSON imports. After CI, merge and Production deploy, the fresh account loaded the real Today page successfully with the expected Phase 1 Pilot plan:

```text
35 min profile budget
14 min reviewed work
2 new nodes
0 reviews ready now
0 reviews upcoming
```

ISSUE-032 is resolved.

---

## 2026-09-11 — Production Lesson submission runtime error — RESOLVED / VERIFIED

After Today was fixed, the hosted reviewed Lesson started successfully. During Lesson progression, a later server-action POST failed:

```text
POST /lesson/<lesson-instance-id> → 500
TypeError: The "path" argument must be of type string or an instance of Buffer or URL
```

The remaining runtime filesystem loader was `getMasteryConfig()` for `mastery-v1.config.json`, reached through deterministic exercise submission and Mastery/Review processing.

It was converted to a static JSON import. PR #6 passed `validate`, `database-integration` and Vercel Preview, then squash-merged as:

```text
557acfb43944490f991fb1f723299cce70e4e8d8
```

Merged-main `validate`, `database-integration` and Vercel Production also passed.

The learner then resumed the same Production Lesson and completed it end to end:

```text
8/8 stages
Lesson complete
Exit check: 9/10 · more practice needed
```

No account reset, lesson reset or Production state rewrite was needed. The persisted Lesson resumed after deployment and progressed beyond the previously failing action.

ISSUE-033 is resolved.

Detailed handoff: `docs/P1_PWA_001B_LESSON_RUNTIME_FIX_HANDOFF.md`.

---

## 2026-09-11 — P1-PWA-001B hosted Production smoke — COMPLETE / PRODUCTION VERIFIED

The real hosted desktop/browser chain is now verified:

```text
public GitHub repo
→ public CI
→ Vercel Production
→ fresh signup
→ confirmation email
→ Email verified
→ sign in
→ Today
→ Start Lesson
→ resume after interruption/runtime fix
→ deterministic exercises
→ Exit Check
→ 8/8 Lesson complete
```

Therefore **P1-PWA-001B is COMPLETE / PRODUCTION VERIFIED**.

Next gate:

```text
P1-PWA-001C physical iPhone validation
→ Add to Home Screen
→ standalone launch
→ auth/session persistence
→ responsive/touch Today/Lesson/Review
→ interruption/reopen
→ real network interruption + Retry
→ authoritative persisted-state resume
→ deployed P1-E2E-001
```

Documentation discipline remains mandatory: every completed slice must update its handoff and this Development Log in the same work cycle; new issues/root causes/solutions must also update `docs/ISSUES_AND_SOLUTIONS.md` before the slice is marked complete.
