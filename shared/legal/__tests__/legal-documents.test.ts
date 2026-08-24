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
import { ANALYTICS_EVENTS, ANALYTICS_PROP_KEYS } from '@/shared/services/analytics/events';

describe('legal compliance pack', () => {
  it('exposes CH/EU/US-oriented document set with versioned acceptance', () => {
    expect(LEGAL_ACCEPTANCE_VERSION).toBe('2026.08.24');
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
    expect(LEGAL_COUNSEL_NOTICE.toLowerCase()).toContain('not production');
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
    expect(privacy).toContain('[legal entity name required]');
    expect(privacy).toContain('höglerstrasse 55');
    expect(privacy).toContain('[official domain required]');
    expect(privacy).toContain('journal text');
    expect(privacy).toContain('cloud_ai_enabled');
    expect(privacy).toContain('12+');
    expect(privacy).toContain('does not mean a minor may legally trade');

    const terms = LEGAL_DOCUMENT_TEXT.terms.toLowerCase();
    expect(terms).toContain('not');
    expect(terms).toContain('broker');
    expect(terms).toContain('switzerland');
    expect(terms).toContain('create an account or purchase a subscription');
    expect(terms).toContain('guest/demo mode');
    expect(terms).toContain('store content rating is separate');
    expect(terms).toContain('not offered at launch');

    expect(privacy).toContain('general audience');
    expect(privacy).toContain('not directed toward young children');
    expect(privacy).toContain('cloud account features');

    const risk = LEGAL_DOCUMENT_TEXT.risk.toLowerCase();
    expect(risk).toContain('decision quality score');
    expect(risk).toContain('neither score predicts');
    expect(risk).toContain('investment advice');
    expect(risk).toContain('not permission to trade');

    const deletion = LEGAL_DOCUMENT_TEXT.accountDeletion.toLowerCase();
    expect(deletion).toContain('does not cancel');
    expect(deletion).toContain('manage subscription');
    expect(deletion).toContain('shared educational content');

    const security = LEGAL_DOCUMENT_TEXT.security.toLowerCase();
    expect(security).toContain('tls');
    expect(security).toContain('breach');
    expect(security).toContain('[security email required]');
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

  it('does not invent production mailboxes from the technical URL fallback', () => {
    expect(LEGAL_URLS.privacyEmail).not.toMatch(/@tradevision\.ai/i);
    expect(LEGAL_URLS.securityEmail).not.toMatch(/@tradevision\.ai/i);
    expect(LEGAL_URLS.supportEmail).not.toMatch(/@tradevision\.ai/i);
  });

  it('keeps product analytics on an allowlist without user-content fields', () => {
    const events = ANALYTICS_EVENTS.join(' ');
    const props = ANALYTICS_PROP_KEYS.join(' ');
    expect(events).not.toMatch(/journal|prompt|chat|holding|password|token/i);
    expect(props).not.toMatch(/journal|prompt|chat|holding|password|token/i);
  });
});
