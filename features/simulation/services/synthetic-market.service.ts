import { DEFAULT_SIMULATION_CURRENCY, SYNTHETIC_UNIVERSE } from '../constants/simulation.constants';
import { parseFxPair, quoteCurrencyFor } from './fx-conversion.service';
import { toMajor, toMinor } from './simulation-money.service';
import type { SimulationPriceProvider, SimulationQuote } from '../types/simulation.types';

function hashSymbol(symbol: string): number {
  return [...symbol.toUpperCase()].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function dayIndex(nowMs: number): number {
  return Math.floor(nowMs / 86_400_000);
}

/**
 * Deterministic synthetic quotes for paper trading.
 * Not live market data. Not licensed historical prices. Labelled SIMULATED.
 * The engine depends on SimulationPriceProvider — never on Finnhub.
 */
export function getSyntheticQuote(
  symbol: string,
  nowMs = Date.now(),
  _currency = DEFAULT_SIMULATION_CURRENCY,
): SimulationQuote | null {
  const upper = symbol.trim().toUpperCase();
  if (!upper) return null;
  const listed = SYNTHETIC_UNIVERSE.find((item) => item.symbol === upper);
  const seed = hashSymbol(upper);
  const base = listed?.basePrice ?? 80 + (seed % 120);
  const wave = Math.sin((dayIndex(nowMs) + seed) / 7) * 0.018;
  const price = toMajor(toMinor(base * (1 + wave)));
  const pair = parseFxPair(upper);
  const quoteCurrency = quoteCurrencyFor(upper);

  return {
    symbol: upper,
    price: Math.max(pair ? 0.0001 : 0.01, price),
    currency: quoteCurrency,
    asOf: new Date(nowMs).toISOString(),
    kind: 'sample',
    provider: 'synthetic',
    label: 'SIMULATED',
    baseCurrency: pair?.base ?? listed?.baseCurrency,
    quoteCurrency,
  };
}

export function getSyntheticQuotes(
  symbols: string[],
  nowMs = Date.now(),
  currency = DEFAULT_SIMULATION_CURRENCY,
): SimulationQuote[] {
  return symbols
    .map((symbol) => getSyntheticQuote(symbol, nowMs, currency))
    .filter((quote): quote is SimulationQuote => quote != null);
}

export const syntheticSimulationPriceProvider: SimulationPriceProvider = {
  getQuote: (symbol, nowMs) => getSyntheticQuote(symbol, nowMs),
  getQuotes: (symbols, nowMs) => getSyntheticQuotes(symbols, nowMs),
};

/** @deprecated Use syntheticSimulationPriceProvider */
export const syntheticSimulationDataProvider = syntheticSimulationPriceProvider;

export function listedSyntheticName(symbol: string): string {
  const upper = symbol.toUpperCase();
  return SYNTHETIC_UNIVERSE.find((item) => item.symbol === upper)?.name ?? `${upper} (synthetic)`;
}
