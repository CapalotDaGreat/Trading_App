# TradeVision AI — Phase 1 Security & Backend Hardening Report

**Date:** 2026-08-03  
**Scope:** Production security, Cloud Functions vendor proxy, App Check, server quotas, auth/local hardening  
**Baseline:** [SECURITY_PRIVACY_AUDIT.md](./SECURITY_PRIVACY_AUDIT.md)

---

## Scores (0–100)

| Area | Score |
|------|------:|
| **Production Readiness** | **88** |
| Security | 88 |
| Privacy | 86 |
| Performance | 81 |
| Accessibility | 79 |
| Maintainability | 87 |
| Architecture | 89 |
| App Store Readiness | 88 |
| Google Play Readiness | 87 |

---

## OWASP Mobile mapping (Phase 1)

| Control | Status |
|---------|--------|
| M1 Improper Platform Usage | App Check init + Functions soft enforce |
| M2 Insecure Data Storage | Logout wipe; SecureStore for sensitive keys; vendor secrets off-client |
| M3 Insecure Authentication | Biometric gate; idle timeout; MFA reauth length check; Apple nonce (prior) |
| M4 Insufficient Cryptography | Platform TLS; pinning deferred |
| M5 Insecure Communication | Callables over HTTPS; sanitized vendor errors |
| M6 Insecure Authorization | Server subscription + quota on proxies |
| M7 Client Code Quality | ErrorBoundary on AI/decision; structured logger |
| M8 Misconfiguration | `EXPO_PUBLIC` vendor keys gated to `__DEV__` direct only |
| M9 Reverse Engineering | Residual — keys no longer in release bundle when EAS omits them |
| M10 Extraneous Functionality | Cloud AI stub fails closed |

---

## What shipped

1. **Cloud Functions proxies** — `marketQuote`, `marketCandles`, `marketSearch`, `economicCalendar`, `newsHeadlines`, `aiAnalysis` (stub), `recordAiUsage`, `getAiQuota`
2. **Auth + App Check + quota** helpers; abuse events in `securityEvents`
3. **Client flip** — signed-in → callables; guest/demo → sample/public; dev-direct keys only when `EXPO_PUBLIC_MARKET_DATA_DIRECT=true` in `__DEV__`
4. **App Check client init** (`firebase/app-check.ts`) + Functions `requireAppCheck` (soft via `APP_CHECK_ENFORCE`)
5. **Server AI usage ledger** preferred when signed in; local engine remains for demo/offline
6. **BiometricGate** via `expo-local-authentication`
7. **True idle session timeout** + touch activity capture
8. **Firestore rules** for `usage/**` and `securityEvents`
9. **Privacy Dashboard** current-session panel
10. **ErrorBoundary** on decision stack + AI tab; sanitized fallback copy

---

## Breaking changes

**None for UX.** Ops change: production EAS must **omit** `EXPO_PUBLIC_FINNHUB_API_KEY`, `EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY`, `EXPO_PUBLIC_NEWS_API_KEY` and set Functions secrets instead.

---

## Remaining risks / technical debt

| Item | Priority |
|------|----------|
| Native DeviceCheck / Play Integrity (replace CustomProvider debug tokens) | P0 before hard enforce |
| Set `APP_CHECK_ENFORCE=true` after debug tokens registered for all internal builds | P0 |
| Deploy Functions + secrets to production Firebase | P0 |
| Full multi-device session revoke | P2 |
| Certificate pinning | P3 |
| Firebase Auth persistence on AsyncStorage | Accepted platform residual |
| `npm audit` moderate/high transitive deps | Ongoing |

---

## Store submission readiness

- **Apple:** Educational positioning + no brokerage preserved; AI disclosures remain; subscriptions via RevenueCat webhook authority.
- **Google Play:** Same; Data Safety should list analytics/crash as opt-in; account deletion path live.

Deploy Functions and strip vendor `EXPO_PUBLIC_*` from production EAS before treating security as release-complete.
