export type LegalBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'rule' };

export type LegalInline =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: LegalInline[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; children: LegalInline[] };

const HEADING = /^(#{1,3})\s+(.+)$/;
const UNORDERED = /^[-*]\s+(.+)$/;
const ORDERED = /^(\d+)\.\s+(.+)$/;
const TABLE_ROW = /^\|.+\|$/;
const RULE = /^-{3,}$/;

function splitTableRow(line: string): string[] {
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  return /^\|[\s:|-]+\|$/.test(line);
}

function isBlockStart(line: string): boolean {
  return (
    HEADING.test(line) ||
    UNORDERED.test(line) ||
    ORDERED.test(line) ||
    TABLE_ROW.test(line) ||
    RULE.test(line)
  );
}

export function parseLegalMarkdown(markdown: string): LegalBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: LegalBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i] ?? '';
    const line = raw.trimEnd();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (RULE.test(line.trim())) {
      blocks.push({ type: 'rule' });
      i += 1;
      continue;
    }

    if (TABLE_ROW.test(line.trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && TABLE_ROW.test((lines[i] ?? '').trim())) {
        tableLines.push((lines[i] ?? '').trim());
        i += 1;
      }
      const bodyLines = tableLines.filter((row) => !isTableDivider(row));
      if (bodyLines.length > 0) {
        const headers = splitTableRow(bodyLines[0]);
        const rows = bodyLines.slice(1).map(splitTableRow);
        blocks.push({ type: 'table', headers, rows });
      }
      continue;
    }

    const unordered = line.match(UNORDERED);
    if (unordered) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = (lines[i] ?? '').trimEnd().match(UNORDERED);
        if (!match) break;
        items.push(match[1]);
        i += 1;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    const ordered = line.match(ORDERED);
    if (ordered) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = (lines[i] ?? '').trimEnd().match(ORDERED);
        if (!match) break;
        items.push(match[2]);
        i += 1;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    const parts: string[] = [];
    let previousHardBreak = false;
    while (i < lines.length) {
      const current = lines[i] ?? '';
      if (!current.trim() || isBlockStart(current.trimEnd())) break;
      const hardBreak = / {2}$/.test(current);
      const content = current.trim();
      if (parts.length === 0) {
        parts.push(content);
      } else if (previousHardBreak) {
        parts.push(`\n${content}`);
      } else {
        parts.push(` ${content}`);
      }
      previousHardBreak = hardBreak;
      i += 1;
    }
    const text = parts.join('').trim();
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
  }

  return blocks;
}

export function parseLegalInline(text: string): LegalInline[] {
  const nodes: LegalInline[] = [];
  const pattern =
    /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|https?:\/\/[^\s)]+)/gi;
  let last = 0;
  let match: RegExpExecArray | null = pattern.exec(text);

  while (match) {
    if (match.index > last) {
      nodes.push({ type: 'text', value: text.slice(last, match.index) });
    }

    const [full, , bold, code, label, href] = match;
    if (bold) {
      nodes.push({ type: 'bold', children: parseLegalInline(bold) });
    } else if (code) {
      nodes.push({ type: 'code', value: code });
    } else if (label && href) {
      nodes.push({ type: 'link', href, children: parseLegalInline(label) });
    } else if (full.includes('@') && !full.includes('://')) {
      nodes.push({ type: 'link', href: `mailto:${full}`, children: [{ type: 'text', value: full }] });
    } else {
      nodes.push({ type: 'link', href: full, children: [{ type: 'text', value: full }] });
    }

    last = match.index + full.length;
    match = pattern.exec(text);
  }

  if (last < text.length) {
    nodes.push({ type: 'text', value: text.slice(last) });
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', value: text }];
}

const HOSTED_PATH_TO_DOC: Record<string, string> = {
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/risk': 'risk',
  '/security': 'security',
  '/account-deletion': 'accountDeletion',
  '/support': 'support',
};

/** Map a hosted or relative legal URL to an in-app route when possible. */
export function inAppLegalPath(href: string): string | null {
  if (href.startsWith('/legal/')) return href;

  const path = (() => {
    try {
      return new URL(href).pathname.replace(/\/$/, '') || '/';
    } catch {
      return href.replace(/\/$/, '') || '/';
    }
  })();

  const doc = HOSTED_PATH_TO_DOC[path];
  return doc ? `/legal/${doc}` : null;
}
