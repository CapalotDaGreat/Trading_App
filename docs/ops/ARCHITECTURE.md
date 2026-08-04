# Ops architecture overview

TradeVision AI production ops is privacy-first and built on existing Firebase, Sentry, EAS, and RevenueCat surfaces.

## Components

| Layer | Responsibility |
|-------|----------------|
| Client defaults (`features/ops-config`) | Safe offline/guest behaviour without network |
| `getOpsBootstrap` callable | Serves Firestore `ops/config` flags + remote values |
| `trackProductEvent` callable | Consent-gated allowlisted aggregates only |
| AI / subs / security rollups | Metadata counters under `ops/aggregates/*` |
| `opsHealthSnapshot` | Hourly health + spike webhook |
| `opsBackupExport` | Daily backup marker + GCS runbook |
| `ops/admin` Vite app | Internal dashboard for allowlisted operators |
| Sentry (consent) | Crashes + low-rate performance traces |

## Data paths (never store)

- Journal text, AI prompts/completions, passwords, portfolio monetary values, emails in aggregates.

## Kill switch

`flags.globalKill.enabled = true` disables high-risk surfaces (AI chat, aggressive polling, paywall experiments, beta/internal diagnostics) while Today / guest / journal remain usable via defaults.
