# Privacy Policy

**Last updated:** 24 July 2026  
**Version:** 2026.07.24  
**Controller / Operator:** Aithera (“Aithera”, “we”, “us”, “our”), operator of the TradeInsight mobile application and https://tradevision.ai  
**Privacy contact:** privacy@tradevision.ai  
**Support contact:** support@tradevision.ai  

This Privacy Policy explains how we collect, use, store, share, and protect personal data when you use TradeInsight. It is designed to meet transparency and rights requirements under:

- the Swiss Federal Act on Data Protection (**nFADP** / revDSG);
- the EU/EEA **GDPR** and UK **UK GDPR** where applicable;
- U.S. state privacy laws including the California Consumer Privacy Act as amended by the CPRA (**CCPA/CPRA**), and similar state laws; and
- related cybersecurity and breach-notification expectations.

**This document is a compliance-oriented template for the shipped product behaviour. Have qualified counsel in Switzerland, the EU/EEA, and relevant U.S. states review and adapt it (including your registered legal entity name, postal address, and VAT/UID) before production launch.**

---

## 1. Who we are and scope

TradeInsight is a **decision-first trading research and coaching application**. It is **not** a broker-dealer, bank, investment adviser, portfolio manager, or execution venue. Scores such as Research Value Score (RVS) and Decision Quality Score (DQS) describe research priority and process quality; they **do not** predict price direction.

This Policy applies to:

- the iOS and Android apps (including demo/guest mode);
- related cloud services we operate (e.g. Firebase Auth/Firestore/Storage, Cloud Functions); and
- our public legal/support pages.

It does **not** govern third-party stores (Apple, Google), payment processors, or market-data vendors’ own processing beyond what we disclose below.

---

## 2. Categories of personal data

Depending on how you use the app, we may process:

| Category | Examples | Typical source |
| --- | --- | --- |
| Account & identity | Email, display name, Firebase UID, auth provider identifiers, email verification status | You; Google/Apple Sign-In |
| Security / MFA | Multi-factor authentication factors (e.g. TOTP enrolment metadata), recent authentication timestamps | You; Firebase Auth |
| Device & push | Device type/OS, Expo/FCM push tokens, app version/release | Device; OS |
| Preferences | Theme, haptics, notification settings, crash-reporting consent and version/timestamp | You |
| Product content you create | Watchlists, alerts, journal entries, decision records, holdings you enter, onboarding answers | You |
| Subscription | Entitlement status, product IDs, expiry/paid-through dates, RevenueCat app user ID (= Firebase UID) | Apple/Google via RevenueCat webhook (server-side) |
| Diagnostics (optional) | Crash/error events, route names, release/build metadata, limited device/OS context — **redacted** of common credentials and personal fields | App, only if you enable Crash Reporting |
| Support | Messages you send to support | You |
| Technical logs | Server timestamps, security/auth events, webhook delivery metadata needed to operate the service | Systems |

We **do not** intentionally collect:

- government ID numbers, biometric templates (beyond optional OS biometric unlock you enable on-device), precise continuous GPS tracking, health data, or children’s data;
- advertising identifiers for cross-app tracking;
- behavioural advertising profiles or cross-app tracking;
- payment card numbers (billing is handled by Apple/Google).

Optional **product analytics** (screen/feature aggregates only) is **off by default** and requires explicit consent. We never intentionally collect journal text, AI conversation content, passwords, or portfolio monetary values in analytics.

Market quotes and news are **market data**, not personal data about you, though requests may be associated with your session/account for rate limiting and service delivery.

---

## 3. Purposes and legal bases

