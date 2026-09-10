import type { Lesson } from '../types/academy.types';

const TS = '2026-01-01T00:00:00.000Z';

function lesson(
  partial: Omit<Lesson, 'createdAt' | 'updatedAt' | 'content'> & { content?: string },
): Lesson {
  const content =
    partial.content ??
    partial.sections.map((section) => `${section.heading}\n\n${section.body}`).join('\n\n');
  return {
    ...partial,
    content,
    createdAt: TS,
    updatedAt: TS,
  };
}

/** Flagship chart-literacy lessons — free, with educational (not live) charts. */
export const CHART_LESSONS: Lesson[] = [
  lesson({
    id: 'ta-rsi',
    title: 'RSI: momentum, stretch, and divergence',
    description:
      'Read RSI as evidence about recent strength — never as an automatic buy or sell instruction.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 16,
    track: 'classic',
    sortOrder: 28,
    isPremium: false,
    tags: ['rsi', 'momentum', 'overbought', 'divergence'],
    searchKeywords: ['overbought', 'oversold', 'relative strength', 'oscillator'],
    prerequisiteIds: ['ta-candles', 'ta-structure'],
    relatedLessonIds: ['ta-trend-range', 'ta-volume', 'dec-regime'],
    practiceLinks: [
      {
        label: 'Inspect RSI on a research chart',
        href: '/asset/AAPL',
        description: 'Open a chart, then come back and write what RSI does not tell you',
      },
      { label: 'Chart Replay', href: '/decision/replay' },
    ],
    commonMistakes: [
      'Treating RSI above 70 as a sell signal in a strong trend.',
      'Ignoring price structure and only watching the oscillator.',
      'Forgetting that oversold can stay oversold in a decline.',
    ],
    whenItWorks: [
      'Range-bound markets where stretch often mean-reverts.',
      'Divergence after a clear swing, used as a research question not a trigger.',
    ],
    whenItFails: [
      'Strong trends where RSI can remain stretched for a long time.',
      'Very low-liquidity names where prints distort momentum.',
    ],
    educationalCharts: [],
    sections: [
      {
        heading: 'What you will learn',
        body: 'RSI (Relative Strength Index) compresses recent up-moves versus down-moves into a 0–100 oscillator. You will learn how traders read stretch, why “overbought” is a poor synonym for “sell”, how RSI behaves in trends, and how divergence is a question — not an order.',
      },
      {
        heading: 'Why it matters',
        body: 'Discretionary research often reaches for a number when the chart feels extended. RSI is one way to describe that feeling. Used badly, it becomes a fake certainty score. Used well, it is a second look at whether price has been one-sided.',
      },
      {
        heading: 'Core idea',
        body: 'Conceptually, RSI asks: of the recent net movement, how much was up versus down? High readings mean recent closes were persistently stronger than weaker. Low readings mean the opposite.\n\nThe common 70/30 (or 80/20) bands are conventions, not laws. In a strong uptrend, RSI can live above 60–70 for a long time. That is trend persistence, not a bug.',
        chart: {
          id: 'rsi-core',
          kind: 'rsi',
          title: 'Stretch is not a reversal',
          caption:
            'Educational example — labelled RSI bands. This chart is teaching material, not a live quote.',
          exercise: {
            prompt: 'In this example, RSI above the stretched band most usefully means…',
            choices: [
              'Price must reverse now',
              'Recent gains were unusually persistent — ask what else confirms',
              'You should sell',
              'The data is live',
            ],
            correctIndex: 1,
            explanation:
              'RSI describes the speed of recent change. Combine it with structure, volume, and regime before it changes a decision.',
          },
        },
      },
      {
        heading: 'How to interpret it on a chart',
        body: '1. Read price structure first (trend, range, key zone).\n2. Ask whether RSI agrees with that structure or argues with it.\n3. Treat a stretched reading as “recent action was one-sided”.\n4. Treat divergence as “this swing is not confirmed by momentum — what would confirm or invalidate?”\n\nNever let RSI skip invalidation, size, or event risk.',
      },
      {
        heading: 'Common mistakes',
        body: 'Selling solely because RSI is “overbought”. Buying solely because it is “oversold”. Using a 14-period RSI on a 1-minute chart as if it were a daily decision tool. Mixing live quotes with this educational example.',
        callout: {
          type: 'warning',
          text: 'Overbought does not mean sell. It means recent gains were stretched relative to recent losses.',
        },
      },
      {
        heading: 'When it helps — and when it misleads',
        body: 'It helps more in ranges, where stretch often fades. It misleads more in trends, where fading strength is expensive. If you cannot tell trend from range, RSI will not decide for you — reduce size or stand aside.',
        callout: {
          type: 'practice',
          text: 'On Replay, hide other indicators. Mark one stretched RSI reading and write what additional evidence you would want before changing a thesis.',
        },
      },
    ],
    keyTakeaways: [
      'RSI describes recent one-sidedness, not future direction.',
      'Overbought is stretch, not a sell alarm.',
      'Divergence is a research question that still needs structure and risk.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'RSI above 70 in a clear uptrend most often means…',
        choices: [
          'An automatic short setup',
          'Recent gains have been persistent — fading it needs more than the oscillator',
          'The instrument is guaranteed to reverse',
          'Volume is always high',
        ],
        correctIndex: 1,
        explanation: 'Strong trends can keep RSI stretched. Treat it as context, not a command.',
      },
      {
        id: 'q2',
        prompt: 'Price makes a new high while RSI makes a lower high. The honest next step is…',
        choices: [
          'Sell immediately',
          'Ask what would confirm or invalidate the idea, and check structure',
          'Ignore price',
          'Assume the data is fake',
        ],
        correctIndex: 1,
        explanation: 'Divergence is a clue. Process quality still requires invalidation and context.',
      },
    ],
  }),

  lesson({
    id: 'ta-moving-averages',
    title: 'Moving averages: trend context, not a crystal ball',
    description:
      'Averages lag price. Use them to describe trend and location — not to predict crossovers.',
    category: 'technical_analysis',
    difficulty: 'beginner',
    durationMinutes: 14,
    track: 'classic',
    sortOrder: 29,
    isPremium: false,
    tags: ['moving average', 'sma', 'ema', 'trend'],
    searchKeywords: ['crossover', 'lag', 'mean', 'average'],
    prerequisiteIds: ['ta-candles', 'ta-trend-range'],
    relatedLessonIds: ['ta-structure', 'ta-rsi', 'dec-regime'],
    practiceLinks: [
      { label: 'Chart Replay', href: '/decision/replay' },
      {
        label: 'Decision Lab · Trend',
        href: '/decision/lab?scenario=trend_following',
        description: 'Write a thesis from structure, then notice whether an average agrees',
      },
    ],
    commonMistakes: [
      'Trading every crossover as if it were a signal.',
      'Ignoring that averages lag — they describe what already happened.',
      'Using a short average on noise as if it were a higher-timeframe trend.',
    ],
    whenItWorks: [
      'Markets with persistent directional drift, as a location map.',
      'Filtering: only research pullbacks that still respect a chosen average.',
    ],
    whenItFails: [
      'Choppy ranges, where crossovers whip back and forth.',
      'News gaps that leave the average stranded.',
    ],
    educationalCharts: [],
    sections: [
      {
        heading: 'What you will learn',
        body: 'A moving average is a smoothed history of closes. Simple averages weight each bar equally; exponential averages emphasise recent bars. Neither predicts. Both lag.',
      },
      {
        heading: 'Why it matters',
        body: 'Averages are popular because they reduce visual noise. The cost is delay. If you treat a delayed line as a forecast, you will buy late and sell late — especially in ranges.',
      },
      {
        heading: 'Core idea',
        body: 'Price above a rising average often coincides with an uptrend; price below a falling average often coincides with a downtrend. That is correlation with structure, not magic.\n\nCrossovers tell you the short window has moved through the longer window. By then, much of the move may already be on the chart.',
        chart: {
          id: 'ma-core',
          kind: 'moving_average',
          title: 'Lag is the feature and the bug',
          caption: 'Educational example — SMA plotted on synthetic candles, not a live symbol.',
          exercise: {
            prompt: 'A moving-average crossover most honestly describes…',
            choices: [
              'A guaranteed trend change',
              'That recent prices have overtaken a lagged average of past prices',
              'A buy instruction',
              'Live broker data',
            ],
            correctIndex: 1,
            explanation:
              'Crossovers are delayed summaries. Decide from structure and risk; the average is supporting context.',
          },
        },
      },
      {
        heading: 'Practical interpretation',
        body: 'Pick one average that matches your holding horizon. Ask: is price extended from it, hugging it, or cutting through it repeatedly? Extension can mean trend strength or exhaustion — you still need structure.\n\nIf the average is being sliced both ways, you are probably in a range. Switch playbooks.',
        callout: {
          type: 'tip',
          text: 'One average plus structure beats five averages plus no invalidation.',
        },
      },
      {
        heading: 'Limitations',
        body: 'Averages do not know about events, gaps, or regime change. They will happily trail a failed breakout. Combine with volume/acceptance if you trade breaks, and always write what would prove you wrong.',
      },
    ],
    keyTakeaways: [
      'Averages lag; they summarise, they do not predict.',
      'Crossovers are delayed descriptions.',
      'In ranges, moving-average signals decay quickly.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'The main cost of using a moving average as a decision tool is…',
        choices: ['It never lags', 'Delay and whip in ranges', 'It replaces risk management', 'It is always live data'],
        correctIndex: 1,
        explanation: 'Lag helps in trends and hurts in chop. Know which regime you are in.',
      },
    ],
  }),
];
