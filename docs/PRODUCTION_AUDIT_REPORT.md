# TradeVision AI — Comprehensive Production Audit Report

**Date:** 2026-08-03  
**Scope:** Full repository review + hardening pass (Expo SDK 54)  
**Companion canvas:** `~/.cursor/projects/c-Money-Trading-App/canvases/production-audit.canvas.tsx`

---

## SECTION 1 — Executive Summary

TradeVision AI is **production-capable** for store submission as a decision-first educational research app, with residual work concentrated in **backend-enforced limits**, **vendor API key proxying**, and continued product-depth polish. Architecture, Firebase gating, demo mode, and educational framing are strong.

| Score area | Score (0–100) |
|---|---:|
| **Overall Production Readiness** | **84** |
| Architecture | 88 |
| Security | 83 |
| Privacy | 85 |
| Performance | 80 |
| Accessibility | 78 |
| Maintainability | 86 |
| Code Quality | 85 |
| UX | 82 |
| App Store Readiness | 86 |
| Google Play Readiness | 85 |

---

## SECTION 2 — Changes Made (this pass)

### 1. Deeper Journal Coach
- **Reason:** Prior coach leaned on P&L weekday heuristics and generic defaults.
- **Files:** `features/decision/services/journal-coach.service.ts`, `trader-intelligence.service.ts` (re-export), `useDecision.ts` (content fingerprint)
- **Benefit:** Insights from tags, emotion, strategy, lessons; cache invalidates on edits.
- **Side effects:** Coach text changes for existing journals.

### 2. AI burst rate limiting
- **Reason:** Daily counters alone do not stop rapid-fire client abuse.
- **Files:** `features/ai/services/ai.service.ts`, uses `shared/services/rate-limit/rate-limiter.ts`
- **Benefit:** `RATE_LIMITED` with `retryAfterMs` on analysis/chat bursts.
- **Side effects:** Heavy users may see brief wait messages; still client-side only.

### 3. Educational AI level naming
- **Reason:** `entryZone` / `stopLoss` / `takeProfit` read as trade instructions.
- **Files:** `ai.types.ts`, `ai-engine.service.ts`, `AiAnalysisCard.tsx`, tests
- **Benefit:** Observation / invalidation / next-research framing for App Store finance review.
- **Side effects:** Breaking rename for any external consumers of `TradeSuggestion` fields.

### 4. Mentor Decision Debt realism
- **Reason:** Debt fields were hard-coded zeros.
- **Files:** `features/decision/hooks/useTradingMentor.ts`
- **Benefit:** Queue length, journal gap, replay gap, ignored alerts feed mentor debt.
- **Side effects:** Mentor urgency may increase for active users.

### 5. Passport credentials beyond simulator
- **Reason:** Credentials were simulator-only.
- **Files:** `passport.service.ts`, `passport.store.ts`, `lab.store.ts`, `useDecisionPassport.ts`
- **Benefit:** Lab closes + stable milestones from journal / academy / replay / lab.
- **Side effects:** More credentials appear for engaged users.

### 6. Passport JSON share (replaced PDF stub)
- **Reason:** “PDF coming soon” was unfinished product surface.
- **Files:** `passport-export.service.ts`, `DecisionPassportScreen.tsx`, `passport-profile.service.ts`
- **Benefit:** Real process-profile export via Share / web download.
- **Side effects:** Large JSON in share sheet on some devices.

### 7. Google auth double-submit guard
- **Reason:** Effect re-fired when parent recreated `onGoogleSuccess`.
- **Files:** `features/auth/components/SocialAuthButtons.tsx`
- **Benefit:** Stable callback ref + response key dedupe.
- **Side effects:** None expected.

### 8. Accessibility polish
- **Reason:** Theme radios and MFA hide control lacked labels/roles.
- **Files:** `ThemeToggle.tsx`, `MfaScreen.tsx`
- **Benefit:** Better VoiceOver / TalkBack semantics.
- **Side effects:** None.

### 9. Logout wipe key coverage
- **Reason:** Brief/portfolio day keys could leak session context.
- **Files:** `shared/services/user-data/clear-all-user-local-state.ts`
- **Benefit:** Cleaner shared-device logout.
- **Side effects:** Day-plan badges reset on logout.

---

## SECTION 3 — Vulnerabilities

