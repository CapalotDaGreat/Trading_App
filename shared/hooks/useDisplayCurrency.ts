import { DEFAULT_DISPLAY_CURRENCY, normalizeDisplayCurrency } from '@/shared/constants/currency';
import { useSettingsStore } from '@/shared/stores/settings.store';

/** User-chosen display / paper-account currency. Defaults to USD. */
export function useDisplayCurrency(): string {
  return useSettingsStore((state) => normalizeDisplayCurrency(state.preferences.currency));
}

export function getDisplayCurrency(): string {
  return normalizeDisplayCurrency(useSettingsStore.getState().preferences.currency ?? DEFAULT_DISPLAY_CURRENCY);
}
