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
