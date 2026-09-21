# ASC API key layout for TradeAcademy

Private `.p8` files live under `credentials/` (gitignored). Do not commit them.

## Which key EAS uses

| File | Key ID | Role |
| --- | --- | --- |
| `credentials/asc/AuthKey_SN9C4638Q3.p8` | `SN9C4638Q3` | **ASC Admin Team key** → EAS Submit + credential repair |
| `credentials/apple/SubscriptionKey_57L6N467ND.p8` | `57L6N467ND` | App Store Server / IAP notifications (not EAS Submit) |
| `credentials/apple/AuthKey_2RJP5KV633_Sign-In.p8` | `2RJP5KV633` | Sign in with Apple |
| `credentials/apple/ApiKey_WHBRIB3O6H1C-PrivateKey.p8` | `WHBRIB3O6H1C` | Other Apple API key |

Issuer ID (ASC Integrations): `5edc5185-66dd-4530-888a-a9d3f865929f`  
Apple Team ID: `833CYAZ8XT`  
ASC App ID: `6812049061`

`eas.json` → `submit.production` / `submit.beta` already reference the Admin Team key path + IDs.

## Commands (run locally)

### Option A — one script (recommended)

```powershell
cd C:\Money\Trading_App
.\scripts\eas-ios-production.ps1
```

When prompted about Apple account login, choose **No** if it offers to use the ASC API key / env credentials. Prefer **Generate** for the distribution certificate (not upload `.p12`).

### Option B — manual env + build

```powershell
cd C:\Money\Trading_App
$env:NODE_EXTRA_CA_CERTS = ".\certs\avg-web-mail-shield-root.pem"
$env:NODE_USE_SYSTEM_CA = "1"
$env:EXPO_ASC_API_KEY_PATH = (Resolve-Path ".\credentials\asc\AuthKey_SN9C4638Q3.p8").Path
$env:EXPO_ASC_KEY_ID = "SN9C4638Q3"
$env:EXPO_ASC_ISSUER_ID = "5edc5185-66dd-4530-888a-a9d3f865929f"
$env:EXPO_APPLE_TEAM_ID = "833CYAZ8XT"
$env:EXPO_APPLE_TEAM_TYPE = "INDIVIDUAL"

npx eas-cli build --platform ios --profile production --auto-submit
```

### Option C — credentials menu only

```powershell
# same EXPO_ASC_* env as above, then:
npx eas-cli credentials -p ios
```

1. Profile: **production**
2. Log in to Apple account? **No**
3. Set up / use **App Store Connect API Key** → path `credentials\asc\AuthKey_SN9C4638Q3.p8`
4. Generate distribution certificate + provisioning profile

After a successful build, the binary appears in App Store Connect → TestFlight.
