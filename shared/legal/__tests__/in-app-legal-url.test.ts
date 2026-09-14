import { IN_APP_LEGAL_URLS, parseInAppLegalPath, rewriteIncomingLegalPath } from '@/shared/legal';

describe('in-app legal deep links', () => {
  it('builds custom-scheme URLs for the RevenueCat dashboard', () => {
    expect(IN_APP_LEGAL_URLS.terms).toBe('tradeacademy://legal/terms');
    expect(IN_APP_LEGAL_URLS.privacy).toBe('tradeacademy://legal/privacy');
    expect(IN_APP_LEGAL_URLS.risk).toBe('tradeacademy://legal/risk');
    expect(IN_APP_LEGAL_URLS.support).toBe('tradeacademy://legal/support');
  });

  it('maps RevenueCat-style scheme URLs onto /legal/:doc', () => {
    expect(parseInAppLegalPath('tradeacademy://legal/terms')).toBe('/legal/terms');
    expect(parseInAppLegalPath('tradeacademy://legal/privacy')).toBe('/legal/privacy');
    expect(parseInAppLegalPath('tradeacademy:///legal/privacy')).toBe('/legal/privacy');
    expect(parseInAppLegalPath('tradeacademy://legal/privacy_policy')).toBe('/legal/privacy');
    expect(parseInAppLegalPath('tradeacademy://legal/privacy-policy')).toBe('/legal/privacy');
  });

  it('maps hosted HTTPS legal paths onto the in-app reader', () => {
    expect(parseInAppLegalPath('https://tradeacademy.cloud/terms')).toBe('/legal/terms');
    expect(parseInAppLegalPath('https://www.tradeacademy.cloud/privacy')).toBe('/legal/privacy');
    expect(parseInAppLegalPath('https://tradeacademy.cloud/account-deletion')).toBe(
      '/legal/accountDeletion',
    );
  });

  it('leaves unrelated URLs unchanged when rewriting native-intent paths', () => {
    expect(rewriteIncomingLegalPath('tradeacademy://legal/terms')).toBe('/legal/terms');
    expect(rewriteIncomingLegalPath('/(tabs)')).toBeNull();
  });
});
