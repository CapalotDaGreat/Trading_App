# TradeAcademy — Pre-ASC Final Audit (last check before upload)

**Date:** 16 September 2026  
**Product:** TradeAcademy by Aithera (CML Electronics)  
**Stack:** Expo SDK **57**, bundle `ai.tradeacademy.app`, scheme `tradeacademy`, slug `traders`  
**Rule:** Unverified device/console items stay **UNVERIFIED**. No fabricated TestFlight, VoiceOver, or ASC pastes.

This is the **last repository-side quality + bloat check** before the operator begins the App Store Connect upload / review process. It builds on:

- [`TRADEACADEMY_FINAL_RELEASE_AUDIT_2026-09-16.md`](./TRADEACADEMY_FINAL_RELEASE_AUDIT_2026-09-16.md)
- [`TRADEACADEMY_FINAL_APPLE_SUBMISSION_GATE_2026-09-16.md`](./TRADEACADEMY_FINAL_APPLE_SUBMISSION_GATE_2026-09-16.md)

---

## Verdict

| Gate | Result |
| --- | --- |
| Code / product integrity for educational core | **PASS (repo)** |
| Automated typecheck (this pass) | **PASS** |
| Bloat / dead-code high-confidence cleanup | **DONE** (minimal; see Cleanup) |
| Expo Go physical walkthrough (same day) | **PASS (operator-reported)** — no runtime failures |
| EAS production / TestFlight binary | **UNVERIFIED — OPERATOR** |
| VoiceOver / TalkBack on device | **UNVERIFIED — OPERATOR** |
| App Check DeviceCheck / Play Integrity | **UNVERIFIED — OPERATOR** |
| ASC URL paste + subscription metadata | **UNVERIFIED — OPERATOR** |
| **Upload readiness** | **CONDITIONALLY READY** — start ASC upload after EAS production build + operator checklist below |

---

## What was cleaned in this pass

| Item | Action |
| --- | --- |
| Accidental Windows `NUL` file | **Deleted**; `/NUL` added to `.gitignore` |
| Settings → Market data health “API keys” framing | **Already fixed** earlier same day — synthetic default, no client Finnhub/CoinGecko keys required |
| User-facing leftover “DNA” copy on Process patterns screens | **Rewritten** to “process patterns” / “process-pattern history” (internal type names kept) |

**Not deleted (intentionally):**

- Historical `docs/*` mentioning SDK 54 / TradeVision — **do not ship in the app binary**; useful audit trail. Do not mass-delete pre-upload.
- Feature modules (`decision-*`, `learner-state`, `personal-intelligence`, vendor adapters) — all still wired into navigation, Home planner, or sync.
- Large Academy / Replay TV content files — product depth, not dead weight.
- Client Finnhub/Alpha/News adapters — gated, store-profile denied; needed for optional signed-in vendor mode via Functions later.
- `RETIRED_PERSIST_TOKEN = 'tradevision'` — required migration token only.

---

## Performance

| Finding | Severity | Notes |
| --- | --- | --- |
| Runtime update-depth / write storms | **Mitigated** | Prior fixes: learning queue, simulation refresh, journal drafts, subscription idempotent sets, Replay TV draft-in-effect, ops-config |
| Crypto / Hermes | **Mitigated** | Polyfill before Firebase |
| Metro lazy bundles on iOS Expo Go | **Expected** | TaskManager / BackgroundTask / alert-capability |
| Large content modules (flagship lessons, Replay catalog) | **LOW** | Acceptable educational depth; loaded via feature routes, not a second chart/planner system |
| Polling | **OK (code)** | `MARKET_DATA_POLICY` quote/candle intervals; synthetic mode does not need vendor poll |
| List virtualization gaps | **MEDIUM / monitor** | Many hubs use mapped `ScrollView` sections; primary tabs are bounded. No FlashList dependency — acceptable for current list sizes; revisit if Review/Replay libraries grow |

**Device performance timings on production binary:** **UNVERIFIED**.

---

## Accessibility

