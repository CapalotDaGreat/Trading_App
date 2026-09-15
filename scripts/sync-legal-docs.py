from pathlib import Path
import json
import re

root = Path(r"C:/Money/Trading_App")
legal = root / "store" / "legal"
out = root / "shared" / "legal"
out.mkdir(parents=True, exist_ok=True)

docs = {
    "privacy": ("privacy-policy.md", "Privacy Policy"),
    "terms": ("terms-of-service.md", "Terms of Service"),
    "risk": ("risk-disclaimer.md", "Risk & Investment Disclaimer"),
    "accountDeletion": ("account-deletion.md", "Account Deletion Notice"),
    "security": ("security-notice.md", "Security & Cybersecurity Notice"),
}

META_RE = re.compile(r"^\*\*(Last updated|Version):\*\*\s*(.+)$", re.M)


def extract_meta(text: str) -> tuple[str, str]:
    found = {m.group(1): m.group(2).strip() for m in META_RE.finditer(text)}
    return found.get("Last updated", "—"), found.get("Version", "—")


lines = [
    "/** Auto-synced from store/legal — update markdown sources, then re-run scripts/sync-legal-docs.py. */",
    "",
    "export type LegalDocumentId =",
    "  | 'privacy'",
    "  | 'terms'",
    "  | 'risk'",
    "  | 'accountDeletion'",
    "  | 'security';",
    "",
    "export const LEGAL_DOCUMENT_META: Record<",
    "  LegalDocumentId,",
    "  { title: string; lastUpdated: string; version: string }",
    "> = {",
]

texts: dict[str, str] = {}
for key, (filename, title) in docs.items():
    text = (legal / filename).read_text(encoding="utf-8")
    texts[key] = text
    last_updated, version = extract_meta(text)
    lines.append(
        f"  {key}: {{ title: {json.dumps(title)}, lastUpdated: {json.dumps(last_updated)}, version: {json.dumps(version)} }},"
    )

lines.append("};")
lines.append("")
lines.append("export const LEGAL_DOCUMENT_TEXT: Record<LegalDocumentId, string> = {")

for key in docs:
    lines.append(f"  {key}: {json.dumps(texts[key])},")

lines.append("};")
lines.append("")

target = out / "document-text.ts"
target.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote {target} ({target.stat().st_size} bytes)")
