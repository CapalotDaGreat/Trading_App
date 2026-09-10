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
  {
    id: 'compare-two-businesses',
    title: 'Two educational businesses — which note is honest?',
    prompt:
      'Cedar Retail: +4% revenue, stable 11% margin, modest debt. Harbor Components: +28% revenue, margin 11%→6%, negative free cash flow, debt/equity 1.1. Educational samples only. Which research note is honest?',
    skill: 'decision',
    topic: 'fundamentals',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'fund-basics',
    simulateHref: '/simulate?start=1&prep=earnings',
    choices: [
      'Harbor is the automatic long because growth always wins',
      'Harbor grew faster; Cedar’s margins and cash look more durable — neither card is a buy or sell instruction',
      'Buy both; diversification removes the need to read statements',
      'Ignore cash flow if revenue is up',
    ],
    correctIndex: 1,
    explanation:
      'Growth and quality can diverge. Naming that split is the skill. These companies are fictional practice files, not recommendations.',
    whyItMatters: 'A faster top line is not the same as a better business — and neither is an order.',
  },
  {
    id: 'changing-margins',
    title: 'Revenue up, margins down',
    prompt:
      'A fictional manufacturer grew revenue 28% while operating margin fell from 11% to 6% and free cash flow turned negative. Honest interpretation?',
    skill: 'decision',
    topic: 'fundamentals',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'fund-statements',
    simulateHref: '/simulate?start=1&prep=earnings',
    choices: [
      'Earnings quality improved because sales grew',
      'Efficiency worsened; cash and leverage still belong in the file — this is not a ticker tip',
      'Always short shrinking-margin names',
      'The next candle must follow the income statement',
    ],
    correctIndex: 1,
    explanation:
      'Rising revenue with thinning margins is a quality question. Simulated P/L would not grade this map.',
    whyItMatters: 'Profitability is more than a growth headline.',
  },
  {
    id: 'balance-sheet-risk',
    title: 'Cash generation versus refinancing risk',
    prompt:
      'Northline Utilities (fictional) converts earnings to cash but has a large debt stack to refinance in 18 months. Honest process note?',
    skill: 'decision',
    topic: 'fundamentals',
    difficulty: 'intermediate',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'fund-statements',
    simulateHref: '/simulate?start=1',
    choices: [
      'Ignore the balance sheet — cash conversion is enough',
      'Leverage and the refinancing window are risk context, even when the income line looks calm',
      'Buy more because utilities never fail',
      'A 5-minute stop solves solvency',
    ],
    correctIndex: 1,
    explanation:
      'The balance sheet is the obligations file. This snapshot is educational sample data, not a recommendation.',
    whyItMatters: 'Pretty earnings do not erase what is owed.',
  },
  {
    id: 'growth-vs-quality',
    title: 'Growth versus quality in a new pair',
    prompt:
      'New educational pair: a fast-growing software name with compressing cash conversion versus a slower retailer with stable margins. You have not seen these exact figures in a lesson. Honest split?',
    skill: 'decision',
    topic: 'fundamentals',
    difficulty: 'intermediate',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'fund-valuation-quality',
    simulateHref: '/simulate?start=1&prep=earnings',
    choices: [
      'Always prefer the faster grower at any price',
      'Name growth, cash quality, and price paid as separate questions — still not a buy list',
      'The slower name is automatically cheap',
      'Skip the file if the chart is trending',
    ],
    correctIndex: 1,
    explanation:
      'Transfer is applying the same process to an unfamiliar pair. Neither name is a recommendation.',
    whyItMatters: 'Demonstration requires the skill in a new example, not the same quiz twice.',
  },
  {
    id: 'valuation-uncertainty',
    title: 'A high multiple is not a timing tool',
    prompt:
      'BrightCanvas Inc. (fictional) grows 18%, sits at a richer P/E than peers, and faces a new free-tier rival. Which note is honest?',
    skill: 'decision',
    topic: 'fundamentals',
    difficulty: 'intermediate',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'fund-valuation-quality',
    simulateHref: '/simulate?start=1&prep=earnings',
    choices: [
      'High multiple means buy before it mean-reverts',
      'Price paid, advantage, and uncertainty are separate; a multiple is not a buy alarm',
      'Skip risk management because software compounds',
      'Short every rich multiple',
    ],
    correctIndex: 1,
    explanation:
      'Valuation is a comparison under uncertainty. This academy does not recommend buying or selling BrightCanvas.',
    whyItMatters: 'Wonderful businesses can be overpaid. Timing still needs its own process.',
  },
  {
    id: 'name-invalidation',
    title: 'Name the thesis-killer',
    prompt: 'You wrote a simulated long: “buyers still defend this zone.” Which sentence is invalidation, not hope?',
    skill: 'decision',
    topic: 'decision_making',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'dec-invalidation',
    simulateHref: '/simulate',
    choices: [
      'I will get out if it feels uncomfortable',
      'Acceptance below the zone means the demand claim is dead — exit and review',
      'Give it room because the story is still good',
      'Move the stop farther so the simulated P/L stays green',
    ],
    correctIndex: 1,
    explanation:
      'Invalidation is a checkable condition. Discomfort, extra room, and protecting a paper P/L are not a thesis-killer.',
    whyItMatters: 'Without a killer condition, size is theater and review has nothing to grade.',
  },
  {
    id: 'volatility-size',
    title: 'Wider range, same cash risk',
    prompt: 'Typical range doubled. Your structure stop is now twice as far. Same 1% cash-risk budget. Process move?',
    skill: 'risk',
    topic: 'risk',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'foundations-volatility',
    simulateHref: '/simulate',
    choices: [
      'Keep the same quantity so you “capture the move”',
      'Cut quantity so cash risk stays at the budget — or skip if size becomes meaningless',
      'Widen risk% because volatility is opportunity',
      'Turn the stop off so you are not shaken out',
    ],
    correctIndex: 1,
    explanation:
      'Range is a sizing input. Same quantity with a wider structure stop doubles cash at risk. Movement is not a permission slip.',
    whyItMatters: 'Volatility changes the math of the budget. It does not tell you which way price will go.',
  },
  {
    id: 'fomo-chase',
    title: 'Which action is FOMO?',
    prompt: 'Price already ran. You have no pre-written thesis. Which move is FOMO?',
    skill: 'psychology',
    topic: 'psychology',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'psych-fomo',
    simulateHref: '/simulate',
    choices: [
      'Stand aside, optionally journal the skip, wait for a plan with invalidation',
      'Market-buy the close because a chat room is loud and you “already missed it”',
      'Cut planned size because the location is worse than your playbook',
      'Write why-not and look for a later hold/retest that your rules actually allow',
    ],
    correctIndex: 1,
    explanation:
      'FOMO is urgency from a move already in motion, with weak evidence. Missing a move is cheap. An unplanned chase spends the budget.',
    whyItMatters: 'The market does not owe you the move you watched. Process is thesis first, including paper trades.',
  },
  {
    id: 'revenge-interrupt',
    title: 'Interrupt after a plan break',
    prompt: 'You just broke your stop rule on a simulated loss. Next action that is process?',
    skill: 'psychology',
    topic: 'psychology',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'psych-revenge',
    simulateHref: '/simulate',
    choices: [
      'Double size immediately — you “know this ticker now”',
      'Pause new risk until a journal sentence names what broke; reset to planned size',
      'Disable the stop because the last fill “wasn’t fair”',
      'Switch names and chase the same size to get the loss back',
    ],
    correctIndex: 1,
    explanation:
      'Revenge is size or frequency driven by the last sting, not a new independent decision. The interrupt is a pause rule, not a bigger bet.',
    whyItMatters: 'The second trade after a loss often has the worst file. Paper trading still trains that leak.',
  },
  {
    id: 'confidence-check',
    title: 'A streak is not a new edge',
    prompt: 'Four paper wins in a row. Which response is process?',
    skill: 'psychology',
    topic: 'psychology',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'psych-overconfidence',
    simulateHref: '/simulate',
    choices: [
      'Triple size and skip the next journal — you are in sync',
      'Keep planned risk percent; journal the winner with the same questions as a loser',
      'Add a market you have not studied because “it’s working”',
      'Treat simulated P/L as proof you should trade live immediately',
    ],
    correctIndex: 1,
    explanation:
      'A streak is a path. Size changes belong in the written plan. Winners need review. Paper profit is not a graduation certificate.',
    whyItMatters: 'Drawdowns often start after a green patch, when size quietly inflates without a new process.',
  },
  {
    id: 'loss-aversion',
    title: 'Which action is loss aversion?',
    prompt: 'Price tags your written invalidation. Which move is the loss-aversion leak — not a diagnosis of you?',
    skill: 'psychology',
    topic: 'psychology',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'psych-loss-aversion',
    simulateHref: '/simulate',
    choices: [
      'Exit at the written invalidation and journal what the thesis missed',
      'Widen the stop so you do not have to book the scratch “yet”',
      'Reduce size because volatility rose, as the plan already required',
      'Skip the next name until a new thesis is written',
    ],
    correctIndex: 1,
    explanation:
      'Moving the exit to avoid the feeling of a loss is a new trade. A planned scratch is process. Simulated P/L is not the grade.',
    whyItMatters: 'Loss aversion buys time with the risk budget. Write the exit before the sting.',
  },
  {
    id: 'premature-entry',
    title: 'Which entry is premature?',
    prompt: 'The tape is moving. You have no written thesis or invalidation yet. Which action is premature?',
    skill: 'psychology',
    topic: 'psychology',
    difficulty: 'beginner',
    estimatedMinutes: 4,
    isPremium: false,
    lessonId: 'dec-thesis',
    simulateHref: '/simulate?start=1&focus=thesis_discipline',
    choices: [
      'Stand aside until thesis, evidence, and invalidation are named',
      'Enter now and write the plan after the fill, because waiting “misses it”',
      'Cut size to a token amount and still skip invalidation',
      'Journal the skip and wait for a location your rules actually allow',
    ],
    correctIndex: 1,
    explanation:
      'Premature entry is size before a written idea. A smaller unplanned fill is still unplanned. Process is thesis and invalidation first.',
    whyItMatters: 'Speed is not a substitute for a decision. Missing a move is cheaper than an unwritten paper trade.',
  },
  {
    id: 'recency-bias',
    title: 'The last print is not the whole file',
    prompt:
      'The last two paper sessions were green. A new ambiguous tape appears. Which response is process — not a diagnosis of you?',
    skill: 'psychology',
    topic: 'psychology',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'psych-recency',
    simulateHref: '/simulate?start=1&focus=uncertainty',
    choices: [
      'Keep the written risk percent and judge this tape on its own evidence',
      'Double size because “it has been working”',
      'Skip the journal because recent wins already prove the method',
      'Treat the last two prints as a forecast for this name',
    ],
    correctIndex: 0,
    explanation:
      'Recency overweighting treats the last outcome as the base rate. Each decision still needs thesis, evidence, and invalidation. Simulated P/L is context.',
    whyItMatters: 'A streak is a path, not a new edge. The next tape can still be ambiguous.',
  },
  {
    id: 'uncertainty-conflict',
    title: 'Two notes disagree',
    prompt:
      'One educational note supports the idea. Another, equally sourced, argues the opposite. The print is still unknown. Process next?',
    skill: 'decision',
    topic: 'decision_making',
    difficulty: 'intermediate',
    estimatedMinutes: 5,
    isPremium: false,
    lessonId: 'dec-uncertainty',
    simulateHref: '/simulate?start=1&focus=uncertainty',
    choices: [
      'Name the conflict, reduce or skip size, and write what would resolve it',
      'Average the two notes into a buy because “both might be right”',
      'Ignore the disagreeing note so the thesis stays clean',
      'Enter full size and decide later — uncertainty is just noise',
    ],
    correctIndex: 0,
    explanation:
      'Conflicting evidence is a reason to shrink or stand aside, not to invent certainty. Naming the conflict is the skill.',
    whyItMatters: 'Ambiguity is common. Process is how you size when you do not know.',
  },
];

export function getPracticeDrill(id: string): PracticeDrill | undefined {
  return PRACTICE_DRILLS.find((drill) => drill.id === id);
}

export function getFreePracticeDrills(): PracticeDrill[] {
  return PRACTICE_DRILLS.filter((drill) => !drill.isPremium);
}
