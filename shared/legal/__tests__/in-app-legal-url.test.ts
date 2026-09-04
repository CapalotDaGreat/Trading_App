import { IN_APP_LEGAL_URLS, parseInAppLegalPath, rewriteIncomingLegalPath } from '@/shared/legal';

describe('in-app legal deep links', () => {
  it('builds custom-scheme URLs for the RevenueCat dashboard', () => {
    expect(IN_APP_LEGAL_URLS.terms).toBe('tradevision://legal/terms');
    expect(IN_APP_LEGAL_URLS.privacy).toBe('tradevision://legal/privacy');
    expect(IN_APP_LEGAL_URLS.risk).toBe('tradevision://legal/risk');
    expect(IN_APP_LEGAL_URLS.support).toBe('tradevision://legal/support');
  });

  it('maps RevenueCat-style scheme URLs onto /legal/:doc', () => {
    expect(parseInAppLegalPath('tradevision://legal/terms')).toBe('/legal/terms');
    expect(parseInAppLegalPath('tradevision://legal/privacy')).toBe('/legal/privacy');
    expect(parseInAppLegalPath('tradevision:///legal/privacy')).toBe('/legal/privacy');
    expect(parseInAppLegalPath('tradevision://legal/privacy_policy')).toBe('/legal/privacy');
    expect(parseInAppLegalPath('tradevision://legal/privacy-policy')).toBe('/legal/privacy');
  });

  it('maps hosted HTTPS legal paths onto the in-app reader', () => {
    expect(parseInAppLegalPath('https://tradevision.ai/terms')).toBe('/legal/terms');
    expect(parseInAppLegalPath('https://www.tradevision.ai/privacy')).toBe('/legal/privacy');
    expect(parseInAppLegalPath('https://tradevision.ai/account-deletion')).toBe(
      '/legal/accountDeletion',
    );
  });

  it('leaves unrelated URLs unchanged when rewriting native-intent paths', () => {
    expect(rewriteIncomingLegalPath('tradevision://legal/terms')).toBe('/legal/terms');
    expect(rewriteIncomingLegalPath('/(tabs)')).toBeNull();
  });
});
