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
