# Phase 1 Implementation Handoff

**Date:** 2026-09-03  
**Current verified handoff:** P1-ENGINE-001, P1-UI-001 and P1-PWA-001A are COMPLETE / merged-main verified  
**Current verified main:** `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`  
**Merged-main CI:** #243 — application + fresh-Supabase PASS  
**Current module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Current slice:** P1-PWA-001B — hosted Supabase + Vercel reachable deployment  
**Detailed PWA handoff:** `docs/P1_PWA_001_HANDOFF.md`

## 1. Phase 1 objective

Phase 1 succeeds only when the trustworthy local vertical slice also works as a real deployed mobile product:

```text
open hosted app
→ authenticate learner
→ see bounded Today Plan
→ complete reviewed Lesson
→ deterministic Attempts
→ Evidence
→ Mastery
→ exactly-once FSRS Review
→ complete due Review through learner UI
→ return/relogin
→ Today reflects persisted state
→ repeat on physical iPhone Home Screen web app
```

Phase 1 is **not** complete yet because hosted deployment, physical iPhone validation and final deployed E2E remain outstanding.

## 2. Frozen scope and product truth

Phase 1 learner-active curriculum remains the reviewed A1 Pilot only:

- `CF-A1-SOCIAL-GREET-01`;
- `VX-A1-SOCIAL-FORMULAS-01`.

The remaining canonical registry nodes remain `draft`.

Current state-changing scored truth remains deterministic reviewed content. Live AI scoring is not permitted to create Mastery/Review truth in this slice.

Speaking rehearsal remains practice-only until a validated speech evaluator exists.

## 3. Verified implementation stack

- Next.js 16.3.4 / React 19.2.8 / TypeScript 5.9.3;
- Node.js 24.20.0 permanent CI runtime;
- Biome 2.5.11;
- Supabase Postgres + Auth + RLS;
- `ts-fsrs@5.4.2` behind an app-owned FSRS-6 Review Adapter;
- GitHub Actions permanent application + fresh-Supabase jobs.

## 4. Completed Phase 1 implementation modules

- **P1-BOOT-001 — COMPLETE:** reproducible application/PWA shell and permanent CI.
- **P1-DATA-001 — COMPLETE:** deterministic 735-node registry and graph validation.
- **P1-DB-001 — COMPLETE:** Supabase Auth/migrations/RLS/browser-server-service-role boundaries.
- **P1-PILOT-001 — COMPLETE:** reviewed prerequisite-free two-node A1 Pilot.
- **P1-ENGINE-001 — COMPLETE / MERGED-MAIN VERIFIED:** Curriculum → Daily Plan → Lesson → deterministic Attempt → Evidence → Mastery → exactly-once FSRS Review. Release `149bf2d2aac1b3ee1a8426be4880fededf1c4f5b`; main CI #145.
- **P1-UI-001 — COMPLETE / MERGED-MAIN VERIFIED:** Today + Lesson + Review + later-Today live Review reflection. Final behavior merge `97cc2a42d864d58b36256b0f9764eccae20bdf34`; completion docs merge `b0a300f86e54808604665c5a582c40a9106ca4e3`; main CI #232.
- **P1-PWA-001A — COMPLETE / MERGED-MAIN VERIFIED:** deployable PWA shell hardening, production app-origin fail-closed behavior, iPhone-compatible manifest contract, retry surface and touch-target readiness. PR #38 squash-merged as `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`; merged-main CI #243 double-green.

Detailed implementation handoffs:

- `docs/P1_ENGINE_001C_HANDOFF.md`
- `docs/P1_UI_001B_HANDOFF.md`
- `docs/P1_UI_001C_HANDOFF.md`
- `docs/P1_PWA_001_HANDOFF.md`

## 5. Current authoritative learner path

```text
authenticated learner
→ Today
→ Start/Resume Lesson
→ reviewed teaching
→ deterministic exercises
→ persisted feedback
→ Evidence / Mastery / FSRS Review
→ Exit Check / Summary
→ Review queue
→ Start/Resume due supported Review
→ deterministic Review answer
→ persisted grade + next due
→ Today live Review state updates
```

This path is proven locally through permanent fresh-Supabase CI. Deployment work must preserve it rather than recreate learning truth in the hosting layer.

## 6. Invariants P1-PWA/E2E must not break

1. Only the reviewed two-node Pilot is learner-active.
2. Browser clients cannot write authoritative Plan/Lesson/Attempt/Evidence/Mastery/Review truth.
3. Current scored truth remains deterministic reviewed content.
4. Spoken rehearsal remains practice-only.
5. Trusted Evidence remains tied to concrete Attempt/content versions.
6. Retry/idempotency cannot intentionally duplicate Evidence or Review effects.
7. Review due/overdue is derived from `due_at` at read/planning time.
8. A started Daily Plan cannot be silently replaced by a later replan.
9. Today may show live Review state separately but must not mutate the frozen started Plan.
10. Review writes stay behind the exactly-once adapter and PostgreSQL source-binding checks.
11. Auth/RLS learner isolation must remain intact in hosted Supabase.
12. Service-role secrets must never reach browser JavaScript.
13. Production email links must return through the server-owned token-hash confirmation path.
14. Physical iPhone behavior must be tested on the actual deployed HTTPS app.
15. A browser/network failure is not proof that the server committed nothing; retry must reload authoritative state and rely on existing idempotency.

