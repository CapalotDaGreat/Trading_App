import { DEFAULT_SIMULATION_CURRENCY, listedSimulationInstrument } from '../constants/simulation.constants';
import type {
  EventReactionStyle,
  MarketRegime,
  RegimeSegment,
  ScenarioAssetConfig,
  ScenarioClimate,
  ScenarioComplexity,
  ScenarioDifficulty,
  ScenarioEvent,
  ScenarioFocus,
  SimulationBar,
  SimulationScenario,
  TapePhase,
} from '../types/scenario.types';
import type { SimulationPriceProvider, SimulationQuote } from '../types/simulation.types';
import { parseFxPair, quoteCurrencyFor } from './fx-conversion.service';
import { clamp, gaussian, hashSeed, intIn, mulberry32, pick } from './scenario-rng';
import { toMajor, toMinor } from './simulation-money.service';
import { getSyntheticQuote } from './synthetic-market.service';

export const DEFAULT_HORIZON_DAYS = 32;

const REGIME_DRIFT: Record<MarketRegime, number> = {
  strong_bull: 0.0042,
  weak_bull: 0.0016,
  sideways: 0,
  high_vol_sideways: 0.0002,
  bear: -0.0028,
  panic: -0.011,
  recovery: 0.0034,
  transition: 0.0005,
  sector_rotation: 0.0007,
};

const REGIME_VOL: Record<MarketRegime, number> = {
  strong_bull: 0.72,
  weak_bull: 0.85,
  sideways: 0.7,
  high_vol_sideways: 1.35,
  bear: 1.15,
  panic: 2.1,
  recovery: 1.05,
  transition: 1.2,
  sector_rotation: 0.95,
};

const PHASE_DRIFT: Record<TapePhase, number> = {
  impulse: 1.35,
  pullback: -0.7,
  consolidation: 0.08,
  breakout_attempt: 1.8,
  failed_breakout: -1.55,
  reversal: -1.7,
  momentum_burst: 2.05,
};

const PHASE_VOL: Record<TapePhase, number> = {
  impulse: 1,
  pullback: 0.85,
  consolidation: 0.42,
  breakout_attempt: 1.55,
  failed_breakout: 1.7,
  reversal: 1.45,
  momentum_burst: 1.85,
};

const ALL_REGIMES: readonly MarketRegime[] = [
  'strong_bull',
  'weak_bull',
  'sideways',
  'high_vol_sideways',
  'bear',
  'panic',
  'recovery',
  'transition',
  'sector_rotation',
];

export interface DayPlan {
  day: number;
  regime: MarketRegime;
  phase: TapePhase;
}

export function pickPrimaryRegime(rand: () => number, focus?: ScenarioFocus): MarketRegime {
  if (focus === 'false_breakouts') return pick(rand, ['sideways', 'high_vol_sideways', 'transition']);
  if (focus === 'position_sizing') return pick(rand, ['high_vol_sideways', 'panic', 'bear', 'transition']);
  if (focus === 'correlation') return pick(rand, ['sector_rotation', 'panic', 'strong_bull']);
  if (focus === 'event_adaptation') return pick(rand, ['transition', 'weak_bull', 'bear']);
  return pick(rand, ALL_REGIMES);
}

