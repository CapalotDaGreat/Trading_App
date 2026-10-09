"""Build static HTML legal pages + deep-link well-known files for legal-site hosting.

Default deploy target is https://tradeacademy.cloud until EXPO_PUBLIC_LEGAL_SITE_ORIGIN
points at a verified hosted origin. Bundle / package id in AASA and assetlinks is
ai.tradeacademy.app.

Upload the contents of store/hosted/ to your site root (or CDN) so that:
  /privacy, /terms, /risk, /security, /account-deletion, /support
and:
  /.well-known/apple-app-site-association
  /.well-known/assetlinks.json
return HTTP 200 with the expected bodies.

Play App Signing SHA-256 in assetlinks must be replaced before production.
"""

from __future__ import annotations

import html
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGAL = ROOT / "store" / "legal"
HOSTED = ROOT / "store" / "hosted"
WELL_KNOWN = HOSTED / ".well-known"
CSS_SRC = Path(__file__).with_name("hosted-legal.css")
SCREENSHOT_SRC = ROOT / "store" / "screenshots" / "source" / "iphone-device"
APP_ICON_SRC = ROOT / "assets" / "images" / "icon.png"
IMG_OUT = HOSTED / "img"
SITE_ORIGIN = "https://tradeacademy.cloud"

# Real device screenshots; the crop drops the status bar and the guest-mode demo banner.
SCREENS = {
    "home": "02-home.png",
    "practice": "04-practice-trend.png",
    "replay": "07-replay-tv.png",
    "simulate": "03-simulate.png",
    "events": "06-events.png",
}
SCREEN_CROP_TOP = 186 / 1024

PAGES = {
    "privacy": ("privacy-policy.md", "Privacy Policy", "How we collect, use, and protect data."),
    "terms": ("terms-of-service.md", "Terms of Service", "Rules for using TradeAcademy."),
    "risk": ("risk-disclaimer.md", "Risk & Investment Disclaimer", "Education and simulation are not investment advice."),
    "security": ("security-notice.md", "Security Notice", "How we protect accounts and handle incidents."),
    "account-deletion": ("account-deletion.md", "Account Deletion", "How to delete your account and what remains."),
    "support": ("support.md", "Support", "Where to get help inside the app and by email."),
}

NAV = [
    ("privacy", "Privacy"),
    ("terms", "Terms"),
    ("risk", "Risk"),
    ("security", "Security"),
    ("account-deletion", "Account deletion"),
    ("support", "Support"),
]

APPLE_TEAM_ID = "833CYAZ8XT"

AASA = f"""{{
  "applinks": {{
    "apps": [],
    "details": [
      {{
        "appID": "{APPLE_TEAM_ID}.ai.tradeacademy.app",
        "paths": ["*"]
      }}
    ]
  }},
  "webcredentials": {{
    "apps": ["{APPLE_TEAM_ID}.ai.tradeacademy.app"]
  }}
}}
"""

ASSETLINKS = """[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ai.tradeacademy.app",
      "sha256_cert_fingerprints": [
        "REPLACE_WITH_PLAY_APP_SIGNING_SHA256"
      ]
    }
  }
]
"""

FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#151922"/>
  <path d="M14.4 4.6H17.6L22.9 27.4H19.5L16 17.8 12.5 27.4H9.1Z" fill="#F8FAFC"/>
  <path d="M6.2 21.3 11.4 18.8 14.6 20.4 22.6 14.6" fill="none" stroke="#151922" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6.2 21.3 11.4 18.8 14.6 20.4 22.6 14.6" fill="none" stroke="#2DD4BF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="23.6" cy="13.9" r="2.6" fill="#2DD4BF" stroke="#151922" stroke-width="1"/>
