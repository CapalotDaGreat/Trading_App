# TradeVision Ops Admin

Internal Vite dashboard for feature flags, remote config, AI/ops aggregates, and health.

## Setup

1. Create an allowlist doc: `opsAdmins/{uid}` (empty map is fine) for each operator.
2. Copy `.env.example` → `.env` with Firebase web config.
3. `npm install && npm run dev` (port 5174).

## Privacy

This UI shows **aggregates only**. It never loads journals, AI conversations, emails, or portfolio values.
