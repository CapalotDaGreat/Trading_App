import type { LearningTopic } from '@/shared/constants/learning-topics';
import { LEARNING_TOPIC_LABELS } from '@/shared/constants/learning-topics';

export type PracticeSkill = 'chart' | 'risk' | 'decision' | 'psychology';
export type PracticeDifficulty = 'beginner' | 'intermediate';
export type PracticeTimeBucket = 'short' | 'medium';

export interface PracticeDrill {
  id: string;
  title: string;
  prompt: string;
  skill: PracticeSkill;
  topic: LearningTopic;
  difficulty: PracticeDifficulty;
  estimatedMinutes: number;
  isPremium: boolean;
  lessonId?: string;
  simulateHref?: string;
  chartKind?:
    | 'candles'
    | 'support_resistance'
    | 'trend'
    | 'volume'
    | 'rsi'
    | 'moving_average'
    | 'breakout';
  choices: string[];
  correctIndex: number;
  explanation: string;
  whyItMatters: string;
}

export { LEARNING_TOPIC_LABELS };

export const PRACTICE_DRILLS: PracticeDrill[] = [
  {
    id: 'identify-trend',
    title: 'Identify the trend',
    prompt: 'On this educational tape, which description fits the structure best?',
    skill: 'chart',
    topic: 'chart_reading',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'ta-trend-range',
    chartKind: 'trend',
    choices: [
      'Higher highs and higher lows — an uptrend until proven otherwise',
      'A confirmed downtrend with lower lows already accepted',
      'A finished reversal — the trend is no longer relevant',
      'Random noise with no usable structure',
    ],
    correctIndex: 0,
    explanation:
      'Trend reading starts with swing structure, not a single candle. An uptrend can still fail; the skill is naming the structure before predicting the next tick.',
    whyItMatters: 'Entries without a trend read often chase. Naming structure first slows the decision down.',
  },
  {
    id: 'find-support',
    title: 'Find the strongest support',
    prompt: 'Where has price repeatedly found buyers on this educational chart?',
    skill: 'chart',
    topic: 'chart_reading',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'ta-structure',
    chartKind: 'support_resistance',
    choices: [
      'The round number at the top of the range',
      'The zone that has been tested more than once from above',
      'Yesterday’s close, regardless of location',
      'The newest wick, because it is the most recent',
    ],
    correctIndex: 1,
    explanation:
      'Support is a zone of prior demand, not a precise pixel. Repeated tests matter more than a single wick.',
    whyItMatters: 'Stops and invalidation belong under real structure, not under a round number you like.',
  },
  {
    id: 'breakout-quality',
    title: 'Is this breakout confirmed?',
    prompt: 'A close prints through resistance. What would make the breakout more trustworthy?',
    skill: 'chart',
    topic: 'technical_analysis',
    difficulty: 'intermediate',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'ta-trend-range',
    chartKind: 'breakout',
    choices: [
      'The first tick beyond the level, even on low volume',
      'A close beyond the level with participation, then a hold on retest',
      'A gap that you did not expect, so it must be important',
      'Social excitement about the ticker',
    ],
    correctIndex: 1,
    explanation:
      'Breakouts fail often. Confirmation is acceptance beyond the level, not the first print through it.',
    whyItMatters: 'False breakouts punish urgency. Waiting for acceptance is a process skill.',
  },
  {
    id: 'rr-compare',
    title: 'Which risk/reward is cleaner?',
    prompt: 'Same thesis, two locations. Which setup is more coherent?',
    skill: 'risk',
    topic: 'risk',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'basics-rr',
    simulateHref: '/simulate',
    choices: [
      'Entry stretched far from invalidation, tiny target, because you “feel” it',
      'Entry near structure, stop beyond invalidation, target at the next evidence-based level',
      'No stop, large size, because the idea is obvious',
      'Target first, then invent a stop that makes R:R look good',
    ],
    correctIndex: 1,
    explanation:
      'Risk/reward is coherent only when the stop is where the thesis dies — not where the spreadsheet looks pretty.',
    whyItMatters: 'A “winning” simulated fill with a nonsense stop is still a poor decision.',
  },
  {
    id: 'position-size',
    title: 'Which size matches 1% risk?',
    prompt: 'Equity $100,000. Entry 100, stop 90. Which size keeps risk at 1%?',
    skill: 'risk',
    topic: 'risk',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'risk-position-sizing',
    simulateHref: '/simulate',
    choices: ['10 shares', '50 shares', '100 shares', '1,000 shares'],
    correctIndex: 2,
    explanation:
      'Risk amount is $1,000. Distance to invalidation is 10. Quantity = 1,000 / 10 = 100. Size follows risk, not conviction.',
    whyItMatters: 'Conviction is not a sizing input. The stop distance and the 1% cap are.',
  },
  {
    id: 'missing-evidence',
    title: 'What evidence is missing?',
    prompt: 'Thesis: “It has to bounce because it is oversold.” What is missing?',
    skill: 'decision',
    topic: 'decision_making',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'ta-rsi',
    chartKind: 'rsi',
    choices: [
      'A celebrity opinion to confirm the oscillator',
      'Invalidation, timeframe, and a reason besides a stretched reading',
      'A larger position to make the idea matter',
      'Nothing — oversold guarantees a bounce',
    ],
    correctIndex: 1,
    explanation:
      'RSI can stay stretched. A thesis needs invalidation and context, not a single oscillator reading presented as fate.',
    whyItMatters: 'Guessing a bounce from one label is not analysis.',
  },
  {
    id: 'confirmation-bias',
    title: 'Which decision shows confirmation bias?',
    prompt: 'Pick the process failure, not the P&L outcome.',
    skill: 'psychology',
    topic: 'psychology',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'dec-psychology',
    choices: [
      'Logging a contrary fact and reducing size',
      'Ignoring a broken level because the original story still “feels right”',
      'Skipping the name because evidence is mixed',
      'Journaling the miss even though the simulated trade made money',
    ],
    correctIndex: 1,
    explanation:
      'Confirmation bias is protecting a story. A profitable simulated trade can still be biased; a losing one can still be process-correct.',
    whyItMatters: 'Review grades reasoning. Outcome is only one later chapter.',
  },
  {
    id: 'fx-convert',
    title: 'What does this dollar amount buy in euros?',
    prompt: 'Sample EUR/USD is 1.10. Ignoring spread, how many euros does $11,000 convert to?',
    skill: 'risk',
    topic: 'fundamentals',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'foundations-fx',
    simulateHref: '/simulate',
    choices: ['1,100 euros', '10,000 euros', '11,000 euros', '12,100 euros'],
    correctIndex: 1,
    explanation:
      'Quote is dollars per euro. 11,000 / 1.10 = 10,000 euros. Conversion literacy is not a buy/sell instruction.',
    whyItMatters: 'If you cannot convert units, you cannot size an FX pair in a USD book.',
  },
  {
    id: 'inflation-asset-effects',
    title: 'Inflation surprise — asset classes',
    prompt:
      'A fictional inflation print surprises versus a consensus guess. Which description is the educational mapping — not a prediction of any real release?',
    skill: 'decision',
    topic: 'fundamentals',
    difficulty: 'intermediate',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'fund-calendar',
    simulateHref: '/simulate?start=1&prep=inflation',
    choices: [
      'Hotter-than-guess inflation can lift real-yield pressure and often hits long-duration growth first; cooler can do the reverse — first ticks still fail',
      'Always buy gold and sell the index when CPI prints, because that is guaranteed',
      'The print does not matter if you already have a chart pattern',
      'You should short the currency of the country releasing the data, every time',
    ],
    correctIndex: 0,
    explanation:
      'The skill is mapping channels (real yields, policy odds, duration) without predicting this month’s number. First reactions fade. Simulated P/L would not grade the map.',
    whyItMatters:
      'Upcoming CPI is a reason to practice uncertainty — not to guess the print or issue a buy/sell call.',
  },
  {
    id: 'rate-decision-uncertainty',
    title: 'Rate Surprise Exercise',
    prompt:
      'A fictional committee decision is due in two sessions. The path of rates is unknown. Which process is sound?',
    skill: 'risk',
    topic: 'decision_making',
    difficulty: 'intermediate',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'fund-economy',
    simulateHref: '/simulate?start=1&prep=rates',
    choices: [
      'Decide the hike now and triple size because you are sure',
      'Name event risk, cut or skip size if you lack a playbook, and write what would invalidate each path',
      'Turn stops off so you are not shaken out by the statement',
      'Copy last year’s reaction and treat it as the next outcome',
    ],
    correctIndex: 1,
    explanation:
      'Possible fictional outcomes include higher than expected, lower, exactly expected, or mixed interpretation. Adaptation is the lesson. The real meeting is not being predicted.',
    whyItMatters: 'Rate days teach preparation and size, not a signal for the actual decision.',
  },
];

export function getPracticeDrill(id: string): PracticeDrill | undefined {
  return PRACTICE_DRILLS.find((drill) => drill.id === id);
}

export function getFreePracticeDrills(): PracticeDrill[] {
  return PRACTICE_DRILLS.filter((drill) => !drill.isPremium);
}
