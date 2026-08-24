# Phase 9 — Trusted AI / Mentor 2.0

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

The AI is a **high-trust research mentor**. Fluency is secondary. It must never appear more certain than the evidence allows.

This phase **extends** `features/ai/` (local engine, trust briefing, quota/security). Cloud AI remains **disabled**. Existing Decision OS / DNA / Decision Log context is reused — no parallel mentor brain.

---

## Scores (0–100)

Not 10/10. Device QA is still required.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Trust over fluency | **90** | Structured answers; self-check downgrades; sanitizer |
| Mandatory structure | **88** | Known / unknown / evidence / why / changed / what would change / action |
| Uncertainty honesty | **89** | High / Moderate / Limited / Insufficient — not a fake probability |
| Source transparency | **86** | Source, timestamp, freshness, data kind (live/delayed/approx/sample/mock) |
| No fabrication | **88** | Missing quote/news/history is stated; no invented prices or citations |
| Counterfactuals | **87** | Every major answer includes “what would change this” |
| Self-check | **86** | Freshness, sources, conflict, advice/prediction language, injection, leakage |
| Mentor memory | **85** | DNA/process labels only; explicit disclosure; never “I remember everything” |
| Modes + depth | **84** | Quick / Deep / Coach / Review / Explain / Replay coach · Concise / Balanced / Detailed |
| Safety | **90** | No trades, brokers, buy/sell calls, guarantees, or implied certainty |
| Adversarial tests | **88** | Dedicated mentor-trust suite covering the required attacks |

**Overall (repo):** **87 / 100**

---

## Mission

**TRUST > FLUENCY**

If inputs are missing, stale, contradictory, or the user asks for a call, the mentor **downgrades** and says what it does not know.

---

## Mandatory response structure

Every chat answer is composed (then sanitized) as:

1. What I know  
2. What I don’t know  
3. Evidence  
4. Why it matters  
5. What changed  
6. What would change the assessment  
7. Suggested research action  

Concise mode shortens sections. It does not skip the honesty contract.

---

## Uncertainty (not a probability)

User-facing labels:

- High evidence  
- Moderate evidence  
- Limited evidence  
- Insufficient evidence  

Internal coverage scores still exist for checklists. They are **not** shown as “72% confident the market will move.”

---

## Source transparency

Where a pack exists, answers cite:

- Source (local rules-based analysis, attached quote, attached headlines)  
- Timestamp  
- Freshness (`live` / `recent` / `stale` / `unknown`)  
- Data type (`live` / `delayed` / `approximate` / `sample` / `mock`)

Evidence Inspector already surfaces `DataSourceBadge` + `DataFreshnessBadge`.

---

## No fabrication

Unavailable quote, news, fundamentals, events, citations, or user history → **say so**.

The mentor will not invent a last price for a symbol with no quote.

---

## Self-check (before display)

Flags that **downgrade** the evidence level:

- Stale / unknown freshness  
- Prediction language  
- Investment-advice language  
- Fake sources  
- Unsupported numeric claims without a quote  
- Malformed structure  
- Prompt injection  
- Private-data leakage patterns  

Conflicting evidence is flagged without forcing a buy/sell resolution.

---

## Mentor memory

Uses existing Trading DNA / Decision Intelligence **labels** when attached.

Example: “You have recently been more consistent at defining invalidation.”

Always discloses what is used and what is not (no journal bodies, no P&L, no “I remember everything”).

Default `tradingDnaLocalOnly` still omits DNA from cloud-bound payloads (cloud remains off).

---

## Answer modes and user control

**Modes:** Quick · Deep research · Coach · Review · Explain · Replay coach  

**Depth (persisted):** Concise · Balanced · Detailed  

Not every response is long. Quota/security is unchanged (server fail-closed AI quota + local daily cap).

---

## Safety

Never:

- Execute trades  
- Recommend a broker  
- Present buy/sell calls  
- Guarantee outcomes  
- Imply certainty  

Buy/sell user questions are answered as research-priority process, then sanitized.

---

## Testing (repo)

| Check | Result |
|-------|--------|
| `npm run typecheck` | **Pass** (`tsc --noEmit`, 2026-08-24) |
| Full Jest (`--runInBand`) | **Pass:** 67 suites, 265 tests (`--forceExit` for known open handles) |

Adversarial coverage in `features/ai/services/__tests__/ai-mentor-trust.test.ts`:

- Missing data  
- Stale data  
- Contradictory data  
- Fake sources  
- Malformed output  
- Prediction language  
- Investment-advice language  
- Prompt injection  
- Private-data leakage  

---

## REPO COMPLETE

- Structured mentor composer on the existing local engine  
- Qualitative evidence levels  
- Self-check + sanitizer  
- Modes + concise/balanced/detailed  
- DNA/process disclosure without a second memory store  

## MANUAL QA REQUIRED

- Ask “should I buy?” on a symbol with a quote — confirm research language only  
- Ask with no symbol/quote — confirm “I don’t know” / no invented price  
- Toggle Concise vs Detailed on the same question  
- Replay coach mode on a Replay TV session  
- VoiceOver on mode chips (44pt) and evidence-level badge  
- Confirm daily AI quota still blocks after the cap  

Store GO/NO-GO is unchanged (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`). Cloud AI remains disabled.
