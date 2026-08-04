import { PRODUCT_ANALYTICS_CONSENT_VERSION } from '@/shared/services/analytics/events';

import {
  CRASH_REPORTING_CONSENT_VERSION,
  migrateSettingsState,
  useSettingsStore,
} from '../settings.store';

describe('privacy consents', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('defaults crash reporting and analytics to disabled', () => {
    expect(useSettingsStore.getState().crashReportingEnabled).toBe(false);
    expect(useSettingsStore.getState().productAnalyticsEnabled).toBe(false);

    useSettingsStore.getState().setCrashReportingEnabled(true);
    useSettingsStore.getState().setProductAnalyticsEnabled(true);

    expect(useSettingsStore.getState()).toMatchObject({
      crashReportingEnabled: true,
      crashReportingConsentVersion: CRASH_REPORTING_CONSENT_VERSION,
      productAnalyticsEnabled: true,
      productAnalyticsConsentVersion: PRODUCT_ANALYTICS_CONSENT_VERSION,
    });
  });

  it('does not inherit opt-in from legacy settings', () => {
    expect(migrateSettingsState({ crashReportingEnabled: true }, 2)).toMatchObject({
      crashReportingEnabled: false,
      crashReportingConsentVersion: CRASH_REPORTING_CONSENT_VERSION,
      crashReportingConsentUpdatedAt: null,
    });
    expect(
      migrateSettingsState({ productAnalyticsEnabled: true } as never, 4),
    ).toMatchObject({
      productAnalyticsEnabled: false,
      productAnalyticsConsentVersion: PRODUCT_ANALYTICS_CONSENT_VERSION,
      productAnalyticsConsentUpdatedAt: null,
    });
  });
});