| Purpose | Legal basis (GDPR Art. 6 / Swiss equivalent) |
| --- | --- |
| Create and authenticate accounts; provide core app features | Contract (Art. 6(1)(b)); Swiss overriding private interest / contract |
| Process Premium entitlements and prevent fraud/abuse | Contract; legitimate interests (security, billing integrity) |
| Sync your content to Firestore when signed in and verified | Contract |
| Send price-alert / transactional notifications you enable | Contract; consent where required for push on the OS |
| Optional crash diagnostics to Sentry | **Consent** (Art. 6(1)(a)); off by default |
| Optional first-party product analytics (allowlisted aggregates) | **Consent** (Art. 6(1)(a)); off by default |
| Security, abuse prevention, MFA, deletion throttling | Legitimate interests (Art. 6(1)(f)); legal obligation where applicable |
| Comply with law, respond to lawful requests, enforce Terms | Legal obligation (Art. 6(1)(c)); legitimate interests |
| Improve reliability using consented, aggregated, non-identifying product signals | Consent when analytics enabled; otherwise not collected |

You may withdraw consent for crash reporting or product analytics at any time in **Settings → Privacy** without affecting other processing that does not rely on that consent.

---

## 4. How we use and store data

- **Client storage:** Preferences and demo/local content may be stored on-device (e.g. AsyncStorage / SecureStore as applicable).
- **Cloud:** Authenticated, email-verified users may sync data to **Google Firebase** (Auth, Firestore, Storage) under security rules that restrict access to the account owner (and server-only paths for subscriptions).
- **Guest / demo mode:** Designed to stay **local**; it does not create a verified cloud identity for personal cloud writes under our hardened rules.
- **Encryption in transit:** TLS for network traffic to our providers.
- **Encryption at rest:** Provider-managed encryption for Firebase/Google Cloud and Sentry as offered by those vendors.
- **Access control:** Least-privilege rules, verified-email write gates, MFA options, and recent-authentication requirements for account deletion.

We apply **data minimisation** and **purpose limitation**: we process what is needed for the purposes above and do not sell personal information.

---

## 5. Sharing and processors (recipients)

We share personal data only with:

1. **Infrastructure processors** acting on our instructions, including:
   - **Google Firebase / Google Cloud** — authentication, database, storage, functions;
   - **RevenueCat** — subscription entitlement sync (server webhook; no client secret keys);
   - **Sentry** — optional crash diagnostics **after consent**;
   - **Expo / Apple / Google** — app distribution, push delivery infrastructure as configured;
2. **Market-data / news providers** (e.g. Finnhub, Alpha Vantage, CoinGecko, NewsAPI or successors) — typically receive technical requests (symbols, IP as seen by their edge) necessary to return quotes/news; their policies apply to their processing;
3. **Professional advisers** or authorities when legally required;
4. A **successor** in a merger or asset transfer, subject to continued protection consistent with this Policy.

We **do not sell** personal information and **do not share** it for cross-context behavioural advertising as those terms are used under CCPA/CPRA. We **do not** use your journal or decision content for advertising.

---

## 6. International transfers

Servers and processors may be located in the **United States**, **EU/EEA**, **Switzerland**, or other countries. Where GDPR/UK GDPR or Swiss nFADP require safeguards for transfers abroad, we rely on:

- adequacy decisions where available; and/or
- **Standard Contractual Clauses** (or Swiss-recognised equivalents) and vendor DPAs; and/or
- other lawful transfer tools.

You may request information about transfer safeguards via privacy@tradevision.ai.

---

## 7. Retention

We retain personal data only as long as needed for the purposes above:

- **Account data:** for the life of the account, then deleted or anonymised after account deletion completes (subject to short backup/log retention);
- **Decision/journal/watchlist content:** until you delete it or delete the account;
- **Subscription entitlement records:** while needed to provide Premium access and resolve billing disputes, then deleted or minimised;
- **RevenueCat webhook event references tied to your UID:** removed as part of account deletion where implemented;
- **Crash diagnostics:** according to Sentry retention settings for consented data; stopped when consent is withdrawn (future events not sent);
- **Security logs:** typically short periods unless needed for investigations or legal holds;
- **Legal holds:** longer retention when required to establish, exercise, or defend legal claims.

