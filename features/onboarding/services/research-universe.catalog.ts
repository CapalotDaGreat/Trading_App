import type {
  MarketInterest,
  MentorExperienceLevel,
  TradingStyleInterest,
} from '../types/mentor-setup.types';
import { RESEARCH_UNIVERSE_MAX } from '../types/mentor-setup.types';

const MARKET_SEEDS: Record<MarketInterest, string[]> = {
  stocks: ['SPY', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'AMD'],
  etfs: ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI'],
  indices: ['SPY', 'QQQ', 'DIA', 'IWM'],
  forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'],
  crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD'],
  commodities: ['XAU/USD', 'WTI/USD', 'XAG/USD'],
  options: ['SPY', 'QQQ', 'AAPL', 'TSLA'],
  futures: ['ES', 'NQ', 'CL', 'GC'],
};

const BEGINNER_SAFE = new Set([
  'SPY',
  'QQQ',
  'AAPL',
  'MSFT',
  'NVDA',
  'EUR/USD',
  'BTC/USD',
  'XAU/USD',
  'VTI',
  'GOOGL',
]);

export interface UniverseRecommendationInput {
  markets: MarketInterest[];
  experience: MentorExperienceLevel | null;
  styles: TradingStyleInterest[];
}

/**
 * Deterministic starter Research Universe from Mentor Setup answers.
 * Prefills 5–7 liquid names; caller may expand to RESEARCH_UNIVERSE_MAX.
 */
export function recommendResearchUniverse(input: UniverseRecommendationInput): string[] {
  const markets = input.markets.length ? input.markets : (['stocks'] as MarketInterest[]);
  const pooled: string[] = [];

  for (const market of markets) {
    pooled.push(...(MARKET_SEEDS[market] ?? []));
  }

  if (input.styles.includes('day_trading') || input.styles.includes('scalping')) {
    pooled.unshift('SPY', 'QQQ', 'NVDA');
  }
  if (input.styles.includes('value_investing') || input.styles.includes('growth_investing')) {
    pooled.unshift('AAPL', 'MSFT', 'GOOGL', 'VTI');
  }
  if (input.styles.includes('swing') || input.styles.includes('trend_following')) {
    pooled.unshift('SPY', 'AAPL', 'NVDA');
  }

  const beginner =
    input.experience === 'completely_new' || input.experience === 'beginner';

  const unique: string[] = [];
  for (const symbol of pooled) {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized || unique.includes(normalized)) continue;
    if (beginner && !BEGINNER_SAFE.has(normalized) && unique.length >= 4) continue;
    unique.push(normalized);
    if (unique.length >= 7) break;
  }

  if (unique.length < 5) {
    for (const fallback of ['SPY', 'AAPL', 'MSFT', 'NVDA', 'QQQ']) {
      if (!unique.includes(fallback)) unique.push(fallback);
      if (unique.length >= 5) break;
    }
  }

  return unique.slice(0, Math.min(7, RESEARCH_UNIVERSE_MAX));
}