</svg>
"""

HEADING = re.compile(r"^(#{1,3})\s+(.+)$")
UNORDERED = re.compile(r"^[-*]\s+(.+)$")
NESTED_UNORDERED = re.compile(r"^\s+[-*]\s+(.+)$")
ORDERED = re.compile(r"^(\d+)\.\s+(.+)$")
TABLE_ROW = re.compile(r"^\|.+\|$")
RULE = re.compile(r"^-{3,}$")
TABLE_DIVIDER = re.compile(r"^\|[\s:|-]+\|$")
META_LINE = re.compile(r"^\*\*(.+?):\*\*\s*(.*)$")
EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
URL = re.compile(r"https?://[^\s)]+")


def split_table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip()[1:-1].split("|")]


def is_block_start(line: str) -> bool:
    stripped = line.rstrip()
    return bool(
        HEADING.match(stripped)
        or UNORDERED.match(stripped)
        or ORDERED.match(stripped)
        or TABLE_ROW.match(stripped)
        or RULE.match(stripped.strip())
    )


def inline(text: str) -> str:
    """Escape, then restore markdown bold/italic/code/links and autolink URLs."""
    placeholders: list[str] = []

    def hold(fragment: str) -> str:
        placeholders.append(fragment)
        return f"\x00{len(placeholders) - 1}\x00"

    def restore(value: str) -> str:
        return re.sub(r"\x00(\d+)\x00", lambda m: placeholders[int(m.group(1))], value)

    working = text

    def link_sub(match: re.Match[str]) -> str:
        label = inline(match.group(1))
        href = html.escape(match.group(2), quote=True)
        return hold(f'<a href="{href}">{label}</a>')

    working = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link_sub, working)

    def code_sub(match: re.Match[str]) -> str:
        return hold(f"<code>{html.escape(match.group(1))}</code>")

    working = re.sub(r"`([^`]+)`", code_sub, working)

    def bold_sub(match: re.Match[str]) -> str:
        return hold(f"<strong>{inline(match.group(1))}</strong>")

    working = re.sub(r"\*\*(.+?)\*\*", bold_sub, working)

    def em_sub(match: re.Match[str]) -> str:
        return hold(f"<em>{inline(match.group(1))}</em>")

    working = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", em_sub, working)

    escaped = html.escape(working)

    def url_sub(match: re.Match[str]) -> str:
        href = html.escape(match.group(0), quote=True)
        return f'<a href="{href}">{html.escape(match.group(0))}</a>'

    escaped = URL.sub(url_sub, escaped)

    def email_sub(match: re.Match[str]) -> str:
        address = match.group(0)
        if "REQUIRED" in address.upper():
            return html.escape(address)
        href = html.escape(address, quote=True)
        return f'<a href="mailto:{href}">{html.escape(address)}</a>'

    escaped = EMAIL.sub(email_sub, escaped)
    return restore(escaped)


def render_table(headers: list[str], rows: list[list[str]]) -> str:
    head = "".join(f"<th scope=\"col\">{inline(cell)}</th>" for cell in headers)
    body_rows: list[str] = []
    for row in rows:
        cells: list[str] = []
        for index, header in enumerate(headers):
            value = row[index] if index < len(row) else ""
            label = html.escape(re.sub(r"\*\*(.+?)\*\*", r"\1", header))
            cells.append(f'<td data-label="{label}">{inline(value)}</td>')
        body_rows.append(f"<tr>{''.join(cells)}</tr>")
    return (
        '<div class="table-wrap" role="region" aria-label="Document table" tabindex="0">'
        "<table>"
        f"<thead><tr>{head}</tr></thead>"
        f"<tbody>{''.join(body_rows)}</tbody>"
        "</table></div>"
    )


def render_paragraph(text: str) -> str:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if len(lines) >= 2 and all(META_LINE.match(line) for line in lines):
        rows: list[str] = []
        for line in lines:
            match = META_LINE.match(line)
            assert match is not None
            rows.append(
                '<div class="meta-row">'
                f"<dt>{html.escape(match.group(1))}</dt>"
                f"<dd>{inline(match.group(2))}</dd>"
                "</div>"
            )
        return f'<dl class="doc-meta">{"".join(rows)}</dl>'
    if "\n" in text:
        return "<p>" + "<br />".join(inline(part) for part in text.split("\n")) + "</p>"
    return f"<p>{inline(text)}</p>"


def md_to_html(md: str) -> str:
    lines = md.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    i = 0

    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()

        if not line.strip():
            i += 1
            continue

        heading = HEADING.match(line)
        if heading:
            level = len(heading.group(1))
            out.append(f"<h{level}>{inline(heading.group(2).strip())}</h{level}>")
            i += 1
            continue

        if RULE.match(line.strip()):
            out.append("<hr />")
            i += 1
            continue

        # Consecutive **Key:** value lines form the document meta panel (no hard-break required).
        if META_LINE.match(line.strip()):
            meta_lines: list[str] = []
            while i < len(lines):
                candidate = (lines[i] or "").strip()
                if not candidate:
                    break
                if not META_LINE.match(candidate):
                    break
                meta_lines.append(candidate)
                i += 1
            out.append(render_paragraph("\n".join(meta_lines)))
            continue

        if TABLE_ROW.match(line.strip()):
            table_lines: list[str] = []
            while i < len(lines) and TABLE_ROW.match((lines[i] or "").strip()):
                table_lines.append((lines[i] or "").strip())
                i += 1
            body_lines = [row for row in table_lines if not TABLE_DIVIDER.match(row)]
            if body_lines:
                headers = split_table_row(body_lines[0])
                rows = [split_table_row(row) for row in body_lines[1:]]
                out.append(render_table(headers, rows))
            continue

        unordered = UNORDERED.match(line)
        if unordered:
            items: list[str] = []
            while i < len(lines):
                match = UNORDERED.match((lines[i] or "").rstrip())
                if not match:
                    break
                items.append(f"<li>{inline(match.group(1))}")
                i += 1
                nested_items: list[str] = []
                while i < len(lines):
                    nested_match = NESTED_UNORDERED.match(lines[i] or "")
                    if not nested_match:
                        break
                    nested_items.append(f"<li>{inline(nested_match.group(1))}</li>")
                    i += 1
                if nested_items:
                    items[-1] += f"<ul>{''.join(nested_items)}</ul>"
                items[-1] += "</li>"
            out.append(f"<ul>{''.join(items)}</ul>")
            continue

        ordered = ORDERED.match(line)
        if ordered:
            items = []
            while i < len(lines):
                match = ORDERED.match((lines[i] or "").rstrip())
                if not match:
                    break
                items.append(f"<li>{inline(match.group(2))}")
                i += 1
                nested_items = []
                while i < len(lines):
                    nested_match = NESTED_UNORDERED.match(lines[i] or "")
                    if not nested_match:
                        break
                    nested_items.append(f"<li>{inline(nested_match.group(1))}</li>")
                    i += 1
                if nested_items:
                    items[-1] += f"<ul>{''.join(nested_items)}</ul>"
                items[-1] += "</li>"
            out.append(f"<ol>{''.join(items)}</ol>")
            continue

        parts: list[str] = []
        previous_hard_break = False
        while i < len(lines):
            current = lines[i] or ""
            if not current.strip() or is_block_start(current):
                break
            hard_break = bool(re.search(r" {2}$", current))
            content = current.strip()
            if not parts:
                parts.append(content)
            elif previous_hard_break:
                parts.append(f"\n{content}")
            else:
                parts.append(f" {content}")
            previous_hard_break = hard_break
            i += 1
        text = "".join(parts).strip()
        if text:
            out.append(render_paragraph(text))

    return "\n".join(out)


def template_notice(md: str) -> str:
    if "REQUIRED]" not in md:
        return ""
    return (
        '<p class="notice" role="note"><strong>Template — not a live operator publication.</strong> '
        "Bracketed fields (legal entity, VAT/UID, emails, official domain) are not production "
        "values. Do not paste this URL into App Store Connect or Play Console until those fields "
        "are replaced and this notice is gone.</p>\n"
    )


def mark_svg() -> str:
    return FAVICON.replace(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
        '<svg class="mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="40" height="40" aria-hidden="true">',
    ).strip()


def nav_html(current: str | None) -> str:
    links: list[str] = []
    for slug, label in NAV:
        href = f"/{slug}"
        current_attr = ' aria-current="page"' if current == slug else ""
        links.append(f'<a class="nav-link" href="{href}"{current_attr}>{html.escape(label)}</a>')
    return f'<nav class="site-nav" aria-label="Legal">{"".join(links)}</nav>'


def extract_meta(md: str, label: str) -> str | None:
    pattern = re.compile(rf"^\*\*{re.escape(label)}:\*\*\s*(.+)$", re.M)
    match = pattern.search(md)
    return match.group(1).strip() if match else None


def footer_html() -> str:
    links = "".join(
        f'<a href="/{slug}">{html.escape(label)}</a>' for slug, label in NAV
    )
    return f"""  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <p class="footer-name">TradeAcademy <span class="footer-by">by Aithera</span></p>
        <p>Official website and legal &amp; support center for the TradeAcademy trading education and simulation app — coming soon to the App Store.</p>
      </div>
      <nav class="footer-nav" aria-label="Footer legal">
        {links}
      </nav>
      <p class="mute">Not a broker. Not an execution venue. Not buy/sell signals. Simulated P/L does not grade a decision. Decision Quality Score (DQS) measures process quality — never a price prediction. Training readiness never certifies live trading.</p>
      <p class="mute footer-copy">© TradeAcademy by Aithera. Operated by CML Electronics · Höglerstrasse 55, 8600 Dübendorf, Switzerland · https://tradeacademy.cloud</p>
    </div>
  </footer>