---

## 8. Your rights

### 8.1 Switzerland (nFADP)

Subject to statutory exceptions, you may request **access**, **rectification**, **erasure**, **restriction**, **objection** to processing based on overriding interests, and **data portability** where applicable. You may lodge a complaint with the Swiss Federal Data Protection and Information Commissioner (**FDPIC**).

### 8.2 EU/EEA & UK (GDPR / UK GDPR)

You have rights of **access**, **rectification**, **erasure**, **restriction**, **portability**, **objection**, and rights related to **automated decision-making**. You may withdraw consent at any time. You may complain to your local supervisory authority (and to the ICO in the UK).

We do **not** use solely automated decision-making that produces legal or similarly significant effects about you within the meaning of GDPR Art. 22. In-app scores are research/coaching aids you control; they are not credit, employment, or similarly significant automated decisions.

### 8.3 United States (including California CCPA/CPRA)

Depending on your state, you may have rights to **know/access**, **delete**, **correct**, and **opt out of sale/sharing**. We do not sell or share personal information for cross-context behavioural advertising. We do not use or disclose sensitive personal information for purposes that require a right to limit under CPRA beyond what is necessary to provide the service.

**How to exercise rights:** use in-app controls (Privacy & Security, Delete Account, Manage Subscription) or email privacy@tradevision.ai. We will verify requests as required by law and will not discriminate against you for exercising privacy rights.

---

## 9. Children’s privacy and audience

TradeInsight is intended for a **general audience**. Anyone may download the app and explore educational Guest/demo features that remain local on the device.

**Cloud account features** — including registration, cloud sync, online journals, online portfolios, and paid subscriptions — are available only to users who meet the minimum eligibility requirements: at least **18** years old, or the age of majority in their jurisdiction. We do not knowingly collect personal data from young children through cloud accounts. The application is **not directed toward young children**. If you believe a minor has created an account or provided personal data, contact privacy@tradevision.ai and we will delete it.

---

## 10. Cookies and similar technologies

The native apps do not use web advertising cookies. If you visit tradevision.ai in a browser, any cookies or local storage will be described on that site. Push tokens and local preference stores are used as described above.

---

## 11. Security and cybersecurity

We implement technical and organisational measures appropriate to the risk, including:

- TLS in transit; provider encryption at rest;
- authentication, optional MFA, verified-email write rules, and deletion re-authentication windows;
- least-privilege Firestore/Storage rules and server-owned subscription records;
- redaction of common secrets/PII in optional crash reports;
- dependency and CI hygiene practices for the codebase.

No method of transmission or storage is perfectly secure. If a breach is likely to result in a high risk to your rights, we will notify you and/or competent authorities as required under Swiss nFADP, GDPR (including the 72-hour supervisory notification rule where applicable), and applicable U.S. state breach laws.

Report suspected security issues to **security@tradevision.ai** (or support@tradevision.ai if that address is not yet active).

---

## 12. Account deletion

You may delete your account in **Settings**. Deletion is intended to remove:

- Firebase Authentication account;
- your Firestore user document tree and settings;
- server subscription-access record and related webhook event references we store;
- files under your Storage path;
- local app user data (device theme preference may be preserved).

**Deleting the TradeInsight account does not cancel Apple App Store or Google Play billing.** Manage or cancel the store subscription first. Store purchase records remain with Apple/Google under their policies.

More detail: https://tradevision.ai/account-deletion and the in-app Account Deletion notice.

---

## 13. Changes

We may update this Policy. Material changes will be indicated by updating the “Last updated” date and, where required, seeking fresh consent (e.g. for crash reporting). Continued use after the effective date constitutes acceptance where permitted by law; where consent is required, we will ask again.

---

## 14. Contact

**Privacy:** privacy@tradevision.ai  
**Support:** support@tradevision.ai  
**Website:** https://tradevision.ai  

Please include your registered email / account identifier so we can verify your request.
