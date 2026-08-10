# Store launch checklist — execution status

**Date:** 2026-08-05  
**Commit under test:** run `git rev-parse HEAD` when attaching evidence  
**Repo gate verdict:** **PASS** (automated)  
**Store submission verdict:** **NO-GO** until manual console / hosting / signed-build items below are complete

This file records what the engineering agent completed in-repo on 2026-08-05, and what only a human with Apple / Google / Expo / Firebase / counsel access can finish.

---

## A. Completed in-repo (2026-08-05)

### Automated release gate

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test -- --runInBand` | PASS — 54 suites, 180 tests |
| `npm run functions:build` | PASS |
| `npm --prefix functions test` | PASS — 11 tests |
| `npm run test:rules` | PASS — Firestore + Storage rules (10 tests) |
| `npx expo config --type public` | PASS — SDK 54, bundle `ai.tradevision.app` |
| `updates.enabled` | **false** in local env (no `EXPO_PUBLIC_EAS_PROJECT_ID`) |
| ESLint | Fixed hooks error in `AiChatScreen`; ignored `ops/admin/` Vite app at root lint |

### Product / billing IDs (consistent)

- Entitlement: `Aithera Pro`
- Monthly: `monthly`
- Yearly: `yearly`
- Lifetime: `lifetime`
- Present in: `shared/constants/subscription.ts`, Functions webhook, reviewer notes, metadata

### Cloud Functions present in source

- `revenueCatWebhook` — `functions/src/index.ts`
- `deleteAccount` — `functions/src/index.ts`
- No `aiBrief` export found in Functions source

### Legal pack

- Canonical markdown in `store/legal/`
- Synced into app via `python scripts/sync-legal-docs.py` → `shared/legal/document-text.ts`
- Static hostable HTML generated via `python scripts/build-hosted-legal.py` → `store/hosted/`
- Deep-link templates: `store/hosted/.well-known/apple-app-site-association`, `assetlinks.json`

### Store asset scaffolding

- Screenshot folders created under `store/screenshots/**` (empty `.gitkeep` placeholders)
- Evidence template: `store/EVIDENCE_TEMPLATE.md`
- Metadata ready: `store/metadata/app-store.json`, `play-store.json`
- Reviewer notes ready: `store/reviewer-notes.md`

### Hosted URL probe (live site)

Probed `https://tradevision.ai/{privacy,terms,support,account-deletion}` on 2026-08-05 — responses were **not** the TradeVision legal pages (placeholder / unrelated content). **Legal hosting remains a hard blocker.**

---

## B. Manual — you must do these

### 1. Legal hosting + counsel (blocker)

- [ ] Insert registered legal entity name, postal address, VAT/UID into `store/legal/*`
- [ ] Counsel review (CH / EU / US as needed)
- [ ] Re-run `npm run legal:sync` and `npm run legal:host`
- [ ] Deploy `store/hosted/` to `tradevision.ai` site root so these return **HTTP 200** with correct HTML:
  - `/privacy` `/terms` `/risk` `/security` `/account-deletion` `/support`
- [ ] Replace `APPLE_TEAM_ID` in hosted AASA
- [ ] Replace Play signing SHA-256 in hosted `assetlinks.json`
- [ ] Serve AASA as `application/json` **without** `.json` extension

### 2. Expo / EAS (blocker)

- [ ] `eas login` + `eas init` (or link existing project)
- [ ] Set EAS secrets/env: `EXPO_PUBLIC_EAS_PROJECT_ID`, `EAS_OWNER`, Firebase public keys, RevenueCat public keys
- [ ] **Omit** vendor API keys and webhook auth from production `EXPO_PUBLIC_*`
- [ ] Configure iOS signing, Android keystore, APNs, FCM
- [ ] Put real App Store Connect App ID into `eas.json` → `submit.beta.ios.ascAppId`
- [ ] Build `preview`/`beta` then `production` for iOS + Android
- [ ] Verify OTA channel + one rollback drill

### 3. Firebase / Functions deploy (blocker)

- [ ] `firebase login` + select production project
- [ ] Deploy Firestore rules, Storage rules, Functions (`revenueCatWebhook`, `deleteAccount`, ops)
- [ ] Set Functions secrets: `REVENUECAT_WEBHOOK_AUTH_TOKEN`, vendor keys
- [ ] Seed `opsAdmins/{uid}` if using ops admin
- [ ] Prove account deletion on a real test user (Auth + Firestore + Storage)

### 4. Billing consoles (blocker)

- [ ] App Store Connect: Paid Apps Agreement, tax, banking
- [ ] Create products + 7-day yearly trial matching IDs above
- [ ] Play Console: same products + trial
- [ ] RevenueCat: both stores, entitlement `premium`, webhook → Functions URL
- [ ] Sandbox / license tester matrix (purchase, restore, cancel, paid-through, refund, resubscribe)

### 5. Signed-device QA (blocker)

- [ ] Install signed builds on real iOS + Android devices
- [ ] Complete `docs/QA.md` signed smoke checklist
- [ ] Fill `store/EVIDENCE_TEMPLATE.md` with build IDs and results
- [ ] Optional: Maestro flows on signed client
- [ ] VoiceOver + TalkBack + tablet landscape + Reduce Motion

### 6. Screenshots & listings (blocker)

- [ ] Capture required scenes from **signed RC** into `store/screenshots/**` (see README there)
- [ ] Play feature graphic
- [ ] Upload to App Store Connect + Play Console
- [ ] Paste listing copy from `store/metadata/*.json`
- [ ] Fill Apple Privacy Nutrition Labels + Google Data Safety (match shipped consent behavior)
- [ ] Age: Apple **12+**, Play **Teen**; account eligibility **18+**

### 7. Review submission

- [ ] Paste `store/reviewer-notes.md` into App Review / Play notes
- [ ] Provide sandbox reviewer credentials in the consoles (never commit them)
- [ ] TestFlight / Play internal testing → production submit
- [ ] Confirm no false claims: broker, buy/sell signals, always-on background alerts, production cloud AI

---

## C. Quick commands for you

```bash
# After legal edits
npm run legal:sync
npm run legal:host

# Repo gate before every RC
npm run typecheck
npm test -- --runInBand
npm run functions:build
npm --prefix functions test
npm run test:rules

# When EAS env is set
npx expo config --type public   # confirm updates.enabled + projectId
eas build --profile preview --platform all
```

---

## D. Related docs

- `docs/STORE_SUBMISSION.md` — external console gate
- `docs/APP_STORE_REVIEW.md` — Apple guideline map
- `docs/QA.md` — signed smoke + a11y
- `docs/DEV_BUILD.md` — Expo Go vs store capabilities
- `docs/ops/PRODUCTION_CHECKLIST.md` — ops
- `store/hosted/README.md` — deploy legal/deep links
- `store/EVIDENCE_TEMPLATE.md` — attach to release ticket
