import { DEFAULT_DISPLAY_CURRENCY, normalizeDisplayCurrency } from '@/shared/constants/currency';

import {
  convertAmount,
  parseFxPair,
  quoteCurrencyFor,
  syntheticSpotRate,
  unitPriceInAccountCurrency,
} from '../fx-conversion.service';

describe('fx conversion (synthetic, educational)', () => {
  it('defaults display currency to USD', () => {
    expect(DEFAULT_DISPLAY_CURRENCY).toBe('USD');
    expect(normalizeDisplayCurrency('usd')).toBe('USD');
    expect(normalizeDisplayCurrency('zzz')).toBe('USD');
  });

  it('parses EURUSD and EUR/USD as the same pair', () => {
    expect(parseFxPair('EURUSD')).toEqual({ symbol: 'EURUSD', base: 'EUR', quote: 'USD' });
    expect(parseFxPair('eur/usd')?.base).toBe('EUR');
  });

  it('converts dollars to euros at the sample rate', () => {
    expect(convertAmount(1_080, 'USD', 'EUR')).toBeCloseTo(1_000, 6);
    expect(syntheticSpotRate('EUR', 'USD')).toBeCloseTo(1.08, 6);
  });

  it('prices USD/JPY in a USD account as about $1 per unit of base', () => {
    expect(quoteCurrencyFor('USDJPY')).toBe('JPY');
    expect(unitPriceInAccountCurrency('USDJPY', 150, 'USD')).toBeCloseTo(1, 6);
  });

  it('leaves USD-quoted equities unchanged in a USD book', () => {
    expect(unitPriceInAccountCurrency('AAPL', 185, 'USD')).toBe(185);
  });
});
