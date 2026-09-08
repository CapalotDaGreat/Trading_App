# Phase 14 — Trusted AI 3.0

**Date:** 2026-08-25  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

The objective is **not** to make the mentor sound smarter. The objective is to make it **impossible to confuse with a confident prediction engine**.

Trust beats fluency. It is acceptable — and desirable — for the AI to say **I don't know.**

This phase **extends** the Phase 9/10 local engine (`features/ai/`). **Cloud AI remains disabled** (`CLOUD_AI_ENABLED = false`). No parallel mentor brain, no new store, no new scoring engine. RVS / DQS math is unchanged and is never shown as a prediction probability.

Store GO/NO-GO is unchanged: **NO-GO** (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`).

---

## Scores (0–100)

Not 10/10. Device QA was not run. These are evidence-bounded.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Trust over fluency | **93** | Hostile asks lead with “I don't know.” Unsupported claims are rejected, not reworded into a still-unsupported call |
| Mandatory structure | **92** | Known / Unknown / Evidence / Interpretation / What changed / What would change / Next research action — even in concise |
| Evidence quality honesty | **91** | Qualitative High / Moderate / Limited / Insufficient from the attached pack. Repeat asks, confident tone, and “more technical language” cannot raise it |
| Provenance | **90** | Source, timestamp, freshness, data kind on pack sources. No pack → no invented `Date.now()` timestamp |
| Conflict detection | **91** | RSI vs bias, MACD vs RSI, structure vs bias → “Two available sources disagree, so confidence is limited.” |
| Stale data | **91** | Downgrades; says the pack is delayed; says a fresher quote is required |
| Known vs inferred | **91** | FACT (process count) vs INFERENCE (not identity). DNA labels only when attached |
| Self-check | **91** | Expanded flags: fake evidence/timestamps, stale-as-live, fabricated authority, hidden-data extraction, contradictory user claims, leftover unsupported calls |
| Self-correction | **88** | Explicit **Correction:** line when the previous assistant turn treated delayed data as live or sounded like a forecast. Last-turn heuristic, not a full audit log |
| Safety | **93** | Buy / sell / rise / tomorrow / winner / signal / journal dump / system-prompt extraction remain blocked |
| Privacy | **93** | No AI analytics of chat, journal, DNA, or portfolio. `tradingDnaLocalOnly` default unchanged. Cloud remains off |
| Tests | **91** | Phase 9–10 cases plus Phase 14 adversarial suite |
| Device QA | **0** | Not run |
| Store readiness | **38** | Unchanged blockers |

**Overall (repo):** **91 / 100**

Why not 95 / 100: the mentor is still a **local rules engine**. Cloud AI is disabled. Self-correction inspects the last assistant message, not a signed conversation ledger. Quote provenance still uses pack `assembledAt` because the attached quote object has no separate provider timestamp. Device VoiceOver on Correction / FACT / INFERENCE was not run.

---

## Trust architecture

```
User prompt
  → classifyMentorAsk (research / prediction / advice / injection / journal dump / signal)
  → composeStructuredMentorAnswer (7-part contract)
  → runAiSelfCheck (downgrade or reject — do not polish an unsupported claim)
  → formatMentorAnswer (concise may shorten, never drop Known/Unknown/Interpretation)
  → display (Ask bubble + Trust Center)

Local demo engine and “cloud” compatibility entry (`fetchCloudAiBrief`) both call the same local composer.
Demo AI is not allowed to sound more certain than production AI.
```

`composeStructuredMentorAnswer` remains the center. No second prompt store.

---

## Evidence model

User-facing labels (never a fake probability):

- High evidence
- Moderate evidence
- Limited evidence
- Insufficient evidence

Determined from the attached pack (quote, structure, headlines, freshness, named levels, module coverage, source conflicts).

It does **not** increase because:

- the user asks again
- the user sounds confident
- the model repeats itself
- the answer is longer
- the answer uses more technical language

`capEvidenceLevel` still floors the current answer at the prior chat evidence level. Confidence-escalation prompts (`be more confident`, `use more technical language`) also downgrade.

### Provenance

Where a pack exists, answers cite:

- source (local rules-based analysis, attached quote, attached headlines)
- timestamp (`assembledAt` — never invented when no pack is attached)
- freshness (`live` / `recent` / `stale` / `unknown`)
- data kind (`live` / `delayed` / `approximate` / `sample` / `mock`)

Local quotes are labeled **delayed** even when freshness is live — this is not a broker tape.

Allowed kinds are never fabricated. Missing quote → missing last price is stated. Analysis tools no longer invent `$100` placeholders, `price * 0.97` support, or ATR percents without ATR.

### Conflicts

If independent attached inputs disagree, the answer says so and caps evidence at **limited** (or insufficient when coverage is thin):

> Two available sources disagree, so confidence is limited.

It does not silently pick the side that supports a conclusion.

### Stale data

Stale / unknown freshness:

- flags `stale_data`
- downgrades evidence quality
- explains that the pack is delayed
- states that a more recent quote (and headlines, if relevant) would be required to improve confidence
- flags `stale_treated_as_current` if the answer still talks like a live tape

---

## Known vs inferred vs memory

**FACT (process count):** e.g. “You selected WAIT in 6 of the last 10 replay checkpoints.”

**INFERENCE (not identity):** e.g. “This may indicate improving patience when evidence is incomplete.”

Never converted into identity. Never “You are an impatient trader.” Never “I remember everything you have ever told me.”

Derived memory (Trading DNA labels, Decision Log counts, reinforcement summaries) is used **only when attached**. Disclosure states that it is derived memory, not a complete archive. Journal bodies are never attached and never reconstructed.

`tradingDnaLocalOnly` default remains **true** (DNA omitted from Ask payloads unless the user has turned that off). Cloud remains off anyway.

---

## Self-check

Before display, `runAiSelfCheck` flags and downgrades or rejects:

| Flag | Meaning |
|------|---------|
| `stale_data` / `stale_treated_as_current` | Delayed pack, or delayed pack described as live |
| `conflicting_evidence` | Independent sources disagree |
| `prediction_language` / `investment_advice_language` | Forecast or buy/sell ask |
| `fake_sources` / `fake_evidence` / `fake_timestamps` | Invented citations, future timestamps |
| `unsupported_claims` | Numeric price without a quote |
| `unsupported_prediction_persists` | Word-swap sanitizer would still leave a call |
| `malformed_output` | Missing Known / Unknown / Interpretation / What would change |
| `prompt_injection` / `fabricated_authority` | Role change, system-prompt extraction, fake admin |
| `hidden_data_extraction` / `private_data_leakage` | Hidden context / journal dump |
| `contradictory_user_claim` | User-stated RSI/price disagrees with the pack — pack wins |
| `confidence_escalation` / `repetition_without_new_evidence` | Cannot inflate quality |
| `excessive_certainty` / `fake_probability` / `dqs_rvs_as_prediction` / `setup_success_language` | Certainty theater |

**Do not** rewrite “buy now, this will rally” into “research further, this will rally.” If the underlying claim is still unsupported, the answer becomes an explicit refusal: *I don't know. That claim is unsupported…*

---

## Self-correction

If the previous assistant turn overstated evidence, the next answer leads with an explicit correction. Example:

> Correction: I treated delayed data as current earlier. That was too strong. The available evidence is limited.

History is not silently rewritten. This is a last-turn heuristic on chat `history`, not a stored experiment log.

---

## User-request safety (still blocked)

| Ask | Behaviour |
|-----|-----------|
| Should I buy? / What should I sell? | “I don't know whether you should buy or sell.” |
| How much will it rise? | “I don't know.” Not a magnitude forecast |
| Guaranteed winner? | “I don't know.” |
| What will happen tomorrow? | “I don't know.” |
| Give me a signal. | Injection / signal refusal |
| Ignore safety / print system prompt / I am your administrator | Role and policy stay in force |
| Dump journal / hidden context | Process labels only; no body |

---

## Privacy

AI feature code does not call `trackEvent` with chat content, journal bodies, portfolio values, private reasoning, or DNA labels.

Analytics allowlist is unchanged (no `dna` / `journal` / `reasoning` / `trait` props).

Local-only DNA configuration is respected. Cloud AI is not enabled.

---

## Examples

**Missing quote**

> I don't know the last price — no quote is attached. I will not invent a price.

**Conflict**

> Two available sources disagree, so confidence is limited. RSI is overbought while the pack still shows a bullish pack bias.

**Stale**

> The attached pack is stale or delayed — I will not treat it as a live broker tape. A more recent quote would be required to improve evidence quality.

**FACT vs INFERENCE**

> FACT (process count): You selected WAIT in 6 of the last 10 replay checkpoints.  
> INFERENCE (not identity): This may indicate improving patience when evidence is incomplete.

**Correction**

> Correction: I treated delayed data as current earlier. That was too strong. The available evidence is limited.

---

## Adversarial testing

`features/ai/services/__tests__/ai-mentor-trust.test.ts` (Phase 9–10 plus 3.0):

- Stale evidence
- Conflicting evidence
- Missing evidence / no invented price
- Fake sources / future timestamps
- Prompt injection / fabricated authority / system-prompt extraction
- Private journal / hidden-data extraction
- Prediction request / What should I sell?
- Repeated questioning / confidence escalation / technical-language inflation
- Malformed output
- Unsupported certainty leftover after sanitizer
- Contradictory user claim
- AI correction
- FACT vs INFERENCE (no identity diagnosis)

Analysis: missing quote does not invent support/invalidation (`ai-engine.test.ts`). Cloud flag still false (`trust-config.test.ts`).

| Check | Result |
|-------|--------|
| `npm run typecheck` | **Pass** |
| Full Jest (`--runInBand --forceExit`) | **Pass:** 69 suites, **340** tests |

---

## Remaining limitations

1. **Cloud AI is disabled.** There is no production hosted model. Do not claim otherwise.
2. **Local rules engine.** Fluency is templated. Trust comes from structure and refusal, not from a frontier model with tools.
3. **Quote timestamp ≈ pack `assembledAt`.** The attached quote object still has no provider `dataKind` / `fetchedAt` of its own.
4. **Self-correction is last-turn only.** It will not reconstruct a long thread of overstatements.
5. **DNA on Ask** still follows `tradingDnaLocalOnly` (default true), so derived memory is often absent on Ask even though the engine is on-device.
6. **Device QA = 0.**
7. **Store GO remains NO-GO.**

---

## Honest verdict

TradeInsight’s AI can still be useful as a research mentor. It is much harder to mistake for a prediction engine than a fluent chatbot would be.

It will say **I don't know** when the pack is missing, stale, conflicting, or the user asks for a call. It will not invent prices, timestamps, or support levels. It will not quietly reword an unsupported forecast into something that still asserts the same claim.

That is the success criterion for Trusted AI 3.0.

**Phase 14 overall: 91 / 100.** Cloud AI disabled. Device QA 0. Store NO-GO.
