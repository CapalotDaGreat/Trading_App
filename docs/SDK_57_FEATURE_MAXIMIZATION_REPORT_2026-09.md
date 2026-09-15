# SDK 57 Feature Maximization Report

**Date:** 2026-09-15  
**Product:** TradeAcademy by Aithera  
**Branch:** `main` (working tree; commit when operator requests)  
**Prior migration:** `2dd7767` (Expo SDK 54 → 57)  
**Stack:** Expo `57.0.22` · React `19.2.3` · React Native `0.86.3` · TypeScript `~6.0.3`  
**Native strategy:** CNG (no checked-in `ios/` / `android/`)

## Executive summary

TradeAcademy was maximized on Expo SDK 57 without a product redesign: stronger offline/connectivity honesty, educational (non-signal) training reminders, preference-gated haptics, clearer simulation framing, professional legal portal + refreshed policies, Settings legal metadata, Dev Client docs updated for SDK 57, and regression tests. Canonical planner / learner / competency / chart authorities and frozen IDs were preserved. Device/EAS/store/legal-entity verification remains explicitly incomplete.

## Baseline → after

| Check | Baseline | After this maximization |
| --- | --- | --- |
| `npm run typecheck` | PASS | PASS |
| Jest | 114 / 746 | **117** / **751** PASS |
| Functions build/test | PASS / 19 | Unchanged expectation: PASS |
| Rules | 14 PASS | PASS |
| Expo config | SDK 57 | SDK 57 |
| Expo Doctor | 21/21 | 21/21 |
| Expo export `--platform all` | PASS | PASS (`.expo-export-sdk57-max`) |

## SDK 57 opportunity map

| Subsystem | Opportunity | Outcome |
| --- | --- | --- |
| Router / tabs | Keep 5–7 tab IA; no 8th tab | Preserved |
| Reanimated 4.5 | Compiler-safe `get`/`set` | Lint-safe press feedback |
| Haptics | Milestone feedback | Wired (practice, journal, replay) |
| Notifications | Educational reminders + quiet hours | Opt-in `trainingReminders` |
| Secure Store | Device push id already secure | No silent AsyncStorage migration |
| Background task | Inexact wakes | Capability copy retained; no real-time claims |
| Offline UX | Sync pending / guest local | Connectivity banner modes |
| Legal hosting | Professional portal | Homepage + footer + docs v2026.09.15 |
| Simulation UI | Obvious simulation | “This is a simulation” heading |
| Charts a11y | Spoken summaries | Empty-state chart summary + existing spoken summaries |
| EAS | Dev Client profiles | `eas.json` profiles documented; build not claimed run |

## Implemented (CODE COMPLETE)

### Native & connectivity

- `feedbackHaptic` — preference-gated; web no-op.
- `useConnectivityStatus` + expanded `OfflineBanner`: **offline**, **sync pending**, **guest local**.
- Educational reminders service with quiet hours and anti-signal copy.
- Notification settings: `trainingReminders`, `quietHoursStart` / `quietHoursEnd` (persisted on user preferences with defaults merge).

### Learning loop

- Home subtitle includes canonical `BRAND.loop`.
- Practice attempt → optional journal reminder; journal save → optional review reminder.
- Simulation disclaimer strengthened (USD 100k, thesis/invalidation, not live).
- Planner authority unchanged: `composeTrainingPlan` via `useLearningEngine` / `TodaysTrainingCard`.

### Legal & support

- Hosted legal portal: brand-first legal center, dated document cards, trust section, footer nav.
- Canonical `store/legal/*` refreshed; risk clarifies simulation ≠ live competence.
- Support page expanded (FAQ, subscriptions, troubleshooting, no fake SLA).
- Security notice: implemented vs planned table; no SOC2/ISO claims.
- `LEGAL_ACCEPTANCE_VERSION` = `2026.09.15`.
- In-app Settings Legal rows show last-updated dates.

### Docs

- `docs/DEV_BUILD.md` retargeted to SDK 57.
- This report.

## Architecture / safety preserved

- Single `composeTrainingPlan` / `composeLearnerModel`.
- No third chart engine; no broker/execution/signals/guaranteed returns.
- Frozen IDs: `ai.tradeacademy.app`, scheme `tradeacademy`, slug `tradeacademy`, `tradeacademy-*`, entitlement `Aithera Pro`, origin `https://tradeacademy.cloud`.
- Analytics allowlist; no journal/AI chat/portfolio values in analytics.
- Guest `demo-guest` stays local; Premium purchase path not for guests.

