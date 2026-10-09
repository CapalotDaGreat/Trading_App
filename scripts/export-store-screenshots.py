"""Compose App Store screenshots and product-page header art from real app captures.

Screenshots: a caption above a framed device showing a real capture. Sources:
  store/screenshots/source/iphone-device/*.png  (required)
  store/screenshots/source/ipad-device/*.png    (optional; iPad sets are only
      produced from real iPad captures — never from stretched iPhone UI)

Captures at native resolution are used as-is. The legacy low-res captures
(height < 2000 px) were taken in Expo Go, so the status bar and the guest/demo
banner are cropped off and the device frame supplies a plain Dynamic Island.

Header art (App Store "Header and Search Results", iOS 27+):
  app-store/header/header-3840x1646.png     product page header only (21:9)
  app-store/header/universal-5244x2950.png  header + search results (16:9)

Usage: python scripts/export-store-screenshots.py
"""

from __future__ import annotations

import random
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "store" / "screenshots"
SRC_IPHONE = ROOT / "source" / "iphone-device"
SRC_IPAD = ROOT / "source" / "ipad-device"
APP_ICON = Path(__file__).resolve().parents[1] / "assets" / "images" / "icon.png"

IPHONE_SIZES = {
    "app-store/iphone-6.9": (1320, 2868),
    "app-store/iphone-6.5": (1284, 2778),
}
IPAD_SIZES = {
    "app-store/ipad-13": (2064, 2752),
}
HEADER_SIZES = {
    "header-3840x1646.png": (3840, 1646),
    "universal-5244x2950.png": (5244, 2950),
}

LEGACY_CROP_TOP = 186 / 1024
NATIVE_MIN_HEIGHT = 2000

BG_TOP = (14, 19, 28)
BG_BOTTOM = (21, 25, 34)
APP_BG = (21, 25, 34)
ACCENT = (45, 212, 191)
ACCENT_SOFT = (94, 234, 212)
WHITE = (248, 250, 252)
MUTED = (174, 186, 201)
BEZEL = (6, 8, 12)
BEZEL_EDGE = (58, 66, 80)
CANDLE_UP = (45, 212, 191)
CANDLE_DOWN = (248, 113, 113)

# source filename, output slug, caption, subcaption
SCENES: list[tuple[str, str, str, str]] = [
    ("02-home.png", "home", "Know what to\ntrain next", "Your personal training center for learning to trade"),
    ("04-practice-trend.png", "practice", "Learn to read\nthe chart", "Short drills on trends, breakouts, and structure"),
    ("07-replay-tv.png", "replay", "What would you\nhave done?", "Replay market history with the future hidden"),
    ("03-simulate.png", "simulate", "$100,000 to\npractise with", "Simulated money only — no broker, no real funds"),
    ("05-practice-breakout.png", "patience", "Patience is\na skill", "Drills that reward process over urgency"),
    ("06-events.png", "events", "Understand\nmarket events", "Study what's coming up — no predictions"),
]


def font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    names = {
        "black": ["seguibl.ttf", "segoeuib.ttf", "arialbd.ttf"],
        "bold": ["segoeuib.ttf", "arialbd.ttf"],
        "semibold": ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"],
        "regular": ["segoeui.ttf", "arial.ttf"],
    }[weight]
    for name in names:
        try:
            return ImageFont.truetype(str(Path(r"C:\Windows\Fonts") / name), size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def vertical_gradient(size: tuple[int, int], top, bottom) -> Image.Image:
    grad = Image.linear_gradient("L").resize(size)
    return Image.composite(Image.new("RGB", size, bottom), Image.new("RGB", size, top), grad)


def glow(size: tuple[int, int], center: tuple[float, float], radius: float, alpha: int) -> Image.Image:
    layer = Image.new("L", size, 0)
    cx, cy = center
    ImageDraw.Draw(layer).ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=alpha)
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.45))


def background(size: tuple[int, int], glow_center: tuple[float, float], glow_radius: float) -> Image.Image:
    bg = vertical_gradient(size, BG_TOP, BG_BOTTOM)
    halo = glow(size, glow_center, glow_radius, 70)
    return Image.composite(Image.new("RGB", size, ACCENT), bg, halo)


def prepare_screen(path: Path) -> tuple[Image.Image, bool]:
    """Return (screen image, needs_island_strip)."""
    im = Image.open(path).convert("RGB")
    if im.height >= NATIVE_MIN_HEIGHT:
        return im, False
    top = round(im.height * LEGACY_CROP_TOP)
    return im.crop((0, top, im.width, im.height)), True


