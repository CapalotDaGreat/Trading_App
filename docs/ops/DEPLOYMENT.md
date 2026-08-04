# Deployment guide

## Channels (EAS)

| Profile | Channel | Audience |
|---------|---------|----------|
| development | development | Dev clients |
| internal | internal | Internal testers + `internal` flags |
| preview | preview | Dogfood |
| beta | beta | External beta + `beta` flags |
| production | production | Store |

## Deploy Cloud Functions

```bash
npm run functions:build
firebase deploy --only functions
```

Required secrets / env:

- Existing vendor + RevenueCat secrets
- Optional: `OPS_BACKUP_BUCKET`, `OPS_ALERT_WEBHOOK_URL`, `OPS_SPIKE_SECURITY_PER_HOUR`
- `APP_CHECK_ENFORCE` when ready for hard App Check

## Seed ops admin

Create Firestore doc `opsAdmins/{uid}` for each operator (empty object OK).

## Client

Ship via EAS build + submit. OTA updates ride the channel. Feature disable does **not** require a binary release — flip flags in Ops Admin / Firestore.