| Severity | Finding | Fix / status | Remaining risk |
|---|---|---|---|
| High (prior) | Logout left local user data | Fixed earlier (`mode: 'logout'` wipe) | Shared-device residual if wipe fails mid-run |
| Medium | Vendor keys in `EXPO_PUBLIC_*` | Documented; client soft-fail for Finnhub | Quota abuse until backend proxy |
| Medium | Client-only AI daily limits | Burst limiter added | Bypass without Cloud Functions |
| Medium | Apple Sign-In nonce missing | Fixed earlier | — |
| Low | Google auth race / double submit | Fixed this pass | Edge cases with aborted prompts |
| Low | No cert pinning | Accepted for Expo managed | Advanced MITM |
| Info | PDF export placeholder | Replaced with JSON share | PDF still not native |

---

## SECTION 4 — Shallow Implementations Improved

| Area | Why shallow | How deepened | Systems integrated |
|---|---|---|---|
| Journal Coach | Generic P&L defaults | Emotion/tags/strategy/lessons + explainability | Journal, Decision types |
| Mentor Decision Debt | Zero placeholders | Live queue, journal gap, replay, alerts | Brief, Log, Alerts, Academy |
| Decision Passport credentials | Simulator-only | Lab awards + journal/academy/replay milestones | Lab, Journal, Academy, Replay |
| Passport export | PDF stub | Shareable JSON process package | Passport profile, Share API |
| AI research levels | Trade language | Observation / invalidation / research levels | AI engine + card UI |

---

## SECTION 5 — Next Steps

### P0 — Critical before release
| Item | Effort | User impact | Complexity | Business value | Dependencies |
|---|---|---|---|---|---|
| Proxy Finnhub / Alpha Vantage / news keys via Cloud Functions | 2–4d | Reliability + security | Medium–High | High | Firebase Functions, secrets |
| Server-enforce AI + premium feature limits | 2–3d | Fair use, anti-abuse | Medium | High | Auth + RevenueCat webhooks |
| Confirm App Check on Firestore/Storage in production | 1d | Abuse resistance | Medium | High | Firebase console |

### P1 — Strongly recommended
| Item | Effort | User impact | Complexity | Business value | Dependencies |
|---|---|---|---|---|---|
| Nest ErrorBoundary on heavy decision screens | 0.5d | Fewer hard crashes | Low | Medium | Existing boundary |
| Academy ↔ heatmap/coach curriculum hooks | 1–2d | Personalized learning | Medium | High | Academy, Heatmap, Mentor |
| Expand a11y audit (dynamic type, reduce motion) | 1–2d | Inclusive UX | Medium | Medium | Design tokens |
| E2E Maestro paths for auth + guest + paywall | 1d | Store regression safety | Medium | High | Maestro |

### P2 — Nice improvements
| Item | Effort | User impact | Complexity | Business value | Dependencies |
|---|---|---|---|---|---|
| Native PDF passport via print/PDF kit | 2–3d | Premium feel | Medium | Medium | Expo print / native |
| FlashList audit on long lists | 0.5–1d | Scroll perf | Low | Medium | FlashList |
| Offline query persistence tuning | 1d | Offline trust | Medium | Medium | React Query Persist |

### P3 — Future innovation
| Item | Effort | User impact | Complexity | Business value | Dependencies |
|---|---|---|---|---|---|
| Multi-device session inventory UI | 3–5d | Privacy confidence | High | Medium | Cloud Functions |
| Behavioural drift coach across weeks | 3–5d | Retention | High | High | Log, Journal, Heatmap |
| Optional encrypted local journal vault | 5d+ | Privacy premium | High | Medium | SecureStore / crypto |

---

## SECTION 6 — Features That Should NOT Be Implemented

| Idea | Why avoid |
|---|---|
| Brokerage / order routing | Breaks product identity; regulatory burden |
| Buy/sell “signals” or predicted returns | App Store finance rejection risk; contradicts DQS framing |
| Full TradingView clone (drawing tools, every TF) | Maintenance explosion; competes where you cannot win |
| Social copy-trading feeds | Legal/compliance and toxic UX vs decision coaching |
| Fabricated FX candles when vendors fail | Trust destruction; already forbidden by AGENTS.md |
| Gamified P&L leaderboards | Encourages performance framing over process |
| Auto-trade bots | Out of scope; liability |

---

## Verification

- `npm run typecheck` — passed  
- `npm run lint` — passed  
- Targeted Jest (AI engine, passport profile, decision services) — passed after export status update  

Educational positioning, guest/demo mode, and “no buy/sell signals” framing were preserved throughout.
