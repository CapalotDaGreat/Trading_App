import { DEFAULT_DISPLAY_CURRENCY, DISPLAY_CURRENCIES } from '@/shared/constants/currency';

import { SYNTHETIC_UNIVERSE } from '../constants/simulation.constants';

/**
 * Sample USD-per-unit rates for education and paper conversion.
 * Not live FX. Not a tradable venue. Labelled synthetic.
 */
export const SYNTHETIC_USD_PER_UNIT: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CHF: 1.12,
  JPY: 1 / 150,
  CAD: 0.73,
  AUD: 0.66,
};

export interface FxPair {
  symbol: string;
  base: string;
  quote: string;
}

const PAIR_ALIASES: Record<string, [string, string]> = {
  EURUSD: ['EUR', 'USD'],
  GBPUSD: ['GBP', 'USD'],
  USDJPY: ['USD', 'JPY'],
  USDCHF: ['USD', 'CHF'],
  USDCAD: ['USD', 'CAD'],
  AUDUSD: ['AUD', 'USD'],
  EURGBP: ['EUR', 'GBP'],
  EURJPY: ['EUR', 'JPY'],
  EURCHF: ['EUR', 'CHF'],
  GBPJPY: ['GBP', 'JPY'],
};

export function parseFxPair(symbol: string): FxPair | null {
  const upper = symbol.trim().toUpperCase().replace(/[-_\s]/g, '');
  const slashed = symbol.trim().toUpperCase();
  if (slashed.includes('/')) {
    const [base, quote] = slashed.split('/');
    if (base && quote && SYNTHETIC_USD_PER_UNIT[base] && SYNTHETIC_USD_PER_UNIT[quote]) {
      return { symbol: `${base}${quote}`, base, quote };
    }
  }
  const listed = SYNTHETIC_UNIVERSE.find((item) => item.symbol === upper);
  if (listed?.baseCurrency && listed.quoteCurrency) {
    return { symbol: listed.symbol, base: listed.baseCurrency, quote: listed.quoteCurrency };
  }
  const alias = PAIR_ALIASES[upper];
  if (alias) {
    return { symbol: upper, base: alias[0], quote: alias[1] };
  }
  return null;
}

export function quoteCurrencyFor(symbol: string): string {
  const pair = parseFxPair(symbol);
  if (pair) return pair.quote;
  const listed = SYNTHETIC_UNIVERSE.find((item) => item.symbol === symbol.trim().toUpperCase());
  return listed?.quoteCurrency ?? DEFAULT_DISPLAY_CURRENCY;
}

export function convertAmount(amount: number, from: string, to: string): number {
  const source = SYNTHETIC_USD_PER_UNIT[from.toUpperCase()];
  const target = SYNTHETIC_USD_PER_UNIT[to.toUpperCase()];
  if (!Number.isFinite(amount) || source == null || target == null || target === 0) return amount;
  if (from.toUpperCase() === to.toUpperCase()) return amount;
  return (amount * source) / target;
}

/** Native quote (quote-currency per 1 base, or USD for sample equities) → account currency. */
export function unitPriceInAccountCurrency(
  symbol: string,
  nativePrice: number,
  accountCurrency: string,
): number {
  return convertAmount(nativePrice, quoteCurrencyFor(symbol), accountCurrency);
}

export function syntheticSpotRate(base: string, quote: string): number {
  return convertAmount(1, base.toUpperCase(), quote.toUpperCase());
}

export function pipSize(quoteCurrency: string): number {
  return quoteCurrency.toUpperCase() === 'JPY' ? 0.01 : 0.0001;
}

export const CONVERTIBLE_CURRENCIES = DISPLAY_CURRENCIES;
