/** ISO 4217 codes the product lets a user choose. Default is USD for the US-first launch. */
export const DEFAULT_DISPLAY_CURRENCY = 'USD';

export const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'] as const;

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const DISPLAY_CURRENCY_LABELS: Record<DisplayCurrency, string> = {
  USD: 'US dollar ($)',
  EUR: 'Euro (€)',
  GBP: 'British pound (£)',
  CHF: 'Swiss franc',
  JPY: 'Japanese yen (¥)',
  CAD: 'Canadian dollar',
  AUD: 'Australian dollar',
};

export function isDisplayCurrency(value: string): value is DisplayCurrency {
  return (DISPLAY_CURRENCIES as readonly string[]).includes(value.toUpperCase());
}

export function normalizeDisplayCurrency(value: string | undefined | null): DisplayCurrency {
  const upper = (value ?? DEFAULT_DISPLAY_CURRENCY).trim().toUpperCase();
  return isDisplayCurrency(upper) ? upper : DEFAULT_DISPLAY_CURRENCY;
}