def device(screen: Image.Image, needs_strip: bool, frame_w: int, ipad: bool = False) -> Image.Image:
    bezel = round(frame_w * (0.022 if ipad else 0.034))
    radius = round(frame_w * (0.06 if ipad else 0.15))
    sw = frame_w - 2 * bezel
    content = screen.resize((sw, round(screen.height * sw / screen.width)), Image.LANCZOS)

    strip_h = round(sw * 0.13) if needs_strip and not ipad else 0
    sh = strip_h + content.height
    shown = Image.new("RGB", (sw, sh), APP_BG)
    shown.paste(content, (0, strip_h))
    if strip_h:
        pill_w, pill_h = round(sw * 0.3), round(sw * 0.085)
        px, py = (sw - pill_w) // 2, round(strip_h * 0.28)
        ImageDraw.Draw(shown).rounded_rectangle((px, py, px + pill_w, py + pill_h), radius=pill_h // 2, fill=(0, 0, 0))

    frame_h = sh + 2 * bezel
    out = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    d.rounded_rectangle((0, 0, frame_w - 1, frame_h - 1), radius=radius, fill=BEZEL + (255,))
    d.rounded_rectangle(
        (1, 1, frame_w - 2, frame_h - 2), radius=radius, outline=BEZEL_EDGE + (255,), width=max(2, frame_w // 300)
    )
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw - 1, sh - 1), radius=radius - bezel, fill=255)
    out.paste(shown, (bezel, bezel), mask)
    return out


