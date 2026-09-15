# TradeAcademy — Complete Current-State Handoff (for ChatGPT / next-agent planning)

**Generated:** 2026-09-15  
**Repo:** `C:/Money/Trading_App` (GitHub: CapalotDaGreat/Trading_App)  
**Branch:** `main` @ `09800e0`  
**Purpose of this document:** Give another model enough product, architecture, legal, and release context to plan the next submission steps without re-discovering the codebase from scratch.

---

## 1. One-sentence product definition

**TradeAcademy** (brand **Aithera**, legal entity **CML Electronics**) is an **educational trading simulation, decision-practice, coaching, and learning** mobile/web app — **not** a broker, execution venue, signal service, social network, or investment-advice product.

---

## 2. Product contract (non-negotiable)

### Learning loop (canonical)

```text
Learn → Practice → Replay → Simulate → Journal → Review → Improve
```

Home / Today is a **training center**, not a trading terminal.

### Hard rules

- Never add actionable **BUY / SELL / ENTER NOW / TARGET / GUARANTEED** recommendations.
- **DQS (Decision Quality Score)** = process quality only — never a price prediction.
- **Simulated P/L never grades** a decision or competence.
- **Training readiness never certifies** live trading.
- Default market data is **labelled synthetic/sample** (honest `DataSourceBadge`: live / delayed / approximate / sample / mock).
- Cloud AI stays **disabled** unless Privacy Policy names a processor and product intentionally enables it.
- Simulation paths must be uniquely generated (internal seed, never shown to users).

### What the app is NOT

Broker · execution venue · live trading terminal · social/copy trading · signal service · guaranteed-returns product · investment advice platform.

---

## 3. Identity & frozen identifiers (do not rename)

| Kind | Value |
| --- | --- |
| Product | TradeAcademy |
| Brand | Aithera |
| Legal entity / controller | **CML Electronics** (trading as Aithera) |
| Registered address | Höglerstrasse 55, 8600 Dübendorf, Switzerland |
| Official domain | **https://tradeacademy.cloud** |
| Privacy email | privacy@tradeacademy.cloud |
| Support email | support@tradeacademy.cloud |
| Security email | security@tradeacademy.cloud |
| VAT/UID | **Intentionally omitted** until provided |
| iOS/Android app id | `ai.tradeacademy.app` |
| URL scheme | `tradeacademy://` |
| Expo / EAS slug | `traders` (immutable; project `45b77785-1075-478a-aef4-75bdc54f90c7`) |
| npm package | `tradeacademy-ai` |
| AsyncStorage prefix | `tradeacademy-*` |
| RevenueCat entitlement | **Aithera Pro** |
| IAP monthly | `tradeacademy_premium_monthly` |
| IAP yearly | `tradeacademy_premium_yearly` |
| IAP lifetime (optional) | `tradeacademy_premium_lifetime` — catalog flag exists; **operator must confirm** whether lifetime ships |
| App Store Connect Apple ID | **6812049061** |
| Legal acceptance version | `2026.09.15` |
| Guest / demo uid | `demo-guest` |

Constants live in `shared/constants/brand.ts`, `shared/constants/legal.ts`, `shared/constants/monetization.ts`, `eas.json`.

---

## 4. Current stack

| Layer | Version / choice |
| --- | --- |
| Expo | **57.0.22** (SDK 57) |
| React | **19.2.3** |
| React Native | **0.86.3** |
| TypeScript | ~6.0.3 |
| Router | Expo Router v6 (`app/`) |
| UI | NativeWind v4 + Tailwind; design tokens in `shared/constants/theme.ts` |
| Server/derived state | TanStack React Query |
| Client/prefs | Zustand + AsyncStorage |
| Backend (optional) | Firebase Auth / Firestore / Storage / Cloud Functions |
| Billing | RevenueCat (`react-native-purchases` + UI) |
| Native generation | **CNG** — no committed `ios/` or `android/` directories |
| New Architecture | SDK 57 only path (no `newArchEnabled` toggle) |

**Do not** write Expo APIs from newer SDKs without checking `package.json` / docs v57.

---

## 5. Repository layout (mental model)

```text
app/                 Expo Router screens (tabs, auth, settings, decision/*, academy, legal, …)
features/            Feature modules: components, hooks, services, screens, stores, content
shared/              UI primitives, constants, legal sync, analytics, stores, utils
firebase/            Client Firebase config / App Check helpers
functions/           Cloud Functions (TypeScript → build)
store/legal/         Canonical legal Markdown (source of truth)
store/hosted/        Generated static legal portal (deploy to tradeacademy.cloud)
store/metadata/      App Store / Play listing JSON drafts
docs/                Audits, checklists, SDK 57 reports, release verification
scripts/             legal sync/host generators, tooling
```

