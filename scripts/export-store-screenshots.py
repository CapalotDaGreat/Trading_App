"""Compose App Store screenshots from real iPhone captures + hero captions.

Sources: store/screenshots/source/iphone-device/*.png (device screenshots with
status bar). Heroes place brand copy above a framed phone; remaining slots can
be full-bleed. Never cover-crops the top of the UI.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC = Path(r"c:\Money\Trading_App\store\screenshots\source\iphone-device")
ROOT = Path(r"c:\Money\Trading_App\store\screenshots")

SIZES = {
    "app-store/iphone-6.7": (1290, 2796),
    "app-store/iphone-6.5": (1284, 2778),
    "app-store/ipad-pro-12.9": (2048, 2732),
}

BG_TOP = (11, 15, 22)
BG_BOTTOM = (18, 24, 34)
PHONE_BG = (15, 18, 26)
ACCENT = (45, 212, 191)
WHITE = (248, 250, 252)
MUTED = (148, 163, 184)

# filename, slug, hero_title, hero_subtitle (None = full-bleed)
SCENES: list[tuple[str, str, str | None, str | None]] = [
    ("01-welcome.png", "welcome", "Learn trading.", "Practice the decision."),
    ("02-home.png", "home-training-center", "Your training center", "What to train next — not a market terminal."),
    ("03-simulate.png", "simulate", "$100,000 paper capital", "Simulated practice. Process over P/L."),
    ("04-practice-trend.png", "practice-trend", "Train judgment", "Name the structure before you chase."),
    ("05-practice-breakout.png", "practice-breakout", "Process over urgency", "Wait for acceptance — not the first tick."),
    ("06-events.png", "events", "Learn the event", "Why it matters — never what happens next."),
    ("07-replay-tv.png", "replay-tv", "Decision Replay TV", "Reason with the information you had then."),
]


def load_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def gradient_bg(size: tuple[int, int]) -> Image.Image:
    tw, th = size
    canvas = Image.new("RGB", size, BG_TOP)
    draw = ImageDraw.Draw(canvas)
    for y in range(th):
        t = y / max(th - 1, 1)
        # Slight ease toward bottom
        t = t * t * (3 - 2 * t)
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        draw.line([(0, y), (tw, y)], fill=(r, g, b))
    return canvas


def fit_contain_top(
    im: Image.Image,
    size: tuple[int, int],
    bg: tuple[int, int, int] = PHONE_BG,
) -> Image.Image:
    """Scale entire phone into the box; top-align so status bar stays visible."""
    tw, th = size
    canvas = Image.new("RGB", size, bg)
    scale = min(tw / im.width, th / im.height)
    nw = max(1, int(im.width * scale))
    nh = max(1, int(im.height * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (tw - nw) // 2
    canvas.paste(resized, (left, 0))
    return canvas


def round_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size[0] - 1, size[1] - 1],
        radius=radius,
        fill=255,
    )
    return mask


def framed_phone(phone: Image.Image, frame_w: int, frame_h: int) -> Image.Image:
    """Black device bezel + rounded real screenshot, top-aligned."""
    device = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    radius = max(48, frame_w // 14)
    bezel = max(14, frame_w // 32)

    # Soft outer glow
    glow = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    for i, a in enumerate((28, 18, 10)):
        pad = 10 + i * 10
        gdraw.rounded_rectangle(
            [pad, pad, frame_w - 1 - pad, frame_h - 1 - pad],
            radius=radius + 8,
            fill=(45, 212, 191, a),
        )
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    device = Image.alpha_composite(device, glow)

    body = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle(
        [0, 0, frame_w - 1, frame_h - 1],
        radius=radius,
        fill=(8, 10, 14, 255),
    )
    device = Image.alpha_composite(device, body)

    inner_w = frame_w - bezel * 2
    inner_h = frame_h - bezel * 2
    ui = fit_contain_top(phone, (inner_w, inner_h), bg=PHONE_BG).convert("RGBA")
    ui.putalpha(round_mask(ui.size, max(34, radius - bezel)))
    device.paste(ui, (bezel, bezel), ui)
    return device


def make_hero(phone: Image.Image, size: tuple[int, int], title: str, subtitle: str) -> Image.Image:
    tw, th = size
    canvas = gradient_bg(size).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    # Ambient orb behind the phone
    orb = Image.new("RGBA", size, (0, 0, 0, 0))
    od = ImageDraw.Draw(orb)
    cx, cy = tw // 2, int(th * 0.58)
    rad = int(min(tw, th) * 0.42)
    for i in range(7, 0, -1):
        a = 10 + i * 4
        r = int(rad * (0.5 + i * 0.08))
        od.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(45, 212, 191, a))
    canvas = Image.alpha_composite(canvas, orb)
    draw = ImageDraw.Draw(canvas)

    brand_font = load_font(max(30, tw // 36), bold=True)
    title_font = load_font(max(48, tw // 17), bold=True)
    sub_font = load_font(max(28, tw // 33), bold=False)

    brand = "TradeAcademy"
    bw = draw.textlength(brand, font=brand_font)
    draw.text(((tw - bw) / 2, int(th * 0.038)), brand, font=brand_font, fill=ACCENT)

    ty = int(th * 0.078)
    for line in title.split("\n"):
        lw = draw.textlength(line, font=title_font)
        draw.text(((tw - lw) / 2, ty), line, font=title_font, fill=WHITE)
        ty += int(title_font.size * 1.1)
    ty += int(th * 0.01)
    for line in subtitle.split("\n"):
        lw = draw.textlength(line, font=sub_font)
        draw.text(((tw - lw) / 2, ty), line, font=sub_font, fill=MUTED)
        ty += int(sub_font.size * 1.18)

    # Maximize the real device shot under the caption
    top_margin = int(th * 0.175)
    bottom_margin = int(th * 0.028)
    side_margin = int(tw * 0.06)
    frame_w = tw - side_margin * 2
    frame_h = th - top_margin - bottom_margin

    device = framed_phone(phone, frame_w, frame_h)
    canvas.paste(device, (side_margin, top_margin), device)
    return canvas.convert("RGB")


def make_full_bleed(phone: Image.Image, size: tuple[int, int]) -> Image.Image:
    return fit_contain_top(phone, size, bg=PHONE_BG)


def prepare_phone(im: Image.Image) -> Image.Image:
    """Real device capture — keep as-is (already has status bar)."""
    return im.convert("RGB")


def main() -> None:
    prepared: list[tuple[str, Image.Image, str | None, str | None]] = []
    for src_name, slug, title, subtitle in SCENES:
        src = SRC / src_name
        if not src.exists():
            print("missing", src)
            continue
        phone = prepare_phone(Image.open(src))
        prepared.append((slug, phone, title, subtitle))
        print(f"loaded {src_name} -> {phone.size}")

    for rel, size in SIZES.items():
        folder = ROOT / rel
        folder.mkdir(parents=True, exist_ok=True)
        for i, (slug, phone, title, subtitle) in enumerate(prepared, start=1):
            out = folder / f"{i:02d}-{slug}.png"
            if title and subtitle:
                frame = make_hero(phone, size, title, subtitle)
            else:
                frame = make_full_bleed(phone, size)
            tmp = out.with_suffix(".tmp.png")
            frame.save(tmp, optimize=True)
            tmp.replace(out)
            print("wrote", out.relative_to(ROOT), frame.size)

    print(f"done: {len(prepared)} scenes across {len(SIZES)} sizes")


if __name__ == "__main__":
    main()