"""


def chrome(title: str, body: str, *, current: str | None, description: str) -> str:
    home_current = ' aria-current="page"' if current is None else ""
    page_title = (
        title
        if title.startswith("TradeAcademy")
        else f"{title} · TradeAcademy by Aithera"
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <meta name="theme-color" content="#151922" />
  <meta name="description" content="{html.escape(description)}" />
  <title>{html.escape(page_title)}</title>
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TradeAcademy" />
  <meta property="og:title" content="{html.escape(page_title)}" />
  <meta property="og:description" content="{html.escape(description)}" />
  <meta property="og:image" content="{SITE_ORIGIN}/img/app-icon.png" />
  <meta name="twitter:card" content="summary" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/img/app-icon.png" />
  <link rel="stylesheet" href="/site.css" />
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="/"{home_current}>
        {mark_svg()}
        <span class="brand-text">
          <span class="brand-name">TradeAcademy</span>
          <span class="brand-sub">by Aithera</span>
        </span>
      </a>
      {nav_html(current)}
    </div>
  </header>
  <main id="content">
    {body.strip()}
  </main>
{footer_html()}</body>
</html>
"""


def phone(screen: str, alt: str, extra_class: str = "") -> str:
    cls = f"phone {extra_class}".strip()
    return (
        f'<figure class="{cls}"><img src="/img/screen-{screen}.webp" alt="{html.escape(alt)}" '
        'width="472" height="838" loading="lazy" decoding="async" /></figure>'
    )