Path alias: `@/*` → repo root.

### Canonical learning systems (do not duplicate)

| System | Authority |
| --- | --- |
| Training planner | `composeTrainingPlan` |
| Learner model | `composeLearnerModel` |
| Competency / mastery | `features/competency/` |
| Candidate pool | `training-candidate-pool.service.ts` (and related planner services) |

Charts: keep the existing educational chart systems (do not invent a third chart stack).

---

## 6. Major user-facing surfaces

### Auth & onboarding

- Welcome, login, register, forgot password, verify email, MFA
- Guest/demo mode works **without** Firebase
- Mentor / coach profile setup (onboarding)
- Age layers: store rating 4+ / Everyone ≠ contractual 18+ for accounts & IAP

### Core loop tabs / hubs

- **Today / Home** — planner-backed “Today’s focus → Why it matters → Start”
- **Learn / Academy** — lessons, paths, checklists
- **Practice** — drills, chart exercises, adaptive retry, next actions
- **Research / Markets / Events / Calendar** — educational research & context (labelled data)
- **Simulate** — paper book; clearly framed as simulation; thesis / invalidation / reflection
- **Journal** — process notes; export Premium-gated; **raw text never in analytics**
- **Review** — “What am I repeatedly doing?” process patterns, not P/L grading
- **You / More / Settings** — account, privacy, accessibility, subscription, legal

### Decision / coaching depth (often Premium-gated)

- Decision Replay / Replay TV (blind decision → reveal → reflection)
- Decision Lab / Simulator / Heatmap / Passport
- Personal Intelligence / Trading DNA (process patterns — not personality/investment advice)
- Ask / AI mentor (cloud AI off; educational framing)

### Monetization UX

- Entitlement: **Aithera Pro**
- Monthly / Yearly; 7-day trial on yearly **only when store shows it**
- Restore, manage subscription, Customer Center path
- Guest cannot claim cloud Premium as if store-verified without proper flows

---

## 7. Architecture notes that matter for next work

- **Firebase optional:** gate with `canUseFirestore()` / `isFirebaseConfigured()`; fall back to local/demo.
- **Never silently fall back to another user’s cloud data.**
- Analytics: opt-in, allowlisted events/props — no journal text, AI chat, portfolio values.
- Sentry: optional, consent-gated.
- Haptics: centralized `feedbackHaptic`, preference-gated.
- Educational reminders: practice / journal / review / replay; quiet hours; no financial signals.
- Connectivity: Offline / sync pending / guest-local banners; training content usable offline where architected.
- Biometrics: opt-in **local unlock** only — does not replace cloud auth or encrypt cloud beyond normal auth.
- Background tasks: OS-inexact; never promise real-time alerts.
- App Check: production fail-closed architecture in Functions; **native attestation providers = operator**.
- Legal Markdown → `npm run legal` → syncs `shared/legal/document-text.ts` + regenerates `store/hosted/`.

---

## 8. Legal & compliance (current published state)

### Documents (v 2026.09.15)

Privacy · Terms · Risk · Security · Account Deletion · Support  

Sources: `store/legal/*.md`  
Hosted: `store/hosted/` (ready to deploy)  
In-app: Settings → Legal & Support / `/legal/[doc]`

### Status

- Operator placeholders **removed**
- Template “not a live publication” banners **removed**
- VAT/UID **omitted** on purpose
- `legalOperatorFieldsComplete: true` in store metadata
- `listingUrlsReady: false` until **https://tradeacademy.cloud** serves HTTP 200

### Store listing draft URLs (paste only after hosting live)

- https://tradeacademy.cloud/privacy  
- https://tradeacademy.cloud/terms  
- https://tradeacademy.cloud/risk  
- https://tradeacademy.cloud/security  
- https://tradeacademy.cloud/support  
- https://tradeacademy.cloud/account-deletion  

Metadata drafts: `store/metadata/app-store.json`, `store/metadata/play-store.json`.

---

## 9. Validation status (code)

Last full automated baseline around final polish / legal identity:

| Check | Result |
| --- | --- |
| Typecheck | PASS |
| Jest | **118 suites / 753 tests PASS** (at polish; legal tests re-verified after identity update) |
| Cloud Functions tests | PASS (19) |
| Firestore/Storage rules | PASS (14) with JDK 21 |
| Expo Doctor | 21/21 PASS |
| Expo export (all platforms) | PASS |
| `git diff --check` | PASS |

**CODE COMPLETE ≠ DEVICE VERIFIED.** IAP, push, biometrics, background wake, App Check enforcement, and live hosting are **not** claimed verified.

---

## 10. What is done vs what remains

