# Store launch checklist — TradeAcademy by Aithera

**Updated:** 2026-09-15
**Identity:** product **TradeAcademy**, brand **Aithera**, legal entity **CML Electronics**,
bundle **`ai.tradeacademy.app`**, ASC Apple ID **`6812049061`**, domain **https://tradeacademy.cloud**
**Privacy audit:** [PRIVACY_AUDIT.md](./PRIVACY_AUDIT.md)
**Release matrix:** [FINAL_RELEASE_VERIFICATION_2026-09.md](./FINAL_RELEASE_VERIFICATION_2026-09.md)

## Verdict

| Gate | Status |
| --- | --- |
| **REPO / LEGAL OPERATOR IDENTITY** | **GO** — CML Electronics, Aithera brand, tradeacademy.cloud contacts, ASC 6812049061 |
| **Store submission** | **NO-GO until** hosted legal URLs return HTTP 200 and console/device items below are done |

Do not paste legal URLs into App Store Connect / Play Console until `https://tradeacademy.cloud/*` serves the generated `store/hosted/` pages.

---

## REPO COMPLETE

### Product / billing IDs (in source)

- Entitlement: `Aithera Pro`
- Products: `tradeacademy_premium_monthly` / `tradeacademy_premium_yearly` (lifetime = operator decision)
- 7-day trial: yearly only, when the store intro offer is attached
- Catalog: [MONETIZATION.md](./MONETIZATION.md)

### Legal pack (published operator values)

- Canonical markdown in `store/legal/` — **CML Electronics**, trading as Aithera
- Domain: https://tradeacademy.cloud
- Mailboxes: privacy@ / support@ / security@tradeacademy.cloud
- VAT/UID: omitted until provided
- In-app reader: Settings → Legal & Support
- Hosted HTML: `store/hosted/` (no template banner)
- Metadata: `store/metadata/app-store.json`, `play-store.json` (`legalOperatorFieldsComplete: true`)
- `eas.json` submit ASC App ID: **6812049061**

---

## MANUAL ACTION REQUIRED (submission blockers)

1. **Deploy** `store/hosted/` to https://tradeacademy.cloud (HTTP 200 on all legal paths + well-known)
2. **Confirm** privacy@ / support@ / security@tradeacademy.cloud mailboxes deliver
3. **ASC** listing for Apple ID 6812049061 — privacy/support/marketing URLs once hosting is live
4. **IAP** products + RevenueCat entitlement mapping
5. **Play** products + assetlinks SHA-256
6. **Firebase** production App Check providers
7. **EAS** development then production builds; `eas submit`
8. **Device QA** matrix in FINAL_RELEASE_VERIFICATION
9. Screenshots / reviewer notes as needed

Optional: provide VAT/UID later and re-run `npm run legal` if counsel requires it on published pages.
