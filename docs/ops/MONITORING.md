# Monitoring guide

## Product analytics

Consent-gated allowlisted events → `ops/aggregates/daily/{day}`.

Dashboards: Ops Admin → Analytics.

## AI ops

`ops/aggregates/ai/{day}`: requests, failures, latency sums, model/category counters, fallback counts. **No prompts.**

## Security

`securityEvents` (Functions-only) rolled into hourly `ops/health/docs/latest`.

Spike alert: `OPS_ALERT_WEBHOOK_URL` when events/hour exceed threshold.

## Crashes & performance

Sentry (consent). Traces sample rate via `EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (default 0.05).

## Subscriptions

`ops/aggregates/subs/{day}` from RevenueCat webhook mapping (counts only).

## Cost

Health snapshot includes a **heuristic** monthly cost — not live GCP Billing.