### Done in code (high level)

- Expo SDK 54 → **57** migration complete
- Product polish: Today hierarchy, Settings IA, Review framing, practice instructions, simulation framing/haptics, biometric honesty
- Legal portal professionalized + CML Electronics identity published
- Educational reminders, connectivity honesty, preference-gated haptics
- Privacy-conscious analytics allowlist
- EAS profiles (development / internal / preview / beta / production)
- ASC App ID wired: **6812049061**
- Release docs: `docs/FINAL_RELEASE_VERIFICATION_2026-09.md`, `docs/STORE_LAUNCH_CHECKLIST.md`, `docs/SDK_57_FEATURE_MAXIMIZATION_REPORT_2026-09.md`

### Remaining — OPERATOR / BUILD / DEVICE only

Recommended order:

1. **Deploy** `store/hosted/` → `https://tradeacademy.cloud` (HTTP 200 + AASA + assetlinks)
2. **Confirm** privacy@ / support@ / security@ mailboxes deliver
3. **EAS** `eas build --profile development` (iOS + Android Dev Client)
4. **Firebase** production project + App Check (DeviceCheck / Play Integrity)
5. **RevenueCat** + ASC/Play IAP products mapped to **Aithera Pro**
6. **Play** signing SHA into `store/hosted/.well-known/assetlinks.json`
7. **Device QA** (IAP restore, push, biometrics, deep links, VoiceOver/TalkBack, deletion vs billing)
8. **Production build** + `eas submit` to ASC **6812049061**
9. Optional later: VAT/UID + counsel jurisdiction tweaks → `npm run legal`

Screenshots / feature graphic inventory may still be empty (`store/screenshots/`) — treat as store-asset work if missing.

---

## 11. How to run (dev)

```bash
npm install
npm run start:dev-client   # preferred for IAP / push / biometrics / background
# or
npm run start              # Expo Go (limited native)

npm run typecheck
npx jest --runInBand --forceExit
npm run legal              # after editing store/legal/*
npm run functions:build && npm run functions:test
npm run test:rules         # needs JDK 21 + emulators
```

Windows note: `git push` may need `git -c http.sslBackend=schannel push` if OpenSSL CA fails locally.

---

## 12. Key docs to open next

| Doc | Why |
| --- | --- |
| `AGENTS.md` | Standing product + SDK rules |
| `docs/FINAL_RELEASE_VERIFICATION_2026-09.md` | Submission verification matrix |
| `docs/STORE_LAUNCH_CHECKLIST.md` | GO / NO-GO checklist |
| `docs/STORE_SUBMISSION.md` | Store gate narrative |
| `docs/DEV_BUILD.md` | Dev Client vs Expo Go |
| `docs/MONETIZATION.md` | Pricing / entitlement catalog |
| `docs/SDK_57_MIGRATION_REPORT_2026-09.md` | Migration history |
| `docs/SDK_57_FEATURE_MAXIMIZATION_REPORT_2026-09.md` | Maximization / polish report |
| `store/legal/README.md` | Legal operator table |
| `store/hosted/README.md` | Deploy instructions |

---

## 13. Suggested next-step prompts for ChatGPT

Use these as follow-ups (pick one):

1. **Hosting:** “Produce an exact deploy checklist for `store/hosted/` to tradeacademy.cloud including MIME types for AASA and assetlinks, and a post-deploy HTTP verification script.”
2. **ASC submission:** “Given Apple ID 6812049061 and metadata in `store/metadata/app-store.json`, draft App Store Connect field-by-field copy and privacy nutrition labels from shipped behaviour.”
3. **RevenueCat:** “Create a step-by-step RevenueCat + ASC/Play product mapping plan for Aithera Pro with monthly/yearly and optional lifetime decision.”
4. **Device QA:** “Turn the DEVICE REQUIRED matrix in FINAL_RELEASE_VERIFICATION into a printable QA script with pass/fail evidence columns.”
5. **EAS:** “Write the exact `eas build` / `eas submit` commands and env/secrets checklist for development then production on SDK 57 CNG.”

---

## 14. Explicit non-goals for the next agent

- Do not re-migrate Expo SDK.
- Do not rename frozen IDs or invent a second planner/learner/competency system.
- Do not invent VAT/UID or claim certifications that do not exist.
- Do not claim IAP/push/biometrics/App Check work until device/console verified.
- Do not turn educational copy into trading signals.
- Do not commit `.env`, credentials, or temporary `.expo-export-*` folders.

---

**End of handoff.** Primary source of truth for remaining work: `docs/FINAL_RELEASE_VERIFICATION_2026-09.md` + `docs/STORE_LAUNCH_CHECKLIST.md`.
