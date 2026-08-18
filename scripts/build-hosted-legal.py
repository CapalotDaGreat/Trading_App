"""Build static HTML legal pages + deep-link well-known files for legal-site hosting.

Default deploy target remains https://tradevision.ai until EXPO_PUBLIC_LEGAL_SITE_ORIGIN
points at a verified Aithera host. Bundle / package id in AASA and assetlinks stays
ai.tradevision.app (Phase 0 freeze).

Upload the contents of store/hosted/ to your site root (or CDN) so that:
  /privacy, /terms, /risk, /security, /account-deletion, /support
and:
  /.well-known/apple-app-site-association
  /.well-known/assetlinks.json
return HTTP 200 with the expected bodies.

Apple Team ID in assetlinks/AASA must be replaced before production.
"""

from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGAL = ROOT / "store" / "legal"
HOSTED = ROOT / "store" / "hosted"
WELL_KNOWN = HOSTED / ".well-known"

PAGES = {
    "privacy": ("privacy-policy.md", "Privacy Policy"),
    "terms": ("terms-of-service.md", "Terms of Service"),
    "risk": ("risk-disclaimer.md", "Risk & Investment Disclaimer"),
    "security": ("security-notice.md", "Security Notice"),
    "account-deletion": ("account-deletion.md", "Account Deletion"),
}

SUPPORT_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TradeInsight Support · Aithera</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.55; color: #111; }
    a { color: #0f766e; }
  </style>
</head>
<body>
  <h1>TradeInsight Support</h1>
  <p>TradeInsight by Aithera</p>
  <p>Email: <a href="mailto:support@tradevision.ai">support@tradevision.ai</a></p>
  <p>TradeInsight is an educational research and decision-coaching app. It is not a broker and does not provide buy/sell signals or execute trades.</p>
  <ul>
    <li><a href="/privacy">Privacy Policy</a></li>
    <li><a href="/terms">Terms of Service</a></li>
    <li><a href="/risk">Risk Disclaimer</a></li>
    <li><a href="/security">Security Notice</a></li>
    <li><a href="/account-deletion">Account Deletion</a></li>
  </ul>
</body>
</html>
"""

AASA = """{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "APPLE_TEAM_ID.ai.tradevision.app",
        "paths": ["*"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["APPLE_TEAM_ID.ai.tradevision.app"]
  }
}
"""

ASSETLINKS = """[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ai.tradevision.app",
      "sha256_cert_fingerprints": [
        "REPLACE_WITH_PLAY_APP_SIGNING_SHA256"
      ]
    }
  }
]
"""


def md_to_simple_html(md: str) -> str:
    """Minimal Markdown → HTML (headers, paragraphs, lists, bold, links, tables as pre)."""
    lines = md.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    in_ul = False
    in_table = False
    para: list[str] = []

    def flush_para() -> None:
        nonlocal para
        if para:
            text = " ".join(para)
            out.append(f"<p>{inline(text)}</p>")
            para = []

    def flush_ul() -> None:
        nonlocal in_ul
        if in_ul:
            out.append("</ul>")
            in_ul = False

    def inline(text: str) -> str:
        text = html.escape(text)
        text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
        text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
        text = re.sub(
            r"\[([^\]]+)\]\(([^)]+)\)",
            r'<a href="\2">\1</a>',
            text,
        )
        return text

    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            flush_para()
            flush_ul()
            if in_table:
                out.append("</pre>")
                in_table = False
            continue

        if line.startswith("|"):
            flush_para()
            flush_ul()
            if not in_table:
                out.append("<pre>")
                in_table = True
            out.append(html.escape(line))
            continue

        if re.match(r"^#{1,3}\s+", line):
            flush_para()
            flush_ul()
            level = len(line) - len(line.lstrip("#"))
            content = line.lstrip("#").strip()
            out.append(f"<h{level}>{inline(content)}</h{level}>")
            continue

        if line.startswith("- ") or line.startswith("* "):
            flush_para()
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            out.append(f"<li>{inline(line[2:].strip())}</li>")
            continue

        if re.match(r"^-{3,}$", line):
            flush_para()
            flush_ul()
            out.append("<hr />")
            continue

        para.append(line)

    flush_para()
    flush_ul()
    if in_table:
        out.append("</pre>")

    return "\n".join(out)


def wrap_page(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(title)} · TradeInsight by Aithera</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 48rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.55; color: #111; }}
    h1, h2, h3 {{ line-height: 1.25; }}
    code, pre {{ background: #f4f4f5; }}
    pre {{ overflow-x: auto; padding: 0.75rem; }}
    a {{ color: #0f766e; }}
    nav {{ margin-bottom: 1.5rem; font-size: 0.9rem; }}
  </style>
</head>
<body>
  <nav>
    <a href="/">TradeInsight</a> ·
    <a href="/privacy">Privacy</a> ·
    <a href="/terms">Terms</a> ·
    <a href="/risk">Risk</a> ·
    <a href="/security">Security</a> ·
    <a href="/account-deletion">Account deletion</a> ·
    <a href="/support">Support</a>
  </nav>
  {body}
</body>
</html>
"""


def main() -> None:
    HOSTED.mkdir(parents=True, exist_ok=True)
    WELL_KNOWN.mkdir(parents=True, exist_ok=True)

    for slug, (filename, title) in PAGES.items():
        md = (LEGAL / filename).read_text(encoding="utf-8")
        page = wrap_page(title, md_to_simple_html(md))
        (HOSTED / f"{slug}.html").write_text(page, encoding="utf-8")
        # Clean path without .html for static hosts that map folders / index
        folder = HOSTED / slug
        folder.mkdir(exist_ok=True)
        (folder / "index.html").write_text(page, encoding="utf-8")

    support_dir = HOSTED / "support"
    support_dir.mkdir(exist_ok=True)
    (HOSTED / "support.html").write_text(SUPPORT_HTML, encoding="utf-8")
    (support_dir / "index.html").write_text(SUPPORT_HTML, encoding="utf-8")

    (WELL_KNOWN / "apple-app-site-association").write_text(AASA, encoding="utf-8")
    (WELL_KNOWN / "assetlinks.json").write_text(ASSETLINKS, encoding="utf-8")

    readme = HOSTED / "README.md"
    readme.write_text(
        """# Hosted legal + deep-link assets

Generated by `python scripts/build-hosted-legal.py`.

## Deploy

Upload everything in this folder to the **site root** of the configured legal origin
(default fallback `https://tradevision.ai`) or your future official Aithera domain.
Do not claim Aithera pages are live until hosting is verified.

Required live URLs (HTTP 200):

- `/privacy`
- `/terms`
- `/risk`
- `/security`
- `/account-deletion`
- `/support`
- `/.well-known/apple-app-site-association` (no file extension; `application/json`)
- `/.well-known/assetlinks.json`

## Before production

1. Replace `APPLE_TEAM_ID` in `.well-known/apple-app-site-association`.
2. Replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` in `.well-known/assetlinks.json`
   with the Play App Signing certificate SHA-256 fingerprint.
3. Have counsel insert the registered legal entity into `store/legal/*`, then re-run
   `python scripts/sync-legal-docs.py` and this script.
""",
        encoding="utf-8",
    )
    print(f"wrote hosted pages under {HOSTED}")


if __name__ == "__main__":
    main()