def drop_shadow(canvas: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    shadow = Image.new("L", canvas.size, 0)
    x0, y0, x1, y1 = box
    ImageDraw.Draw(shadow).rounded_rectangle((x0, y0 + radius // 3, x1, y1), radius=radius, fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius * 0.5))
    canvas.paste(Image.new("RGB", canvas.size, (2, 4, 8)), mask=shadow)


def draw_centered_lines(draw, lines, fnt, color, top, width, line_gap=1.08) -> int:
    y = top
    for line in lines:
        w = draw.textlength(line, font=fnt)
        draw.text(((width - w) / 2, y), line, font=fnt, fill=color)
        y += round(fnt.size * line_gap)
    return y


def wrap(draw, text: str, fnt, max_w: float) -> list[str]:
    words, lines, cur = text.split(), [], ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=fnt) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def balanced_wrap(draw, text: str, fnt, max_w: float) -> list[str]:
    lines = wrap(draw, text, fnt, max_w)
    if len(lines) < 2:
        return lines
    target = draw.textlength(text, font=fnt) / len(lines)
    while target < max_w:
        balanced = wrap(draw, text, fnt, target)
        if len(balanced) == len(lines):
            return balanced
        target *= 1.04
    return lines


def fit_font(draw, lines: list[str], weight: str, max_w: float, start: int) -> ImageFont.FreeTypeFont:
    size = start
    while size > 10:
        fnt = font(size, weight)
        if max(draw.textlength(line, font=fnt) for line in lines) <= max_w:
            return fnt
        size = round(size * 0.96)
    return font(size, weight)


def compose_screenshot(screen, needs_strip, size, caption, sub, ipad=False) -> Image.Image:
    W, H = size
    canvas = background(size, (W / 2, H * 0.62), W * 0.55)
    draw = ImageDraw.Draw(canvas)

    title_f = font(round(W * (0.064 if ipad else 0.092)), "black")
    sub_f = font(round(W * (0.026 if ipad else 0.04)), "semibold")
    y = round(H * 0.055)
    y = draw_centered_lines(draw, caption.split("\n"), title_f, WHITE, y, W, 1.06)
    y += round(H * 0.012)
    y = draw_centered_lines(draw, balanced_wrap(draw, sub, sub_f, W * 0.86), sub_f, ACCENT_SOFT, y, W, 1.25)

    frame_w = round(W * (0.7 if ipad else 0.8))
    dev = device(screen, needs_strip, frame_w, ipad)
    top = max(y + round(H * 0.03), round(H * 0.235))
    avail = H - top - round(H * 0.03)
    if dev.height > avail:
        scale = avail / dev.height
        dev = device(screen, needs_strip, round(frame_w * scale), ipad)
    x = (W - dev.width) // 2
    drop_shadow(canvas, (x, top, x + dev.width, top + dev.height), round(dev.width * 0.08))
    canvas.paste(dev, (x, top), dev)
    return canvas


def candle_field(size: tuple[int, int], seed: int = 7) -> Image.Image:
    """Decorative, low-contrast educational-style candles across the full width."""
    W, H = size
    rng = random.Random(seed)
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    n = 64
    step = W / n
    body_w = step * 0.46
    price = 0.0
    closes = []
    for _ in range(n):
        price += rng.gauss(0, 1)
        closes.append(price)
    lo, hi = min(closes) - 2, max(closes) + 2
    band_top, band_bot = H * 0.22, H * 0.86

    def ypos(p):
        return band_bot - (p - lo) / (hi - lo) * (band_bot - band_top)

    prev = closes[0] - rng.gauss(0, 1)
    for i, close in enumerate(closes):
        open_ = prev
        high = max(open_, close) + abs(rng.gauss(0, 0.6))
        low = min(open_, close) - abs(rng.gauss(0, 0.6))
        cx = step * (i + 0.5)
        color = CANDLE_UP if close >= open_ else CANDLE_DOWN
        rgba = color + (54,)
        d.line((cx, ypos(high), cx, ypos(low)), fill=rgba, width=max(2, round(step * 0.07)))
        top, bot = sorted((ypos(open_), ypos(close)))
        d.rectangle((cx - body_w / 2, top, cx + body_w / 2, max(bot, top + step * 0.12)), fill=rgba)
        prev = close
    return layer


def rounded_icon(size: int) -> Image.Image:
    icon = Image.open(APP_ICON).convert("RGB").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 0.225), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(icon, (0, 0), mask)
    return out


def compose_header(size: tuple[int, int]) -> Image.Image:
    """Single clear idea, key content centered so device crops keep it."""
    W, H = size
    canvas = background(size, (W / 2, H * 0.5), H * 0.7).convert("RGBA")
    canvas.alpha_composite(candle_field(size))

    vignette = glow(size, (W / 2, H * 0.5), H * 0.62, 235)
    canvas = Image.composite(Image.new("RGBA", size, BG_BOTTOM + (255,)), canvas, vignette)

    unit = H / 1646
    draw = ImageDraw.Draw(canvas)
    title = "Learn trading."
    title2 = "Practice the decision."
    sub = "Lessons · Drills · Replays · Simulation"
    safe_w = min(W, H * 21 / 9) * 0.38
    title_f = fit_font(draw, [title, title2], "black", safe_w, round(176 * unit))
    sub_f = fit_font(draw, [sub], "semibold", safe_w, round(64 * unit))
    icon_size = round(title_f.size * 1.5)
    gap = round(48 * unit)
    block_h = icon_size + gap + title_f.size * 2 + round(36 * unit) + sub_f.size
    y = round((H - block_h) / 2)

    icon = rounded_icon(icon_size)
    shadow = Image.new("L", size, 0)
    ix = (W - icon_size) // 2
    ImageDraw.Draw(shadow).rounded_rectangle(
        (ix, y + round(20 * unit), ix + icon_size, y + icon_size + round(20 * unit)),
        radius=round(icon_size * 0.225), fill=160,
    )
    canvas.paste(Image.new("RGBA", size, (0, 0, 0, 255)), mask=shadow.filter(ImageFilter.GaussianBlur(40 * unit)))
    canvas.alpha_composite(icon, (ix, y))
    draw = ImageDraw.Draw(canvas)

    y += icon_size + gap
    for text, color in ((title, WHITE), (title2, ACCENT_SOFT)):
        w = draw.textlength(text, font=title_f)
        draw.text(((W - w) / 2, y), text, font=title_f, fill=color)
        y += title_f.size
    y += round(36 * unit)
    w = draw.textlength(sub, font=sub_f)
    draw.text(((W - w) / 2, y), sub, font=sub_f, fill=MUTED)
    return canvas.convert("RGB")


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print("wrote", path.relative_to(ROOT), img.size)


def export_set(src_dir: Path, sizes: dict, ipad: bool) -> None:
    for rel, size in sizes.items():
        folder = ROOT / rel
        if folder.exists():
            shutil.rmtree(folder)
        for i, (src_name, slug, caption, sub) in enumerate(SCENES, start=1):
            src = src_dir / src_name
            if not src.exists():
                print("skip (missing source)", src.relative_to(ROOT))
                continue
            screen, strip = prepare_screen(src)
            save(compose_screenshot(screen, strip, size, caption, sub, ipad), folder / f"{i:02d}-{slug}.png")


def main() -> None:
    export_set(SRC_IPHONE, IPHONE_SIZES, ipad=False)
    if SRC_IPAD.exists() and any(SRC_IPAD.glob("*.png")):
        export_set(SRC_IPAD, IPAD_SIZES, ipad=True)
    else:
        print(f"no iPad captures in {SRC_IPAD.relative_to(ROOT)} — iPad screenshots not generated")
    for name, size in HEADER_SIZES.items():
        save(compose_header(size), ROOT / "app-store" / "header" / name)


if __name__ == "__main__":
    main()
