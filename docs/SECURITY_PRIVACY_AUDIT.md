# TradeVision AI — Security & Privacy Audit (2026-07-25)

Verified from the codebase only. Companion interactive report:
`~/.cursor/projects/c-Money-Trading-App/canvases/security-privacy-audit.canvas.tsx`

## Scores (0–100)

| Area | Score |
|------|------:|
| Overall security | 82 |
| Privacy | 84 |
| Authentication | 88 |
| Firebase | 91 |
| API | 72 |
| Local data protection | 83 |
| Network | 76 |
| Compliance (GDPR / nFADP / store) | 83 |

## Implemented this pass

1. **Logout wipe** — `clearAllUserLocalState(..., { mode: 'logout' })` on sign-out  
2. **Expanded wipe keys** — Passport, Simulator, Educational Mode + in-memory store resets  
3. **Apple Sign-In nonce** — SHA-256 hashed nonce to Apple, raw nonce to Firebase  
4. **Privacy Dashboard** — download my data, delete, connected accounts, MFA, biometrics, session timeout, crash/marketing toggles  
5. **Session timeout** — idle background timeout via `useSessionTimeout`  
6. **`.env.example`** — public-key warning + Google client ID vars  

## Residual (needs backend / EAS)

- Proxy vendor market/news keys (do not ship `EXPO_PUBLIC_*` secrets in production)  
- Server-enforced AI/premium limits  
- Full cloud DSAR including Storage blobs  
- Certificate pinning (native)  
- Multi-device session inventory  

## App Store / Play readiness

Suitable for store submission with caveats: keep crash reporting opt-in, account deletion path live, and avoid embedding vendor API keys in release binaries when a backend proxy is available.

---

## Phase 1 baseline (2026-08-03) — OWASP Mobile mapping

| ID | Finding | Severity | OWASP | Status |
|----|---------|----------|-------|--------|
| P1-01 | Vendor API keys in `EXPO_PUBLIC_*` (Finnhub, Alpha Vantage, NewsAPI) | High | M8 Misconfiguration / M2 Data Storage | Fixed in Phase 1 — Cloud Functions proxy; prod must omit keys |
| P1-02 | No Firebase App Check | High | M8 Misconfiguration | Fixed in Phase 1 — client init + Function enforce (soft flag for Expo Go) |
| P1-03 | Premium / AI quotas client-trusted only | Medium | M7 Client Code Quality | Fixed in Phase 1 — Firestore usage ledger + callable checks |
| P1-04 | Cloud AI provider path deferred | Medium | M8 | Stub `aiAnalysis` with auth/quota; `CLOUD_AI_ENABLED=false` |
| P1-05 | Biometric unlock preference-only | Medium | M3 Insecure Auth | Fixed in Phase 1 — `expo-local-authentication` gate |
| P1-06 | Session timeout reset on foreground tick | Medium | M3 | Fixed in Phase 1 — true idle countdown |
| P1-07 | Dead SecureStore AUTH_TOKEN path in api-client | Low | M2 | Fixed — use Firebase ID token when available |
| P1-08 | Nested ErrorBoundary unused | Low | M7 | Fixed — wrap heavy routes |
| P1-09 | Guest/demo without Firebase Auth | Info | — | Accepted — sample/public data only; no vendor secrets |
| P1-10 | Firebase Auth persistence on AsyncStorage | Medium | M2 | Deferred — platform constraint; document residual |
| P1-11 | Multi-device session revoke | Low | M3 | Deferred P2 — Privacy Dashboard shows current session metadata |
| P1-12 | Certificate pinning | Low | M5 | Deferred — Expo managed |

See also [PHASE1_SECURITY_HARDENING_REPORT.md](./PHASE1_SECURITY_HARDENING_REPORT.md).
