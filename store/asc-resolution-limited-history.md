# ASC Resolution Center — Limited App Review history reply

**Use:** Paste into the Resolution Center reply **and** into **App Review Information → Notes** (for future submissions).

**Before you reply:** Attach the physical-device recording at
`store/review/app-review-demo.mp4` in Resolution Center (or link it if ASC
rejects large uploads — unlisted YouTube/Drive with access for Apple is common).

**Do not commit real reviewer passwords in git.** Put credentials only in ASC Notes / Resolution Center.

---

## Paste below (ASC Notes ≤4000 chars — fill credentials first)

```
TradeAcademy by Aithera — App Review info

1) SCREEN RECORDING
Attached in this reply (app-review-demo.mp4). Physical iPhone; cold launch. Build 1.0.0 (9), ai.tradeacademy.app.
Shows: welcome/risk → Guest → Home → Learn → Practice → Simulate ($100k paper, not brokerage) → Journal/Review → Sign in → Premium/IAP + Restore → Delete Account (type DELETE; does not cancel App Store billing).
UGC: journals are private only — no social feed, comments, or messaging. No report/block needed. Replay catalogs are first-party.

2) PURPOSE / AUDIENCE
Educational trading practice: Learn → Practice → Replay → Simulate → Journal → Review → Improve. Solves lack of structured judgment practice without real money or buy/sell signals. DQS = process quality, not price prediction. Not a broker; no funds, execution, advice, or guaranteed returns. Audience: adults learning process/risk. Store 4+ = content only. Accounts/IAP: 18+. Guest = local demo without account.

3) SETUP
No sample files. Guest: acknowledge risk → Continue as Guest → Home Learn/Practice/Simulate/Journal. Guest cannot buy Premium.
Demo account (deletion/cloud): Email: [REVIEWER_DEMO_EMAIL] Password: [REVIEWER_DEMO_PASSWORD]. Sign in with Apple also OK.
IAP: Settings → upgrade. Products: tradeacademy_premium_monthly, _yearly (7-day trial if shown), _lifetime, optional _monthly_12m_commitment. Entitlement Aithera Pro (RevenueCat). Restore + Manage Subscription in Settings.
Delete: Settings → Delete Account → type DELETE (recent sign-in ~5 min). Cancel billing first — deletion does not cancel IAP.
Legal: https://tradeacademy.cloud/support | /privacy | /account-deletion | /risk

4) SERVICES
Firebase Auth/Firestore/Storage/Functions; Apple Sign In + IAP; RevenueCat (App User ID = Firebase UID); Expo/EAS; optional push; Sentry + first-party analytics only after consent (off by default); labelled market data (live/delayed/sample/mock). Cloud generative AI DISABLED this release.

5) REGIONS
Core features consistent worldwide. Price/tax/trial/IAP catalog may vary by App Store territory. No region-locked curriculum. 12-month commitment plan iOS-only when offered.

6) REGULATION
Education/simulation only — not broker-dealer, adviser, or execution venue; no customer funds. Operator: CML Electronics t/a Aithera, Höglerstrasse 55, 8600 Dübendorf, Switzerland. support@tradeacademy.cloud. Content is first-party. Happy to clarify further in Resolution Center.
```

(~2428 characters with placeholders; replace the two credential brackets before paste.)

---

## Longer archive (too long for ASC Notes field)

Use only if attaching as a document; ASC Notes max is **4000** characters.