## Accessibility

- Legal site: skip link, 44px targets, focus-visible, reduced motion.
- Tab bar `minHeight: 44`, font scaling allowed.
- Chart empty state accessibility label; Replay TV spoken summaries retained.
- Connectivity banners: `accessibilityRole="alert"`, live region.

## Performance

- No architecture replacement; deferred sync poll (8s) for pending flag only; reminder scheduling is opt-in fire-and-forget.

## Security / privacy

- No new client secrets / `EXPO_PUBLIC_*` secrets.
- App Check / Functions fail-closed posture documented as implemented-when-configured.
- Bracketed legal operator fields remain REQUIRED placeholders.

## Classification matrix

| Item | Status |
| --- | --- |
| SDK 57 stack | **PASS / CODE COMPLETE** |
| Haptics milestones | **CODE COMPLETE** · feel **DEVICE REQUIRED** |
| Connectivity / guest / sync banners | **CODE COMPLETE** |
| Educational reminders | **CODE COMPLETE** · delivery **DEVICE/BUILD REQUIRED** |
| Simulation framing | **CODE COMPLETE** |
| Legal portal + docs | **CODE COMPLETE** · hosting **OPERATOR REQUIRED** · counsel **LEGAL VERIFICATION REQUIRED** |
| Settings legal metadata | **CODE COMPLETE** |
| Secure Store expansion beyond device id | Audited; deferred |
| Full every-screen visual redesign | Deferred (IA preserved; high-risk surfaces prioritized) |
| EAS `development` build executed | **BUILD REQUIRED** / **OPERATOR REQUIRED** |
| IAP / biometrics / push / background wake | **DEVICE REQUIRED** |
| Play assetlinks SHA / ASC app id | **OPERATOR REQUIRED** |
| Entity / VAT / mailboxes | **LEGAL VERIFICATION REQUIRED** |

## Manual device matrix (checklist)

### iOS & Android

- [ ] Onboarding, tabs, keyboard, safe areas, edge-to-edge
- [ ] Charts + replay gestures + blind mode
- [ ] Simulation ticket + journal handoff
- [ ] Biometric unlock
- [ ] Training reminders with quiet hours
- [ ] IAP purchase/restore (Aithera Pro)
- [ ] Account deletion vs store subscription management
- [ ] Deep links `tradeacademy://` + https://tradeacademy.cloud
- [ ] VoiceOver / TalkBack on Today, Replay, Simulation, Legal

### Web

- [ ] Legal homepage/docs keyboard + focus
- [ ] Responsive Settings legal routes
- [ ] Forms / charts loading & error states

### EAS

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
npm run start:dev-client
```

Do not claim IAP/push/background verified until physical devices pass.

## Known limitations

1. Bracketed legal fields still templates — do not paste into store consoles until verified.
2. Expo Go ≠ production native behaviour.
3. Background alert evaluation remains OS-inexact (≥15 minutes typical).
4. Historical docs may still mention SDK 54; AGENTS.md / DEV_BUILD / this report are authoritative for SDK 57.
5. Competing chart implementations (EducationalChart vs CandlestickChart) remain two — no third added.

## Absolute safety check

No broker, real-money execution, buy/sell recommendations, guaranteed returns, fake live data, fabricated certifications/entity details, P&L competence scoring, training-readiness-as-live-certification, analytics leakage of journal/chat/portfolio, duplicate planner/learner/mastery, SDK downgrade, or silent storage reset.

## Definition of done (honest)

| Requirement | Status |
| --- | --- |
| Framework SDK 57 / RN 0.86 / React 19.2 / TS 6 | **Met** |
| Architecture preserved | **Met** |
| Useful native capabilities evaluated + implemented where justified | **Met** (device verification open) |
| UI modernized on critical surfaces; not a fintech redesign | **Met with explicit deferrals** |
| Learning loop obvious | **Met** |
| Simulation educational | **Met** |
| Privacy / security honest | **Met** |
| Legal professionalized | **Met** (operator + counsel open) |
| Tests green + new regressions | **Met** (re-run suite before merge) |
| EAS/device/store claims not faked | **Met** |