FEATURES = [
    {
        "id": "learn",
        "screen": "home",
        "alt": "TradeAcademy Home screen: Your training center, with a Start Learning button for the Foundations path.",
        "eyebrow": "Learn",
        "title": "A training center that knows what to work on next",
        "body": "Home suggests your next lesson, drill, or review based on your progress. Academy paths start with market literacy, risk, and chart basics, then build from there.",
        "points": [
            "Guided paths from first concepts to process review",
            "Quick, normal, or deep sessions to fit your day",
            "Start in Guest mode — no account needed",
        ],
        "note": None,
    },
    {
        "id": "practice",
        "screen": "practice",
        "alt": "Practice drill 'Identify the trend' showing a labelled educational candlestick chart with higher highs and higher lows.",
        "eyebrow": "Practice",
        "title": "Short drills that train how you read a chart",
        "body": "Identify trends, spot breakouts, and name market structure in focused exercises that take a few minutes each.",
        "points": [
            "Bite-sized drills for chart reading and risk",
            "Each drill explains why the structure matters",
            "Track what you have and haven't completed",
        ],
        "note": "Drill charts are labelled educational examples, not live market data.",
    },
    {
        "id": "replay",
        "screen": "replay",
        "alt": "Decision Replay TV screen asking how you would have reasoned at a frozen point, featuring the 2020 COVID Crash episode.",
        "eyebrow": "Replay",
        "title": "Decision Replay TV: what would you have done?",
        "body": "Step into reconstructions of market episodes such as the 2020 COVID crash with the future hidden. Decide using only what was known at that moment — then reveal what happened next.",
        "points": [
            "The future stays hidden until you commit",
            "Waiting is a valid decision, too",
            "Scores measure your process, not whether price went your way",
        ],
        "note": "Replay bars are educational reconstructions, not exchange tick data.",
    },
    {
        "id": "simulate",
        "screen": "simulate",
        "alt": "Simulate screen labelled SIMULATED, showing a simulated portfolio with USD 100,000 in paper capital.",
        "eyebrow": "Simulate",
        "title": "Practise with $100,000 in simulated capital",
        "body": "Write a thesis and set your invalidation, then see how the trade plays out on a simulated price path. Every path is generated fresh, so you can't memorise the answer.",
        "points": [
            "Clearly labelled paper money — never real funds",
            "No brokerage connection and nothing is executed",
            "Reflection is part of every practice trade",
        ],
        "note": "A profitable simulated trade is not automatically a good decision. Simulated results do not predict real-world results.",
    },
    {
        "id": "events",
        "screen": "events",
        "alt": "Events screen suggesting a lesson, practice drill, replay, and simulation related to an upcoming central-bank decision.",
        "eyebrow": "Events",
        "title": "Study the events that move markets",
        "body": "When something like a central-bank decision is coming up, TradeAcademy suggests a related lesson, drill, replay, and scenario so you understand what such events can mean.",
        "points": [
            "A small learning calendar, not a news feed",
            "Scenarios show possibilities, not forecasts",
            "Your own training plan stays in charge",
        ],
        "note": "Event suggestions are study material — not trade alerts and not predictions.",
    },
]

