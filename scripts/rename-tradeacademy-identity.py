"""One-shot identity rename: TradeVision/TradeInsight → TradeAcademy.

Does not touch node_modules, .git, binaries, or generated native folders.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {
    ".git",
    "node_modules",
    ".expo",
    "dist",
    "coverage",
    "ios",
    "android",
    ".cursor",
    "certs",
}
EXTS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".html",
    ".yml",
    ".yaml",
    ".txt",
    ".example",
    ".css",
}
SPECIAL_NAMES = {".env.example", "AGENTS.md", "CLAUDE.md", "README.md"}

REPLACEMENTS = (
    ("TradeInsight", "TradeAcademy"),
    ("tradeinsight", "tradeacademy"),
    ("TRADEINSIGHT", "TRADEACADEMY"),
    ("TradeVision", "TradeAcademy"),
    ("TRADEVISION", "TRADEACADEMY"),
    ("tradevision", "tradeacademy"),
)


def should_process(path: Path) -> bool:
    if path.name in SPECIAL_NAMES:
        return True
    if path.suffix.lower() not in EXTS:
        return False
    return True


def main() -> None:
    changed = 0
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if not should_process(path):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        updated = text
        for old, new in REPLACEMENTS:
            updated = updated.replace(old, new)
        if path.name in {"app.config.ts", "brand.ts"}:
            updated = updated.replace("slug: 'traders'", "slug: 'tradeacademy'")
            updated = updated.replace("expoSlug: 'traders'", "expoSlug: 'tradeacademy'")
        if updated != text:
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed += 1
            print(path.relative_to(ROOT))
    print(f"updated {changed} files")


if __name__ == "__main__":
    main()
