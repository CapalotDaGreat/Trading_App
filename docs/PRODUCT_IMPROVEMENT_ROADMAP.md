# Product improvement roadmap — TradeInsight

Items are ranked by launch risk and user value. **P0 is only what blocks a responsible store release**, not every interesting idea.

---

## P0 — must fix before launch

Operator / console work (not more product code):

1. Host legal documents on the official domain until Terms, Privacy, Risk, and Support return HTTP 200.
2. Replace legal placeholders (`[LEGAL ENTITY NAME REQUIRED]`, VAT, support emails, domain) and run `npm run legal`.
3. App Store Connect + Play Console: agreements, tax, banking, listing, age rating, screenshots.
4. RevenueCat: live app, entitlement **Aithera Pro**, products matching EAS (`monthly` / `yearly` / `lifetime`), public SDK keys in EAS secrets — never in `EXPO_PUBLIC_*` as secrets.
5. Firebase production: Blaze, App Check, Functions secrets (`FINNHUB_API_KEY` commercial, RevenueCat webhook auth, etc.).
6. Finnhub **commercial** market-data plan with written permission for in-app display (not redistribution / Enterprise).
7. EAS production credentials, push, and a store binary (IAP and background alerts do not work in Expo Go).
8. Device QA using [MANUAL_QA_CHECKLIST.md](./MANUAL_QA_CHECKLIST.md) on iOS and Android.

Until these are done, treat store submission as **NO-GO**. See [STORE_LAUNCH_CHECKLIST.md](./STORE_LAUNCH_CHECKLIST.md) and [FULL_PRODUCT_IMPROVEMENT_AUDIT.md](./FULL_PRODUCT_IMPROVEMENT_AUDIT.md).

---

## P1 — important (next product cycle)

- Device visual pass: spacing, contrast, and hierarchy on every tab after this content/search work.
- Live research chart: pan/zoom and a calmer default indicator set (RSI on by default may overwhelm experienced users — keep it one tap away).
- AI answer chips: “Open RSI lesson”, “Add uncertainty”, “Continue research” when local analysis mentions those concepts.
- Stronger research-to-learning loop: after a lesson, deep-link back to the symbol the user came from.
- Journal: autosave drafts if a reflection is abandoned mid-form.
- Personal Intelligence / DNA: more insights in the “what / evidence / next try” template where sample size allows; stay silent when evidence is thin.
- Onboarding: one shorter first-run path + contextual coaching (already directionally there; trim remaining tutorial length).
- Confirm lifetime SKU vs older “no lifetime at launch” notes so listing, paywall, and RC catalog match.

---

## P2 — valuable later

- Drawing tools on live charts (trend line, zone) without crowding the default view.
- Saved research / insight bookmarks beyond Academy lessons.
- Virtualize very large journal lists if real users exceed the current render cap.
- Richer Academy catalog (options Greeks literacy, earnings process, multi-asset volume caveats) using the same educational-chart system.
- Full-text journal search if on-device embeddings become feasible; structured filters already cover the main intents.
- Widget / watch complications for the Today cue (capability-honest).
- Sentry org/project if you want production crash reporting (off by default today).

---

## P3 — experimental

- Cloud AI (`CLOUD_AI_ENABLED`) after privacy, provenance, quotas, and fail-closed review.
- Semantic search over decision logs with on-device models.
- Interactive “tap the support zone” hit-testing on educational charts (today: labelled scenes + multiple-choice).
- Cross-user anonymized process benchmarks (high privacy risk — do not ship casually).

---

## Explicitly out of scope unless strategy changes

- Changing bundle id `ai.tradevision.app` or URL scheme `tradevision` without an Apple migration plan.
- Finnhub Enterprise (tick, 35y OHLC, redistribution).
- Turning DQS/RVS into price predictions or buy/sell signals.
- Fake live candles, fake DNA, or fake AI confidence to fill empty states.
