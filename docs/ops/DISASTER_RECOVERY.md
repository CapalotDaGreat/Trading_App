# Disaster recovery

## Backups

Scheduled function `opsBackupExport` writes a daily marker under `ops/backups/runs/{day}`.

Configure:

```bash
# Example managed export (run with project owner / backup SA)
gcloud firestore export gs://$OPS_BACKUP_BUCKET/firestore/$(date -u +%Y%m%d) --project YOUR_PROJECT
```

Also back up:

- Firebase Storage buckets
- Cloud Functions source (git) + Secret Manager
- Ops config docs (`ops/config/docs/*`)
- EAS credentials / App Store / Play Console access (offline runbook)

Retention: `remote.backupRetentionDays` (default 30) — apply lifecycle rules on the GCS bucket.

## Restore Firestore

```bash
gcloud firestore import gs://$OPS_BACKUP_BUCKET/firestore/YYYYMMDD --project YOUR_PROJECT
```

Validate security rules, then smoke: auth, Today brief, journal, subscription restore.

## Config rollback

1. Revert `ops/config` flags/remote via Ops Admin, or
2. Enable `globalKill` for emergency disable without binary rollback, or
3. Republish previous OTA on the channel / disable broken update in EAS.