export function buildRegimeSegments(input: {
  rand: () => number;
  primary: MarketRegime;
  horizon: number;
  uncertainty: number;
  difficulty?: ScenarioDifficulty;
}): RegimeSegment[] {
  const beginner = input.difficulty === 'beginner';
  const expertish = input.difficulty === 'advanced' || input.difficulty === 'expert';
  const extra = beginner
    ? 0
    : expertish
      ? 1 + (input.rand() > 0.35 ? 1 : 0)
      : input.uncertainty > 0.5
        ? 1 + (input.rand() > 0.4 ? 1 : 0)
        : input.rand() > 0.65
          ? 1
          : 0;
  const count = 1 + extra;
  if (count === 1) {
    return [{ startDay: 0, endDay: input.horizon - 1, regime: input.primary }];
  }
  const cuts: number[] = [];
  for (let i = 0; i < count - 1; i += 1) {
    cuts.push(intIn(input.rand, 6, Math.max(7, input.horizon - 8)));
  }
  cuts.sort((a, b) => a - b);
  const unique = [...new Set(cuts)].filter((day) => day > 3 && day < input.horizon - 4);
  const bounds = [0, ...unique, input.horizon];
  const segments: RegimeSegment[] = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const start = bounds[i]!;
    const end = bounds[i + 1]! - 1;
    const regime = i === 0 ? input.primary : pick(input.rand, ALL_REGIMES.filter((item) => item !== input.primary));
    segments.push({ startDay: start, endDay: Math.max(start, end), regime });
  }
  return segments;
}

function regimeOnDay(segments: RegimeSegment[], day: number, fallback: MarketRegime): MarketRegime {
  return segments.find((item) => day >= item.startDay && day <= item.endDay)?.regime ?? fallback;
}

function nextPhase(
  rand: () => number,
  current: TapePhase,
  regime: MarketRegime,
  focus?: ScenarioFocus,
  difficulty?: ScenarioDifficulty,
): TapePhase {
  const beginner = difficulty === 'beginner';
  const expertish = difficulty === 'advanced' || difficulty === 'expert';
  const falseBias = (focus === 'false_breakouts' ? 0.18 : 0) + (expertish ? 0.08 : 0) - (beginner ? 0.12 : 0);
  if (current === 'impulse') {
    if (rand() < (beginner ? 0.28 : 0.42)) return 'pullback';
    if (rand() < 0.28) return 'consolidation';
    if (rand() < 0.12 + (regime === 'transition' ? 0.1 : 0) - (beginner ? 0.08 : 0)) return 'reversal';
    if (expertish && rand() < 0.16) return 'momentum_burst';
    return 'impulse';
  }
  if (current === 'momentum_burst') {
    if (rand() < 0.45) return 'pullback';
    if (rand() < 0.35) return 'reversal';
    return 'consolidation';
  }
  if (current === 'pullback') {
    if (rand() < 0.5) return 'impulse';
    if (rand() < 0.28) return 'consolidation';
    if (rand() < (beginner ? 0.06 : 0.14)) return 'reversal';
    return 'pullback';
  }
  if (current === 'consolidation') {
    if (rand() < 0.34 + falseBias) return 'breakout_attempt';
    if (rand() < 0.22) return 'impulse';
    if (expertish && rand() < 0.12) return 'momentum_burst';
    return 'consolidation';
  }
  if (current === 'breakout_attempt') {
    if (rand() < 0.42 + falseBias) return 'failed_breakout';
    if (rand() < 0.55) return 'impulse';
    return 'consolidation';
  }
  if (current === 'failed_breakout') {
    return rand() < 0.55 ? 'consolidation' : 'reversal';
  }
  return rand() < 0.6 ? 'impulse' : 'consolidation';
}

function phaseLength(rand: () => number, phase: TapePhase): number {
  if (phase === 'breakout_attempt' || phase === 'momentum_burst') return 1 + (rand() > 0.65 ? 1 : 0);
  if (phase === 'failed_breakout') return 2 + (rand() > 0.5 ? 1 : 0);
  if (phase === 'reversal') return 2 + intIn(rand, 0, 2);
  if (phase === 'consolidation') return 3 + intIn(rand, 0, 4);
  if (phase === 'pullback') return 2 + intIn(rand, 0, 3);
  return 3 + intIn(rand, 0, 5);
}

