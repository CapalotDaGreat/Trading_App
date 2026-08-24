# Legal documents (canonical)

Markdown in this folder is the **source of truth** for hosted legal pages and
in-app copies. Brand: **Aithera**. Product: **TradeInsight**.

Bracketed fields (`[LEGAL ENTITY NAME REQUIRED]`, `[VAT/UID REQUIRED]`,
`[SUPPORT EMAIL REQUIRED]`, `[OFFICIAL DOMAIN REQUIRED]`, and related contact
placeholders) are **not** production values. The registered postal address
**Höglerstrasse 55, 8600 Dübendorf** is the address supplied for these templates;
counsel must still confirm the legal entity that occupies it.

Public URLs must not be pasted into App Store Connect / Play Console until
`[OFFICIAL DOMAIN REQUIRED]` hosts HTTP 200 copies of `store/hosted/`.

| File | Public path (intended) |
| --- | --- |
| `privacy-policy.md` | {origin}/privacy |
| `terms-of-service.md` | {origin}/terms |
| `risk-disclaimer.md` | {origin}/risk |
| `account-deletion.md` | {origin}/account-deletion |
| `security-notice.md` | {origin}/security |
| `support.md` | {origin}/support |

Replace `{origin}` with `[OFFICIAL DOMAIN REQUIRED]` after hosting is verified.
A technical fallback origin may still exist in app config; do not treat it as
live Aithera legal hosting.

After editing any file:

```bash
npm run legal
```

## Counsel review required

These texts are compliance-oriented templates covering Swiss nFADP, EU/UK GDPR,
U.S. state privacy laws (including CCPA/CPRA), trading-app risk disclosures, and
cybersecurity expectations. Before production:

1. Replace `[LEGAL ENTITY NAME REQUIRED]` and `[VAT/UID REQUIRED]`.
2. Activate real `[PRIVACY EMAIL REQUIRED]`, `[SECURITY EMAIL REQUIRED]`, and
   `[SUPPORT EMAIL REQUIRED]` mailboxes (do not ship invented addresses).
3. Confirm processor list / DPAs / SCCs with counsel.
4. Confirm store age rating (Apple **12+**, Google Play **Teen**) versus
   contractual eligibility (**18+** / age of majority for accounts and
   subscriptions). Guest/demo does not require being 18.
5. Publish HTTP 200 pages that match this folder on `[OFFICIAL DOMAIN REQUIRED]`.

They are **not** a substitute for advice from a licensed attorney.