| Finding | Severity | Notes |
| --- | --- | --- |
| Primary tabs | **PASS (code)** | `tabBarAccessibilityLabel`, `tabBarAllowFontScaling`, `minHeight: 44` |
| Design-system Button / Input / IconButton / StatusState | **PASS (code)** | Labels, loading announcements, min touch targets, design-system a11y tests |
| Charts | **PASS (code)** | `AccessibleChartFrame`, CandlestickChart parent accessibility (RN-only props removed from `Svg` for web) |
| Reduce motion | **PASS (code)** | `useReducedMotion` on major animated surfaces |
| Icon-only / custom Pressables outside design system | **MEDIUM** | Coverage is good but not total; VoiceOver pass still required |
| VoiceOver journey on iPhone | **UNVERIFIED** | Operator checklist: Home → Learn lesson → Practice → Simulate → Journal → Review → Settings → Subscription |

---

## Understanding (educational boundary)

| Contract | Status |
| --- | --- |
| Not a broker / no live execution | **PASS (copy + tests)** |
| No buy/sell signals / guaranteed returns | **PASS (mentor refusals + store copy)** |
| DQS = process quality | **PASS** |
| Simulated P/L ≠ competence grade | **PASS** |
| Cloud AI off | **PASS** (`CLOUD_AI_ENABLED = false`) |
| One Home planner authority | **PASS** |
| Market data honesty | **PASS** after health-screen rewrite |
| Process patterns vs “Trading DNA” user copy | **PASS** after this pass |

---

## Depth (product loop)

| Surface | Depth judgment |
| --- | --- |
| Learn / Academy | **Deep** — multi lesson packs, quiz, chart exercise, mastery wiring |
| Practice | **Solid** — drills + evidence |
| Simulate | **Solid** — $100k paper, thesis/invalidation, scenario engine |
| Replay / Replay TV | **Deep** — catalog + session flow |
| Journal / Review | **Solid** — process review hubs |
| Events | **Adequate** — educational calendar + recommendations (not a second planner) |
| Ask | **Bounded** — on-device mentor only |
| Hidden Markets / Portfolio / Research tabs | **Intentional shells** — deep-link only, not primary IA |

---

## Bloat / unused code audit

| Category | Result |
| --- | --- |
| TradeVision production IDs | **None** (migration token only) |
| Orphan feature folders | **None high-confidence** — all sampled modules have external refs |
| Unused npm deps | **None high-confidence** — Purchases UI, Sentry, Apple Auth, biometrics, screen-capture all referenced |
| Accidental junk in tree | **`NUL` removed** |
| Repo doc drift (SDK 54 in old audits) | **Hygiene only** — optional later cleanup; not binary bloat |

**Do not** strip Academy content, Replay catalog, or vendor adapter files solely to “look smaller” before review — risk outweighs binary savings.

---

## Apple review / operator blockers (still)

1. **EAS production iOS build** + TestFlight install (prior non-interactive build blocked on credentials).
2. Paste listing URLs into ASC (`store/metadata/app-store.json` already lists them; host previously HTTP 200).
3. Confirm RevenueCat ↔ ASC products / entitlement **Aithera Pro** / webhook secret.
4. Native App Check (DeviceCheck) — fail-closed in code; attestation unproven.
5. VoiceOver + restore purchases + account deletion on a **signed** build.
6. App Privacy questionnaire + age / subscription review notes.

### Improved since prior audit

- **App Store screenshots present** in-repo: 8 each for iPhone 6.7", 6.5", iPad Pro 12.9" (24 PNGs). Still must be **uploaded** in ASC.
- Expo Go core journey reported clean by operator (same day).

---

## Automated checks (this pass)

| Check | Result |
| --- | --- |
| `npm run typecheck` | **PASS** |
| Personal intelligence + market-data-health Jest | **PASS** (18 tests) |
| Prior full suite baseline | **125 / 769** Jest; Functions **19**; Rules **14** (same-day earlier run) |

Re-run the full suite after the production EAS binary is produced if any further code lands.

---

## Recommendation

**Proceed to operator upload workflow** (EAS production → TestFlight → ASC metadata → submit), not more product features.

Repository state is educational-boundary sound, runtime-hardened, and not carrying high-confidence dead shipping code. Remaining risk is **console / attestation / signed-build QA**, not missing Learn→Simulate depth.
