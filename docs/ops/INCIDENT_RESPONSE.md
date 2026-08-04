# Incident response

## Severity

| Level | Example | First action |
|-------|---------|--------------|
| SEV-1 | Data exposure, auth bypass | Kill switch + disable OTA + page on-call |
| SEV-2 | AI/quota outage, vendor 5xx storm | Flag off AI / raise poll intervals via remote config |
| SEV-3 | Elevated crashes | Sentry release health; OTA revert if needed |

## Playbooks

### Abuse / App Check storm

1. Check Ops Admin health (`appCheckFails`, `quotaBlocks`).
2. Confirm `APP_CHECK_ENFORCE` state.
3. Raise rate limits only after verifying legitimate traffic.

### Bad AI behaviour / cost spike

1. Disable `aiChatEnabled` or enable `globalKill`.
2. Inspect `ops/aggregates/ai` (metadata only).
3. Lower `aiDailyLimit*` via remote config.

### Privacy incident

1. Disable analytics + crash reporting remotely if needed (config + store listing notice).
2. Do not export aggregates containing unexpected free text (should be impossible by allowlist).
3. Follow legal deletion / notification obligations.
