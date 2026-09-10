# P1-PWA-001 Handoff

**Date:** 2026-09-03  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Completed slice:** P1-PWA-001A — deployment/PWA code readiness  
**Status:** COMPLETE / MERGED-MAIN VERIFIED  
**Feature code head:** `87182c39a845f53aa470e0001afaf6e97c42eb08` — CI #236 double-green  
**Final code+docs head:** `238e5212d0a41ac0c361c812d63881520b5196e6` — CI #242 double-green  
**Release PR:** #38 squash-merged as `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`  
**Merged-main CI:** #243 — application + fresh-Supabase PASS  
**Exact next slice:** P1-PWA-001B — hosted Supabase + Vercel deployment

## 1. Purpose

P1-PWA-001 does not add new learning semantics. It takes the verified local vertical slice and proves that the same server-authoritative learner loop works as a real hosted iPhone-first product.

The Phase 1 device path remains:

```text
hosted HTTPS app
→ authenticate
→ Today
→ reviewed Lesson
→ deterministic Attempt / Evidence / Mastery / Review
→ learner Review session
→ return / refresh / relogin
→ Today reflects persisted state
→ Add to Home Screen / standalone launch on physical iPhone
```

## 2. Frozen physical-device acceptance contract

`docs/ARCHITECTURE.md` requires for Phase 1:

- Add to Home Screen;
- responsive Today/Lesson/Review flow;
- auth/session persistence;
- audio playback when included;
- interruption/resume;
- network error/retry.

The current reviewed Pilot has no required learner audio asset, so audio is tested only if an approved asset exists in the deployed slice. Realtime microphone/WebRTC/background-audio routing belongs to Phase 3.

## 3. Service Worker / offline scope

Phase 1 does **not** require offline content caching. A Service Worker was intentionally not added merely to satisfy a generic PWA checklist.

Current Home Screen web-app support is based on:

- Next.js Web App Manifest;
- `display: standalone`;
- stable root `id`, `scope` and `start_url`;
- Apple web-app metadata in the root layout;
- HTTPS deployment;
- responsive/safe-area-aware UI;
- physical Add to Home Screen validation.

Offline behavior must not be claimed beyond what is actually implemented.

## 4. 001A verified changes

### Production application origin

`src/lib/app-url.ts` now enforces:

- development may fall back to `http://localhost:3000`;
- production requires `NEXT_PUBLIC_APP_URL`;
- production requires HTTPS;
- only absolute `http(s)` URLs are accepted;
- credentials/query/hash are rejected;
- URL must point to the application origin root;
- returned value is normalized to the origin.

`signup()` uses this helper for `emailRedirectTo`, so a production deployment cannot silently emit localhost confirmation links because the variable was omitted.

Permanent coverage: `test/app-url.test.mts`.

### iPhone manifest compatibility

`src/app/manifest.ts` freezes:

- `id: "/"`;
- `start_url: "/"`;
- `scope: "/"`;
- `display: "standalone"`;
- portrait-primary orientation;
- existing SVG icon with `purpose: "any"` rather than maskable-only.

Permanent coverage: `test/pwa-manifest.test.mts`.

### Mobile interaction / failure readiness

- generic `button`, `input` and `select` minimum height is 44px;
- existing `viewport-fit=cover`, `100dvh` and safe-area handling remain;
- root `src/app/error.tsx` exposes learner-facing Retry.

The error UI does not claim that a failed browser response means the server made no change. A connection may fail after a server commit. Server persistence remains authoritative; retry reloads persisted state while existing idempotency protects exact trusted replays.

## 5. Auth/session boundary

Supabase SSR sessions are cookie-based through `@supabase/ssr`, suitable for the Home Screen web-app validation path.

The server confirmation path remains:

```text
/auth/confirm?token_hash=<hash>&type=email
→ server verifyOtp()
→ session cookies
→ fixed same-origin /
```

Arbitrary `next` redirects remain forbidden.

## 6. Hosted Supabase sequence for 001B

Do not copy local `supabase/config.toml` localhost Auth values into production.

Required order:

```text
1. create/connect dedicated hosted Supabase project
2. link CLI to the exact project
3. preview migrations: `supabase db push --dry-run`
4. apply migrations: `supabase db push`
5. do NOT use `--include-seed` in production
6. configure hosted URL + publishable key + service-role key securely
7. run `npm run pilot:seed`
8. run reviewed seed again to prove idempotency
9. verify exactly the two Pilot nodes are learner-active
10. verify both reviewed Lesson Blueprints exist
11. configure Auth Site URL / exact redirect URL
12. configure Confirm signup token-hash template
```

`supabase/seed.sql` is intentionally empty. Reviewed Pilot + Review Blueprint content is seeded by `scripts/seed-pilot-content.mjs`, which validates committed content before privileged upserts.

## 7. Hosted Auth configuration

For final production origin `<APP_ORIGIN>`:

```text
Site URL: <APP_ORIGIN>
Redirect URL: <APP_ORIGIN>/auth/confirm
```

`signup()` passes the full callback as `RedirectTo`, so the Confirm signup template should use it directly:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Confirm email address</a>
```

Do not append a second `/auth/confirm` to `RedirectTo`.

## 8. Vercel deployment boundary

Preferred Phase 1 host: Vercel.

Required production variables:

```text
NEXT_PUBLIC_APP_URL=<final https origin>
NEXT_PUBLIC_SUPABASE_URL=<hosted Supabase API URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
```

Rules:

- Node runtime remains 24.x;
- `SUPABASE_SERVICE_ROLE_KEY` must never have a `NEXT_PUBLIC_` prefix;
- do not commit production secrets;
- public variables require rebuild/redeploy after changes;
- physical-device validation begins only after the final HTTPS origin is stable.

## 9. 001A release verification

All 001A release gates passed:

1. code-only feature head `87182c39...` passed CI #236 application + fresh-Supabase;
2. final code+documentation head `238e5212...` passed CI #242 application + fresh-Supabase;
3. PR #38 merged normally through squash merge;
4. merge SHA is `2c32d11f078dd8bdee784d8b7251e9aba998b7f6`;
5. merged-main CI #243 passed both permanent jobs.

Therefore **P1-PWA-001A is COMPLETE / merged-main verified**.

## 10. Work not yet claimed

001A does **not** claim:

- hosted Supabase project connection;
- production secrets configuration;
- hosted migrations;
- hosted Pilot/Review Blueprint seed;
- production Auth Site URL/redirect/template configuration;
- Vercel production deployment;
- hosted desktop signup/login smoke;
- physical iPhone Add to Home Screen;
- physical iPhone interruption/resume/network retry.

These remain P1-PWA-001B/C.

## 11. Exact next slice — P1-PWA-001B

```text
connect Supabase account/tool
→ create or select dedicated Phase 1 hosted project
→ migration dry-run + push
→ reviewed seed twice + exact activation verification
→ connect Vercel
→ production environment variables
→ production deploy
→ final Supabase Site URL / redirect / email template
→ hosted desktop signup/confirm/login/Today smoke
```

Only after hosted desktop smoke passes should the user perform **P1-PWA-001C — physical iPhone validation**.

## 12. Physical iPhone target

On the actual device verify:

- open final HTTPS URL;
- Add to Home Screen;
- standalone launch;
- auth/session persistence;
- Today/Lesson/Review phone/touch usability;
- interruption and reopen during Lesson/Review;
- network interruption then Retry;
- authoritative state resumes correctly.

## 13. Final Phase 1 gate

After P1-PWA-001 passes, run P1-E2E-001 on the deployed environment:

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

Only hosted E2E + physical iPhone validation may close Phase 1 and allow Phase 2.
