import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  LEGAL_ACCEPTANCE_VERSION,
  LEGAL_COUNSEL_NOTICE,
  LEGAL_URLS,
} from '@/shared/constants/legal';
import { BRAND, DEFAULT_LEGAL_SITE_ORIGIN } from '@/shared/constants/brand';
import {
  LEGAL_DOCUMENT_META,
  LEGAL_DOCUMENT_TEXT,
  LEGAL_DOCUMENT_URL,
  LEGAL_DOCUMENTS,
} from '@/shared/legal';
import { ANALYTICS_EVENTS, ANALYTICS_PROP_KEYS } from '@/shared/services/analytics/events';

describe('legal compliance pack', () => {
  it('exposes CH/EU/US-oriented document set with versioned acceptance', () => {
    expect(LEGAL_ACCEPTANCE_VERSION).toBe('2026.09.16');
    expect(LEGAL_DOCUMENTS).toEqual([
      'terms',
      'privacy',
      'risk',
      'accountDeletion',
      'security',
    ]);
    expect(LEGAL_COUNSEL_NOTICE.toLowerCase()).toContain('counsel');
    expect(LEGAL_COUNSEL_NOTICE).toContain('TradeAcademy');
    expect(LEGAL_COUNSEL_NOTICE).toContain('Aithera');
    expect(LEGAL_COUNSEL_NOTICE).toContain('CML Electronics');
    expect(BRAND.legalEntity).toBe('CML Electronics');
    expect(BRAND.company).toBe('Aithera');
  });

  it('keeps in-app text aligned with required policy topics', () => {
    const privacy = LEGAL_DOCUMENT_TEXT.privacy.toLowerCase();
    expect(privacy).toContain('aithera');
    expect(privacy).toContain('tradeacademy');
    expect(privacy).toContain('cml electronics');
    expect(privacy).toContain('nfadp');
    expect(privacy).toContain('gdpr');
    expect(privacy).toContain('ccpa');
    expect(privacy).toContain('crash');
    expect(privacy).toContain('do not sell');
    expect(privacy).toContain('höglerstrasse 55');
    expect(privacy).toContain('https://tradeacademy.cloud');
    expect(privacy).toContain('privacy@tradeacademy.cloud');
    expect(privacy).toContain('journal text');
    expect(privacy).toContain('cloud_ai_enabled');
    expect(privacy).toContain('4+');
    expect(privacy).toContain('does not mean a minor may legally trade');
    expect(privacy).not.toMatch(/\[legal entity name required\]|\[vat\/uid required\]|\[official domain required\]/i);
    expect(privacy).not.toMatch(/tradeinsight|tradevision/i);
    expect(privacy).not.toMatch(/\*\*vat\/uid:\*\*/i);

    const terms = LEGAL_DOCUMENT_TEXT.terms.toLowerCase();
    expect(terms).toContain('not');
    expect(terms).toContain('broker');
    expect(terms).toContain('switzerland');
    expect(terms).toContain('cml electronics');
    expect(terms).toContain('create an account or purchase a subscription');
    expect(terms).toContain('guest/demo mode');
    expect(terms).toContain('store content rating is separate');
    expect(terms).toContain('lifetime is a one-time purchase');
    expect(terms).toContain('tradeacademy_premium_monthly');
    expect(terms).toContain('tradeacademy_premium_yearly');
    expect(terms).toContain('tradeacademy_premium_monthly_12m_commitment');
    expect(terms).toContain('12-month commitment');
    expect(terms).not.toMatch(/tradeinsight|tradevision/i);
    expect(terms).not.toMatch(/\[legal entity name required\]|\[vat\/uid required\]/i);

    expect(privacy).toContain('general audience');
    expect(privacy).toContain('not directed toward young children');
    expect(privacy).toContain('cloud account features');

    const risk = LEGAL_DOCUMENT_TEXT.risk.toLowerCase();
    expect(risk).toContain('decision quality score');
    expect(risk).toContain('neither score predicts');
    expect(risk).toContain('investment advice');
    expect(risk).toContain('not permission to trade');
    expect(risk).toContain('simulation performance does not demonstrate live trading competence');
    expect(risk).toContain('training-readiness');

    const deletion = LEGAL_DOCUMENT_TEXT.accountDeletion.toLowerCase();
    expect(deletion).toContain('does not cancel');
    expect(deletion).toContain('manage subscription');
    expect(deletion).toContain('shared educational content');

    const security = LEGAL_DOCUMENT_TEXT.security.toLowerCase();
    expect(security).toContain('tls');
    expect(security).toContain('breach');
    expect(security).toContain('security@tradeacademy.cloud');
  });

  it('maps every document to meta, text, and hosted URL', () => {
    for (const id of LEGAL_DOCUMENTS) {
      expect(LEGAL_DOCUMENT_META[id].version).toBe(LEGAL_ACCEPTANCE_VERSION);
      expect(LEGAL_DOCUMENT_TEXT[id].length).toBeGreaterThan(500);
      expect(LEGAL_DOCUMENT_URL[id]).toMatch(/^https:\/\//);
    }
    expect(LEGAL_URLS.risk).toContain('/risk');
    expect(LEGAL_URLS.security).toContain('/security');
    expect(DEFAULT_LEGAL_SITE_ORIGIN).toBe('https://tradeacademy.cloud');
  });

  it('publishes official @tradeacademy.cloud mailboxes by default', () => {
    expect(LEGAL_URLS.privacyEmail).toBe('mailto:privacy@tradeacademy.cloud');
    expect(LEGAL_URLS.securityEmail).toBe('mailto:security@tradeacademy.cloud');
    expect(LEGAL_URLS.supportEmail).toBe('mailto:support@tradeacademy.cloud');
  });

  it('keeps product analytics on an allowlist without user-content fields', () => {
    const events = ANALYTICS_EVENTS.join(' ');
    const props = ANALYTICS_PROP_KEYS.join(' ');
    expect(events).not.toMatch(/journal|prompt|chat|holding|password|token/i);
    expect(props).not.toMatch(/journal|prompt|chat|holding|password|token/i);
  });

  it('keeps hosted legal pages on TradeAcademy without template placeholders', () => {
    const hosted = readFileSync(join(__dirname, '../../../store/hosted/terms.html'), 'utf8');
    expect(hosted).toContain('TradeAcademy');
    expect(hosted).toContain('CML Electronics');
    expect(hosted).not.toMatch(/TradeInsight|TradeVision/);
    expect(hosted).not.toContain('Template — not a live operator publication');
    expect(hosted).not.toContain('[LEGAL ENTITY NAME REQUIRED]');
    expect(hosted).not.toContain('[VAT/UID REQUIRED]');
  });

  it('renders hosted legal HTML with app chrome and readable tables', () => {
    const hostedDir = join(__dirname, '../../../store/hosted');
    const home = readFileSync(join(hostedDir, 'index.html'), 'utf8');
    const privacy = readFileSync(join(hostedDir, 'privacy.html'), 'utf8');

    expect(home).toContain('Official legal, privacy, security &amp; support center');
    expect(home).toContain('TradeAcademy');
    expect(home).toContain('by Aithera');
    expect(home).toContain('CML Electronics');
    expect(home).toContain('Learn → Practice → Replay → Simulate → Journal → Review → Improve');
    expect(home).toContain('Updated 16 September 2026');
    expect(home).toContain('Read document');
    expect(home).toContain('/site.css');
    expect(home).not.toMatch(/TradeInsight|TradeVision/);
    expect(home).not.toContain('Bracketed operator fields');

    expect(privacy).toContain('site.css');
    expect(privacy).toContain('<table');
    expect(privacy).toContain('data-label');
    expect(privacy).toContain('doc-meta');
    expect(privacy).toContain('Last updated');
    expect(privacy).toContain('CML Electronics');
    expect(privacy).toContain('privacy@tradeacademy.cloud');
    expect(privacy).not.toContain('<pre>');
    expect(privacy).not.toContain('VAT/UID');
  });
});
