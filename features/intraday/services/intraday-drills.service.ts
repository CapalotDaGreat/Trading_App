import { mulberry32 } from '@/features/simulation/services/scenario-rng';

/**
 * Generated advanced/expert intraday drills.
 *
 * Scenarios are built from validated parameter ranges with deterministic
 * seeds — not hundreds of duplicated static questions. IDs, titles, and
 * metadata never encode the correct answer. Every drill can be attempted
 * untimed; timed mode is an instructional option, not a reaction-time claim.
 */

export type IntradayDrillKind =
  | 'sizing'
  | 'risk-reward'
  | 'vwap-context'
  | 'breakout-confirmation'
  | 'failed-breakout'
  | 'cost-drag'
  | 'daily-limit'
  | 'multi-timeframe'
  | 'order-selection'
  | 'no-trade';

export type IntradayDrillDifficulty = 'advanced' | 'expert';

export interface IntradayDrill {
  id: string;
  kind: IntradayDrillKind;
  difficulty: IntradayDrillDifficulty;
  title: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  /** Suggested response window in timed mode. Untimed is always available. */
  timeLimitSeconds: number;
  conceptIds: string[];
}

const TITLES: Record<IntradayDrillKind, string> = {
  sizing: 'Size from the risk budget',
  'risk-reward': 'Reward-to-risk as a planning metric',
  'vwap-context': 'Price versus VWAP, in context',
  'breakout-confirmation': 'Breakout: acceptance or invitation?',
  'failed-breakout': 'The breakout that came back',
  'cost-drag': 'Gross move, net result',
  'daily-limit': 'The daily limit decision',
  'multi-timeframe': 'Two timeframes disagree',
  'order-selection': 'Choose the order that matches the plan',
  'no-trade': 'When the best decision is none',
};

function shuffleChoices(
  rand: () => number,
  choices: string[],
  correct: string,
): { choices: string[]; correctIndex: number } {
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return { choices: arr, correctIndex: arr.indexOf(correct) };
}

