# TradeVision AI – Architecture & Security Blueprint

This document describes the **target production shape** expected by the comprehensive audit. It is a recovery guide for when application source is pushed into `CapalotDaGreat/Trading_App`. It is **not** an instruction to invent a greenfield app if a real codebase already exists elsewhere — prefer importing and reconciling real code first.

---

## Product identity (non-negotiable)

TradeVision AI is a **decision-first educational trading research platform**.

Core loop:

1. **Learn** — Academy  
2. **Research** — Research Queue / AI research assistants  
3. **Decide** — Decision Lab / structured decision capture  
4. **Practice** — Decision Replay / scenarios  
5. **Review** — Journal / Decision Passport  
6. **Improve** — Portfolio Health + behavioural insights feeding back into Learn/Research  

Positioning must stay educational (not brokerage execution, not guaranteed signals).

---

## Required technology constraints

| Constraint | Rule |
|------------|------|
| Expo | SDK **54** — **never eject** |
| Navigation | Expo Router |
| UI | React Native + NativeWind |
| Language | TypeScript **strict** |
| Server data | Firebase Auth, Firestore, Storage |
| Client data | React Query + Zustand (clear ownership: server cache vs ephemeral UI) |
| Monetization | RevenueCat |
| Dependencies | No unnecessary packages; prefer Expo-supported modules |

---

## Suggested folder map (reconcile with real tree)

```text
app/                          # Expo Router screens & layouts
  (auth)/
  (tabs)/
  (modals)/
src/
  components/                 # Presentational + interactive primitives
  features/
    auth/
    academy/
    decisions/                # Lab, Passport, Replay
    journal/
    portfolio/
    research/
    watchlists/
    subscriptions/
    notifications/
    ai/
  services/                   # Firebase, RevenueCat, analytics facades
  hooks/
  stores/                     # Zustand
  providers/                  # QueryClient, Auth, Theme, etc.
  theme/
  constants/
  utils/
  types/
functions/                    # Cloud Functions (callable, triggers)
firestore.rules
storage.rules
firebase.json
app.json / app.config.ts
eas.json
privacy/                      # PrivacyInfo.xcprivacy, disclosure copy
```

Adapt names to the imported codebase; do not force a rewrite solely to match this map.

---

## Security baseline (must verify on real code)

### Authentication & session

- Prefer Firebase Auth with secure persistence; store refresh/session material in **expo-secure-store** / Keychain — not plaintext AsyncStorage.
- Guest / Demo modes must be explicitly scoped: no privilege to write another user’s Firestore paths; demo data local or clearly labeled ephemeral collections.
- Auth error messages must not enable account enumeration beyond Firebase defaults.

### Authorization

- Firestore: **deny by default**; every document path enforces `request.auth.uid == resource.data.userId` (or equivalent ownership).
- Storage: path-bound to uid; content-type and size limits.
- Cloud Functions: verify Auth + **App Check**; never trust client-sent `userId` for entitlement.
- RevenueCat: client unlocks UX only; sensitive premium server actions re-check entitlements server-side.

### Secrets & logging

- No API keys in the client except Firebase web config / RevenueCat **public** SDK keys.
- Strip tokens, journal text, and PII from console logs in production builds.
- `.gitignore` must include `.env*`, service account JSON, local Google services overrides if they embed secrets.

### Abuse & integrity

- Rate-limit AI / research callables per uid.
- Validate and sanitize all deep-link params before navigation.
- Avoid `eval`, dynamic `Function`, and unsafe deserialization of AI tool payloads.
- HTTPS only; no cleartext network exceptions without documented need.

### Privacy

- Privacy Manifest (iOS) aligned with actual APIs (file timestamps, disk space, boot time, user defaults, etc.).
- In-app educational + AI disclosures; subscription terms and manage/cancel paths visible.
- Data deletion / export path for user journals and decisions (store & GDPR/CCPA readiness).

---

## Performance baseline

- Deduplicate Firestore listeners; prefer React Query with explicit `staleTime` / invalidation.
- Lists: FlashList where lists are long; avoid anonymous inline components that defeat recycling.
- Images: sized + cached; no huge uncompressed assets in the bundle.
- Startup: defer non-critical providers; avoid blocking auth on premium/network when Guest Mode is allowed.
- Animations: respect reduced-motion; keep 2–3 intentional motions, not noise.

---

## Accessibility baseline

- Meaningful `accessibilityLabel` / roles on icon-only controls  
- Focus order matches visual order  
- Contrast AA+ for text on atmospheric backgrounds  
- Dynamic Type / font scaling does not clip primary CTAs  
- Touch targets ≥ 44×44 pt  
- Web keyboard affordances if Expo web is shipped  

---

## Testing gate (re-audit exit criteria)

Scripts / checks expected in CI:

```bash
npx tsc --noEmit
npm run lint
npm test
```

Manual / E2E smoke (device or Maestro/Detox if present):

- Auth (sign-up, sign-in, sign-out, password reset)  
- Guest Mode & Demo Mode boundaries  
- Decision Replay, Decision Lab, Academy, Portfolio, Journal, Watchlists  
- AI flows with failure/empty states  
- RevenueCat paywall restore/purchase sandbox  
- Notifications permission denied path  

---

## App Store / Play readiness checklist

- [ ] Educational finance positioning; no “get rich / guaranteed returns” copy  
- [ ] AI disclosure (limitations, not financial advice)  
- [ ] Subscription price, period, auto-renew, manage/cancel links  
- [ ] Privacy Policy + Terms URLs live and linked from app + store  
- [ ] Age rating consistent with content  
- [ ] Data Safety form matches actual collection (Firebase, analytics, RevenueCat)  
- [ ] Account deletion if account creation is offered  

---

## Import playbook (P0)

1. Locate the real TradeVision AI project on the developer machine or correct GitHub remote.  
2. Copy or push into this repository on a feature branch (preserve history if possible via `git subtree` / remote add).  
3. Confirm Expo 54; do not upgrade/downgrade casually during first import.  
4. Add security ignore files and remove any committed secrets (rotate if leaked).  
5. Re-run the production audit agent / checklist (Phases 1–9).  
6. Only then deepen shallow product surfaces — always integrating Learn/Research/Decide/Practice/Review/Improve.
