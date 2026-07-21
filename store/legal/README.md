# Legal documents (canonical)

Markdown in this folder is the **source of truth** for hosted legal pages and
in-app copies.

| File | Public path (intended) |
| --- | --- |
| `privacy-policy.md` | https://tradevision.ai/privacy |
| `terms-of-service.md` | https://tradevision.ai/terms |
| `risk-disclaimer.md` | https://tradevision.ai/risk |
| `account-deletion.md` | https://tradevision.ai/account-deletion |
| `security-notice.md` | https://tradevision.ai/security |

After editing any file, sync into the app:

```bash
python scripts/sync-legal-docs.py
```

## Counsel review required

These texts are compliance-oriented templates covering Swiss nFADP, EU/UK GDPR,
U.S. state privacy laws (including CCPA/CPRA), trading-app risk disclosures, and
cybersecurity expectations. Before production:

1. Insert the registered legal entity name, postal address, and UID/VAT.
2. Confirm processor list / DPAs / SCCs with counsel.
3. Confirm age rating and store privacy questionnaires match shipped behaviour.
4. Publish HTTP 200 pages that match this folder (or regenerate from it).

They are **not** a substitute for advice from a licensed attorney.
