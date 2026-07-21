# Release candidate validation

Validation date: 2026-07-21

Verdict: **NO-GO**

The repository gate passes, including all-platform Expo bundling, but no signed iOS or Android candidate, EAS build ID,
device record, or external evidence bundle was available for validation. The
production Expo configuration is also not linked in the current environment,
and the required hosted legal/support URLs did not respond. A store submission
must remain blocked.

## Automated evidence

The following checks were run from a clean dependency install:

- `npm ci`: passed after retrying a transient Windows file lock. The install
  reported 25 moderate dependency vulnerabilities.
- `npm ci --prefix functions`: passed. The local Node 22 runtime does not match
  the Functions Node 20 engine; CI uses Node 20.
- `npm run lint`: passed with 0 errors and 420 warnings.
- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 27 suites and 90 tests. React Native
  Testing Library coverage now exercises onboarding copy, Start Here outcomes,
  the free top-three/deeper-queue boundary, Premium OS gates, and Review
  navigation.
- `npm run functions:build`: passed.
- `npm run functions:test`: passed, 4 tests.
- `npm run test:rules`: passed, 4 Firestore emulator tests.
- `npx expo config --type public`: parsed successfully, but reported
  `updates.enabled: false` and no EAS project ID or owner.
- `npx expo export --platform all --output-dir .expo-export-p1-validation`:
  passed for iOS, Android, and web (51 static routes). This is bundle evidence,
  not signed-device evidence.
- `git diff --check`: passed.

The generated `.expo-export-test/` output was added to ESLint's ignore list so
the lint gate does not traverse bundled dependencies and stall.

P1 repository automation added in this candidate:

- CI now validates public Expo config, app lint/typecheck/tests, Functions
  build/tests, Firestore emulator rules, and `git diff --check`.
- Checked-in Maestro-ready smoke flows cover clean demo activation and Today →
  Research/Skip → Journal → Review using stable test IDs.

Known external/automation gaps:

- The Maestro flows were not executed on a device or signed client.
- Storage rules are not wired into emulator tests.
- There are no end-to-end, signed-client, purchase/restore, webhook-handler, or
  account-deletion integration tests.
- Store screenshot inventories are empty, and no executable OTA rollback
  runbook is present.

## P0 acceptance review

### Verification and Firebase contract

Automated lint, typecheck, Jest, Functions, and Firestore rules commands pass.
The rules suite covers owner payload access, malformed document rejection, and
server-owned subscriptions. This is repository evidence only; production
Firebase deployment and signed-client behavior were not exercised.

### Decision loop

Decision-log, decision-core, and replay service tests pass. There is no signed
candidate evidence for Brief → Research/Skip/Ignore → Journal → Replay,
idempotency under real retries, app-restart persistence, or offline/demo
behavior on either platform.

### Subscriptions

Effective-access and webhook mapper tests pass, including authorization,
cancellation, expiry, refund, grace, and product changes. App Store sandbox and
Play license-test purchase, restore, cancellation, paid-through expiry,
resubscribe, duplicate/out-of-order webhook, and cross-account cache behavior
were not validated on signed builds.

### Product trust and cloud AI

Trust-language, local-AI configuration, and market-data source tests pass.
Actual badges, timestamps, production cloud-AI disablement, and store-facing
copy were not inspected in signed candidates.

The audited paywall now advertises only implemented capabilities. The Brief,
top-three research queue, journal, and basic Process Tape remain free; Premium
gates the deeper queue, advanced/weekly recorded-process insights, Trading DNA,
portfolio intelligence, Decision Lab, expanded Ask allowance, and journal
export. Unsupported priority-cloud-AI and faster-data claims were removed.

### Store compliance and operations

No EAS project ID or owner is active in the current Expo configuration, so OTA
and rollback validation cannot run. Requests to `/privacy`, `/terms`,
`/support`, and `/account-deletion` on `tradevision.ai` timed out with HTTP
status `000`. Production account deletion, push credentials/deep links,
reviewer access, store metadata, and screenshot uploads have no recorded
external proof in this repository.

### Signed candidate smoke tests

Not run. No `.ipa`, `.apk`, `.aab`, EAS build URL/ID, device/OS matrix, tester
record, timestamped screenshots/video, or release-ticket evidence was found.
VoiceOver and TalkBack coverage is therefore also unverified.

## Evidence required to change the verdict

For both the iOS sandbox candidate and Android license-test candidate, attach:

1. EAS build ID/URL, commit SHA, runtime version, update channel, install source,
   device model, OS version, tester, and timestamp.
2. Evidence for every signed-build step in `docs/QA.md`, including all three
   decision outcomes and restart/offline persistence.
3. Monthly and yearly purchase, restore, cancel, exact paid-through boundary,
   expiry/refund, and resubscribe records from the stores and RevenueCat.
4. Push registration/deep-link evidence plus production OTA update and rollback
   evidence.
5. Re-authenticated deletion evidence for Auth, Firestore subcollections,
   settings, subscription cache, Storage, and local state.
6. VoiceOver/TalkBack results for registration, decision loop, paywall,
   subscription management, and deletion — plus Reduce Motion and 1.3× text checks.
7. HTTP 200 proof for all legal/support URLs and confirmation that the active
   EAS configuration contains the real project ID and owner.
8. Tablet landscape screenshots for Today, Asset, Portfolio, and Paywall, plus
   Maestro tablet/asset-chart flow notes when executed on device.
9. Performance baseline table from `docs/QA.md` for phone and tablet, with build
   IDs. Record Sentry consent on/off behavior on a signed preview build.

After those records exist, rerun the complete gate on the exact candidate
commit. Submission remains blocked until every item passes and the native
cancellation test proves access remains active before the provider expiry
instant and becomes Free at that instant.

## P2 repository gates

Repository automation for P2 covers scheduler/performance unit tests, consent
and redaction suites, chart windowing bounds, responsive breakpoint helpers,
accessibility label helpers, Storage rules emulator coverage, and Expo
all-platform export in CI. Native profilers, Sentry delivery, VoiceOver/TalkBack,
and Maestro tablet screenshots remain signed-preview device gates.
