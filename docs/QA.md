# Release verification

Run the automated release gate from the repository root:

```bash
npm ci
npm run lint
npm run typecheck
npm run expo:config
npm test -- --runInBand
npm run functions:build
npm --prefix functions test
npm run test:rules
git diff --check
```

The Firestore emulator download uses the repository CA settings on managed
Windows machines. CI must not merge when any command fails.

For release-candidate bundle validation, also run:

```bash
npx expo export --platform all --output-dir .expo-export-test
```

The checked-in `.maestro/demo-activation.yaml` and
`.maestro/decision-loop.yaml` flows are device-ready smoke specifications for
guest activation and Today → Research/Skip → Journal → Review. They require a
running signed or development client with app id `ai.tradevision.app`; their
presence is not evidence that either platform executed them.

## Signed-build smoke test

Run this checklist on both an iOS sandbox build and an Android license-test
build:

1. Register after accepting Terms and Privacy, verify email, sign in, and sign
   out.
2. Complete Brief → Research or Skip → Journal → Review and confirm the event
   tape survives an app restart.
3. Verify every chart and research result shows its actual data source and
   freshness.
4. Purchase monthly and yearly Premium, restore on a second install, and verify
   the provider expiration date.
5. Cancel auto-renewal from Manage Subscription. Confirm Premium remains active
   until the displayed paid-through time and becomes Free after that time.
6. Resubscribe and confirm Premium returns without clearing app data.
7. Test offline/demo fallback without Firebase or market-data credentials.
8. Trigger account deletion, confirm subscription cancellation guidance, then
   confirm Auth, Firestore, Storage, and local data are gone.
9. Verify push registration, a push deep link, and one production-channel OTA
   update.
10. Run VoiceOver/TalkBack through registration, the decision loop, paywall,
    subscription management, and account deletion.

Record build IDs, devices, OS versions, tester, timestamps, and evidence links
in the release ticket.

## Performance baseline

Capture baselines from a development build with the same device, OS, network,
account mode, and test symbols for every comparison. Development diagnostics
record only event names, durations, request categories, cache outcomes, and app
state; never attach symbols, user identifiers, research text, or other content.

Repeat each scenario from a cold app start at least five times, discard only
runs with a documented setup failure, and report the median plus the slowest
retained run:

1. Cold start until the first usable screen (`startup.begin` → `startup.ready`).
2. Build the default decision brief, then repeat once warm (`brief.build`).
3. Open the same chart cold and warm (`chart.work` and `chart.render`).
4. Record market request started, deduplicated, cache-hit, background-skipped,
   and direct-fallback counters for each scenario.
5. Background the app beyond the quote/candle TTL and confirm no refresh starts
   until the app is active. Record whether stale cached data was available.

For rollback verification, set `EXPO_PUBLIC_MARKET_DATA_DIRECT=true`, restart
the Expo bundler so the public environment value is rebuilt, and repeat the
market scenarios. Remove the flag to restore scheduler-backed reads.

Use release-ticket placeholders until measured values have been captured:

- Cold startup budget: **TBD after baseline**
- Warm brief-build budget: **TBD after baseline**
- Cold chart-work budget: **TBD after baseline**
- Chart-render preparation budget: **TBD after baseline**
- Expected market-request count per scenario: **TBD after baseline**

Do not convert these placeholders into targets or claim a regression/improvement
without attaching the raw run notes and build identifiers.

## Accessibility and tablet

11. Enable Reduce Motion and confirm Button/IconButton springs and Skeleton pulse
    are disabled; Toast still announces via a polite live region.
12. At 1.3× text size, confirm primary CTAs remain ≥44×44pt and are not clipped on
    Today, Asset, Journal, Review, and Paywall.
13. On an iPad / 10-inch Android class device, rotate to landscape and confirm
    Today, Asset, Portfolio, and Paywall keep readable two-column layouts without
    overlapping tabs or lost navigation state.
14. Run VoiceOver/TalkBack through Demo Activation → Start Here → Research/Skip →
    Journal → Review, including chart summaries on the Asset Chart tab.

Checked-in Maestro specs (device-ready, not CI-executed by default):

- `.maestro/demo-activation.yaml`
- `.maestro/decision-loop.yaml`
- `.maestro/asset-chart.yaml`
- `.maestro/tablet-layout.yaml`

## Rollback

- Observability stays off without consent and without a Sentry DSN.
- Market-data scheduler direct fallback: set `EXPO_PUBLIC_MARKET_DATA_DIRECT=true`
  and restart the bundler.
- OTA rollback requires a linked EAS project and matching runtime version.