```
TradeAcademy by Aithera — Additional App Review information

1) SCREEN RECORDING
Attached / linked: store/review/app-review-demo.mp4 (or [HOSTED LINK])
Recorded on: [DEVICE MODEL], iOS [VERSION]
Build: TradeAcademy 1.0.0 (build [BUILD NUMBER]), bundle id ai.tradeacademy.app


The recording starts at cold launch and shows:
- Welcome / educational risk acknowledgment
- Continue as Guest → Home (Training Center)
- Learn (Academy lesson / chart exercise)
- Practice (short drill)
- Simulate ($100,000 USD paper capital — labelled simulation, not brokerage)
- Journal / Review (process quality, not simulated P/L as a grade)
- Sign up or Sign in (email and/or Sign in with Apple)
- Settings → subscription / paywall (Aithera Pro products; Restore Purchases)
- Settings → Delete Account (signed-in user types DELETE; note: deletion does not cancel App Store billing)

User-generated content: journals and simulation notes are private to the signed-in user. There is no social network, public feed, comments, messaging, or content shared with other users. Therefore there are no cross-user report/block controls. Catalog / Replay TV content is first-party educational material, not user posts.

2) PURPOSE AND TARGET AUDIENCE
Purpose: TradeAcademy is a trading education, simulation, decision-practice, and coaching app. The product loop is Learn → Practice → Replay → Simulate → Journal → Review → Improve. It helps learners build research and decision process skills with labelled sample/synthetic or delayed market context and paper simulation.

Problem solved: New and intermediate learners lack a structured way to practise judgment without risking real money or being pushed buy/sell signals.

Value: Structured lessons and drills; Decision Replay; paper simulation with default $100,000 USD simulated capital; journaling and Decision Quality Score (DQS) that grades process completeness — never price direction or profit prediction.

Not a broker / not live trading: TradeAcademy does not execute trades, does not hold customer funds, does not provide investment advice, and does not provide buy/sell signals or guaranteed returns. Simulated P/L does not grade a decision.

Target audience: Adults learning trading process and risk awareness. Store content rating 4+ is content suitability only. Creating an account or purchasing requires 18+ (or age of majority). Guest mode allows local educational exploration without an account.

3) SETUP AND ACCESSING MAIN FEATURES
No special sample files required.

Guest (fastest path for review — full local demo):
1. Launch app → acknowledge educational / risk notice
2. Tap Continue as Guest
3. Use Home → Learn / Practice / Simulate / Journal / Review
Guest mode does not sync cloud journals and cannot purchase Premium.

Signed-in demo account (cloud features + account deletion):
Email: [REVIEWER_DEMO_EMAIL]
Password: [REVIEWER_DEMO_PASSWORD]
(Optional) Sign in with Apple is also supported on device.

Premium / IAP (sandbox):
- Open Settings → subscription / upgrade (or paywall entry points)
- Products: tradeacademy_premium_monthly, tradeacademy_premium_yearly (7-day trial when shown on the purchase sheet), tradeacademy_premium_lifetime (non-renewing), and when offered tradeacademy_premium_monthly_12m_commitment
- Entitlement: Aithera Pro via Apple IAP + RevenueCat
- Use Restore Purchases on the subscription screen
- Manage / cancel via Settings → Manage Subscription (App Store subscriptions)

Account deletion (required for account creation):
1. Sign in with the demo account
2. Settings → Delete Account
3. If Premium is active, Manage Subscription first (deletion does not cancel billing)
4. Type DELETE and confirm (may require recent sign-in within ~5 minutes)

Support / legal (also in Settings → Legal & Support):
https://tradeacademy.cloud/support
https://tradeacademy.cloud/privacy
https://tradeacademy.cloud/account-deletion
https://tradeacademy.cloud/risk

4) EXTERNAL SERVICES / PLATFORMS
- Google Firebase (Authentication, Firestore, Storage, Cloud Functions) — account, sync, server logic when configured
- Apple Sign In / App Store In-App Purchase
- RevenueCat — subscription entitlement sync (App User ID = Firebase UID)
- Expo / EAS — build and distribution
- Apple Push / Expo notifications — optional alert delivery when permitted
- Sentry — optional crash diagnostics only after explicit in-app consent (off by default)
- First-party product analytics — optional allowlisted aggregates only after consent (off by default)
- Market / quote context — labelled live, delayed, approximate, sample, or mock; not a live brokerage feed dependency for core education
- Third-party generative cloud AI — DISABLED for this release (local rules/template coaching only, labelled as such)

5) REGIONAL DIFFERENCES
The app functions consistently across regions for core education, practice, simulation, and journal features. Storefront pricing, taxes, trial eligibility, and available IAP products may vary by Apple App Store territory (standard App Store behavior). There is no separate region-locked educational curriculum. The optional 12-month commitment monthly plan is iOS-only and only shown when present in the store offering / supported OS.

6) REGULATED INDUSTRY / PROTECTED MATERIAL
TradeAcademy is an educational and simulated-practice product, not a licensed broker-dealer, investment adviser, or execution venue. We do not handle customer funds or execute real trades.

Operator: CML Electronics, trading as Aithera
Registered address: Höglerstrasse 55, 8600 Dübendorf, Switzerland
Contact: support@tradeacademy.cloud

No third-party brokerage license is required for this product model. Educational content and Decision Replay catalogs are first-party materials. If App Review needs any additional clarification that we are not offering brokerage or signals, please reply in Resolution Center and we will respond promptly.
```

---

## §1 Screen recording checklist (do this on a physical iPhone)

Record on a real device on a current iOS version. Start from the app icon (cold launch). Suggested order (~3–6 minutes):

1. Cold launch → welcome / risk acknowledgment  
2. **Continue as Guest** → Home  
3. Open one **Learn** lesson briefly  
4. Open one **Practice** drill briefly  
5. **Simulate**: start / show paper capital framing  
6. **Journal** or Review briefly  
7. Sign out / leave guest → **Create account** or **Sign in** (demo account)  
8. Open **paywall / Premium** (show products; do not need a successful sandbox purchase if products load — better if sandbox purchase works)  
9. **Settings → Delete Account** flow up to confirmation UI (prefer completing delete on a disposable demo account you can recreate)

Export: Photos → screen recording → upload to Resolution Center attachment, or host privately and paste the link in the reply.

---

## ASC fields to also update

| Field | Action |
| --- | --- |
| Resolution Center | Reply with the paste block + video |
| App Review Information → Notes | Same text (with credentials filled) |
| App Review Information → Demo account | Same email/password as in §3 |
| Contact | support@tradeacademy.cloud |

After Apple replies or clears the item, you can **Submit for Review** again if required by the Resolution Center UI.
