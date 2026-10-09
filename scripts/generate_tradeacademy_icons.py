from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'images'
ASSETS.mkdir(parents=True, exist_ok=True)


def to_rgba(hex_color: str) -> tuple[int, int, int, int]:
    value = hex_color.lstrip('#')
    if len(value) == 6:
        value += 'ff'
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4, 6))


def rounded_square(size: int, radius: int, fill: tuple[int, int, int, int]) -> Image.Image:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=fill)
    return img


def build_background(size: int) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    # dark navy base with subtle cool blue vignette
    for y in range(size):
        for x in range(size):
            nx = (x - size / 2) / (size / 2)
            ny = (y - size / 2) / (size / 2)
            dist = (nx * nx + ny * ny) ** 0.5
            mix = max(0.0, 1.0 - dist)
            r = int(7 + 18 * mix)
            g = int(17 + 20 * mix)
            b = int(27 + 30 * mix)
            a = 255
            canvas.putpixel((x, y), (r, g, b, a))
    # radial glow overlay
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((size * 0.08, size * 0.08, size * 0.92, size * 0.92), fill=(24, 88, 168, 65))
    canvas = Image.alpha_composite(canvas, glow)
    return canvas


def add_mark(base: Image.Image, size: int, mark_color: tuple[int, int, int, int], accent_color: tuple[int, int, int, int]) -> Image.Image:
    mark = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(mark)

    # elevated geometric A / roofline to feel like research confidence and upward movement.
    d.polygon(
        [
            (170, 760),
            (365, 260),
            (468, 260),
            (292, 760),
        ],
        fill=mark_color,
    )
    d.polygon(
        [
            (854, 760),
            (659, 260),
            (556, 260),
            (732, 760),
        ],
        fill=mark_color,
    )
    d.polygon(
        [
            (242, 760),
            (414, 318),
            (500, 318),
            (344, 760),
        ],
        fill=(58, 155, 244, 255),
    )
    d.polygon(
        [
            (782, 760),
            (610, 318),
            (524, 318),
            (680, 760),
        ],
        fill=(58, 155, 244, 255),
    )

    # central crossbar
    d.rounded_rectangle((320, 480, 704, 610), radius=38, fill=accent_color)

    # upper highlight / taper to read clearly at small sizes
    d.rounded_rectangle((338, 330, 688, 430), radius=28, fill=(148, 223, 255, 90))

    # subtle inner shadow for polish
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s = ImageDraw.Draw(shadow)
    s.polygon(
        [
            (280, 625),
            (380, 392),
            (500, 392),
            (450, 625),
        ],
        fill=(5, 10, 18, 90),
    )
    s.polygon(
        [
            (744, 625),
            (644, 392),
            (524, 392),
            (574, 625),
        ],
        fill=(5, 10, 18, 90),
    )
    mark = Image.alpha_composite(mark, shadow)

    # using a crisp white accent that reads like a polished, branded monogram rather than a placeholder
    accent = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ad = ImageDraw.Draw(accent)
    ad.polygon([(300, 700), (430, 345), (510, 345), (390, 700)], fill=(255, 255, 255, 36))
    ad.polygon([(724, 700), (594, 345), (514, 345), (634, 700)], fill=(255, 255, 255, 36))
    mark = Image.alpha_composite(mark, accent)

    # dark frame at the edges to keep the mark clean and app-store ready
    frame = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle((35, 35, size - 35, size - 35), radius=170, outline=(15, 29, 44, 100), width=18)
    mark = Image.alpha_composite(mark, frame)

    return Image.alpha_composite(base, mark)


def save_png(path: Path, image: Image.Image) -> None:
    image.save(path)


# Build the primary app icon, which also serves as the splash icon and web favicon.
icon_size = 1024
base = build_background(icon_size)
icon = add_mark(
    base,
    icon_size,
    mark_color=(28, 135, 233, 255),
    accent_color=(116, 216, 255, 255),
)

