"""Generate every TradeAcademy icon asset from one shared geometry.

Mark: a bold "A" (Academy) whose crossbar is a teal learning-curve line.

Outputs (assets/images/):
  icon.png                     1024 RGB, opaque, full-bleed square (iOS / App Store)
  splash-icon.png              1024 RGBA, mark only on transparent (expo-splash-screen)
  favicon.png                  512 RGB (web)
  android-icon-background.png  1024 RGB (adaptive icon background layer)
  android-icon-foreground.png  1024 RGBA, mark inside the 66/108 safe zone
  android-icon-monochrome.png  1024 RGBA, white silhouette (themed icon + notification icon)
  tradeacademy-icon-master.svg vector master of icon.png

Usage:  python scripts/generate_tradeacademy_icons.py           # generate + validate
        python scripts/generate_tradeacademy_icons.py --check   # validate only
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ASSETS_DIR = Path(__file__).resolve().parents[1] / 'assets' / 'images'

BG_TOP = (28, 36, 50)
BG_BOTTOM = (12, 15, 22)
BG_FLAT = (21, 25, 34)  # #151922, app background
LETTER = (248, 250, 252)  # #F8FAFC
TEAL = (45, 212, 191)  # #2DD4BF, accent.primary

SS = 4  # supersampling factor

# Mark geometry in a unit box (0..1). The "A" has no crossbar; the curve replaces it.
A_POLY = [
    (0.40, 0.06), (0.60, 0.06), (0.93, 0.94), (0.72, 0.94),
    (0.50, 0.34), (0.28, 0.94), (0.07, 0.94),
]
CURVE = [(0.02, 0.74), (0.30, 0.60), (0.48, 0.69), (0.86, 0.40)]
CURVE_END_DOT = (0.86, 0.40)
CURVE_WIDTH = 0.075
CURVE_GAP = 0.035
DOT_RADIUS = 0.075


def _scale(points, origin, size):
    ox, oy = origin
    return [(ox + x * size, oy + y * size) for x, y in points]


def _polyline(draw, pts, width, fill):
    draw.line(pts, fill=fill, width=int(round(width)), joint='curve')
    r = width / 2
    for x, y in (pts[0], pts[-1]):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def _dot(draw, center, radius, fill):
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def render_mark(canvas: int, box: float, letter=LETTER, curve=TEAL, dy: float = 0.0) -> Image.Image:
    """Mark on a transparent canvas. `box` is the mark size as a fraction of the canvas."""
    big = canvas * SS
    size = big * box
    origin = ((big - size) / 2, (big - size) / 2 + dy * big)

    letter_mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(letter_mask).polygon(_scale(A_POLY, origin, size), fill=255)

    curve_pts = _scale(CURVE, origin, size)
    dot_center = _scale([CURVE_END_DOT], origin, size)[0]

    gap = Image.new('L', (big, big), 0)
    gd = ImageDraw.Draw(gap)
    _polyline(gd, curve_pts, (CURVE_WIDTH + 2 * CURVE_GAP) * size, 255)
    _dot(gd, dot_center, (DOT_RADIUS + CURVE_GAP) * size, 255)
    letter_mask = ImageChops.subtract(letter_mask, gap)

    curve_mask = Image.new('L', (big, big), 0)
    cd = ImageDraw.Draw(curve_mask)
    _polyline(cd, curve_pts, CURVE_WIDTH * size, 255)
    _dot(cd, dot_center, DOT_RADIUS * size, 255)

    out = Image.composite(
        Image.new('RGB', (big, big), curve),
        Image.new('RGB', (big, big), letter),
        curve_mask,
    ).convert('RGBA')
    out.putalpha(ImageChops.lighter(letter_mask, curve_mask))
    return out.resize((canvas, canvas), Image.LANCZOS)


def render_background(canvas: int, glow: bool = True) -> Image.Image:
    grad = Image.linear_gradient('L').resize((canvas, canvas))
    bg = Image.composite(
        Image.new('RGB', (canvas, canvas), BG_BOTTOM),
        Image.new('RGB', (canvas, canvas), BG_TOP),
        grad,
    )
    if glow:
        halo = Image.new('L', (canvas, canvas), 0)
        r = canvas * 0.34
        c = canvas / 2
        ImageDraw.Draw(halo).ellipse((c - r, c - r, c + r, c + r), fill=40)
        halo = halo.filter(ImageFilter.GaussianBlur(canvas * 0.12))
        bg = Image.composite(Image.new('RGB', (canvas, canvas), TEAL), bg, halo)
    return bg


def full_icon(canvas: int) -> Image.Image:
    bg = render_background(canvas).convert('RGBA')
    bg.alpha_composite(render_mark(canvas, box=0.60, dy=-0.005))
    return bg.convert('RGB')


def master_svg() -> str:
    s, o = 1024 * 0.60, (1024 - 1024 * 0.60) / 2
    def pt(x, y):
        return f'{o + x * s:.1f} {o + y * s - 5:.1f}'
    a_path = 'M' + ' L'.join(pt(x, y) for x, y in A_POLY) + ' Z'
    curve_path = 'M' + ' L'.join(pt(x, y) for x, y in CURVE)
    dx, dy = (o + CURVE_END_DOT[0] * s, o + CURVE_END_DOT[1] * s - 5)
    hex_ = lambda c: '#%02X%02X%02X' % c
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{hex_(BG_TOP)}"/>
      <stop offset="1" stop-color="{hex_(BG_BOTTOM)}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.45">
      <stop offset="0" stop-color="{hex_(TEAL)}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="{hex_(TEAL)}" stop-opacity="0"/>
    </radialGradient>
    <mask id="gap">
      <rect width="1024" height="1024" fill="#fff"/>
      <path d="{curve_path}" fill="none" stroke="#000" stroke-width="{(CURVE_WIDTH + 2 * CURVE_GAP) * s:.1f}" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="{dx:.1f}" cy="{dy:.1f}" r="{(DOT_RADIUS + CURVE_GAP) * s:.1f}" fill="#000"/>
    </mask>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <path d="{a_path}" fill="{hex_(LETTER)}" mask="url(#gap)"/>
  <path d="{curve_path}" fill="none" stroke="{hex_(TEAL)}" stroke-width="{CURVE_WIDTH * s:.1f}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="{dx:.1f}" cy="{dy:.1f}" r="{DOT_RADIUS * s:.1f}" fill="{hex_(TEAL)}"/>
</svg>
"""


