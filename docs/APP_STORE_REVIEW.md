# Apple App Store Review readiness — TradeInsight by Aithera

Cross-check against https://developer.apple.com/app-store/review/guidelines/
before each submission. Position: **Finance / educational research coaching**,
not a broker or investment adviser. Bundle id: `ai.tradevision.app`.

**Submission status:** repo copy and in-app legal reader are prepared.
**Hosted Privacy Policy URL, screenshots, IAP products, and counsel entity
fields remain MANUAL ACTION REQUIRED.** Do not submit until those are done.

## Already aligned in-app

| Guideline theme | Status |
| --- | --- |
| 3.1.1 / 3.1.2 IAP subscriptions | Native App Store IAP via RevenueCat; Restore + Manage Subscription; paywall Terms/Privacy/Risk links (in-app); StoreKit price strings when offerings load |
| 5.1.1(v) Account deletion | In-app deletion for signed-in users; billing warning; guest does not show Delete Account |
| 5.1.1 Privacy | Crash reporting and product analytics off by default; no ATT/tracking product; Privacy Policy in-app |
| 4.8 Sign in with Apple | Google + Apple offered; `usesAppleSignIn` + `expo-apple-authentication` plugin in `app.config.ts` |
| 2.3 Accurate metadata | Educational research / not a broker / no buy-sell signals; **12+** store rating with **18+** account eligibility; RVS/DQS are not price predictions |
| Demo access | Guest path with educational/risk acknowledgment (no 18+ gate to explore) |
| AI | Explainability / process coaching; production cloud AI disabled |

## Must complete outside the repo (blockers)

1. Host legal URLs with HTTP 200 on `[OFFICIAL DOMAIN REQUIRED]`: privacy, terms, risk, security, support, account-deletion.
2. Fill App Store screenshots (`store/screenshots/`).
3. Configure App Store Connect products + 7-day yearly trial to match code IDs (`monthly`, `yearly`, `lifetime`, entitlement `Aithera Pro`). Lifetime must be a non-consumable / one-time IAP.
4. Complete Paid Applications Agreement, tax, and banking.
5. Privacy Nutrition Labels must match shipped behavior (optional crash diagnostics and optional analytics only after consent; no tracking).
6. TestFlight: Sign in with Apple, purchase, restore, cancel, deletion with recent login.
7. Counsel: replace `[LEGAL ENTITY NAME REQUIRED]` / `[VAT/UID REQUIRED]` / official emails before treating policies as production.

## Reviewer notes

Use `store/reviewer-notes.md`. Emphasize Guest demo, Educational Mode, RVS/DQS meaning, no brokerage, no signals, in-app legal docs, and that cloud AI is off.