export function buildDayPlan(input: {
  rand: () => number;
  segments: RegimeSegment[];
  primary: MarketRegime;
  horizon: number;
  focus?: ScenarioFocus;
  psychologicalPressure: number;
  difficulty?: ScenarioDifficulty;
}): DayPlan[] {
  const plan: DayPlan[] = [];
  let phase: TapePhase = input.rand() > 0.45 ? 'impulse' : 'consolidation';
  let remaining = phaseLength(input.rand, phase);
  for (let day = 0; day < input.horizon; day += 1) {
    const regime = regimeOnDay(input.segments, day, input.primary);
    if (remaining <= 0) {
      phase = nextPhase(input.rand, phase, regime, input.focus, input.difficulty);
      remaining = phaseLength(input.rand, phase);
    }
    plan.push({ day, regime, phase });
    remaining -= 1;
  }

  if (input.psychologicalPressure > 0.55 && input.horizon > 16) {
    const start = intIn(input.rand, 10, input.horizon - 8);
    for (let i = 0; i < 3; i += 1) {
      const row = plan[start + i];
      if (row) {
        row.phase = 'impulse';
        row.regime = input.rand() > 0.4 ? 'bear' : 'panic';
      }
    }
  }
  return plan;
}

function reactionImpulse(style: EventReactionStyle, surprise: number, lag: number): { ret: number; volMul: number; gap: number } {
  const mag = Math.abs(surprise);
  const dir = surprise >= 0 ? 1 : -1;
  if (style === 'impulse_extend') {
    return { ret: dir * (0.012 + mag * 0.02) * (lag === 0 ? 1 : lag === 1 ? 0.45 : 0.1), volMul: 1.4, gap: dir * mag * 0.006 };
  }
  if (style === 'gap_fade') {
    if (lag === 0) return { ret: -dir * (0.006 + mag * 0.012), volMul: 1.7, gap: dir * (0.012 + mag * 0.016) };
    return { ret: -dir * mag * 0.004, volMul: 1.15, gap: 0 };
  }
  if (style === 'muted') {
    return { ret: dir * mag * 0.004, volMul: 1.1, gap: dir * mag * 0.002 };
  }
  if (style === 'vol_only') {
    return { ret: dir * mag * 0.002, volMul: 2.1, gap: dir * mag * 0.003 };
  }
  if (style === 'delayed') {
    if (lag === 0) return { ret: dir * mag * 0.003, volMul: 1.2, gap: 0 };
    if (lag === 1) return { ret: dir * (0.01 + mag * 0.018), volMul: 1.6, gap: dir * mag * 0.008 };
    return { ret: dir * mag * 0.003, volMul: 1.1, gap: 0 };
  }
  if (lag === 0) return { ret: -dir * (0.01 + mag * 0.016), volMul: 1.85, gap: dir * (0.01 + mag * 0.014) };
  return { ret: -dir * mag * 0.005, volMul: 1.2, gap: 0 };
}

function eventsOn(events: ScenarioEvent[], day: number, symbol?: string): ScenarioEvent[] {
  return events.filter(
    (event) => event.resolveDay === day && (symbol == null || event.symbols.includes(symbol) || event.marketRelevance > 0.7),
  );
}

function clampDailyReturn(value: number, regime: MarketRegime): number {
  const cap = regime === 'panic' ? 0.18 : 0.11;
  return clamp(value, -cap, cap);
}

function ohlcFromReturn(input: {
  prevClose: number;
  ret: number;
  gap: number;
  vol: number;
  volMul: number;
  liquidity: number;
  rand: () => number;
  day: number;
  phase: TapePhase;
}): SimulationBar {
  const open = Math.max(0.01, input.prevClose * (1 + input.gap));
  const close = Math.max(0.01, input.prevClose * (1 + input.ret));
  const thin = 1 + (1 - input.liquidity) * 0.8;
  const range = (Math.abs(close - open) + input.vol * close * (0.35 + input.rand() * 0.75) * input.volMul) * thin;
  const upperShare = input.phase === 'failed_breakout' ? 0.25 + input.rand() * 0.25 : 0.3 + input.rand() * 0.4;
  const high = Math.max(open, close) + range * upperShare;
  const low = Math.min(open, close) - range * (1 - upperShare);
  const volume = Math.round(80_000 + input.rand() * 220_000 * input.volMul * (input.phase === 'consolidation' ? 0.55 : 1.15));
  return {
    day: input.day,
    open: toMajor(toMinor(open)),
    high: toMajor(toMinor(Math.max(high, open, close))),
    low: toMajor(toMinor(Math.max(0.01, Math.min(low, open, close)))),
    close: toMajor(toMinor(close)),
    volume: Math.max(1, volume),
    phase: input.phase,
  };
}

