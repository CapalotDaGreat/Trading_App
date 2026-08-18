# Account Deletion Notice

**Last updated:** 24 July 2026  
**Version:** 2026.07.24  

This notice explains how to delete your TradeInsight account and what happens to your data. It supports Apple App Store and Google Play account-deletion requirements and privacy rights under Swiss nFADP, EU/UK GDPR, and U.S. state privacy laws (including CCPA/CPRA deletion rights).

---

## 1. How to delete in the app

1. Open **Settings**.
2. If you have an active Premium subscription, tap **Manage Subscription** and cancel or modify billing in the Apple App Store or Google Play **first**. **Account deletion does not cancel store billing.**
3. Under **Delete Account**, tap **Delete Account**, type `DELETE`, and confirm.
4. For security, deletion may require a **recent sign-in** (typically within about five minutes). If prompted, sign out, sign back in, and retry.

Guest/demo data can usually be cleared by resetting local demo state or reinstalling; it is not a cloud account.

---

## 2. What we delete

When deletion succeeds, we aim to remove:

- your Firebase Authentication user;
- your Firestore user profile and subcollections (e.g. watchlists, holdings, journal, alerts, decisions, devices);
- your `userSettings` document;
- the server-side subscription access record for your UID;
- RevenueCat webhook event documents we store that reference your UID (where implemented);
- files under your Firebase Storage path;
- local app user data on the device used for deletion (device theme preference may remain).

Push tokens registered for your account are removed as part of device/token cleanup where implemented.

---

## 3. What we may retain briefly or cannot delete

- **Apple / Google purchase and billing records** remain with the stores under their policies.
- **Security, fraud, or legal logs** may be retained for a limited period where required by law or legitimate security interests.
- **Backups** may persist for a short technical window before rotating out.
- **Aggregated, de-identified** metrics that cannot reasonably identify you may remain.

---

## 4. Other ways to request deletion

Email **privacy@tradevision.ai** or **support@tradevision.ai** from your account email with subject “Account deletion request”. We will verify your identity and process the request within applicable statutory timelines (e.g. GDPR one month, subject to extensions; CCPA timelines as required).

---

## 5. Effect on Premium

Deleting the account removes TradeInsight access to Premium features tied to that account. It does **not** stop auto-renewal in the store. Manage subscription separately:

- iOS: Settings → Apple ID → Subscriptions (or in-app Manage Subscription)
- Android: Play Store → Subscriptions (or in-app Manage Subscription)

---

## 6. Contact

privacy@tradevision.ai  
support@tradevision.ai  
https://tradevision.ai/account-deletion