save_png(ASSETS / 'icon.png', icon)
save_png(ASSETS / 'splash-icon.png', icon)

# Android foreground and background are intentionally aligned to the same visual system.
background = rounded_square(1024, 220, (9, 18, 28, 255))
foreground = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
foreground = add_mark(
    foreground,
    1024,
    mark_color=(28, 135, 233, 255),
    accent_color=(116, 216, 255, 255),
)
# strip the background from the foreground so Android adaptive icons can use the dedicated background asset.
alpha = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
alpha.paste(foreground, (0, 0))
# Ensure the mark itself is transparent in the background layer.
# For Android adaptive icon, the foreground image is the mark only; the dark square is supplied separately.
# We keep the mark on transparent canvas and leave background as a separate file.
foreground = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
foreground = add_mark(
    foreground,
    1024,
    mark_color=(28, 135, 233, 255),
    accent_color=(116, 216, 255, 255),
)
# Remove the dark square fill from the background in the final foreground image by compositing with a transparent layer.
# The result keeps the mark only and is ready for Android adaptive icons.
foreground = foreground.crop((0, 0, 1024, 1024))
save_png(ASSETS / 'android-icon-foreground.png', foreground)
save_png(ASSETS / 'android-icon-background.png', background)

# Simple monochrome mark for Android notification and monochrome adaptive use.
mono = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
mono_draw = ImageDraw.Draw(mono)
mono_draw.polygon(
    [
        (170, 760),
        (365, 260),
        (468, 260),
        (292, 760),
    ],
    fill=(255, 255, 255, 255),
)
mono_draw.polygon(
    [
        (854, 760),
        (659, 260),
        (556, 260),
        (732, 760),
    ],
    fill=(255, 255, 255, 255),
)
mono_draw.polygon(
    [
        (242, 760),
        (414, 318),
        (500, 318),
        (344, 760),
    ],
    fill=(255, 255, 255, 255),
)
mono_draw.polygon(
    [
        (782, 760),
        (610, 318),
        (524, 318),
        (680, 760),
    ],
    fill=(255, 255, 255, 255),
)
mono_draw.rounded_rectangle((320, 480, 704, 610), radius=38, fill=(255, 255, 255, 255))
mono_draw.rounded_rectangle((338, 330, 688, 430), radius=28, fill=(255, 255, 255, 120))
# Small white details are okay here; the adaptive monochrome icon remains crisp and uniform.
save_png(ASSETS / 'android-icon-monochrome.png', mono)

# favicon for web/social surfaces is aligned to the same mark.
favicon = icon.resize((512, 512), Image.Resampling.LANCZOS)
save_png(ASSETS / 'favicon.png', favicon)

# Also keep a reusable master source with a vector-like layout to make future tweaks easier.
svg = '''
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#061622"/>
      <stop offset="100%" stop-color="#0f233c"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#35B7FF"/>
      <stop offset="48%" stop-color="#1B87E8"/>
      <stop offset="100%" stop-color="#0E6AD7"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#C9F2FF"/>
      <stop offset="100%" stop-color="#79D8FF"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="210" fill="url(#bg)"/>
  <path d="M170 760 L365 260 L468 260 L292 760 Z" fill="url(#mark)"/>
  <path d="M854 760 L659 260 L556 260 L732 760 Z" fill="url(#mark)"/>
  <path d="M242 760 L414 318 L500 318 L344 760 Z" fill="#1F9AE9"/>
  <path d="M782 760 L610 318 L524 318 L680 760 Z" fill="#1F9AE9"/>
  <rect x="320" y="480" width="384" height="130" rx="38" fill="url(#accent)"/>
  <rect x="338" y="330" width="350" height="100" rx="28" fill="#B9EEFF" opacity="0.42"/>
</svg>
'''
(ASSETS / 'tradeacademy-icon-master.svg').write_text(svg, encoding='utf-8')

print('Generated icon assets in', ASSETS)
