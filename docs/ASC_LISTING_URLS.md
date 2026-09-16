# App Store Connect — paste these URLs

Verified live on **2026-09-16** (`HTTP 200`).

| ASC field | URL |
| --- | --- |
| **Privacy Policy URL** | https://tradeacademy.cloud/privacy |
| **Support URL** | https://tradeacademy.cloud/support |
| **Marketing URL** (optional) | https://tradeacademy.cloud |
| **Account Deletion** | https://tradeacademy.cloud/account-deletion |

Also useful (not always separate ASC fields):

- Terms (website): https://tradeacademy.cloud/terms
- Risk: https://tradeacademy.cloud/risk
- Security: https://tradeacademy.cloud/security

**Contact email:** support@tradeacademy.cloud  
**Bundle ID:** `ai.tradeacademy.app`  
**Apple ID:** `6812049061`

## Custom EULA (License Agreement)

ASC does **not** accept a Terms URL for the custom EULA field. Paste **plain text**.

1. App → **App Information** → License Agreement → **Edit**
2. Select **Apply a custom EULA to all chosen countries or regions**
3. Select **all** countries/regions (otherwise Apple’s standard EULA applies to the rest)
4. Paste the full text of `store/legal/terms-of-service.md` (or the live Terms page body) as **plain text**

Apple minimum terms are in **§17** of the Terms. Claims telephone in the Terms: **+41 78 672 88 05**.

Source: [Apple Minimum Terms](https://www.apple.com/legal/internet-services/itunes/dev/minterms/)

## Where in ASC

1. **App Information** → Privacy Policy URL + License Agreement (custom EULA text)
2. **App Store** → version → Support URL (+ optional Marketing URL)
3. **App Privacy** → match hosted Privacy Policy
