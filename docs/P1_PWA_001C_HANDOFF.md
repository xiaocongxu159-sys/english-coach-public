# P1-PWA-001C Physical iPhone Validation Handoff

**Date opened:** 2026-09-11  
**Parent module:** P1-PWA-001 — hosted/reachable deployment + physical iPhone PWA validation  
**Slice:** P1-PWA-001C — physical iPhone validation  
**Status:** IN PROGRESS — Safari install gate passed; standalone/session/touch/interruption checks remain

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
Standalone launch                         PENDING
Existing auth/session restored            PENDING
Today responsive/touch                    PENDING
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

This verifies the first physical-device installation gate. The screenshot is user-provided acceptance evidence; it is not treated as proof of standalone launch or session persistence until those interactions are performed separately.

## 6. Evidence discipline

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

## 7. Next manual gate

From the physical iPhone Home Screen:

```text
tap the installed English Coach icon
→ confirm it opens without Safari browser chrome/address bar
→ confirm whether the existing authenticated session is restored
→ inspect Today layout/touch usability
```

Required evidence:

- one screenshot of the app after launching from the Home Screen;
- whether it opened directly to Today or asked for sign-in.

This next gate can validate standalone launch, session restoration and the first mobile Today rendering in one pass.

## 8. Exit condition

P1-PWA-001C is COMPLETE only when all required physical-iPhone checks pass or any discovered defects are fixed, redeployed and re-verified on the physical device.

After P1-PWA-001C passes, execute deployed **P1-E2E-001** before Phase 2.
