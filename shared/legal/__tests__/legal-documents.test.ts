import {
  LEGAL_ACCEPTANCE_VERSION,
  LEGAL_COUNSEL_NOTICE,
  LEGAL_URLS,
} from '@/shared/constants/legal';
import {
  LEGAL_DOCUMENT_META,
  LEGAL_DOCUMENT_TEXT,
  LEGAL_DOCUMENT_URL,
  LEGAL_DOCUMENTS,
} from '@/shared/legal';

describe('legal compliance pack', () => {
  it('exposes CH/EU/US-oriented document set with versioned acceptance', () => {
    expect(LEGAL_ACCEPTANCE_VERSION).toBe('2026.07.24');
    expect(LEGAL_DOCUMENTS).toEqual([
      'terms',
      'privacy',
      'risk',
      'accountDeletion',
      'security',
    ]);
    expect(LEGAL_COUNSEL_NOTICE.toLowerCase()).toContain('counsel');
    expect(LEGAL_COUNSEL_NOTICE).toContain('TradeInsight');
    expect(LEGAL_COUNSEL_NOTICE).toContain('Aithera');
  });

  it('keeps in-app text aligned with required policy topics', () => {
    const privacy = LEGAL_DOCUMENT_TEXT.privacy.toLowerCase();
    expect(privacy).toContain('aithera');
    expect(privacy).toContain('tradeinsight');
    expect(privacy).toContain('nfadp');
    expect(privacy).toContain('gdpr');
    expect(privacy).toContain('ccpa');
    expect(privacy).toContain('crash');
    expect(privacy).toContain('do not sell');

    const terms = LEGAL_DOCUMENT_TEXT.terms.toLowerCase();
    expect(terms).toContain('not');
    expect(terms).toContain('broker');
    expect(terms).toContain('switzerland');
    expect(terms).toContain('create an account or purchase a subscription');
    expect(terms).toContain('guest/demo mode');

    expect(privacy).toContain('general audience');
    expect(privacy).toContain('not directed toward young children');
    expect(privacy).toContain('cloud account features');

    const risk = LEGAL_DOCUMENT_TEXT.risk.toLowerCase();
    expect(risk).toContain('decision quality score');
    expect(risk).toContain('neither score predicts');
    expect(risk).toContain('investment advice');

    const deletion = LEGAL_DOCUMENT_TEXT.accountDeletion.toLowerCase();
    expect(deletion).toContain('does not cancel');
    expect(deletion).toContain('manage subscription');

    const security = LEGAL_DOCUMENT_TEXT.security.toLowerCase();
    expect(security).toContain('tls');
    expect(security).toContain('breach');
  });

  it('maps every document to meta, text, and hosted URL', () => {
    for (const id of LEGAL_DOCUMENTS) {
      expect(LEGAL_DOCUMENT_META[id].version).toBe(LEGAL_ACCEPTANCE_VERSION);
      expect(LEGAL_DOCUMENT_TEXT[id].length).toBeGreaterThan(500);
      expect(LEGAL_DOCUMENT_URL[id]).toMatch(/^https:\/\//);
    }
    expect(LEGAL_URLS.risk).toContain('/risk');
    expect(LEGAL_URLS.security).toContain('/security');
  });
});
