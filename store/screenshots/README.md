# Store screenshot inventory

Capture screenshots from the signed release candidate with production-like,
honestly labelled data. Do not use generated market candles or cloud-AI output.

Required scenes:

1. Today brief and Start Here decision flow
2. Research Queue with RVS explanation
3. Asset research with actual source/freshness badge
4. Explicit Research / Skip / Ignore decision
5. Journal and Decision Replay
6. Premium plan comparison and cancellation terms
7. Academy or coaching remediation

Required exports:

- App Store iPhone 6.7-inch: `store/screenshots/app-store/iphone-6.7/`
- App Store iPhone 6.5-inch: `store/screenshots/app-store/iphone-6.5/`
- App Store iPad Pro 12.9-inch: `store/screenshots/app-store/ipad-pro-12.9/`
- Play Store phone: `store/screenshots/play-store/phone/`
- Play Store 7-inch tablet: `store/screenshots/play-store/tablet-7/`
- Play Store 10-inch tablet: `store/screenshots/play-store/tablet-10/`
- Play Store feature graphic: `store/screenshots/play-store/feature-graphic/`

These are target inventory paths, not evidence that assets have been captured.
Keep metadata screenshot arrays empty until reviewed files exist.

Before upload, verify status bars contain no personal data, all legal copy is
current, no screen implies brokerage execution or price-direction prediction,
and each filename/device mapping is added to `store/metadata`. Also verify:

- [ ] Data source and freshness labels are legible.
- [ ] No production screenshot shows cloud-AI output or cloud-AI marketing.
- [ ] Premium screenshots show renewal, cancellation, and paid-through wording.
- [ ] Terms, Privacy, Support, and account-deletion links open.
- [ ] Account-deletion screenshots warn that store billing is not cancelled.
- [ ] Every image comes from the signed release candidate at the required size.