LOOP = ["Learn", "Practice", "Replay", "Simulate", "Journal", "Review", "Improve"]


def coming_soon_badge() -> str:
    return (
        '<div class="soon-badge" role="note" aria-label="Coming soon to the App Store for iPhone and iPad">'
        '<span class="soon-dot" aria-hidden="true"></span>'
        '<span><span class="soon-top">Coming soon</span>'
        '<span class="soon-main">to the App Store</span></span></div>'
    )


def feature_section(index: int, feature: dict) -> str:
    points = "".join(f"<li>{html.escape(p)}</li>" for p in feature["points"])
    note = (
        f'<p class="feature-note">{html.escape(feature["note"])}</p>' if feature["note"] else ""
    )
    flip = " flip" if index % 2 else ""
    return f"""
      <section class="feature{flip}" id="{feature['id']}" aria-labelledby="{feature['id']}-title">
        <div class="feature-media">{phone(feature['screen'], feature['alt'])}</div>
        <div class="feature-copy">
          <p class="eyebrow">{html.escape(feature['eyebrow'])}</p>
          <h2 id="{feature['id']}-title">{html.escape(feature['title'])}</h2>
          <p class="feature-body">{html.escape(feature['body'])}</p>
          <ul class="checks">{points}</ul>
          {note}
        </div>
      </section>"""


