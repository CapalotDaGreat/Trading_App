# Store submission gate — TradeInsight by Aithera

**Living execution status:** [STORE_LAUNCH_CHECKLIST.md](./STORE_LAUNCH_CHECKLIST.md)  
**Monetization catalog:** [MONETIZATION.md](./MONETIZATION.md)  
**Privacy / processors:** [PRIVACY_AUDIT.md](./PRIVACY_AUDIT.md)  
**Identity (Phase 0 freeze):** [IDENTITY_MIGRATION_PHASE0.md](./IDENTITY_MIGRATION_PHASE0.md)  
**Evidence form:** [`store/EVIDENCE_TEMPLATE.md`](../store/EVIDENCE_TEMPLATE.md)  
**Hostable legal pages:** [`store/hosted/README.md`](../store/hosted/README.md)

Listing display name: **TradeInsight**. Company: **Aithera**. Application id: **`ai.tradevision.app`**.

**This repository is not submission-ready** until MANUAL ACTION REQUIRED items on the launch checklist are complete (especially legal hosting).

## Age — three layers

| Layer | Value |
| --- | --- |
| Store content rating | Apple **12+**, Google Play **Teen** |
| Contractual eligibility | **18+** or age of majority for accounts and purchases |
| Privacy | Cloud accounts not directed at young children; Guest/demo is local and has no 18+ gate |

Do not describe the 12+ rating as permission to trade.

## Expo and push

- Run `eas init`, then set the returned UUID as `EXPO_PUBLIC_EAS_PROJECT_ID`
  and the owning Expo account/organization as `EAS_OWNER` in each EAS
  environment. Neither value is committed.
- Configure production update channel, iOS signing, Android signing, APNs, and
  FCM credentials.
- Set all production `EXPO_PUBLIC_FIREBASE_*` and public RevenueCat SDK keys in
  EAS environment variables. Set `REVENUECAT_WEBHOOK_AUTH_TOKEN` only as a
  Functions secret/environment value, never as an `EXPO_PUBLIC_*` value.
- Set `EXPO_PUBLIC_SENTRY_DSN` only if crash reporting will ship, and store
  `SENTRY_AUTH_TOKEN` as a sensitive EAS build secret for source-map upload.
- Deploy `revenueCatWebhook` and `deleteAccount`; verify no production cloud-AI
  provider is enabled until the Privacy Policy names that processor.
- Install both signed builds and verify the runtime version and OTA rollback.

## Billing

- Configure **monthly** and **yearly** products in App Store Connect and Play Console. Do not create Lifetime at launch.
- Configure the seven-day yearly trial identically on both platforms.
- See [MONETIZATION.md](./MONETIZATION.md).
- Connect both stores to RevenueCat and configure the authenticated webhook.
- Confirm RevenueCat App User IDs are Firebase UIDs and the webhook entitlement
  id is **`Aithera Pro`**.
- Add sandbox/license testers and complete purchase, restore, cancel,
  paid-through access, expiry, refund, and resubscribe tests.

## Compliance and review

- Publish Terms, Privacy, Risk Disclaimer, Security Notice, Support, and Account
  Deletion on `[OFFICIAL DOMAIN REQUIRED]` and verify HTTP 200. Canonical sources
  are in `store/legal/` (`npm run legal` after edits). Counsel must replace
  `[LEGAL ENTITY NAME REQUIRED]` and `[VAT/UID REQUIRED]` before treating pages
  as production.
- Complete Apple privacy labels and Google Play Data Safety from shipped
  behaviour: crash diagnostics and product analytics optional, off by default,
  consent required; no ATT tracking product; analytics never includes journal
  text, AI chat, or portfolio values.
- Upload the assets listed in `store/screenshots/README.md`.
- Provide reviewer credentials and paste `store/reviewer-notes.md`.
- Follow [APP_STORE_REVIEW.md](./APP_STORE_REVIEW.md).

## Account-deletion production proof

- Enable the callable `deleteAccount` in the same Firebase project used by the
  signed app and confirm the default Storage bucket exists.
- With a newly signed-in test account, create data under `users/{uid}` and a
  nested subcollection, `userSettings/{uid}`, `subscriptions/{uid}`,
  RevenueCat webhook event docs with that `uid`, a Storage object under
  `users/{uid}/`, and a `securityEvents` doc with that `uid`.
  Delete in-app and verify all are gone with the Auth user. Shared Academy
  content must remain.
- Sign in, wait more than five minutes, and verify deletion is rejected until
  the user signs out and signs in again.
- Verify Manage Subscription opens the correct Apple or Google management page
  before deletion. Confirm separately in the store sandbox that account
  deletion did not alter billing state.

Submission is blocked until every automated check and signed-build smoke test
has recorded evidence **and** legal URLs are live.