def generate() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    full_icon(1024).save(ASSETS_DIR / 'icon.png', optimize=True)
    full_icon(512).save(ASSETS_DIR / 'favicon.png', optimize=True)
    render_mark(1024, box=0.86).save(ASSETS_DIR / 'splash-icon.png', optimize=True)
    Image.new('RGB', (1024, 1024), BG_FLAT).save(ASSETS_DIR / 'android-icon-background.png', optimize=True)
    # Adaptive icons are masked to the central 66/108 (~61%) circle; keep the mark well inside it.
    render_mark(1024, box=0.44).save(ASSETS_DIR / 'android-icon-foreground.png', optimize=True)
    render_mark(1024, box=0.44, letter=(255, 255, 255), curve=(255, 255, 255)).save(
        ASSETS_DIR / 'android-icon-monochrome.png', optimize=True
    )
    (ASSETS_DIR / 'tradeacademy-icon-master.svg').write_text(master_svg(), encoding='utf-8')


EXPECTED = {
    # name: (size, must_be_opaque)
    'icon.png': ((1024, 1024), True),
    'favicon.png': ((512, 512), True),
    'splash-icon.png': ((1024, 1024), False),
    'android-icon-background.png': ((1024, 1024), True),
    'android-icon-foreground.png': ((1024, 1024), False),
    'android-icon-monochrome.png': ((1024, 1024), False),
}


def validate() -> list[str]:
    errors: list[str] = []
    for name, (size, opaque) in EXPECTED.items():
        path = ASSETS_DIR / name
        if not path.exists():
            errors.append(f'{name}: missing')
            continue
        img = Image.open(path)
        if img.size != size:
            errors.append(f'{name}: expected {size}, got {img.size}')
        if opaque and img.mode != 'RGB':
            errors.append(f'{name}: must be RGB without alpha (App Store rejects transparent icons), got {img.mode}')
        if not opaque and img.mode != 'RGBA':
            errors.append(f'{name}: expected RGBA with transparency, got {img.mode}')
    mono = ASSETS_DIR / 'android-icon-monochrome.png'
    if mono.exists():
        r, g, b, a = Image.open(mono).convert('RGBA').split()
        visible = a.point(lambda v: 255 if v > 0 else 0)
        darkest = min(
            ImageChops.lighter(ch, ImageChops.invert(visible)).getextrema()[0] for ch in (r, g, b)
        )
        if darkest < 250:
            errors.append('android-icon-monochrome.png: must be pure white on transparent')
    return errors


def main() -> int:
    if '--check' not in sys.argv:
        generate()
    errors = validate()
    for e in errors:
        print(f'ERROR {e}')
    if not errors:
        print('All TradeAcademy icon assets valid.')
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
