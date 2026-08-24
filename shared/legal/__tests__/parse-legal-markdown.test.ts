import { LEGAL_DOCUMENT_META, LEGAL_DOCUMENT_TEXT } from '@/shared/legal';
import {
  inAppLegalPath,
  parseLegalInline,
  parseLegalMarkdown,
} from '@/shared/legal/parse-legal-markdown';

describe('parseLegalMarkdown', () => {
  it('parses headings, lists, tables, and hard line breaks', () => {
    const blocks = parseLegalMarkdown(
      [
        '# Privacy Policy',
        '',
        '**Last updated:** 24 July 2026  ',
        '**Version:** 2026.07.24',
        '',
        '## 2. Categories',
        '',
        '| Category | Examples |',
        '| --- | --- |',
        '| Account | Email, UID |',
        '',
        '- Not a broker',
        '- No buy/sell signals',
        '',
        '1. Open Settings.',
        '2. Type DELETE.',
      ].join('\n'),
    );

    expect(blocks[0]).toEqual({ type: 'heading', level: 1, text: 'Privacy Policy' });
    expect(blocks[1]).toMatchObject({ type: 'paragraph' });
    expect((blocks[1] as { text: string }).text).toContain('Last updated');
    expect((blocks[1] as { text: string }).text).toContain('\n');
    expect(blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'heading', level: 2, text: '2. Categories' }),
        expect.objectContaining({
          type: 'table',
          headers: ['Category', 'Examples'],
          rows: [['Account', 'Email, UID']],
        }),
        expect.objectContaining({ type: 'list', ordered: false, items: ['Not a broker', 'No buy/sell signals'] }),
        expect.objectContaining({ type: 'list', ordered: true, items: ['Open Settings.', 'Type DELETE.'] }),
      ]),
    );
  });

  it('renders every shipped legal document into readable blocks', () => {
    for (const [id, markdown] of Object.entries(LEGAL_DOCUMENT_TEXT)) {
      const blocks = parseLegalMarkdown(markdown);
      expect(blocks.length).toBeGreaterThan(8);
      expect(blocks.some((block) => block.type === 'heading')).toBe(true);
      expect(blocks.some((block) => block.type === 'paragraph')).toBe(true);
      const first = blocks[0];
      if (first.type === 'heading' && first.level === 1) {
        expect(first.text).toBe(LEGAL_DOCUMENT_META[id as keyof typeof LEGAL_DOCUMENT_META].title);
      }
    }
  });
});

describe('parseLegalInline', () => {
  it('marks bold, code, emails, and legal URLs', () => {
    const nodes = parseLegalInline(
      'Contact **privacy@tradevision.ai** or visit https://tradevision.ai/privacy and use `DELETE`.',
    );
    expect(nodes.some((node) => node.type === 'bold')).toBe(true);
    expect(nodes.some((node) => node.type === 'code' && node.value === 'DELETE')).toBe(true);
    expect(
      nodes.some((node) => node.type === 'link' && node.href === 'https://tradevision.ai/privacy'),
    ).toBe(true);
  });
});

describe('inAppLegalPath', () => {
  it('maps hosted legal URLs onto in-app routes', () => {
    expect(inAppLegalPath('https://tradevision.ai/terms')).toBe('/legal/terms');
    expect(inAppLegalPath('/account-deletion')).toBe('/legal/accountDeletion');
    expect(inAppLegalPath('https://example.com/other')).toBeNull();
  });
});
