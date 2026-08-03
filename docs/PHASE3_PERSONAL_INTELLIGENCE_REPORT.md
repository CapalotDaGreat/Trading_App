# Phase 3 — Personal Intelligence Platform

TradeVision AI now answers: **Who am I becoming as a trader?**

## What shipped

### 1. Dynamic Today
- Homepage adapts by archetype: new trader → lesson, experienced → replay, poor discipline → journal-first, high consistency → advanced setup.
- `visibleTodaySections` + personalized `sectionOrder` drive layout (no hard-coded static stack).
- Surfaces: Dynamic Today hero, adaptive goals, day plan, DNA pulse.

### 2. Trading DNA (continuous)
- Thirteen process traits derived from Decision Log, Heatmap scores, Journal Coach, and Trader Memory.
- Pure derivation — no duplicate event store.

### 3. DNA Evolution
- Month timeline from Decision Log buckets + current becoming label.
- Thin seed arc when history is short so identity still feels alive.

### 4. Decision Graph
- Weekly / monthly / yearly process intensity across consistency, research, patience, learning, risk, journal, replay, academy, mentor.
- Reuses Heatmap aggregation + log actions (GitHub cadence × Apple Health clarity).

### 5. AI Memory Timeline
- Learning journey milestones (patience, impulse control, replay, research quality, identity shifts).
- Composes existing AI learning memory + DNA + log.

### 6. Adaptive goals
- Derived targets (replay, patience, Academy, overtrading, journal, DNA growth) from archetype + debt + activity.

### 7. Coaching references
- Mentor links Passport, Replay, Academy, Journal, Decision Graph, DNA, Heatmap, Decision Log.

### 8. Quality
- Feature module: `features/personal-intelligence/`
- Route: `/decision/intelligence`
- Expo SDK 54 compatible; Reanimated entrances; GlassCard premium UI.
- Existing storage spines unchanged (Decision Log, Trader Memory, Academy progress, Heatmap derivation).

## Primary entry points
- Today tab — adaptive composition
- More → Personal Intelligence
- Trading Mentor → Mentor references + DNA deep link
