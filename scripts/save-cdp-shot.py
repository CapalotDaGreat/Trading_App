"""Capture phone-sized dark-mode screenshots via CDP clip (390x844 @ 3x).

Requires: Expo web on localhost:8081 and an active Cursor browser session
already navigated with device metrics. Prefer calling from the agent that
holds the browser lock — this script only decodes/saves if you pass JSON paths.

For agent use: the browser tools drive navigation; this module provides helpers.
"""

from __future__ import annotations

import base64
import json
from pathlib import Path

from PIL import Image

OUT = Path(r"c:\Users\masap\AppData\Local\Temp\cursor\screenshots")


def save_cdp_png(json_path: Path, dest_name: str) -> Path:
    data = json.loads(json_path.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "result" in data and "data" in data["result"]:
        b64 = data["result"]["data"]
    elif isinstance(data, dict) and "data" in data:
        b64 = data["data"]
    else:
        raise ValueError(f"Unexpected CDP payload keys: {list(data)[:10]}")
    out = OUT / dest_name
    out.write_bytes(base64.b64decode(b64))
    im = Image.open(out)
    print(f"saved {out.name} {im.size}")
    return out


if __name__ == "__main__":
    import sys

    save_cdp_png(Path(sys.argv[1]), sys.argv[2])
