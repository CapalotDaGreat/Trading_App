# TradeAcademy — Post-audit implementation plan

**Date:** 10 September 2026  
**Starting point:** [TRADEACADEMY_FINAL_RELEASE_AUDIT_2026-09.md](./TRADEACADEMY_FINAL_RELEASE_AUDIT_2026-09.md) — **NOT RELEASE READY**  
**Score-improvement pass (10 September 2026):** [TRADEACADEMY_SCORE_IMPROVEMENT_IMPLEMENTATION_2026-09.md](./TRADEACADEMY_SCORE_IMPROVEMENT_IMPLEMENTATION_2026-09.md) — planner authority, session-length ranking, ChartExercise retry, simulation process gate, UID-keyed stores. Operator/store items remain open.  
**Rule:** execute **phase by phase**. After each major phase, run relevant tests and inspect the diff. Do not polish stores or screenshots while the loop is still fragmented.

Frozen IDs stay frozen (`ai.tradevision.app`, `tradevision`, `tradevision-*`, slug `traders`). Expo SDK 54. Two charts only. USD 100k synthetic sim. Cloud AI off. Do not invent legal entity, VAT, emails, or store credentials.

---

## Reuse (do not duplicate)

| Concern | Canonical code | Do not add |
| --- | --- | --- |
| Next action | `composeTrainingPlan` | A second Home/Review ranker |
| Evidence / mastery | `features/competency/` | A third mastery store |
| Learner model | `composeLearnerModel` | Personality / DNA as a scorer |
| Candidates | `training-candidate-pool.service.ts` | Parallel “today” engines as authorities |
| Loop chrome | `PRODUCT_LOOP_STEPS` + `LoopCtaRow` | Extra primary tabs |
| Simulation | existing engine | Outcome rigging |
| Replay | information-boundary + sample tapes | Unlicensed historical library |

Competing recommenders (`buildPersonalizedCurriculum`, mentor, Replay TV rank, personal-intelligence, radar) remain **candidate sources**. They must not independently set the final CTA (Phase 2).

---

## Sequence

| Order | Phase | This pass |
| ---: | --- | --- |
| 1 | **Core loop** | **Now** — Journal→Review, Review→planner, brand loop, sequential CTAs |
| 2 | Training Planner authority | Academy / mentor / Replay consume planner primary |
| 3 | Learner model | Guest isolation; four dimensions already sketched |
| 4 | Evidence / mastery | Bind remaining activities; no completion=mastery |
| 5 | Personalization | Sim/replay/events/psychology/fundamentals application |
| 6 | UX + a11y | Terminal leftovers, chart text alternatives |
| 7 | Production infra | App Check native, Functions, RevenueCat — **UNVERIFIED until consoles exist** |
| 8 | Legal / stores | Host 200 + real operator fields **only if supplied**; screenshots |
| 9 | Device journeys | Physical iOS/Android — do not mark PASS from code |
| 10 | Final audit | Update scores honestly |

Legal host HTTP 500, empty screenshots, `REPLACE_WITH_ASC_APP_ID`, and unattested App Check stay **P0** until operator/console work exists. This plan does **not** fabricate them.

---

## Phase 1 (done)

Gaps from the audit:

1. `BRAND.loop` now includes Replay and Journal.
2. Journal has a Review CTA after save plus sequential Review in `LoopCtaRow`.
3. Review `LoopCtaRow` uses the Training Planner primary (`resolveLoopCtas`).
4. Practice no longer injects a duplicate Replay follow-up; remediation can lead.

## Phase 2 (done in product code)

Academy hub, Practice, Review, Mentor, and Replay TV consume `composeTrainingPlan` via `PlannerNextCard` / `plannerFocus` when the primary activity matches. Competing rankers still generate candidates (Replay TV library, event cards) but Home / Review / Replay next-action chrome prefers the planner.

## Phase 3 (done in product code)

Persist `tradevision-last-auth-uid` so guest academy/practice cannot attach to the first login after a process kill. Four-dimension learner model remains `composeLearnerModel`.

## Phase 4–17 (this pass)

- Event education and training-plan hrefs include `concept=` / `loop=` handoff.
- Practice honors `?topic=` (event fundamentals handoff).
- Psychology drills: loss aversion + premature entry; FOMO remediation uses `fomo-chase`.
- Development history card (Earlier / Recently / Next) from independent evidence — no trophy score.
- Educational and candlestick charts expose a visible spoken caption, not only `accessibilityLabel`.
- Review section title is process patterns, not “Trading DNA” as a dashboard.

## Phases 22–28 (operator / console — still blocked)

Native App Check, Functions deploy, RevenueCat products, legal host HTTP 200, screenshots, `ascAppId`, and physical-device QA **cannot** be marked PASS from this repository. See [TRADEACADEMY_APP_CHECK.md](./TRADEACADEMY_APP_CHECK.md). Do not invent operator identity or store credentials.

Legal host HTTP 500, empty screenshots, `REPLACE_WITH_ASC_APP_ID`, and unattested App Check stay **P0** until operator/console work exists. This plan does **not** fabricate them.