## 7. P1-PWA-001A — COMPLETE / MERGED-MAIN VERIFIED

001A hardened the deployable shell without changing learning semantics.

Verified changes:

- production `NEXT_PUBLIC_APP_URL` is mandatory and HTTPS-only;
- application origin rejects nested paths, query/hash and credentials;
- signup confirmation uses the validated origin instead of a localhost production fallback;
- manifest has stable root `id`, `scope`, `start_url`, standalone display and `purpose: any` icon;
- existing Apple web-app metadata and safe-area/phone-width CSS remain;
- button/input/select touch targets have at least 44px height;
- root route error UI exposes a learner-facing Retry path;
- error messaging keeps server persistence authoritative rather than claiming a failed response means no commit occurred;
- unit tests freeze app-origin and manifest contracts;
- feature code head `87182c39a845f53aa470e0001afaf6e97c42eb08` passed CI #236;
- final code+documentation head passed CI #242 application + fresh-Supabase;
- PR #38 squash-merged as `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`;
- merged-main CI #243 passed both permanent jobs.

Therefore P1-PWA-001A is formally complete.

## 8. Service Worker / offline scope

The frozen Phase 1 iPhone acceptance requires:

- Add to Home Screen;
- responsive Today/Lesson/Review;
- auth/session persistence;
- audio only when included;
- interruption/resume;
- network error/retry.

It does **not** require offline content caching. Therefore Phase 1 intentionally does not add a Service Worker merely to satisfy a generic PWA checklist.

Do not claim offline behavior that is not implemented.

## 9. Exact hosted Supabase sequence — CURRENT

P1-PWA-001B proceeds as:

```text
A. create/connect a dedicated hosted Supabase project
B. link CLI/tooling to the exact project
C. preview migrations against the target
D. apply migrations from the committed migration chain
E. configure hosted credentials in a controlled environment
F. run `npm run pilot:seed`
G. run the seed again to prove idempotency
H. verify exact two active Pilot nodes + both reviewed Lesson Blueprints
I. configure production Site URL + exact callback redirect
J. configure Confirm signup token-hash template
```

Production must **not** use `supabase db push --include-seed`.

`supabase/seed.sql` is intentionally empty. Reviewed Pilot and Review Blueprint content are applied through `scripts/seed-pilot-content.mjs`, which validates committed content before privileged upserts.

## 10. Hosted Auth configuration

For final production origin `<APP_ORIGIN>`:

```text
Site URL: <APP_ORIGIN>
Redirect URL: <APP_ORIGIN>/auth/confirm
```

`signup()` already passes the full `/auth/confirm` callback as `emailRedirectTo`, so the production Confirm signup email template must use `RedirectTo` directly:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Confirm email address</a>
```

Do not append another `/auth/confirm` to `RedirectTo`.

The application confirmation route remains server-owned and redirects successful confirmation only to `/`; arbitrary `next` redirects remain forbidden.

## 11. Vercel production boundary

Preferred Phase 1 host: Vercel.

Production variables:

```text
NEXT_PUBLIC_APP_URL=<final https origin>
NEXT_PUBLIC_SUPABASE_URL=<hosted Supabase URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
```

Rules:

- Node remains 24.x;
- never prefix the service-role key with `NEXT_PUBLIC_`;
- do not commit production secrets;
- public environment variables require rebuild/redeploy after changes;
- physical-device validation begins only after final HTTPS origin is stable.

## 12. Current slice — P1-PWA-001B

Execute now:

```text
connect Supabase account/tool
→ create or select dedicated hosted project
→ migrations + reviewed seed
→ connect Vercel account/tool
→ production variables
→ reachable HTTPS deployment
→ final Supabase Auth URL/template config
→ hosted desktop signup/confirm/login/Today smoke
```

Human action should be requested only when external account authorization/secret/device access genuinely cannot be performed through connected tools.

## 13. P1-PWA-001C physical iPhone target

Only after hosted desktop smoke passes, ask the user to validate on the actual iPhone:

- open HTTPS URL;
- Add to Home Screen;
- launch standalone;
- login/session persistence;
- Today/Lesson/Review responsive/touch usability;
- interrupt and reopen during Lesson/Review;
- network interruption then Retry;
- authoritative state still resumes correctly.

## 14. Final Phase 1 gate after PWA

After P1-PWA-001 passes, run **P1-E2E-001** on the deployed environment:

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

Only hosted E2E + physical iPhone validation may close Phase 1 and allow Phase 2 to begin.

## 15. Documentation/release rule

A module is not complete because code exists. Formal completion requires final branch CI, normal PR merge, merged-main CI and repository handoff documents to agree.