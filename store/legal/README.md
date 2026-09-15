# Legal documents (canonical)

Markdown in this folder is the **source of truth** for hosted legal pages and
in-app copies.

| Field | Value |
| --- | --- |
| Legal entity / operator | **CML Electronics** |
| Brand | **Aithera** |
| Product | **TradeAcademy** |
| Official domain | **https://tradeacademy.cloud** |
| Registered address | Höglerstrasse 55, 8600 Dübendorf, Switzerland |
| Privacy | privacy@tradeacademy.cloud |
| Support | support@tradeacademy.cloud |
| Security | security@tradeacademy.cloud |

VAT/UID is intentionally omitted until provided.

| File | Public path |
| --- | --- |
| `privacy-policy.md` | https://tradeacademy.cloud/privacy |
| `terms-of-service.md` | https://tradeacademy.cloud/terms |
| `risk-disclaimer.md` | https://tradeacademy.cloud/risk |
| `account-deletion.md` | https://tradeacademy.cloud/account-deletion |
| `security-notice.md` | https://tradeacademy.cloud/security |
| `support.md` | https://tradeacademy.cloud/support |

After editing any file:

```bash
npm run legal
```

Deploy `store/hosted/` to `https://tradeacademy.cloud` so App Store Connect / Play Console
URLs return HTTP 200.

## Counsel review

These texts cover Swiss nFADP, EU/UK GDPR, U.S. state privacy laws (including CCPA/CPRA),
trading-app risk disclosures, and cybersecurity expectations. Before relying on them as
legal advice, have a licensed attorney review jurisdiction-specific adaptations. They are
**not** a substitute for advice from a licensed attorney.
