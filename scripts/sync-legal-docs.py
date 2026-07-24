from pathlib import Path
import json

root = Path(r"C:/Money/Trading_App")
legal = root / "store" / "legal"
out = root / "shared" / "legal"
out.mkdir(parents=True, exist_ok=True)

docs = {
    "privacy": "privacy-policy.md",
    "terms": "terms-of-service.md",
    "risk": "risk-disclaimer.md",
    "accountDeletion": "account-deletion.md",
    "security": "security-notice.md",
}

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
    "  privacy: { title: 'Privacy Policy', lastUpdated: '24 July 2026', version: '2026.07.24' },",
    "  terms: { title: 'Terms of Service', lastUpdated: '24 July 2026', version: '2026.07.24' },",
    "  risk: { title: 'Risk & Investment Disclaimer', lastUpdated: '24 July 2026', version: '2026.07.24' },",
    "  accountDeletion: { title: 'Account Deletion Notice', lastUpdated: '24 July 2026', version: '2026.07.24' },",
    "  security: { title: 'Security & Cybersecurity Notice', lastUpdated: '24 July 2026', version: '2026.07.24' },",
    "};",
    "",
    "export const LEGAL_DOCUMENT_TEXT: Record<LegalDocumentId, string> = {",
]

for key, filename in docs.items():
    text = (legal / filename).read_text(encoding="utf-8")
    lines.append(f"  {key}: {json.dumps(text)},")

lines.append("};")
lines.append("")

target = out / "document-text.ts"
target.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote {target} ({target.stat().st_size} bytes)")
