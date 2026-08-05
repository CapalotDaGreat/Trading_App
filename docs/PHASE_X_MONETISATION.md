# Phase X — Monetisation, Mentor Setup & Personalisation

Calm, educational, decision-first. The product should feel like it understands the user — never like a paywall app.

## Mentor Setup (first launch)

Route: `/onboarding` → [`MentorSetupScreen`](../features/onboarding/screens/MentorSetupScreen.tsx)

1. Intro — “Let’s personalise your trading coach.”
2. Questions 1–10 (motive, experience, markets, frequency, styles, struggles, time budget, coach tone, success, research time of day)
3. **Research Universe** — recommended assets, editable, max 10
4. **Mentor Ready** — estimated learning profile + personalisation checklist

New users must complete this before tabs. Drafts persist under `tradevision:mentor-setup-draft:v2:<uid>`.

## Soft invite (existing users)

Flags:

| Flag | Meaning |
| --- | --- |
| `hasCompletedOnboarding` | May use tabs (legacy-compatible) |
| `mentorSetupCompleted` | Full Mentor Setup finished |
| Soft invite | `hasCompletedOnboarding && !mentorSetupCompleted && !inviteDismissed` |

Surfaces: Today, Settings, Trading Mentor. Dismissible; hidden forever after completion.

## Coach profile

- Types: [`mentor-setup.types.ts`](../features/onboarding/types/mentor-setup.types.ts)
- Persist: AsyncStorage + Firestore `users/{uid}.coachProfile` + Trader Memory + settings prefs
- Reader: `useCoachProfile()` / `getCoachProfileSnapshot()`

Injected into Today greeting, Trading Mentor copy, AI context, Academy curriculum, Replay TV ranking.

## Entitlements

Central map: [`shared/constants/entitlements.ts`](../shared/constants/entitlements.ts)  
Resolver: [`entitlement.service.ts`](../features/subscription/services/entitlement.service.ts) + `useEntitlement()`.

| Capability | Free | Premium |
| --- | ---: | ---: |
| AI Mentor | 20 / month | Unlimited |
| AI analyses | 20 / month | Unlimited |
| Replay sessions | 5 / month | Unlimited |
| Watchlists | 1 · 15 symbols | Unlimited |
| Portfolio positions | 10 | Unlimited |
| Alerts | 5 | Unlimited |
| Research Queue | Top 3 | Full |
| DNA / Graph / advanced reviews | Preview | Full |

Remote overrides live on `OpsRemoteConfig` (`aiMentorMonthlyFree`, `aiAnalysisMonthlyFree`, …).

## Premium preview & wording

- [`PremiumPreviewCard`](../features/subscription/components/PremiumPreviewCard.tsx)
- [`PremiumOsGate`](../features/decision/components/PremiumOsGate.tsx) — teaser + “Unlock deeper insights”
- Avoid: Upgrade Now / Locked / Restricted / Unavailable

## Subscription screen

Outcome-led Free vs Premium comparison, 7-day trial highlight, Free remains available, RevenueCat Paywall + manual fallback, Customer Center for active Pro.