function money(v: number): string {
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function generateIntradayDrill(seed: number, kindIndex = 0): IntradayDrill {
  const rand = mulberry32(Math.abs(Math.floor(seed)) || 7);
  const kinds = Object.keys(TITLES) as IntradayDrillKind[];
  const kind = kinds[Math.abs(kindIndex) % kinds.length]!;
  const expert = kindIndex % 3 === 2;
  const difficulty: IntradayDrillDifficulty = expert ? 'expert' : 'advanced';
  const base = {
    id: `intraday-gen-${kind}-${Math.abs(Math.floor(seed))}-${kindIndex}`,
    kind,
    difficulty,
    title: TITLES[kind],
  };

  switch (kind) {
    case 'sizing': {
      const equity = [25_000, 50_000, 100_000][Math.floor(rand() * 3)]!;
      const riskPct = [0.25, 0.5, 1][Math.floor(rand() * 3)]!;
      const entry = 40 + Math.floor(rand() * 120);
      const stopDistance = [0.5, 1, 1.5, 2, 2.5][Math.floor(rand() * 5)]!;
      const budget = (equity * riskPct) / 100;
      const qty = Math.floor(budget / stopDistance);
      const correct = `${money(qty)} shares — risk budget $${money(budget)} ÷ $${stopDistance.toFixed(2)} per share`;
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          `${money(Math.floor(budget / (stopDistance * 2)))} shares — halve the stop distance to be safe`,
          `${money(Math.floor(equity / entry))} shares — invest the full account`,
          `${money(qty * 2)} shares — conviction is high, so double the budget`,
        ],
        correct,
      );
      return {
        ...base,
        prompt: `Educational example: simulated equity $${money(equity)}, planned risk ${riskPct}% per trade, entry $${entry}, invalidation $${(entry - stopDistance).toFixed(2)}. What size follows the plan?`,
        choices,
        correctIndex,
        explanation: `Size = risk budget ÷ distance to invalidation = $${money(budget)} ÷ $${stopDistance.toFixed(2)} ≈ ${money(qty)} shares. Halving the stop invents risk you did not plan; full-account sizing ignores invalidation entirely. No percentage suits every person — this is arithmetic inside one written plan.`,
        timeLimitSeconds: 90,
        conceptIds: ['position-sizing', 'risk-per-trade', 'intraday-structure'],
      };
    }
    case 'risk-reward': {
      const entry = 80 + Math.floor(rand() * 40);
      const stop = 1 + Math.floor(rand() * 2);
      const target = stop * [2, 2.5, 3][Math.floor(rand() * 3)]!;
      const rr = (target / stop).toFixed(1);
      const correct = `Planned R:R is about ${rr}:1 — a planning metric, not a promise that the target is reached`;
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          `R:R of ${rr}:1 means the trade will probably make ${rr}× the risk`,
          'R:R cannot be computed until the trade closes',
          'A high R:R makes position sizing unnecessary',
        ],
        correct,
      );
      return {
        ...base,
        prompt: `Entry $${entry}, invalidation $${entry - stop}, first target $${entry + target}. How should the reward-to-risk be described before the trade?`,
        choices,
        correctIndex,
        explanation: `Planned reward ÷ planned risk = $${target} ÷ $${stop} ≈ ${rr}:1. It describes the plan's geometry. It says nothing about probability, and it never replaces sizing.`,
        timeLimitSeconds: 60,
        conceptIds: ['risk-reward', 'position-sizing'],
      };
    }
    case 'vwap-context': {
      const above = rand() > 0.5;
      const correct = above
        ? 'Context, not a signal: acceptance above VWAP describes where value traded — wait for structure and invalidation before any plan'
        : 'Context, not a signal: a VWAP cross alone does not change market structure — name structure and invalidation first';
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          above
            ? 'Price above VWAP confirms buyers will push higher'
            : 'Price below VWAP confirms sellers will push lower',
          'Crossing VWAP is itself a completed setup',
          'Stack two more indicators until the decision feels certain',
        ],
        correct,
      );
      return {
        ...base,
        prompt: `Five-minute candles print ${above ? 'above' : 'below'} session VWAP, but the range highs keep rejecting price and volume is thinning. What does VWAP tell you here?`,
        choices,
        correctIndex,
        explanation:
          'VWAP summarises where volume traded; it does not predict. Crosses without acceptance, participation, and a named invalidation are indicator noise. Redundant indicators create confidence, not evidence.',
        timeLimitSeconds: 45,
        conceptIds: ['vwap-interpretation', 'volume', 'false-signals'],
      };
    }
    case 'breakout-confirmation': {
      const correct =
        'Wait for a close beyond the level, participation, and a hold on retest — acceptance, not the first poke';
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          'Enter on the first tick through the level before it gets away',
          'The level broke, so invalidation is no longer needed',
          'A bigger size compensates for weak confirmation',
        ],
        correct,
      );
      return {
        ...base,
        prompt:
          'On 5-minute candles, price pokes 0.3% above a two-hour range high on one candle with average volume, then closes back inside. What is the disciplined read?',
        choices,
        correctIndex,
        explanation:
          'A single poke is an invitation to chase. Confirmation is acceptance: closes beyond the level, participation, and a retest that holds. Until then the range is still the story.',
        timeLimitSeconds: 30,
        conceptIds: ['breakouts', 'false-breakouts', 'intraday-structure'],
      };
    }
    case 'failed-breakout': {
      const correct =
        'The thesis is invalidated as written — exit or stand down per the plan, and journal the failed acceptance';
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          'Average down: the level held once, it should hold again',
          'Move the invalidation lower so the idea can breathe',
          'Double size to recover the first loss faster',
        ],
        correct,
      );
      return {
        ...base,
        prompt:
          'Your written plan: long only if the 15-minute close holds above the opening-range high. The close holds, you enter in simulation, and the next two candles close back inside the range. What does the plan say?',
        choices,
        correctIndex,
        explanation:
          'The condition that justified the trade no longer exists. Moving invalidation after entry converts a planned loss into an unplanned one. The journal entry — not the next trade — is the recovery tool.',
        timeLimitSeconds: 30,
        conceptIds: ['false-breakouts', 'invalidation', 'discipline'],
      };
    }
    case 'cost-drag': {
      const grossCents = [6, 8, 10, 12][Math.floor(rand() * 4)]!;
      const spreadCents = [2, 3, 4][Math.floor(rand() * 3)]!;
      const slipCents = [1, 2][Math.floor(rand() * 2)]!;
      const feeCents = 2;
      const net = grossCents - spreadCents - slipCents * 2 - feeCents;
      const correct =
        net <= 0
          ? `A net loss: ${grossCents}¢ gross − ${spreadCents}¢ spread − ${slipCents * 2}¢ slippage (in+out) − ${feeCents}¢ fees = ${net}¢ — the scalp never had room`
          : `Only ${net}¢ net: ${grossCents}¢ gross − ${spreadCents}¢ spread − ${slipCents * 2}¢ slippage (in+out) − ${feeCents}¢ fees — costs ate most of the move`;
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          `Net gain of ${grossCents}¢ — chart distance is what you keep`,
          'Costs only matter for large positions',
          'Trade it more often so the costs average out',
        ],
        correct,
      );
      return {
        ...base,
        prompt: `A scalp targets a ${grossCents}¢ move. Spread is ${spreadCents}¢, slippage averages ${slipCents}¢ per side, fees total ${feeCents}¢ per round trip. What does the simulated arithmetic say?`,
        choices,
        correctIndex,
        explanation:
          'Scalping lives or dies on friction: spread is paid on entry and exit through fill prices, slippage compounds, fees are certain. A theoretical chart entry is not a fill. Repeated low-quality trades compound costs, not edge.',
        timeLimitSeconds: 90,
        conceptIds: ['execution-mechanics', 'liquidity', 'intraday-structure'],
      };
    }
    case 'daily-limit': {
      const correct =
        'Stop opening new risk, manage or close what exists per plan, and complete the session review';
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          'Trade smaller but keep going — the limit was for full size',
          'One recovery trade is allowed if the setup looks strong',
          'Switch instruments so the limit no longer applies',
        ],
        correct,
      );
      return {
        ...base,
        prompt:
          'Your simulated session plan sets a maximum daily loss. Two stop-outs reach it at 11:20, and a clean-looking setup appears at 11:35. What does the plan require?',
        choices,
        correctIndex,
        explanation:
          'The circuit breaker is the plan working, not failing. Risk-reducing actions remain available; new risk waits for the next session and a completed review. Simulated limits do not protect a real account — the habit is what transfers.',
        timeLimitSeconds: 30,
        conceptIds: ['drawdown-management', 'discipline', 'session-planning'],
      };
    }
    case 'multi-timeframe': {
      const correct =
        'No trade yet: the hourly context does not create a 5-minute entry — wait for lower-timeframe structure that agrees, or stand down';
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          'The hourly uptrend guarantees the 5-minute dip is a buying opportunity',
          'Ignore the hourly chart; only the fastest timeframe matters intraday',
          'Average the two signals and take half size immediately',
        ],
        correct,
      );
      return {
        ...base,
        prompt:
          'Hourly candles trend up. Five-minute candles just broke down through VWAP with expanding range, and no support has held yet. How do the timeframes combine?',
        choices,
        correctIndex,
        explanation:
          'Higher-timeframe context frames what to look for; it never times an entry and never guarantees short-term direction. Conflict means insufficient evidence — a complete answer is "not yet".',
        timeLimitSeconds: 45,
        conceptIds: ['multi-timeframe', 'confirmation-bias', 'vwap-interpretation'],
      };
    }
    case 'order-selection': {
      const useLimit = rand() > 0.5;
      const correct = useLimit
        ? 'A limit order at the retest level, accepting it may never fill — an unfilled order is not a trade'
        : 'A stop-market order beyond the trigger, accepting slippage — the stop triggers execution, it does not guarantee a price';
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          useLimit
            ? 'A market order now, because a missed fill is worse than a chased entry'
            : 'A stop-limit with a tight limit, because the fill price must be exact even if it never fills',
          'Whichever order type filled fastest last time',
          'Split into five small market orders to look active',
        ],
        correct,
      );
      return {
        ...base,
        prompt: useLimit
          ? 'Your plan: buy only on a retest of the breakout level, and only at that level. Which simulated order expresses the plan?'
          : 'Your plan: exit immediately if price trades through invalidation, whatever the print. Which simulated order expresses the plan?',
        choices,
        correctIndex,
        explanation: useLimit
          ? 'Limit orders express a price condition and may expire unfilled — that is the plan working. Chasing with a market order rewrites the plan at the worst moment.'
          : 'Stop-market prioritises exit over price; gaps can fill through the stop. Stop-limit can protect price and fail to exit at all. Neither guarantees an outcome — the trade-off must be chosen in advance.',
        timeLimitSeconds: 45,
        conceptIds: ['execution-mechanics', 'stop-logic'],
      };
    }
    case 'no-trade': {
      const correct =
        'Remain flat and log the observation — declining a low-quality tape is a completed decision';
      const { choices, correctIndex } = shuffleChoices(
        rand,
        [
          correct,
          'Take a small position so the session is not wasted',
          'Lower your standards until something qualifies',
          'Recheck every minute until a candle forces a decision',
        ],
        correct,
      );
      return {
        ...base,
        prompt:
          'Ninety minutes into a choppy, thin session: no acceptance beyond any level, VWAP crossed six times, and your two planned setups never triggered. What is the professional outcome?',
        choices,
        correctIndex,
        explanation:
          'Some sessions are unsuitable for a given approach. Activity is not progress; the journal entry "nothing met the plan" is evidence of discipline, and the review can still extract lessons.',
        timeLimitSeconds: 30,
        conceptIds: ['discipline', 'session-planning', 'fomo'],
      };
    }
  }
}

export function generateIntradayDrills(seed: number, count = 10): IntradayDrill[] {
  return Array.from({ length: count }, (_, i) => generateIntradayDrill(seed + i * 101, i));
}

export interface DrillAttemptScore {
  correct: boolean;
  timedOut: boolean;
  elapsedMs: number;
}

/** Score an attempt. A timeout is recorded honestly, never disguised as a miss by latency. */
export function scoreIntradayDrillAttempt(input: {
  drill: IntradayDrill;
  selectedIndex: number;
  elapsedMs: number;
  timed: boolean;
}): DrillAttemptScore {
  const timedOut = input.timed && input.elapsedMs > input.drill.timeLimitSeconds * 1000;
  return {
    correct: !timedOut && input.selectedIndex === input.drill.correctIndex,
    timedOut,
    elapsedMs: input.elapsedMs,
  };
}
