# TradeVision AI review notes

TradeVision is a decision-quality research and coaching app. It is not a broker
and does not provide buy/sell signals or execute trades.

## Review access

- Use **Continue as Guest** after checking the educational/risk acknowledgment on the welcome
  screen to review the complete local demo without external credentials. Guest mode does not
  require being 18; creating an account or purchasing a subscription does.
- A sandbox account and platform tester credentials must be entered in App
  Store Connect / Play Console; never commit them here.

## Core flow

1. Open Today and review the brief.
2. Select a queue item and record Research or Skip.
3. Save a journal entry.
4. Open Review to see the basic Process Tape.

RVS means Research Value Score: whether an idea deserves attention. DQS means
Decision Quality Score: checklist/process quality. Neither predicts price
direction.

## Subscription review

- Open Settings → Manage Subscription.
- The Brief, top-three Research Queue, journal, and basic Process Tape remain
  free. Premium gates only the deeper queue, advanced/weekly review insights,
  Trading DNA, portfolio intelligence, Decision Lab, expanded Ask allowance,
  and journal export.
- Monthly and yearly products use native platform billing through RevenueCat.
- Restore Purchases is available on the subscription screen.
- Cancel opens the platform or provider subscription-management screen.
- Cancellation disables renewal but Premium benefits remain available through
  the provider-reported paid-through date. The app displays that date and
  removes Premium access after expiration.

Product identifiers:

- `tradevision_premium_monthly`
- `tradevision_premium_yearly`

The configured seven-day trial applies only to the yearly product and must
match the platform-console offer.

## Data and AI

Market-data surfaces label live, delayed, approximate, sample, or mock data and
show freshness. Production cloud AI is disabled for this release; no fixed or
mock cloud response is marketed as a production capability.

## Account deletion

Settings includes in-app account deletion. The flow first directs users to
manage any active store subscription because deleting an account does not
cancel platform billing, then requires the user to type `DELETE`. For security,
the server accepts deletion only within five minutes of authentication; if
prompted, sign out and sign back in before retrying. Deletion removes the Auth
account, the user's Firestore document tree, settings, subscription-access
record, user Storage prefix, and local app data.

Terms, Privacy, Risk Disclaimer, Security Notice, Support, and account-deletion
information are linked in Settings (in-app copies plus hosted URLs). Public URLs
must return HTTP 200 in the submission consoles before review; no reviewer
credential is stored in this repository. Legal markdown sources are in
`store/legal/` and must be counsel-reviewed for the production entity.