def home_page() -> str:
    trust = [
        (
            "Educational purpose",
            "TradeAcademy teaches concepts and decision process through Academy, practice, replay, simulation, journal, and review — not live execution.",
        ),
        (
            "Simulation only",
            "Paper capital starts at USD 100,000. Prices may be synthetic, sample, delayed, or licensed historical and are labelled. Simulated P/L never grades competence.",
        ),
        (
            "Privacy principles",
            "Optional analytics are opt-in and allowlisted. Raw journal text, AI chat content, and portfolio values are not sent to analytics.",
        ),
        (
            "Account control",
            "You can review legal documents, manage subscription billing in the store, and request account deletion from Settings.",
        ),
    ]
    trust_html = "".join(
        f'<article class="principle"><h3>{html.escape(title)}</h3><p>{html.escape(body)}</p></article>'
        for title, body in trust
    )
    card_bits: list[str] = []
    for slug, (filename, title, blurb) in PAGES.items():
        md = (LEGAL / filename).read_text(encoding="utf-8")
        updated = extract_meta(md, "Last updated") or "See document"
        card_bits.append(
            f'<a class="card doc-card" href="/{slug}">'
            f'<div class="card-top"><h2>{html.escape(title)}</h2>'
            f'<span class="card-updated">Updated {html.escape(updated)}</span></div>'
            f'<p>{html.escape(blurb)}</p>'
            f'<span class="card-action">Read document</span></a>'
        )
    cards = "".join(card_bits)
    features_html = "".join(feature_section(i, f) for i, f in enumerate(FEATURES))
    loop_html = "".join(
        f'<li><span class="loop-num">{i + 1}</span>{html.escape(step)}</li>' for i, step in enumerate(LOOP)
    )
    body = f"""
    <div class="wrap">
      <section class="hero promo-hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">Trading education app · iPhone &amp; iPad</p>
          <h1 id="hero-title">Learn trading.<br /><span class="accent">Practice the decision.</span></h1>
          <p class="lede">TradeAcademy teaches trading through lessons, chart drills, historical replays, and a $100,000 paper simulator — all with simulated money, so you can practise without risking any.</p>
          <div class="hero-actions">
            {coming_soon_badge()}
            <a class="btn-ghost" href="#learn">See what's inside</a>
          </div>
          <p class="hero-fine">Free to download at launch, with optional Premium. Not available yet — we'll add the download link here the day it goes live.</p>
        </div>
        <div class="hero-media">
          {phone("practice", "Practice drill 'Identify the trend' with a labelled educational candlestick chart.", "phone-back")}
          {phone("home", "TradeAcademy Home screen: Your training center.", "phone-front")}
        </div>
      </section>

      <ul class="truth-strip" aria-label="What TradeAcademy is not">
        <li>Simulated money only</li>
        <li>Not a broker</li>
        <li>No buy/sell signals</li>
        <li>Try it without an account</li>
      </ul>

      {features_html}

      <section class="loop-section" aria-labelledby="loop-title">
        <p class="eyebrow">How it fits together</p>
        <h2 id="loop-title" class="section-title big">One loop, built around better decisions</h2>
        <p class="section-lede">Every part of the app feeds the next. You journal your reasoning, review the process behind each decision, and the app points you to what to train next.</p>
        <ol class="loop">{loop_html}</ol>
        <p class="feature-note">Your Decision Quality Score (DQS) rates the quality of your process — planning, risk, and discipline. It is never a prediction of where price will go.</p>
      </section>

      <section class="trust" aria-labelledby="trust-heading">
        <h2 id="trust-heading" class="section-title big">Honest by design</h2>
        <div class="principles">
          {trust_html}
        </div>
      </section>

      <section class="launch" aria-labelledby="launch-title">
        <h2 id="launch-title">TradeAcademy is coming soon</h2>
        <p>We're finishing the first release for iPhone and iPad. When it's live on the App Store, this page will link straight to it.</p>
        {coming_soon_badge()}
        <p class="mute">Questions before launch? <a href="mailto:support@tradeacademy.cloud">support@tradeacademy.cloud</a></p>
      </section>

      <p class="screens-note">Screens shown are from a pre-release build of the app and may change before launch.</p>

      <section class="docs" aria-labelledby="docs-heading">
        <h2 id="docs-heading" class="section-title">Legal &amp; support</h2>
        <p class="section-lede">Each document describes how TradeAcademy actually behaves. Operated by CML Electronics, trading as Aithera.</p>
        <div class="cards">
          {cards}
        </div>
      </section>
    </div>
    """
    return chrome(
        "TradeAcademy — Learn trading. Practice the decision. Coming soon",
        body,
        current=None,
        description="TradeAcademy is a trading education app with lessons, chart drills, historical replays, and a $100,000 paper simulator. Coming soon to the App Store. Simulated money only — not a broker and no buy/sell signals.",
    )


def not_found_page() -> str:
    body = """
    <div class="wrap narrow">
      <section class="hero">
        <h1>Page not found</h1>
        <p class="lede">That page doesn't exist on tradeacademy.cloud. Use the links below, or return home.</p>
      </section>
      <div class="cards">
        <a class="card" href="/"><h2>Home</h2><p>Product overview and legal index.</p></a>
        <a class="card" href="/support"><h2>Support</h2><p>How to get help in the app.</p></a>
      </div>
    </div>
    """
    return chrome(
        "Page not found",
        body,
        current=None,
        description="The requested TradeAcademy page was not found.",
    )


