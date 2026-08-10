# Trading DNA 2.0 Report

Living personal decision intelligence — process identity, never P&L.

## Product question

**Who am I becoming as a decision-maker?**

Not: how profitable am I?

## Trait definitions (13 process traits)

| ID | Label | Primary evidence |
| --- | --- | --- |
| `evidenceDiscipline` | Evidence Discipline | researched, checklist_done, journals |
| `riskAwareness` | Risk Awareness | invalidation marks, journal risk, memory risk prior |
| `patience` | Patience | skips, replay, ignored chase patterns |
| `thesisClarity` | Thesis Clarity | DQS samples, journals, briefs |
| `invalidationDiscipline` | Invalidation Discipline | invalidated events, replay, checklists |
| `processConsistency` | Process Consistency | heatmap consistency, journal cadence |
| `emotionalAwareness` | Emotional Awareness | psychology notes, replay, known struggles |
| `fomoResistance` | FOMO Resistance | skips vs ignored urgency |
| `overtradingResistance` | Overtrading Resistance | research vs journal/skip ratio |
| `adaptability` | Adaptability | invalidation revisions, lab, replay |
| `researchEfficiency` | Research Efficiency | RVS samples, research volume quality |
| `reflectionQuality` | Reflection Quality | journals, Process Tape / replay |
| `learningMomentum` | Learning Momentum | replay, lab, academy/heatmap learning |

Style leanings live on `TradingDnaProfile.styleFingerprint` (labels only). Legacy passport `TraderMemory.dna` / `buildTradingDna()` remains separate narrative DNA.

## Data sources

Derived only from existing systems — **no second behavioural database**:

- Decision Log (`researched`, `skipped`, `journaled`, `invalidated`, `replay_completed`, `lab_*`, `checklist_done`, …)
- Journal coach aggregates (never raw journal bodies in Mentor/AI DNA payloads)
- Heatmap scores
- Trader memory / Mentor Setup struggles as **priors** (confidence/focus, not fake scores)
- Academy / Replay / Lab via Decision Log + learning events

## Derivation logic

- Pure composers under `features/personal-intelligence/services/`
- Entry: `buildPersonalIntelligence` → traits, evolution, patterns, what’s changing, weekly/monthly reviews, coaching actions, mentor summary, Today, goals
- Trait scores use week window when evidence is rich; otherwise month window
- Previous score comes from the prior window inside the last ~30 days
- Trend: delta ≥ 6 up, ≤ -6 down, else flat

## Confidence model

- Each trait has `minEvidence` units from counted evidence items
- Below threshold → `status: 'insufficient'`, `score: null`, detail **“Not enough evidence yet.”**
- Confidence levels: low / medium / high from evidence unit thresholds
- Mentor Setup struggle match slightly lowers confidence (focus prior), never invents a score

## Evolution honesty

`buildDnaEvolution` **does not seed fabricated earlier identities**. Thin history returns a single point with `hasEvidence: false`.

## Coaching rules

- Neutral language; no clinical diagnosis; no buy/sell framing
- “What’s changing?” compares the user to themselves only
- Weekly: improved / declined / repeated / practise / stop / learn
- Monthly: 30 / 60 / 90 day self-baselines
- Weaknesses map to Replay / Academy / Journal / Mentor / checklist actions
- Mentor observation rotates by `uid + ISO week` so lines do not repeat constantly
- Today adaptations: weak patience → fewer research priorities; weak research efficiency → time-budget emphasis; improving risk awareness → fewer repetitive risk reminders

## Goals

- User may select **1–2** process goals (Premium persistence via UID-scoped AsyncStorage `dna-goals.store`)
- Free: system-suggested adaptive goals only
- Selected goals get high priority and suppress duplicate nags

## Privacy model

- Trading DNA is highly personal
- Privacy control: **Trading DNA stays on-device** (`tradingDnaLocalOnly`, default true)
- Product analytics description excludes raw DNA evidence / journals
- No public DNA, no cross-user comparison, no advertising use, no sale of behavioural profiles
- Privacy export may include aggregated settings; Mentor/AI DNA payloads carry labels and counts only — never raw journal text

## Monetisation

| Free | Premium |
| --- | --- |
| Basic DNA snapshot (subset of traits) | Full 13-trait DNA |
| Limited history | Evolution timeline |
| Basic weekly coaching | Patterns, monthly/90d, goals, deep Mentor hooks |

Entitlement keys reused: `tradingDna`, `personalIntelligence`.

## Testing

Focused suite: `features/personal-intelligence/services/__tests__/personal-intelligence.test.ts`

Covers trait derivation, insufficient data, evolution honesty, Today adaptations, selected goals, patterns/change/mentor summary privacy, full snapshot compose.

Run:

```bash
npm run typecheck
npx jest --runInBand features/personal-intelligence/services/__tests__/personal-intelligence.test.ts
```

## Future improvements

- Emulator tests for UID-scoped goal persistence across sign-in
- Richer journal structured fields (thesis / invalidation) when authored reflections expose them
- Device VoiceOver pass on DNA trait disclosure rows
- Optional quarterly narrative review once 90d evidence is dense
