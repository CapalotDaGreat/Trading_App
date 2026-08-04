# Phase 6 — Native Reliability

**Baseline:** `d4f2309`  
**Scope:** Dev Client / EAS foundation, background alert evaluation, IAP + push reliability paths, capability-aware copy.

## Bundling assumption (verified)

| Surface | Expo Go | Evidence |
|---------|---------|----------|
| Native IAP | Disabled | `ExecutionEnvironment.StoreClient` → Purchases module `null` |
| Background alerts | Unavailable | Foreground `isAppActive()` guard; StoreClient capability = false |
| Production push | Proxy-only | Standalone needs EAS `projectId` + APNs/FCM credentials |

**Conclusion:** One Dev Client migration is the correct bundling — not three separate phases.

## What shipped (code / docs)

1. **EAS profiles audited** — `development` / `internal` already `developmentClient: true`; `preview` / `beta` / `production` documented.
2. **`expo-background-task` ~1.0.10 + `expo-task-manager` ~14.0.9** (SDK 54 bundled versions).
3. **Background task** — `alert-background.task.ts` defines + registers OS-scheduled evaluation; foreground ~45s loop unchanged.
4. **`evaluateAlertsForUser(uid, { allowInactive })`** — background path only.
5. **Capability probe + Alerts UX** — capability-aware banner + create-time hint.
6. **Push** — resolve EAS `projectId` from env / `extra.eas` / `Constants.easConfig`.
7. **IAP** — longer webhook poll + optimistic Premium from RevenueCat `customerInfo` when Firestore lags.
8. **`app.config.ts`** — `UIBackgroundModes` processing + remote-notification; Android boot/wake permissions; `expo-background-task` plugin.
9. **`docs/DEV_BUILD.md`** — install flow, Go vs Dev Client QA matrix, honest background latency, server-side follow-up.

## Explicit non-goals (unchanged)

- Alert rule logic, new alert types, invalidation-linked alerts  
- RevenueCat webhook / entitlement schema  
- Academy ↔ Personal Intelligence  
- AI canary rollouts  
- Widgets (Phase 6.5)  
- Store marketing claims of “background alerts” before field verification  

## Device verification checklist (human / QA)

- [ ] Dev Client install on physical iOS + Android  
- [ ] Multi-hour background alert fire (not only `triggerTaskWorkerForTestingAsync`)  
- [ ] Foreground poll regression  
- [ ] Sandbox IAP purchase + restore + restart  
- [ ] Production-path push token receive  
- [ ] Store copy updated **only after** the above  

## Follow-ups

1. Server-side alert evaluator (Cloud Function + push) if client miss-rate is high  
2. Invalidation-linked alerts (after delivery is proven)  
3. Home-screen widgets once Dev Client pipeline is habitual  
