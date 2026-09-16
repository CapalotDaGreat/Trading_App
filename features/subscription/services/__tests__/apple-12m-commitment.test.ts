import {
  APPLE_12M_COMMITMENT_MIN_OS,
  isApple12mCommitmentOsSupported,
  isApple12mCommitmentPlatformEligible,
  isCommitmentProductIdentifier,
  parseOsVersion,
} from '../apple-12m-commitment';

describe('Apple 12-month commitment availability', () => {
  it('parses OS versions', () => {
    expect(parseOsVersion('26.4')).toEqual({ major: 26, minor: 4 });
    expect(parseOsVersion('26.4.1')).toEqual({ major: 26, minor: 4 });
    expect(parseOsVersion(18)).toEqual({ major: 18, minor: 0 });
  });

  it(`requires iOS ${APPLE_12M_COMMITMENT_MIN_OS.major}.${APPLE_12M_COMMITMENT_MIN_OS.minor}+`, () => {
    expect(isApple12mCommitmentOsSupported('26.3')).toBe(false);
    expect(isApple12mCommitmentOsSupported('26.4')).toBe(true);
    expect(isApple12mCommitmentOsSupported('27.0')).toBe(true);
    expect(isApple12mCommitmentOsSupported('18.5')).toBe(false);
  });

  it('is iOS-only', () => {
    expect(isApple12mCommitmentPlatformEligible('ios', '26.4')).toBe(true);
    expect(isApple12mCommitmentPlatformEligible('android', '26.4')).toBe(false);
    expect(isApple12mCommitmentPlatformEligible('web', '26.4')).toBe(false);
  });

  it('recognizes commitment product identifiers', () => {
    expect(isCommitmentProductIdentifier('tradeacademy_premium_monthly_12m_commitment')).toBe(
      true,
    );
    expect(isCommitmentProductIdentifier('tradeacademy_premium_monthly')).toBe(false);
    expect(isCommitmentProductIdentifier('tradeacademy_premium_yearly')).toBe(false);
  });
});
