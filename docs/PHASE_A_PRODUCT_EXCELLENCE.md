# Phase A — Product Excellence Redesign

**Goal:** Make TradeVision feel calmer after open than before — without removing functionality or changing architecture.

**Companion:** [PRODUCT_REDESIGN_SPEC.md](./PRODUCT_REDESIGN_SPEC.md) (IA / narrative). This doc is the **visual & interaction system** for that calm Decision OS.

## Principles

1. Every screen answers **one primary question**.
2. Progressive disclosure for everything else.
3. Large whitespace; quiet elevation; soft dark surfaces.
4. Cards must earn their place (fill hierarchy > shadows).
5. One clear primary action per focus block.
6. No dashboard clutter, no metric walls above the fold.

## Hierarchy (attention order)

1. What deserves my attention?  
2. Why?  
3. What should I research?  
4. What changed?  
5. Everything else (collapsed).

## Design tokens

Source: `shared/constants/theme.ts`

| Token area | Change |
|------------|--------|
| Backgrounds | Softer near-black stack; less navy noise |
| Surfaces / borders | Lower opacity chrome |
| Shadows | Near-zero by default; soft only when `glow` |
| Spacing | Added `focus` (28), `section` (36), `screenX/Y` |
| Touch | Prefer `min-h-13` (52) / `min-h-11` (44) |
| Motion | Slightly slower fades; quieter layout springs |
| Type | Semibold headings (less shouty bold), relaxed body |

Gutters: `useResponsiveLayout` → 24 / 28.

## Layout primitives

| Primitive | Path | Use |
|-----------|------|-----|
| `ScreenQuestion` | `shared/components/layout/ScreenQuestion.tsx` | Lead every hub/session with one question |
| `FocusStack` | `shared/components/layout/FocusStack.tsx` | Calm vertical rhythm (`focus` / `section` / `compact`) |
| `HubPathList` | `shared/components/patterns/HubPathList.tsx` | Start / Continue / Deepen hubs |
| `CollapsibleSection` | `shared/components/patterns/CollapsibleSection.tsx` | Progressive disclosure |

## Screen applications (Phase A)

| Surface | Primary question | Calm treatment |
|---------|------------------|----------------|
| Today | What deserves your attention? | Focus stack + “More for this session” disclosure |
| Research | What deserves your attention? | Start → Deepen paths |
| Review | What should improve next? | Start → Continue → Deepen |
| You | Who are you becoming? | Growth → Desk → Account |
| Ask | What should I understand? | Evidence-first subtitle |
| Alerts | (capability honesty) | More air; quieter banner |

## Shared UI updates

- `Screen` — `bg-background`, slightly wider padding  
- `GlassCard` / `Card` — elevated fill, minimal shadow  
- `Text` — lighter weight hierarchy  
- `EmptyState` / `Skeleton` / `Header` — more space, calmer pulse  

## Non-goals (enforced)

- No feature removal  
- No architecture / data-layer rewrite  
- No visual rebrand (palette family preserved: dark teal)  
- No store claim changes  

## Follow-ons

- Apply `ScreenQuestion` + disclosure patterns to Asset, Radar, Portfolio detail screens  
- Chart axis/grid token pass for readability  
- R2 Skill OS (Academy ↔ DNA) remains product-spec work, not Phase A chrome  

## Verification

- `npm run typecheck`  
- Spot-check Today / hubs / Ask on Dev Client  
- Reduce Motion: skeletons static; enters collapse via motion helpers  
