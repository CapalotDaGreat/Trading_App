# Operational handbook

## Day-2 operations

1. Open Ops Admin → Health after deploy.
2. Confirm analytics/AI/subs aggregates increment on canary traffic.
3. Review Sentry unresolved issues for the release.
4. Keep Privacy consents **off by default** in new installs.

## Feature rollouts

1. Ship code dark (default on/off in `DEFAULT_OPS_FLAGS`).
2. Enable percentage / beta / premium targeting in Ops Admin.
3. Monitor aggregates + Sentry for 24–48h.
4. Roll to 100% or kill.

## Version compatibility

`schemaVersion` on bootstrap must remain backward compatible. Additive remote keys only; never rename without client fallbacks in `normalizeOpsBootstrap`.

## Release notes template

```
## TradeVision AI x.y.z
- Process / coaching changes (never market prediction claims)
- Flags / remote defaults touched:
- Ops / monitoring notes:
```
