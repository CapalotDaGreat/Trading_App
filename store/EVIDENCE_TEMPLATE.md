# Signed-build evidence template

Copy this into your release ticket for **each** of iOS sandbox and Android license-test candidates.

## Build identity

| Field | Value |
| --- | --- |
| Commit SHA | |
| EAS build ID / URL | |
| Profile (`preview` / `beta` / `production`) | |
| Runtime version | |
| Update channel | |
| Install source (TestFlight / Internal testing / sideload) | |
| Device model | |
| OS version | |
| Tester | |
| Timestamp (UTC) | |

## Functional smoke (`docs/QA.md`)

| # | Check | Pass? | Notes / link |
| --- | --- | --- | --- |
| 1 | Register / verify / sign in / out | | |
| 2 | Brief → Research/Skip → Journal → Review survives restart | | |
| 3 | Data source + freshness badges honest | | |
| 4 | Purchase monthly + yearly | | |
| 5 | Restore on second install | | |
| 6 | Cancel → paid-through still Premium → Free after | | |
| 7 | Resubscribe without wiping data | | |
| 8 | Offline / guest demo | | |
| 9 | Account deletion (Auth, Firestore, Storage, local) | | |
| 10 | Push token + deep link | | |
| 11 | Production-channel OTA update | | |
| 12 | VoiceOver / TalkBack key flows | | |
| 13 | Reduce Motion + 1.3× text | | |
| 14 | Tablet landscape layouts | | |

## Billing matrix

| Scenario | Apple | Google | RevenueCat |
| --- | --- | --- | --- |
| Monthly purchase | | | |
| Yearly + 7-day trial | | | |
| Restore | | | |
| Cancel renewal | | | |
| Paid-through boundary | | | |
| Refund / expiry | | | |
| Resubscribe | | | |

## Legal URL proof

| URL | HTTP status | Timestamp |
| --- | --- | --- |
| https://tradevision.ai/privacy | | |
| https://tradevision.ai/terms | | |
| https://tradevision.ai/risk | | |
| https://tradevision.ai/security | | |
| https://tradevision.ai/support | | |
| https://tradevision.ai/account-deletion | | |
| https://tradevision.ai/.well-known/apple-app-site-association | | |
| https://tradevision.ai/.well-known/assetlinks.json | | |
