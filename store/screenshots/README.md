# Store screenshot inventory

App Store screenshots and header art are composed from **real app captures** by:

```bash
python scripts/export-store-screenshots.py
```

## Sources

| Folder | Contents |
| --- | --- |
| `source/iphone-device/` | iPhone captures (required) |
| `source/ipad-device/` | iPad captures (optional — iPad sets are only generated from real iPad captures) |

Captures at native resolution (height ≥ 2000 px) are used as-is. The current
iPhone captures are low-res Expo Go shots, so the status bar and the guest/demo
banner are cropped off and the device frame supplies a plain Dynamic Island.
For sharper results, replace them with native screenshots from the TestFlight /
production build using the same file names.

## Scenes (01 → 06)

1. **Home** — Know what to train next
2. **Practice (trend)** — Learn to read the chart
3. **Decision Replay TV** — What would you have done?
4. **Simulate** — $100,000 to practise with
5. **Practice (breakout)** — Patience is a skill
6. **Events** — Understand market events

## Output

| Folder | Pixels | ASC slot |
| --- | --- | --- |
| `app-store/iphone-6.9/` | 1320 × 2868 | iPhone 6.9" Display |
| `app-store/iphone-6.5/` | 1284 × 2778 | iPhone 6.5" Display |
| `app-store/ipad-13/` | 2064 × 2752 | iPad 13" Display (needs `source/ipad-device/`) |
| `app-store/header/header-3840x1646.png` | 3840 × 1646 | Header and Search Results → Product page header |
| `app-store/header/universal-5244x2950.png` | 5244 × 2950 | Header and Search Results → both placements |

Header art shows on iOS/iPadOS 27+. Key content sits in the centre; check the
crop with the Preview tool in App Store Connect before submitting.

Because `supportsTablet` is true, App Store Connect requires iPad 13"
screenshots. Do not upload iPhone UI framed as an iPad (App Review 2.3.3).
