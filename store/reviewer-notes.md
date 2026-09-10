# TradeAcademy by Aithera — App Review notes

Paste into App Store Connect / Play Console review notes. Do not commit reviewer
passwords or sandbox emails here.

TradeAcademy is an educational **trading education and simulated-practice** app from Aithera.
It is **not** a broker, **does not** execute trades, **does not** handle customer
funds, and **does not** provide buy/sell signals or guaranteed returns.

**Technical identity:** iOS/Android application id remains `ai.tradevision.app`
(frozen). Display name and branding are TradeAcademy / Aithera.

**Age layers (please do not collapse these):**

- Store content rating: Apple **12+** / Play **Teen** (content suitability).
- Accounts and in-app purchases: **18+** or age of majority.
- Guest/demo: local educational exploration; not an 18+ gate.
- The 12+ rating does **not** mean a minor may legally trade.

---

## Guest mode / demo mode

On the welcome screen, acknowledge the educational/risk checkbox, then
**Continue as Guest**. This loads a complete local demo (sample/synthetic data as labelled).
No store account is required. Guest mode does not create cloud journals, does not sync,
and cannot purchase Premium.

When Firebase env is absent, the same local demo path is used (`demo-guest`).

---

## Educational Mode

Educational Mode is always on. It is not a one-time popup. Copy throughout the
app states that TradeAcademy is education and simulated practice, not brokerage or advice.
Settings → Educational Mode explains the framing. Risk disclaimer is available
in-app under Settings → Legal.

---

## Core review flow

1. Onboarding: product explanation (no real money, no brokerage, no signals).
2. Home: what to learn / practise / simulate next.
3. Learn: Foundations path — chart, exercise, knowledge check.
4. Practice: a short drill.
5. Simulate: start **$100,000 USD** paper capital, write a thesis, size, fill, close.
6. Review / Journal: grade process, not simulated P/L.

---

## RVS and DQS (not price predictions)

- **RVS = Research Value Score.** It ranks whether an idea deserves *research
  time* (attention priority).
- **DQS = Decision Quality Score.** It grades checklist / process completeness.

Neither score predicts future price, direction, or profit. Setup “confidence”
in the product is DQS-style decision quality, never a forecast.

---

## AI explainability

In-app Ask / analysis is a **decision coach**: evidence for, against, and
missing. It must not be reviewed as a signal service.

**Production third-party cloud AI is disabled** for this release. Local
rules/template explanations may appear and are labelled as such. Do not expect
a live cloud-LLM desk.

---

## Data freshness

Quotes, news, and charts use a data-source badge: live, delayed, approximate,
sample, or mock, plus freshness where applicable. Sample/mock data is for demo
and education. FX candles are never fabricated.

---

## Subscription and 7-day trial

- Entitlement: `Aithera Pro`
- Launch products: `tradevision_premium_monthly`, `tradevision_premium_yearly`, and `tradevision_premium_lifetime`. Lifetime is a one-time purchase and does not auto-renew.
- Native App Store / Play billing via RevenueCat (not available in Expo Go).
- Restore Purchases is on the subscription screen.
- Cancel / Manage Subscription opens the platform subscription page.
- Cancelling stops renewal; Premium remains until the store-reported
  paid-through date.
- A **7-day trial**, if shown, applies only to **yearly** and must match the
  console offer.
- Free is a complete daily product (Today, basic research, basic journal,
  limited replay / radar / DNA). Premium is depth: full library, portfolio
  intelligence, export, and ~100/day fair-use AI (not unlimited).

---

## Account deletion

Signed-in users: Settings → Delete Account.

1. The app instructs the user to **Manage Subscription first**.
2. **Deleting the TradeAcademy account does not cancel App Store / Play billing.**
3. User types `DELETE`.
4. Server requires a **recent sign-in** (~5 minutes). If rejected, sign out and
   sign back in.
5. Deletion removes Auth, the user’s Firestore tree, settings, server
   subscription-access record, user Storage prefix, uid-scoped webhook/security
   docs we store, and local user data. Shared Academy content is not deleted.

Guests do not see Delete Account (there is no cloud account).

---

## Legal in the app

Settings → Legal & Support opens **in-app** Terms, Privacy, Risk, Security,
Account deletion, and Support. Hosted public URLs must still return HTTP 200 in
the store consoles before submission; they are a **manual hosting** item, not
claimed live in this repository.
