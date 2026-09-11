# P1-PWA-001C Physical iPhone Validation Handoff

**Date opened:** 2026-09-11  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Slice:** P1-PWA-001C — physical iPhone validation  
**Status:** IN PROGRESS — install + standalone launch passed; installed-app session persistence/interruption checks remain

## 1. Entry conditions

P1-PWA-001C starts only after hosted Production is verified on the real application path.

Entry gates already passed:

```text
public canonical repository              PASS
public GitHub Actions                    PASS
Vercel Production                       PASS
fresh signup + confirmation              PASS
authenticated Today                      PASS
reviewed Lesson end-to-end               PASS
Lesson completion                        PASS
Today completion-state reconciliation    PASS
future Review preserved separately       PASS
```

The final P1-PWA-001B completion-state Production evidence showed:

```text
Today badge: Completed
CTA: View lesson summary
0 reviews ready now
14 reviews upcoming
```

ISSUE-034 is therefore closed before mobile validation begins.

## 2. Scope

This slice validates the actual Production application on a physical iPhone. It is a functional acceptance gate, not a broad visual redesign.

Required checks:

1. open the final HTTPS Production origin in iPhone Safari;
2. Add to Home Screen;
3. launch from the Home Screen in standalone mode;
4. verify authentication/session persistence;
5. verify Today responsive/touch behavior;
6. verify Lesson responsive/touch behavior;
7. verify Review responsive/touch behavior;
8. interrupt and reopen an in-progress Lesson;
9. interrupt and reopen an in-progress Review;
10. perform a real network interruption and use Retry;
11. confirm authoritative persisted state resumes correctly after interruption/retry.

## 3. Non-goals

P1-PWA-001C does not require:

- offline lesson content caching;
- a Service Worker;
- broad typography/color redesign;
- Phase 2 features;
- changing Mastery/Review semantics;
- resetting learner data merely to make mobile testing convenient.

Any defect found during physical validation must first be reproduced and scoped before code changes are made.

## 4. Acceptance matrix

```text
Safari HTTPS open                         PASS — physical iPhone
Add to Home Screen                        PASS — physical iPhone
Home Screen icon present                  PASS — screenshot evidence received
Standalone launch                         PASS — Home Screen launch without Safari browser chrome
Installed-app sign-in                     PASS — login eventually reached authenticated app
Installed-app session persists on reopen  PENDING
Today responsive/touch                    PRELIMINARY PASS — authenticated mobile screen reachable
Lesson responsive/touch                   PENDING
Review responsive/touch                   PENDING
Lesson interruption/reopen                PENDING
Review interruption/reopen                PENDING
Real network interruption                 PENDING
Retry surface usable                      PENDING
Persisted state resumes correctly         PENDING
```

## 5. Physical evidence — install gate

On 2026-09-11 the learner provided a physical iPhone Home Screen screenshot after using Safari → Share → Add to Home Screen.

Observed result:

```text
English Coach Home Screen icon visible
installation completed on the physical device
```

This verifies the first physical-device installation gate.

## 6. Physical evidence — standalone launch and installed-app login

The learner launched English Coach from the iPhone Home Screen. The app opened without Safari address-bar/browser chrome, verifying standalone launch.

The first installed-app launch presented the login screen rather than inheriting the already-authenticated Safari browsing context. That is not yet treated as a session-persistence failure because the acceptance requirement is persistence **after the installed app itself has authenticated**.

The learner entered credentials and successfully reached the authenticated application. The first login response felt noticeably slow, but it eventually completed without an error screen.

Current interpretation:

```text
standalone shell                      PASS
installed-app login functional        PASS
first interaction latency             OBSERVATION — not yet a proven defect
session persistence after PWA login   NOT YET TESTED
```

Do not merge a speculative login-code change solely because of one slow first response. Reproduce timing first; a cold server start, network path, or app/runtime warm-up may explain a one-off delay.

## 7. Evidence discipline

Physical-device checks must be based on actual iPhone behavior. Desktop responsive emulation is not accepted as a substitute.

For each failed check record:

```text
exact screen/action
expected result
actual result
whether reload/reopen changes it
screenshot when useful
```

Do not apply speculative fixes from screenshots alone when a reproducible interaction is needed.

## 8. Next manual gate

Now that the installed app is authenticated:

```text
1. leave the app on the authenticated Today screen
2. swipe up / open App Switcher
3. fully dismiss English Coach
4. wait about 10 seconds
5. tap the English Coach Home Screen icon again
```

Acceptance result:

```text
PASS → app reopens still authenticated and returns to Today (or equivalent authenticated screen)
FAIL → app reopens at login and requires credentials again
```

Also note whether reopen feels immediate, moderately delayed, or again noticeably slow. This separates one-time login latency from general installed-app latency.

## 9. Exit condition

P1-PWA-001C is COMPLETE only when all required physical-iPhone checks pass or any discovered defects are fixed, redeployed and re-verified on the physical device.

After P1-PWA-001C passes, execute deployed **P1-E2E-001** before Phase 2.
