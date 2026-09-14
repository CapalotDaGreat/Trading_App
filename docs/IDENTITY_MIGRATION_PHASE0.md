# Identity migration — Phase 0 (Aithera / TradeAcademy)

**Date:** 14 September 2026 (identifiers aligned to TradeAcademy)  
**Scope:** Product, bundle, scheme, persist keys, and legal-host fallback all use TradeAcademy. A one-time AsyncStorage copy still reads retired persist keys and writes `tradeacademy-*`.

## Brand (locked)

| Field | Value |
| --- | --- |
| Company / operator | **Aithera** |
| Product / app | **TradeAcademy** |
| Attribution | **TradeAcademy by Aithera** |
| Positioning | Research smarter. Decide with clarity. Improve your process. |

Source of truth for in-app constants: [`shared/constants/brand.ts`](../shared/constants/brand.ts).

## Audit summary

### User-facing branding (updated in Phase 0)

- Expo display `name` → TradeAcademy (`app.config.ts`)
- Welcome, Settings, Privacy, Educational Mode, AI disclaimer, auth/MFA copy
- Store metadata (`store/metadata/app-store.json`, `play-store.json`)
- Reviewer notes (`store/reviewer-notes.md`)
- Legal markdown + synced in-app text + hosted HTML templates
- Launch docs: `AGENTS.md`, `README.md`, store submission / checklist / App Store review docs

### Technical identifiers — **frozen**

| Identifier | Value | Why |
| --- | --- | --- |
| iOS/Android application id | `ai.tradeacademy.app` | Changing creates a **new** store app |
| URL scheme | `tradeacademy` | Existing deep links / Maestro |
| Expo slug | `tradeacademy` | EAS project slug |
| npm package name | `tradeacademy-ai` | Private package name |
| AsyncStorage / Zustand keys | `tradeacademy-*` | Rename wipes local progress without migration |
| AI modelVersion strings | `tradeacademy-engine-*` | Internal telemetry |
| Replay TV persist name | `tradeacademy-replay-tv-v2` | Local persistence |
| AASA / assetlinks package | `ai.tradeacademy.app` | Tied to frozen bundle |
| Maestro `appId` | `ai.tradeacademy.app` | Must match bundle |

### Domain / legal URLs

- Legal site origin is configurable via `EXPO_PUBLIC_LEGAL_SITE_ORIGIN` (see `.env.example`).
- Official origin is **`https://tradeacademy.cloud`** (`DEFAULT_LEGAL_SITE_ORIGIN`). Overridable via `EXPO_PUBLIC_LEGAL_SITE_ORIGIN`.
- **Do not claim** Aithera pages are live until hosting is verified. Legal hosting remains a launch blocker (see [`STORE_LAUNCH_CHECKLIST.md`](./STORE_LAUNCH_CHECKLIST.md)).

### RevenueCat

- Entitlement already **`Aithera Pro`** — no rename in Phase 0.
- Phase 0 listed `monthly` / `yearly` / `lifetime`. **Phase 2 launch offering is monthly + yearly only** (see [MONETIZATION.md](./MONETIZATION.md)).
- Play subscription management URLs correctly use `package=ai.tradeacademy.app` while the bundle is frozen.

### Firebase

- No Firestore collection rename.
- App Check / project IDs remain env-driven.
- Console display-name rename is a **manual** task (below).

## Later identifier alignment (14 September 2026)

Bundle, scheme, Expo slug, persist keys, AASA/assetlinks, Maestro `appId`, and the official site origin **`https://tradeacademy.cloud`**. Existing local data is copied by `migrateLegacyPersistKeys` before Expo Router loads.

## Still operator-owned

- Hosting a live legal site + flipping ASC/Play URL fields
- Firebase console project display name
- App Store Connect / Play listing screenshots
- App icon / splash visual polish
- RevenueCat products matching `tradeacademy_premium_*` IDs

## Manual console tasks (remaining)

1. **App Store Connect / Play Console** — listing name **TradeAcademy**, company **Aithera**, screenshots; Privacy Policy / Terms URLs once hosted content matches templates.
2. **Legal hosting** — deploy `store/hosted/` to the official domain (or current origin with correct HTML). Then set `EXPO_PUBLIC_LEGAL_SITE_ORIGIN` and, when ready, update associated domains / AASA / assetlinks for that host.
3. **Firebase Console** — optional project display-name update to Aithera / TradeAcademy.
4. **RevenueCat** — confirm apps still linked to `ai.tradeacademy.app`; entitlement remains `Aithera Pro`.
5. **Apple / Google** — age rating, export compliance, reviewer account — unchanged by brand text alone; re-paste `store/reviewer-notes.md` on next submission.

## Validation (Phase 0)

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS (2026-08-10) |
| Focused Jest: `shared/legal` + `shared/services/user-data` | PASS — 5 suites, 13 tests |
| Frozen bundle / scheme in `app.config.ts` | Unchanged (`ai.tradeacademy.app`, `tradeacademy`) |

Manual smoke (device): Welcome shows TradeAcademy; Settings about shows Aithera attribution; guest demo still works.
