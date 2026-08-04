# Phase B — AI Trust Center

**Goal:** Become the most trusted AI trading *research* assistant — optimize for credibility, never excitement.

**Baseline:** Extends Phase 2 trust engine (`docs/PHASE2_AI_TRUST_REPORT.md`) and Phase A calm chrome.

## Non-negotiables

- Never sound like ChatGPT hype or a signal bot  
- Every answer should increase trust  
- Scores = evidence / process quality — not price direction  
- Educational Mode + model limitations always available  

## What every AI answer includes

| Required | Surface |
|----------|---------|
| What supports this | `TrustBriefStrip` (always on) |
| What contradicts this | `TrustBriefStrip` |
| Unknowns | `TrustBriefStrip` / Inspector |
| Risk factors | Evidence Inspector |
| Confidence pillars | Inspector → `ConfidenceBreakdownPanel` |
| Evidence quality % | Bubble meta + briefing |
| Timestamp | Bubble / freshness badges |
| Source | `DataSourceBadge` + provider label |
| Freshness | Badge + prose explanation |
| What would invalidate this? | Inspector |
| What evidence is missing? | Inspector |
| How reliable is this? | Briefing lead line |
| Model limitations | Inspector |
| Assumptions / alternative view | Inspector |
| Why confidence changed / history | `WhyThisChangedPanel` + `ConfidenceHistoryPanel` |
| AI memory timeline | Ask header (process traits) |

## Architecture

```
buildAiTrustPayload
  ├─ confidence (pillars)
  ├─ evidence pack
  ├─ counterfactuals
  ├─ briefing  ← NEW (ai-trust-briefing.service)
  ├─ whyChanged / confidenceHistory (async attach)
  └─ meta (citations, freshness, educational reminder)
```

UI:

- `AiTrustCenter` → `TrustBriefStrip` + `EvidenceInspector`  
- Wired on chat bubbles (default-visible) and analysis cards  
- Ask screen Trust Center intro + memory timeline  

## Tone

Research desk, not assistant persona:

- “TradeVision research desk…” welcome  
- Prompts: supports vs contradicts, missing evidence, invalidate, reliability  
- Icon: `library-outline` on assistant bubbles  

## Verification

- `npm run typecheck`  
- Jest: `features/ai/services/__tests__/ai-trust.test.ts`  

## Follow-ons

- Expand educational explanation mode toggle in AI settings (persist preference)  
- Server-side AI ops still metadata-only — never log prompts/journal text  
