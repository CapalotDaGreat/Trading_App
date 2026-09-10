# Learner-state persistence, privacy, and resilience

**Date:** 10 September 2026  
**Role:** How TradeAcademy keeps structured learner development across reinstall and devices — without turning the cloud into a diary.

Authenticated cloud persistence is **optional** (same gate as the rest of the app: `canUseFirestore(uid)`). Guests (`demo-guest`) stay local.

## Audit (what lived only locally)

| State | Local key / source | Cloud before this work | Cloud now |
| --- | --- | --- | --- |
| Competency / mastery | Derived from evidence | No | Derived after evidence restore |
| Evidence ledger | `tradevision-competency-evidence-v1` | No | `users/{uid}/learnerEvidence/{eventKey}` |
| Planner / queue | `tradevision-learning-queue-v1` | No | Inside `users/{uid}/learnerState/progress` |
| Academy progress | `tradevision-academy-progress` | No | Progress doc (`lessons`, quiz stats) |
| Practice history | `tradevision-practice-progress-v1` | No | Progress doc |
| Replay progress | `tradevision-replay-tv-v2` (uid map) | No | Completed episode IDs + process scores — **not** draft reasoning |
| Learner behavior | `tradevision-learner-behavior-v1` | No | Compact events / self-confidence numbers |
| Learner profile (coach) | `tradevision:coach-profile:v1:{uid}` | `users/{uid}` preferences | Unchanged |
| Mistake patterns | Derived from evidence | No | Derived on restore |
| Spaced-practice due dates | Derived from evidence | No | Derived on restore |
| Journal **prose** | Local repo or `users/{uid}/journal` | Already Firestore for signed-in users | Unchanged — **not** copied into learnerState |
| Simulation **book / equity** | `tradevision-simulation-v1` | Rules existed; feature was local | Process counts only in progress meta. Cash/equity are not synced |
| AI conversations | Local | Cloud AI off | Not synced |

## Classification

**Safe structured (synced when authenticated):** concept IDs, evidence type, timestamps, results, help level, process flags, academy lesson IDs, drill IDs, queue skip/defer counts (not the free-form defer reason), replay episode IDs, aggregated behavior events.

**Sensitive (not synced on this channel):** journal notes / `lessonsLearned`, AI prompts/messages, replay draft reasoning, defer reasons, simulated P/L, cash/equity, portfolio values.

`sanitizeEvidenceForCloud` strips `simulatedPnl` / `simulatedProfitable`. `assertStructuredLearnerPayload` refuses the sensitive key list.

## Sync

`syncLearnerState({ authUid })` uses the **Auth uid only**. Client-supplied document `uid` must match `request.auth.uid` in rules.

1. Offline → mark `tradevision-learner-sync-queue-v1` pending; keep local writes.  
2. Online → pull cloud, **union-merge** with local, apply, push. Unique records on either side are kept.  
3. Guest → skip. Changing uid (including `demo-guest` → signed-in, signed-in → guest, or another account) clears device-global academy/practice/queue so guest or other-user work is not uploaded as the current user. Evidence/replay/behavior are already uid-scoped. First launch (`previousUid` null) does not wipe persisted local state.

Account deletion still `recursiveDelete`s `users/{uid}`, which includes `learnerState` and `learnerEvidence`.

## Analytics

Unchanged allowlist. No journal text, AI chats, portfolio values, or raw behavioral labels. Requires `productAnalyticsEnabled`.
