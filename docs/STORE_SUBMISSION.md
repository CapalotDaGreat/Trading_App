# Store submission gate

Repository checks are documented in [QA.md](./QA.md). The remaining items must
be completed in the named external console before submission.

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
- Deploy exactly `revenueCatWebhook` and `deleteAccount`; verify no `aiBrief`
  function remains deployed.
- Install both signed builds and verify the runtime version and OTA rollback.

## Billing

- Configure monthly/yearly products in App Store Connect and Play Console.
- Configure the seven-day yearly trial identically on both platforms.
- Connect both stores to RevenueCat and configure the authenticated webhook.
- Confirm RevenueCat App User IDs are Firebase UIDs and the webhook entitlement
  id is `premium`.
- Add sandbox/license testers and complete purchase, restore, cancel,
  paid-through access, expiry, refund, and resubscribe tests.

## Compliance and review

- Publish Terms, Privacy, Risk Disclaimer, Security Notice, Support, and Account
  Deletion URLs and verify they return HTTP 200. Canonical sources are in
  `store/legal/` (run `npm run legal:sync` after edits). Have Swiss/EU/US counsel
  review and insert the registered legal entity before production.
- Set App Store age rating to **12+** and Google Play to **Teen** (content suitability). Keep
  **account eligibility at 18+** (or age of majority) in Terms, registration, and purchases —
  downloading or Guest mode does not require being 18.
- Publish the account-deletion instructions at
  `https://tradevision.ai/account-deletion`; state that account deletion does
  not cancel store billing and link both stores' subscription management.
- Complete Apple privacy labels and Google Play Data Safety from the shipped
  behavior, not aspirational settings. Crash diagnostics are optional,
  disabled by default, and sent to Sentry only after explicit consent; no
  general usage analytics, personalized ads, or trading-pattern sharing ships.
- Upload the assets listed in `store/screenshots/README.md`.
- Provide reviewer credentials and paste `store/reviewer-notes.md`.
- Complete content ratings, export compliance, subscription disclosures, and
  account-deletion URL fields.
- Follow [APP_STORE_REVIEW.md](./APP_STORE_REVIEW.md) for guideline cross-checks
  (IAP disclosures, Sign in with Apple, Privacy Nutrition Labels, screenshots).

## Account-deletion production proof

- Enable the callable `deleteAccount` in the same Firebase project used by the
  signed app and confirm the default Storage bucket exists.
- With a newly signed-in test account, create data under `users/{uid}` and a
  nested subcollection, `userSettings/{uid}`, `subscriptions/{uid}`,
  RevenueCat webhook event docs with that `uid`, and `users/{uid}/` in Storage.
  Delete in-app and verify all are gone with the Auth user.
- Sign in, wait more than five minutes, and verify deletion is rejected until
  the user signs out and signs in again.
- Verify Manage Subscription opens the correct Apple or Google management page
  before deletion. Confirm separately in the store sandbox that account
  deletion did not alter billing state.

Submission is blocked until every automated check and signed-build smoke test
has recorded evidence.
