# Store screenshot inventory

## Status (2026-09-16 — real iPhone heroes)

**App Store drafts** under `app-store/` are composed from **real iPhone
screenshots** in `source/iphone-device/`, with marketing hero captions and a
device frame.

Regenerate with:

```bash
python scripts/export-store-screenshots.py
```

### Scenes (01 → 07)

1. **Welcome** — Learn trading. / Practice the decision.
2. **Home** — Your training center
3. **Simulate** — $100,000 paper capital
4. **Practice (trend)** — Train judgment
5. **Practice (breakout)** — Process over urgency
6. **Events** — Learn the event
7. **Decision Replay TV** — Reason with the information you had then.

### Sizes

| Folder | Pixels |
| --- | --- |
| `app-store/iphone-6.7/` | 1290 × 2796 |
| `app-store/iphone-6.5/` | 1284 × 2778 (ASC 6.5" Display) |
| `app-store/ipad-pro-12.9/` | 2048 × 2732 (ASC 13" / 12.9") |

### ASC upload

- **iPhone → 6.5" Display:** `iphone-6.5/*.png` in order 01→07  
- **iPad → 13" Display:** `ipad-pro-12.9/*.png` in order 01→07  

Sources keep the real status bar / Dynamic Island. Captions sit above a framed
phone; UI is contain-scaled and top-aligned (headers never cover-cropped).