export function generateStructuredPaths(input: {
  seed: number;
  assets: ScenarioAssetConfig[];
  events: ScenarioEvent[];
  segments: RegimeSegment[];
  climate: ScenarioClimate;
  complexity: ScenarioComplexity;
  primary: MarketRegime;
  horizon: number;
  focus?: ScenarioFocus;
  difficulty?: ScenarioDifficulty;
}): { marketPath: SimulationBar[]; paths: Record<string, SimulationBar[]>; plan: DayPlan[] } {
  const planRand = mulberry32(hashSeed([input.seed, 'plan']));
  const plan = buildDayPlan({
    rand: planRand,
    segments: input.segments,
    primary: input.primary,
    horizon: input.horizon,
    focus: input.focus,
    psychologicalPressure: input.complexity.psychologicalPressure,
    difficulty: input.difficulty,
  });

  const marketRand = mulberry32(hashSeed([input.seed, 'market']));
  const baseVol = 0.0065 + input.complexity.volatility * 0.016;
  const liqMul = input.climate.liquidity === 'thin' ? 1.35 : input.climate.liquidity === 'deep' ? 0.85 : 1;
  let prevRet = 0;
  let vol = baseVol;
  const marketReturns: number[] = [];
  const marketGaps: number[] = [];
  const marketVolMul: number[] = [];

  for (let day = 0; day < input.horizon; day += 1) {
    const row = plan[day]!;
    vol = 0.55 * vol + 0.45 * (baseVol * REGIME_VOL[row.regime] + 0.55 * Math.abs(prevRet));
    const recent = marketReturns.slice(-5).reduce((sum, item) => sum + item, 0);
    const meanRev =
      row.regime === 'sideways' || row.regime === 'high_vol_sideways' ? -0.22 * recent : -0.08 * recent;
    const momentum = row.phase === 'impulse' || row.phase === 'breakout_attempt' ? 0.28 * prevRet : 0.08 * prevRet;
    let ret =
      REGIME_DRIFT[row.regime] * PHASE_DRIFT[row.phase] +
      meanRev +
      momentum +
      gaussian(marketRand) * vol * PHASE_VOL[row.phase] * liqMul;
    let gap = 0;
    let volMul = PHASE_VOL[row.phase];
    const expertish = input.difficulty === 'advanced' || input.difficulty === 'expert';
    if (expertish && marketRand() < 0.1) {
      gap += gaussian(marketRand) * 0.007;
    }
    if (input.difficulty !== 'beginner' && input.climate.liquidity === 'thin' && marketRand() < 0.18) {
      volMul *= 1.35;
    }
    for (const event of eventsOn(input.events, day)) {
      const impulse = reactionImpulse(event.reactionStyle, event.surpriseMagnitude, 0);
      ret += impulse.ret * event.marketRelevance;
      gap += impulse.gap * event.marketRelevance;
      volMul *= impulse.volMul;
    }
    for (const event of input.events.filter((item) => item.resolveDay === day - 1)) {
      const impulse = reactionImpulse(event.reactionStyle, event.surpriseMagnitude, 1);
      ret += impulse.ret * event.marketRelevance * 0.7;
      volMul *= 1 + (impulse.volMul - 1) * 0.4;
    }
    ret = clampDailyReturn(ret, row.regime);
    marketReturns.push(ret);
    marketGaps.push(gap);
    marketVolMul.push(volMul);
    prevRet = ret;
  }

  let marketClose = 100;
  const marketPath: SimulationBar[] = [];
  for (let day = 0; day < input.horizon; day += 1) {
    const row = plan[day]!;
    const bar = ohlcFromReturn({
      prevClose: marketClose,
      ret: marketReturns[day]!,
      gap: marketGaps[day]!,
      vol,
      volMul: marketVolMul[day]!,
      liquidity: input.climate.liquidity === 'thin' ? 0.4 : 0.85,
      rand: marketRand,
      day,
      phase: row.phase,
    });
    marketPath.push(bar);
    marketClose = bar.close;
  }

  const sectors = [...new Set(input.assets.map((item) => item.sector))];
  const sectorRets: Record<string, number[]> = {};
  for (const sector of sectors) {
    const srand = mulberry32(hashSeed([input.seed, 'sector', sector]));
    const series: number[] = [];
    let bias = 0;
    if (input.primary === 'sector_rotation') {
      bias = (hashSeed([sector]) % 2 === 0 ? 1 : -1) * 0.0018;
    }
    for (let day = 0; day < input.horizon; day += 1) {
      const corr = 0.55 + input.complexity.volatility * 0.15;
      series.push(corr * marketReturns[day]! + (1 - corr) * gaussian(srand) * vol + bias);
    }
    sectorRets[sector] = series;
  }

  const paths: Record<string, SimulationBar[]> = {};
  for (const asset of input.assets) {
    const arand = mulberry32(hashSeed([input.seed, 'asset', asset.symbol]));
    let close = asset.basePrice;
    const bars: SimulationBar[] = [];
    let prev = 0;
    for (let day = 0; day < input.horizon; day += 1) {
      const row = plan[day]!;
      const market = marketReturns[day]!;
      const sector = sectorRets[asset.sector]?.[day] ?? 0;
      const idio = gaussian(arand) * vol * (0.7 + asset.idiosyncrasy);
      let ret =
        asset.beta * market * 0.7 +
        0.25 * sector +
        idio +
        asset.momentumBias * prev * 0.2 -
        asset.meanReversion * (close / asset.basePrice - 1) * 0.04;
      let gap = marketGaps[day]! * asset.beta * 0.6;
      let volMul = marketVolMul[day]! * (1.15 - asset.liquidity * 0.3);
      for (const event of input.events) {
        if (!event.symbols.includes(asset.symbol)) continue;
        const lag = day - event.resolveDay;
        if (lag < 0 || lag > 2) continue;
        const impulse = reactionImpulse(event.reactionStyle, event.surpriseMagnitude, lag);
        ret += impulse.ret + event.shockBps / 10_000 * (lag === 0 ? 0.55 : 0.15);
        gap += impulse.gap;
        volMul *= impulse.volMul;
      }
      ret = clampDailyReturn(ret, row.regime);
      const bar = ohlcFromReturn({
        prevClose: close,
        ret,
        gap,
        vol: vol * (1.1 - asset.liquidity * 0.25),
        volMul,
        liquidity: asset.liquidity,
        rand: arand,
        day,
        phase: row.phase,
      });
      bars.push(bar);
      close = bar.close;
      prev = ret;
    }
    paths[asset.symbol] = bars;
  }

  return { marketPath, paths, plan };
}

