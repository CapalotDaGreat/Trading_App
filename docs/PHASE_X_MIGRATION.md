# Phase X — Migration guide

## Existing users

- **Do not** force Mentor Setup.
- Users with `hasCompletedOnboarding === true` keep tab access.
- Soft invite appears until they complete Mentor Setup or dismiss it.
- Settings migration v6 adds `mentorSetupCompleted: false` by default.

## Draft versions

| Key | Version | Notes |
| --- | --- | --- |
| `tradevision:onboarding-draft:v1` | 1 | Legacy activation (still readable) |
| `tradevision:mentor-setup-draft:v2` | 2 | Mentor Setup answers + step |
| `tradevision:coach-profile:v1` | 1 | Completed coach profile |

## Quota: daily → monthly (AI)

- Client limits: `aiAnalysisMonthly` / `aiMentorMonthly` in entitlements.
- Server: `usage/{uid}/monthly/{yyyy-mm}` for `ai` and `ai_mentor` buckets ([`functions/src/quota.ts`](../functions/src/quota.ts)).
- Other vendor proxies remain daily.
- Ops remote: prefer `aiAnalysisMonthlyFree` (20) / `aiAnalysisMonthlyPremium` (-1). Legacy `aiDailyLimit*` kept for older clients.

## Watchlists

- Free: **1** list, **15** symbols (`symbolsPerWatchlist`).
- Call sites using `watchlistMax` for symbols should use `symbolsPerWatchlist`.

## Functions deploy

Set `REVENUECAT_ENTITLEMENT_ID=Aithera Pro` if not already. Redeploy functions after quota changes.

## Tests to run

```bash
npm run typecheck
npx jest features/onboarding/services/__tests__/onboarding-routing.test.ts features/decision/components/__tests__/PremiumOsGate.test.tsx features/subscription/services/__tests__/subscription-access.test.ts --runInBand
npm --prefix functions test
```
