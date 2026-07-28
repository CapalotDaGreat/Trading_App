# TradeVision AI

Decision-first educational trading research platform (Expo SDK 54 · React Native · Firebase · RevenueCat).

## Current repository status

**This repository does not yet contain the application source code.**

`main` currently has documentation and audit artifacts only. A full production audit was attempted on 2026-07-28 and **blocked** because no Expo / TypeScript / Firebase application tree is present.

See:

- [`docs/PRODUCTION_AUDIT_REPORT.md`](docs/PRODUCTION_AUDIT_REPORT.md) — scores, findings, roadmap  
- [`docs/ARCHITECTURE_BLUEPRINT.md`](docs/ARCHITECTURE_BLUEPRINT.md) — target architecture & security baseline  

## What to do next

1. Push the real TradeVision AI Expo project into this repository (or reconnect tooling to the correct remote/branch).  
2. Ensure `.gitignore` excludes secrets (`.env*`, service accounts, etc.).  
3. Re-run the production audit / hardening pass against the imported source.  

## Product philosophy

Learn → Research → Decide → Practice → Review → Improve  

Educational research and decision quality — not brokerage execution or guaranteed trading signals.

## Compatibility targets

- Expo SDK 54 (no eject)  
- Expo Router  
- React Native + TypeScript (strict)  
- NativeWind  
- Firebase (Auth, Firestore, Storage)  
- React Query + Zustand  
- RevenueCat  
