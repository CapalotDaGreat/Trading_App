import {
  CRASH_REPORTING_CONSENT_VERSION,
  migrateSettingsState,
  useSettingsStore,
} from '../settings.store';

describe('crash reporting consent', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('defaults to disabled and records explicit changes', () => {
    expect(useSettingsStore.getState().crashReportingEnabled).toBe(false);
    expect(useSettingsStore.getState().crashReportingConsentUpdatedAt).toBeNull();

    useSettingsStore.getState().setCrashReportingEnabled(true);

    expect(useSettingsStore.getState()).toMatchObject({
      crashReportingEnabled: true,
      crashReportingConsentVersion: CRASH_REPORTING_CONSENT_VERSION,
    });
    expect(useSettingsStore.getState().crashReportingConsentUpdatedAt).toEqual(expect.any(String));
  });

  it('does not inherit opt-in from legacy settings', () => {
    expect(migrateSettingsState({ crashReportingEnabled: true }, 2)).toMatchObject({
      crashReportingEnabled: false,
      crashReportingConsentVersion: CRASH_REPORTING_CONSENT_VERSION,
      crashReportingConsentUpdatedAt: null,
    });
  });
});
