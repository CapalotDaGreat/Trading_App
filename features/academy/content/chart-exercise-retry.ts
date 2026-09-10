import type { EducationalChartExercise, EducationalChartKind } from '../types/educational-chart.types';

/**
 * Alternate chart prompts for retry-after-miss. Same concept family, different item.
 * Completing retries is still recognition/application evidence — not mastery farming.
 */
export const CHART_EXERCISE_RETRY_BANK: Record<EducationalChartKind, EducationalChartExercise[]> = {
  candles: [
    {
      prompt: 'A long lower wick after a decline most usefully suggests…',
      choices: [
        'A guaranteed reversal you should buy',
        'Sellers pushed price down and buyers showed up — still ask what would invalidate',
        'The next candle must be green',
        'This is a live execution signal',
      ],
      correctIndex: 1,
      explanation:
        'Wicks describe a battle that already happened. They are context for a thesis, not a buy instruction.',
    },
    {
      prompt: 'Two small-bodied candles in a tight range most usefully mean…',
      choices: [
        'You should sell because nothing is happening',
        'Range and indecision — size and invalidation still need a written plan',
        'A breakout is guaranteed next',
        'The tape is a live quote',
      ],
      correctIndex: 1,
      explanation:
        'Small bodies describe low conviction in that window. They do not authorize a chase or a skip of risk rules.',
    },
  ],
  support_resistance: [
    {
      prompt: 'Price tags a labelled support zone and rejects. The process next is…',
      choices: [
        'Buy because support always holds',
        'Write what would prove the zone failed before changing size',
        'Ignore the zone because it is educational',
        'Place a live order',
      ],
      correctIndex: 1,
      explanation:
        'A bounce is one observation. Invalidation of the zone is still required before a simulated size.',
    },
  ],
  trend: [
    {
      prompt: 'Higher highs and higher lows on this educational tape describe…',
      choices: [
        'A buy signal',
        'An uptrend structure — still write invalidation under the last higher low',
        'Proof the move cannot fail',
        'A live quote you should execute',
      ],
      correctIndex: 1,
      explanation:
        'Trend is a description of recent structure. It is not a prediction and not an order.',
    },
    {
      prompt: 'A sequence of lower highs after a climb most usefully means…',
      choices: [
        'You must sell now',
        'The prior uptrend is in question — name what would confirm a regime change',
        'Ignore structure and trade the last print',
        'The chart is live market data',
      ],
      correctIndex: 1,
      explanation:
        'Failed higher highs are a process cue to update the thesis, not a short recommendation.',
    },
  ],
  volume: [
    {
      prompt: 'A break of a range on shrinking volume most usefully means…',
      choices: [
        'The breakout is high quality — size up',
        'Participation is thin — treat quality as unproven until more evidence arrives',
        'Volume does not matter in education',
        'Buy because price printed higher',
      ],
      correctIndex: 1,
      explanation:
        'Volume is participation context. A thin break is a reason to wait or reduce, not a signal.',
    },
  ],
  rsi: [
    {
      prompt: 'RSI stays stretched while price makes another high. Process next is…',
      choices: [
        'Sell because RSI is overbought',
        'Ask whether structure still holds and what would invalidate the trend',
        'Ignore RSI because it is educational',
        'Treat the reading as a live sell alarm',
      ],
      correctIndex: 1,
      explanation:
        'Stretch in a trend can persist. Combine RSI with structure and a written invalidation.',
    },
    {
      prompt: 'RSI divergence against a new high most usefully means…',
      choices: [
        'The high must reverse immediately',
        'Momentum did not confirm the high — write what additional evidence you need',
        'Buy the divergence',
        'The oscillator is a live quote',
      ],
      correctIndex: 1,
      explanation:
        'Divergence is a question about confirmation. It is not an automatic reversal trade.',
    },
  ],
  moving_average: [
    {
      prompt: 'Price is above a rising average on this educational tape. That most usefully means…',
      choices: [
        'A buy signal',
        'Recent closes are above a lagging summary — still need thesis and invalidation',
        'The average predicts the next tick',
        'You should execute live',
      ],
      correctIndex: 1,
      explanation:
        'Averages summarize past closes. They do not replace a written plan.',
    },
  ],
  breakout: [
    {
      prompt: 'A close back inside the range after a breakout most usefully means…',
      choices: [
        'Add size because it will work on the second try',
        'The breakout thesis is in question — this is why invalidation is written first',
        'Ignore the close; the first print was enough',
        'It is a live short signal',
      ],
      correctIndex: 1,
      explanation:
        'Failed breakouts are a common process lesson. The grade is whether invalidation was named, not P/L.',
    },
    {
      prompt: 'A breakout with expanding volume and a hold above the range most usefully means…',
      choices: [
        'Guaranteed continuation — max size',
        'Quality is better than a thin fake — still write the failure line before size',
        'You should buy because the academy said so',
        'This is a licensed live tape',
      ],
      correctIndex: 1,
      explanation:
        'Quality can improve the file. It still does not skip invalidation or position sizing.',
    },
  ],
  macd: [
    {
      prompt: 'A MACD cross on this educational chart most usefully means…',
      choices: [
        'A buy/sell signal',
        'Average momentum changed — still check structure, events, and invalidation',
        'The next candle is known',
        'Execute immediately',
      ],
      correctIndex: 1,
      explanation:
        'MACD is a lagged comparison of averages. It is context, not an instruction.',
    },
  ],
  risk_reward: [
    {
      prompt: 'A 1:1 target against a wide stop on this sketch most usefully means…',
      choices: [
        'Take it because the chart looks good',
        'Cash at risk is large versus the planned reward — rewrite size or skip',
        'Ignore the numbers; conviction matters more',
        'This is a live order ticket',
      ],
      correctIndex: 1,
      explanation:
        'Reward-to-risk is arithmetic on the written plan. Pretty structure does not override the budget.',
    },
  ],
};

export function retryExercisesForKind(
  kind: EducationalChartKind,
  current: EducationalChartExercise,
): EducationalChartExercise[] {
  const bank = CHART_EXERCISE_RETRY_BANK[kind] ?? [];
  return bank.filter((item) => item.prompt !== current.prompt);
}

export function nextRetryExercise(
  kind: EducationalChartKind,
  current: EducationalChartExercise,
  seenPrompts: string[],
): EducationalChartExercise | null {
  const candidates = retryExercisesForKind(kind, current).filter((item) => !seenPrompts.includes(item.prompt));
  return candidates[0] ?? retryExercisesForKind(kind, current)[0] ?? null;
}