function isStructured(scenario: SimulationScenario): boolean {
  return scenario.engineVersion === 2 && Boolean(scenario.paths) && Object.keys(scenario.paths).length > 0;
}

function barClose(bars: SimulationBar[] | undefined, day: number, fallback: number): number {
  if (!bars?.length) return fallback;
  const index = clamp(day, 0, bars.length - 1);
  return bars[index]?.close ?? fallback;
}

/** Legacy v1 path — kept so in-progress books do not jump. */
function legacyScenarioPrice(scenario: SimulationScenario, symbol: string, day: number): number {
  const listed = scenario.assets.find((item) => item.symbol === symbol) ?? listedSimulationInstrument(symbol);
  const base = listed && 'basePrice' in listed ? listed.basePrice : 100;
  const idiosyncrasy = scenario.assets.find((item) => item.symbol === symbol)?.idiosyncrasy ?? 0;
  let price = base;
  for (let d = 0; d <= day; d += 1) {
    const rand = mulberry32(hashSeed([scenario.seed, symbol, d]));
    const vol = 0.006 + scenario.complexity.volatility * 0.018;
    const shock = scenario.events
      .filter((event) => event.resolveDay === d && event.symbols.includes(symbol))
      .reduce((sum, event) => sum + event.shockBps / 10_000, 0);
    const drift = REGIME_DRIFT[scenario.regime] ?? 0;
    price *= 1 + drift + idiosyncrasy * 0.001 + gaussian(rand) * vol + shock;
  }
  const pair = parseFxPair(symbol);
  return Math.max(pair ? 0.0001 : 0.01, toMajor(toMinor(price)));
}