def wrap_legal(slug: str, title: str, md: str, blurb: str) -> str:
    body = f'<article class="wrap narrow legal">{template_notice(md)}{md_to_html(md)}</article>'
    return chrome(title, body, current=slug, description=blurb)


def write_page(path: Path, html_text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cleaned = "\n".join(line.rstrip() for line in html_text.splitlines()) + "\n"
    path.write_text(cleaned, encoding="utf-8")


def build_images() -> None:
    from PIL import Image

    IMG_OUT.mkdir(parents=True, exist_ok=True)
    for key, filename in SCREENS.items():
        src = Image.open(SCREENSHOT_SRC / filename).convert("RGB")
        top = round(src.height * SCREEN_CROP_TOP)
        src.crop((0, top, src.width, src.height)).save(
            IMG_OUT / f"screen-{key}.webp", "WEBP", quality=92, method=6
        )
    Image.open(APP_ICON_SRC).convert("RGB").resize((512, 512), Image.LANCZOS).save(
        IMG_OUT / "app-icon.png", optimize=True
    )


def main() -> None:
    HOSTED.mkdir(parents=True, exist_ok=True)
    WELL_KNOWN.mkdir(parents=True, exist_ok=True)

    shutil.copyfile(CSS_SRC, HOSTED / "site.css")
    build_images()
    (HOSTED / "favicon.svg").write_text(FAVICON, encoding="utf-8")
    (HOSTED / "robots.txt").write_text("User-agent: *\nAllow: /\n", encoding="utf-8")
    write_page(HOSTED / "index.html", home_page())
    write_page(HOSTED / "404.html", not_found_page())

    for slug, (filename, title, blurb) in PAGES.items():
        md = (LEGAL / filename).read_text(encoding="utf-8")
        page = wrap_legal(slug, title, md, blurb)
        write_page(HOSTED / f"{slug}.html", page)
        write_page(HOSTED / slug / "index.html", page)

    (WELL_KNOWN / "apple-app-site-association").write_text(AASA, encoding="utf-8")
    (WELL_KNOWN / "assetlinks.json").write_text(ASSETLINKS, encoding="utf-8")

    (HOSTED / "_headers").write_text(
        """# Custom headers for Cloudflare Pages (legal + deep-link hosting)

/.well-known/apple-app-site-association
  Content-Type: application/json
  Cache-Control: public, max-age=300

/.well-known/assetlinks.json
  Content-Type: application/json
  Cache-Control: public, max-age=300

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
""",
        encoding="utf-8",
    )

    (HOSTED / "README.md").write_text(
        """# Cloudflare Pages — TradeAcademy legal site

Generated by `python scripts/build-hosted-legal.py` (re-run via `npm run legal`).

Deploy this folder as the **site root** for **https://tradeacademy.cloud** after the
Namecheap → Cloudflare domain transfer.

## Deploy (Cloudflare Pages)

1. Workers & Pages → Create → Pages (Git connect to this repo, or direct upload).
2. If Git: set root / output to `store/hosted` (static — no build required).
3. Attach custom domains `tradeacademy.cloud` and `www.tradeacademy.cloud`.
4. SSL/TLS → Full (strict).

Direct upload:

```bash
npx wrangler pages deploy store/hosted --project-name tradeacademy-legal
```

## Required live URLs (HTTP 200)

- `/privacy` `/terms` `/risk` `/security` `/account-deletion` `/support`
- `/.well-known/apple-app-site-association` (`application/json` via `_headers`)
- `/.well-known/assetlinks.json`

## Before store submission

1. Confirm Apple Team ID `833CYAZ8XT` in `.well-known/apple-app-site-association`.
2. Replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` in `.well-known/assetlinks.json`.
3. Verify mailboxes privacy@ / support@ / security@tradeacademy.cloud.
4. See `docs/DOMAIN_TRANSFER_WAITLIST.md`.
""",
        encoding="utf-8",
    )
    print(f"wrote hosted pages under {HOSTED}")


if __name__ == "__main__":
    main()
