# Security & Cybersecurity Notice

**Last updated:** 16 September 2026
**Version:** 2026.09.16
**Operator:** CML Electronics, trading as Aithera
**Registered address:** Höglerstrasse 55, 8600 Dübendorf, Switzerland

This notice summarises Aithera’s security posture for users, reviewers, and enterprise diligence. It complements the Privacy Policy and is aligned with expectations under Swiss nFADP, GDPR security principles (Art. 32), and commonly referenced U.S. frameworks (e.g. reasonable security under state law, FTC Act Section 5 unfairness for unreasonable security).

**It is not a certification, SOC 2 report, or guarantee against breach.**

---

## 1. Security objectives

- Protect account confidentiality and integrity;
- Prevent cross-user data access;
- Minimise collection and exposure of personal data;
- Detect and respond to incidents;
- Keep optional diagnostics off until consent is given.

---

## 2. Controls in the shipped product

| Area | Measures |
| --- | --- |
| Transport | HTTPS/TLS to backend and third-party APIs |
| Authentication | Firebase Auth; optional MFA (TOTP); OAuth MFA challenge handling |
| Authorisation | Firestore/Storage security rules; verified-email write gates; owner-scoped documents |
| Privileged actions | Recent re-authentication window for account deletion and sensitive MFA changes |
| Subscriptions | Server-side webhook verification; entitlement/expiry fail-closed; client cache not treated as authority |
| Push | Per-device token documents with cleanup on sign-out/delete |
| Diagnostics | Crash reporting default **off**; redaction of common secrets/PII and user-content fields; consent versioning; debug console logs in development builds only |
| Analytics | Product analytics default **off**; allowlisted event/property names only; no journal, AI chat, or portfolio values |
| Guest mode | Local demo without verified cloud write privileges |
| Screen privacy | Screen-capture protections on sensitive MFA secret reveal flows where implemented |
| Development | Typecheck/tests/rules emulator gates in CI; dependency isolation for Functions |
| Optional app lock | On-device biometric / device authentication gate when enabled in Settings (protects local app reveal — not a bank-grade vault claim) |

---

## 2A. Implemented vs planned

| Topic | Status |
| --- | --- |
| Firestore/Storage rules fail-closed for unverified users | **Implemented** |
| RevenueCat webhook signature verification | **Implemented** (server) |
| App Check hard-enforce in production Functions path | **Implemented** when configured; soft mode only for explicit emulator/dev |
| Optional crash reporting (Sentry) with consent | **Implemented** |
| Allowlisted product analytics | **Implemented** (opt-in) |
| SOC 2 / ISO 27001 / PCI attestations | **Not claimed** |
| Guaranteed breach immunity | **Not claimed** |

---

## 3. Your responsibilities

- Use a strong unique password and enable MFA;
- Keep the OS and app updated;
- Do not jailbreak/root or install untrusted profiles that weaken OS protections;
- Review crash-reporting consent before enabling;
- Report suspected compromise immediately.

---

## 4. Vulnerability disclosure

Email **security@tradeacademy.cloud** (or support@tradeacademy.cloud) with a good-faith report. Include steps to reproduce and avoid accessing other users’ data. We will acknowledge and remediate according to severity. Do not publicly disclose before a reasonable remediation window unless required by law.

---

## 5. Incident notification

If a personal-data breach is likely to result in a high risk to individuals, we will notify affected users and/or authorities as required under Swiss nFADP, GDPR (including supervisory notification without undue delay and, where feasible, within 72 hours), and applicable U.S. state breach statutes.

---

## 6. Contact

security@tradeacademy.cloud
privacy@tradeacademy.cloud
support@tradeacademy.cloud
Höglerstrasse 55, 8600 Dübendorf, Switzerland
