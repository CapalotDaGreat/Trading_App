# Identity migration — Phase 0 (Aithera / TradeInsight)

**Date:** 2026-08-10  
**Scope:** Safe repository-side rebrand only. No bundle ID, deep-link scheme, AsyncStorage key, Firestore schema, or live-domain invention.

## Brand (locked)

| Field | Value |
| --- | --- |
| Company / operator | **Aithera** |
| Product / app | **TradeInsight** |
| Attribution | **TradeInsight by Aithera** |
| Positioning | Research smarter. Decide with clarity. Improve your process. |

Source of truth for in-app constants: [`shared/constants/brand.ts`](../shared/constants/brand.ts).

## Audit summary

### User-facing branding (updated in Phase 0)

- Expo display `name` → TradeInsight (`app.config.ts`)
- Welcome, Settings, Privacy, Educational Mode, AI disclaimer, auth/MFA copy
- Store metadata (`store/metadata/app-store.json`, `play-store.json`)
- Reviewer notes (`store/reviewer-notes.md`)
- Legal markdown + synced in-app text + hosted HTML templates
- Launch docs: `AGENTS.md`, `README.md`, store submission / checklist / App Store review docs

### Technical identifiers — **frozen**

| Identifier | Value | Why |
| --- | --- | --- |
| iOS/Android application id | `ai.tradevision.app` | Changing creates a **new** store app |
| URL scheme | `tradevision` | Existing deep links / Maestro |
| Expo slug | `traders` | EAS project continuity |
| npm package name | `tradevision-ai` | Optional rename later |
| AsyncStorage / Zustand keys | `tradevision-*` | Rename wipes local progress without migration |
| AI modelVersion strings | `tradevision-engine-*` | Internal telemetry |
| Replay TV persist name | `tradevision-replay-tv-v2` | Local persistence |
| AASA / assetlinks package | `ai.tradevision.app` | Tied to frozen bundle |
| Maestro `appId` | `ai.tradevision.app` | Must match bundle |

### Domain / legal URLs

- Legal site origin is configurable via `EXPO_PUBLIC_LEGAL_SITE_ORIGIN` (see `.env.example`).
- Default fallback remains `https://tradevision.ai` via [`shared/constants/legal.ts`](../shared/constants/legal.ts).
- **Do not claim** Aithera pages are live until hosting is verified. Legal hosting remains a launch blocker (see [`STORE_LAUNCH_CHECKLIST.md`](./STORE_LAUNCH_CHECKLIST.md)).

### RevenueCat

- Entitlement already **`Aithera Pro`** — no rename in Phase 0.
- Products: `monthly` / `yearly` / `lifetime`.
- Play subscription management URLs correctly use `package=ai.tradevision.app` while the bundle is frozen.

### Firebase

- No Firestore collection rename.
- App Check / project IDs remain env-driven.
- Console display-name rename is a **manual** task (below).

## Explicitly out of Phase 0

- Changing bundle ID / Play package / AASA package name
- Renaming AsyncStorage keys (needs a migration helper)
- Changing URL scheme
- Hosting a new legal site + flipping ASC/Play URL fields
- Firebase console project display name
- Apple / Google listing rename beyond in-repo metadata JSON
- App icon / splash redesign (visual assets may still show prior branding)

## Manual console tasks (remaining)

1. **App Store Connect / Play Console** — listing name **TradeInsight**, company **Aithera**, screenshots; Privacy Policy / Terms URLs once hosted content matches templates.
2. **Legal hosting** — deploy `store/hosted/` to the official domain (or current origin with correct HTML). Then set `EXPO_PUBLIC_LEGAL_SITE_ORIGIN` and, when ready, update associated domains / AASA / assetlinks for that host.
3. **Firebase Console** — optional project display-name update to Aithera / TradeInsight.
4. **RevenueCat** — confirm apps still linked to `ai.tradevision.app`; entitlement remains `Aithera Pro`.
5. **Apple / Google** — age rating, export compliance, reviewer account — unchanged by brand text alone; re-paste `store/reviewer-notes.md` on next submission.

## Validation (Phase 0)

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS (2026-08-10) |
| Focused Jest: `shared/legal` + `shared/services/user-data` | PASS — 5 suites, 13 tests |
| Frozen bundle / scheme in `app.config.ts` | Unchanged (`ai.tradevision.app`, `tradevision`) |

Manual smoke (device): Welcome shows TradeInsight; Settings about shows Aithera attribution; guest demo still works.
