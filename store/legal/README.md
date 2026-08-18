# Legal documents (canonical)

Markdown in this folder is the **source of truth** for hosted legal pages and
in-app copies. Operator brand: **Aithera**. Product: **TradeInsight**.

Public paths below use the current legal-site origin fallback (`tradevision.ai`)
until `EXPO_PUBLIC_LEGAL_SITE_ORIGIN` points at a verified Aithera host. Do not
claim live Aithera pages until hosting is verified.

| File | Public path (intended) |
| --- | --- |
| `privacy-policy.md` | {origin}/privacy |
| `terms-of-service.md` | {origin}/terms |
| `risk-disclaimer.md` | {origin}/risk |
| `account-deletion.md` | {origin}/account-deletion |
| `security-notice.md` | {origin}/security |

Replace `{origin}` with `https://tradevision.ai` (current fallback) or your
configured legal site origin.

After editing any file, sync into the app and regenerate hosted HTML:

```bash
npm run legal:sync
npm run legal:host
```

## Counsel review required

These texts are compliance-oriented templates covering Swiss nFADP, EU/UK GDPR,
U.S. state privacy laws (including CCPA/CPRA), trading-app risk disclosures, and
cybersecurity expectations. Before production:

1. Insert the registered legal entity name, postal address, and UID/VAT.
2. Confirm processor list / DPAs / SCCs with counsel.
3. Confirm store age rating (Apple **12+**, Google Play **Teen**) and account eligibility
   (**18+** / age of majority for accounts and subscriptions) match shipped behaviour.
4. Publish HTTP 200 pages that match this folder (or regenerate from it).

They are **not** a substitute for advice from a licensed attorney.
