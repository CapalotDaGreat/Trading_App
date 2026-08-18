# Apple App Store Review readiness — TradeInsight by Aithera

Cross-check against https://developer.apple.com/app-store/review/guidelines/
before each submission. This app is positioned as **Finance / educational research
coaching**, not a broker or investment adviser. Bundle id remains `ai.tradevision.app`.

## Already aligned in-app

| Guideline theme | Status |
| --- | --- |
| 3.1.1 / 3.1.2 IAP subscriptions | Native App Store IAP via RevenueCat; Restore + Manage Subscription; paywall Terms/Privacy/Risk links; StoreKit price strings when offerings load |
| 5.1.1(v) Account deletion | In-app deletion for signed-in users; billing warning; guest does not show Delete Account |
| 5.1.1 Privacy | Crash reporting off by default; no ATT/tracking product; Privacy Policy linked |
| 4.8 Sign in with Apple | Google + Apple offered; `usesAppleSignIn` + `expo-apple-authentication` plugin in `app.config.ts` |
| 2.3 Accurate metadata | Store copy states educational research / not a broker / no buy-sell signals; **12+** store rating with **18+** account & subscription eligibility |
| Demo access | Guest path for reviewers with educational/risk acknowledgment (no 18+ gate to explore) |

## Must complete outside the repo (blockers)

1. Host legal URLs with HTTP 200: privacy, terms, risk, security, support, account-deletion.
2. Fill App Store screenshots (`store/screenshots/`).
3. Configure App Store Connect products + 7-day yearly trial to match code IDs.
4. Complete Paid Applications Agreement, tax, and banking.
5. Privacy Nutrition Labels must match shipped behavior (optional crash diagnostics only after consent; no tracking).
6. TestFlight: Sign in with Apple, purchase, restore, cancel, deletion with recent login.
7. Counsel-reviewed legal entity name/address in hosted policies.

## Reviewer notes

Use `store/reviewer-notes.md`. Emphasize Guest demo, RVS/DQS meaning, and cloud AI off.