export function scenarioBars(scenario: SimulationScenario, symbol: string, throughDay = scenario.clockDay): SimulationBar[] {
  const bars = scenario.paths?.[symbol];
  if (!bars) return [];
  const end = clamp(throughDay, 0, bars.length - 1);
  return bars.slice(0, end + 1);
}

export function scenarioPrice(scenario: SimulationScenario, symbol: string, day = scenario.clockDay): number {
  const listed = scenario.assets.find((item) => item.symbol === symbol) ?? listedSimulationInstrument(symbol);
  const fallback = listed && 'basePrice' in listed ? listed.basePrice : 100;
  if (isStructured(scenario)) {
    return Math.max(0.01, barClose(scenario.paths[symbol], day, fallback));
  }
  return legacyScenarioPrice(scenario, symbol, day);
}

export function getScenarioQuote(
  scenario: SimulationScenario,
  symbol: string,
  nowMs = Date.now(),
): SimulationQuote | null {
  const upper = symbol.trim().toUpperCase();
  if (!upper) return null;
  const pair = parseFxPair(upper);
  const quoteCurrency = quoteCurrencyFor(upper);
  return {
    symbol: upper,
    price: scenarioPrice(scenario, upper),
    currency: quoteCurrency,
    asOf: new Date(nowMs).toISOString(),
    kind: 'sample',
    provider: 'synthetic',
    label: 'SIMULATED',
    baseCurrency: pair?.base,
    quoteCurrency,
  };
}

export function createScenarioPriceProvider(scenario: SimulationScenario): SimulationPriceProvider {
  return {
    getQuote: (symbol, nowMs) => getScenarioQuote(scenario, symbol, nowMs) ?? getSyntheticQuote(symbol, nowMs),
    getQuotes: (symbols, nowMs) =>
      symbols
        .map((symbol) => getScenarioQuote(scenario, symbol, nowMs) ?? getSyntheticQuote(symbol, nowMs))
        .filter((quote): quote is SimulationQuote => quote != null),
  };
}

export function quotesForScenario(
  scenario: SimulationScenario,
  symbols: string[],
  nowMs = Date.now(),
  _currency = DEFAULT_SIMULATION_CURRENCY,
): SimulationQuote[] {
  return createScenarioPriceProvider(scenario).getQuotes(symbols, nowMs);
}

export function averageTrueRange(bars: SimulationBar[], period = 5): number {
  if (bars.length < 2) return 0;
  const window = bars.slice(-period);
  const ranges = window.map((bar, index) => {
    const prev = window[index - 1] ?? bars[bars.length - window.length - 1];
    const tr = Math.max(
      bar.high - bar.low,
      prev ? Math.abs(bar.high - prev.close) : bar.high - bar.low,
      prev ? Math.abs(bar.low - prev.close) : bar.high - bar.low,
    );
    return tr / bar.close;
  });
  return ranges.reduce((sum, item) => sum + item, 0) / ranges.length;
}
