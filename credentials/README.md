# Local Apple credentials (gitignored)

Put private keys under this folder on your machine only. `*.p8` / this directory are gitignored.

## Layout

| Path | Use |
| --- | --- |
| `asc/AuthKey_SN9C4638Q3.p8` | **App Store Connect API (Admin Team Key)** — EAS Submit + credential automation |
| `apple/SubscriptionKey_*.p8` | App Store Server / subscription notifications (not EAS Submit) |
| `apple/AuthKey_*_Sign-In.p8` | Sign in with Apple |
| `apple/ApiKey_*.p8` | Other Apple API key (not the ASC Admin Team key for EAS) |

## EAS Submit

`eas.json` → `submit.production.ios` points at:

- `ascApiKeyPath`: `./credentials/asc/AuthKey_SN9C4638Q3.p8`
- `ascApiKeyId`: `SN9C4638Q3`
- `ascApiKeyIssuerId`: (Issuer ID from ASC Integrations)
- `ascAppId`: `6812049061`
- `appleTeamId`: `833CYAZ8XT`

## Build with ASC API key (skip Apple password login)

```powershell
.\scripts\eas-ios-production.ps1
```

Or:

```powershell
$env:NODE_EXTRA_CA_CERTS = ".\certs\avg-web-mail-shield-root.pem"
$env:NODE_USE_SYSTEM_CA = "1"
$env:EXPO_ASC_API_KEY_PATH = (Resolve-Path ".\credentials\asc\AuthKey_SN9C4638Q3.p8").Path
$env:EXPO_ASC_KEY_ID = "SN9C4638Q3"
$env:EXPO_ASC_ISSUER_ID = "5edc5185-66dd-4530-888a-a9d3f865929f"
npx eas-cli build --platform ios --profile production --auto-submit
```
