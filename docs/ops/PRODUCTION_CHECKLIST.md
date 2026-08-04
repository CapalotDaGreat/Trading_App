# Production checklist (ops)

- [ ] EAS project + channels configured (`development` / `internal` / `preview` / `beta` / `production`)
- [ ] Functions deployed including ops callables + schedules
- [ ] `opsAdmins/{uid}` seeded
- [ ] Optional `ops/config/docs/{flags,remote}` seeded (defaults work if empty)
- [ ] `OPS_BACKUP_BUCKET` + IAM for Firestore export
- [ ] Sentry DSN + consent path verified
- [ ] Product analytics off by default; Privacy Policy synced
- [ ] RevenueCat webhook live; subs aggregates increment
- [ ] App Check soft → hard plan documented
- [ ] Ops Admin `.env` configured; sign-in smoke test
- [ ] Kill switch drill: enable `globalKill`, confirm Ask AI gated, Today still loads
- [ ] Guest/demo offline still uses local defaults
