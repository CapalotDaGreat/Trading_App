# Waiting on domain transfer — what is ready vs blocked

**Date:** 2026-09-15
**Status (2026-09-16):** Domain is live on Cloudflare (`HTTP 200` for privacy/terms/support/risk/security/account-deletion + AASA).
**Historical note:** Previously blocked on Namecheap → Cloudflare transfer for **tradeacademy.cloud**.
**EAS project:** `45b77785-1075-478a-aef4-75bdc54f90c7` (owner `boddibossis-team`, Expo slug **`traders`**)
**App product scheme / bundle:** `tradeacademy` / `ai.tradeacademy.app` (unchanged)
**Note:** Expo project slugs are immutable per project ID — app config `slug` is `traders` to match EAS.

## Ready now (do not wait for DNS)

| Item | How |
| --- | --- |
| EAS project linked in repo | `app.config.ts` → `extra.eas.projectId` + `owner` |
| EAS Update URL | `https://u.expo.dev/45b77785-1075-478a-aef4-75bdc54f90c7` |
| Dev Client workflow | `eas workflow:run .eas/workflows/create-development-builds.yml` |
| Preview workflow | `eas workflow:run .eas/workflows/create-preview-builds.yml` |
| Production workflow | `eas workflow:run .eas/workflows/create-production-builds.yml` (needs credentials first) |
| iOS simulator Dev profile | `development-simulator` in `eas.json` |
| ASC submit target | Apple ID **6812049061** in `eas.json` |
| Legal static site | `store/hosted/` + Cloudflare `_headers` + README deploy steps |
| Operator identity | CML Electronics / Aithera / mailboxes published in legal pack |

### Recommended operator commands (while waiting)

```bash
# 1) Configure signing once per platform/profile (interactive — Apple/Google accounts)
npx eas-cli credentials:configure-build -p ios -e development
npx eas-cli credentials:configure-build -p android -e development

# 2) Kick off Dev Client builds (does not need tradeacademy.cloud)
npx eas-cli workflow:run .eas/workflows/create-development-builds.yml

# Later, when store credentials exist:
npx eas-cli credentials:configure-build -p ios -e production
npx eas-cli credentials:configure-build -p android -e production
npx eas-cli workflow:run .eas/workflows/create-production-builds.yml
```

Watch builds: https://expo.dev/accounts/boddibossis-team/projects/traders/workflows

### Optional Expo dashboard note

Expo project slug is **`traders`** (immutable for this project ID). Product URL scheme and
store bundle remain **`tradeacademy`** / **`ai.tradeacademy.app`**.

### Still configure in consoles (independent of DNS)

1. RevenueCat: entitlement **Aithera Pro**, products monthly/yearly  
2. App Store Connect IAP + privacy questionnaire (URLs after hosting)  
3. Google Play products + Play App Signing SHA → assetlinks  
4. Firebase production + App Check DeviceCheck / Play Integrity  
5. EAS secrets for RevenueCat / Firebase public keys (never commit `.env`)  
6. Link GitHub repo in Expo project GitHub settings (for workflow `on: push` later if desired)

## Hosting status (updated 2026-09-16)

| Item | Status |
| --- | --- |
| Legal pages on https://tradeacademy.cloud | **Live** — see `docs/ASC_LISTING_URLS.md` |
| AASA | **Live** (`833CYAZ8XT.ai.tradeacademy.app`) |
| assetlinks | Served, but SHA still `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` (Android later) |
| Paste listing URLs into ASC | **Ready** — paste now |
| Production mailbox delivery on @tradeacademy.cloud | **Operator** — confirm MX |
| Universal Links end-to-end QA | **DEVICE** after Dev Client install |

### Day-of-transfer checklist

See [`store/hosted/README.md`](../store/hosted/README.md). Short version:

1. Domain active in Cloudflare  
2. Pages project → deploy `store/hosted/`  
3. Attach custom domain + SSL  
4. Curl all legal + well-known URLs  
5. Flip `listingUrlsReady` when verified  
6. Paste URLs into store consoles  

## Explicitly not started here

- Running production store submission without credentials  
- Auto `on: push` production builds (too aggressive until you opt in)  
- Inventing Play signing SHA or RevenueCat secret keys
