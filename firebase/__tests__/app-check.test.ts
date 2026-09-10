import { resolveAppCheckInitMode } from '../app-check-mode';

describe('App Check init mode', () => {
  it('uses debug tokens only in development', () => {
    expect(
      resolveAppCheckInitMode({ isDev: true, platform: 'ios', recaptchaSiteKey: 'site' }),
    ).toBe('debug');
    expect(
      resolveAppCheckInitMode({ isDev: true, platform: 'web', recaptchaSiteKey: 'site' }),
    ).toBe('debug');
  });

  it('does not attach debug placeholders in production', () => {
    expect(resolveAppCheckInitMode({ isDev: false, platform: 'ios' })).toBe('unattested');
    expect(resolveAppCheckInitMode({ isDev: false, platform: 'android' })).toBe('unattested');
    expect(resolveAppCheckInitMode({ isDev: false, platform: 'web' })).toBe('unattested');
  });

  it('uses ReCaptcha on production web when a site key is configured', () => {
    expect(
      resolveAppCheckInitMode({
        isDev: false,
        platform: 'web',
        recaptchaSiteKey: 'recaptcha-public-site-key',
      }),
    ).toBe('recaptcha');
  });
});
