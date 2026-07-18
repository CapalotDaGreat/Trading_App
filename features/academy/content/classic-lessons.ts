import type { Lesson } from '../types/academy.types';

const TS = '2026-01-01T00:00:00.000Z';

function lesson(
  partial: Omit<Lesson, 'createdAt' | 'updatedAt' | 'content'> & { content?: string },
): Lesson {
  const content =
    partial.content ??
    partial.sections.map((s) => `${s.heading}\n\n${s.body}`).join('\n\n');
  return {
    ...partial,
    content,
    createdAt: TS,
    updatedAt: TS,
  };
}

/** Classic trading school — mechanics, TA, fundamentals, options, crypto. */
export const CLASSIC_LESSONS: Lesson[] = [
  lesson({
    id: 'basics-orders',
    title: 'Order types that actually matter',
    description: 'Market, limit, stop, and stop-limit — with failure modes.',
    category: 'basics',
    difficulty: 'beginner',
    durationMinutes: 12,
    track: 'classic',
    sortOrder: 20,
    isPremium: false,
    tags: ['orders', 'execution', 'basics'],
    relatedLessonIds: ['risk-position-sizing', 'basics-rr'],
    practiceLinks: [
      {
        label: 'Decision Lab · Risk',
        href: '/decision/lab?scenario=risk_management',
        description: 'Practice stops and size with a complete thesis',
      },
      {
        label: 'Pre-trade checklist',
        href: '/academy/checklist/pre-trade-checklist',
      },
    ],
    sections: [
      {
        heading: 'Market vs limit',
        body: 'Market orders prioritize speed: you get filled near the touch, with slippage risk in thin or fast markets.\n\nLimit orders prioritize price: you specify the worst price you will accept, and you may not fill. Use limits when you care more about location than immediacy — common for planned entries at structure.',
      },
      {
        heading: 'Stops and stop-limits',
        body: 'A stop order becomes a market order when price trades at the trigger — good for hard exits, but slippage can be large in gaps.\n\nA stop-limit becomes a limit order at trigger — you control price but may not exit in a freefall. Choose consciously: certainty of exit vs certainty of price.',
        callout: {
          type: 'warning',
          text: 'In gap risk (earnings, crypto weekends), a stop-limit can leave you stuck in a thesis that already invalidated.',
        },
      },
      {
        heading: 'Process link',
        body: 'Your invalidation level should drive stop placement — not a round number you like. Entry order type should match urgency: chasing a runaway move with market orders often is impulse, not plan.',
        callout: {
          type: 'tip',
          text: 'Practice stating “entry type + exit type + why” in one sentence before sending.',
        },
      },
    ],
    keyTakeaways: [
      'Market = speed; limit = price control.',
      'Stops guarantee attempt to exit, not fill quality.',
      'Stop-limits can fail to exit when you need them most.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'You need to exit a broken thesis during a violent selloff. Which is usually safer for exit certainty?',
        choices: ['Limit only far from market', 'Stop-market style exit', 'Stop-limit with tiny range', 'No order'],
        correctIndex: 1,
        explanation: 'Exit certainty usually beats price nicety when invalidation hits hard.',
      },
    ],
  }),

  lesson({
    id: 'risk-position-sizing',
    title: 'Position sizing and the 1% rule',
    description: 'Size from stop distance so one loss cannot ruin the week.',
    category: 'risk_management',
    difficulty: 'beginner',
    durationMinutes: 14,
    track: 'classic',
    sortOrder: 21,
    isPremium: false,
    tags: ['risk', 'sizing', 'stops'],
    relatedLessonIds: ['dec-invalidation', 'risk-expectancy', 'dec-portfolio-risk'],
    practiceLinks: [
      { label: 'Portfolio risk', href: '/decision/risk' },
      { label: 'Pre-trade checklist', href: '/academy/checklist/pre-trade-checklist' },
      {
        label: 'Decision Lab · Risk practice',
        href: '/decision/lab?scenario=risk_management',
        description: 'Open a thesis-first simulated trade focused on stops and size',
      },
    ],
    sections: [
      {
        heading: 'Risk first, size second',
        body: 'Decide how much account equity you will lose if invalidation hits (commonly 0.5–1% for active traders). Measure the distance from entry to invalidation. Position size = (account * risk%) / (entry − stop) per unit.\n\nIf size becomes tiny, the idea’s location is wrong for your account — skip rather than widen risk%.',
      },
      {
        heading: 'The 1% rule is a ceiling, not a target',
        body: 'You do not need to risk 1% every trade. In high volatility or uncertain regimes, risk less. Correlated open risk counts toward the same budget.\n\nNever enlarge size to “make the trade worth it.” That is ego sizing.',
        callout: {
          type: 'practice',
          text: 'Pick a hypothetical entry and stop on Replay; compute shares/contracts for 0.5% risk on a round account number.',
        },
      },
    ],
    keyTakeaways: [
      'Size from $ risk and stop distance.',
      '1% is a max mindset, not a quota.',
      'Tiny computed size ⇒ skip or better location.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Account $10,000, risk 1%, stop $2 away. Approx share size?',
        choices: ['50', '100', '500', '5'],
        correctIndex: 0,
        explanation: '($10,000 * 0.01) / $2 = 50 shares.',
      },
    ],
  }),

  lesson({
    id: 'risk-expectancy',
    title: 'Risk/reward and expectancy',
    description: 'Why payoff math beats win-rate mythology.',
    category: 'risk_management',
    difficulty: 'intermediate',
    durationMinutes: 13,
    track: 'classic',
    sortOrder: 22,
    isPremium: false,
    tags: ['expectancy', 'rr', 'edge'],
    relatedLessonIds: ['risk-position-sizing', 'dec-psychology', 'dec-setup-quality'],
    practiceLinks: [{ label: 'Journal', href: '/journal' }],
    sections: [
      {
        heading: 'Win rate is incomplete',
        body: 'A 70% win-rate system can lose money with poor payoff. A 40% system can thrive with asymmetric wins. Expectancy ≈ (win% * avg win) − (loss% * avg loss).\n\nDesign trades so the planned reward justifies the risk given your realistic hit rate — not fantasy runners every time.',
      },
      {
        heading: 'R-multiples',
        body: 'Measure outcomes in R (risk units). A +2R winner and −1R loser are comparable across sizes. Journal in R to see whether you cut winners and hold losers — the classic expectancy leak.',
        callout: {
          type: 'tip',
          text: 'Tag each trade with planned R and realized R; study the gap.',
        },
      },
    ],
    keyTakeaways: [
      'Expectancy combines frequency and payoff.',
      'Use R-multiples to compare trades fairly.',
      'Leaks often hide in asymmetric behavior, not entries.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: '40% wins at +2R, 60% losses at −1R. Expectancy per trade?',
        choices: ['−0.2R', '+0.2R', '+1R', '0R'],
        correctIndex: 1,
        explanation: '0.4*2 − 0.6*1 = 0.8 − 0.6 = +0.2R.',
      },
    ],
  }),

  lesson({
    id: 'ta-structure',
    title: 'Support, resistance, and market structure',
    description: 'Read swing structure before decorating with indicators.',
    category: 'technical_analysis',
    difficulty: 'beginner',
    durationMinutes: 15,
    track: 'classic',
    sortOrder: 23,
    isPremium: false,
    tags: ['structure', 'levels', 'swings'],
    relatedLessonIds: ['ta-trend-range', 'dec-invalidation', 'ta-mtf'],
    practiceLinks: [
      { label: 'Chart Replay', href: '/decision/replay' },
      {
        label: 'Decision Lab · Levels',
        href: '/decision/lab?scenario=support_resistance',
        description: 'Thesis from structure with clear invalidation',
      },
    ],
    sections: [
      {
        heading: 'Structure first',
        body: 'Markets advertise willingness to buy or sell at prior auction areas. Support/resistance are zones of interest, not laser lines. Higher highs / higher lows describe uptrends; the opposite describes downtrends; overlapping swings describe balance.',
      },
      {
        heading: 'Invalidation lives on structure',
        body: 'A long thesis often invalidates on a decisive break and hold beyond the swing that defined the idea — not on a random oscillator cross.\n\nRespect wicks vs closes based on your timeframe rules; be consistent.',
        callout: {
          type: 'practice',
          text: 'In Replay, strip indicators and only mark swings for 50 bars. Then add one entry idea with structure-based invalidation.',
        },
      },
    ],
    keyTakeaways: [
      'Structure precedes indicators.',
      'Treat levels as zones.',
      'Tie stops to structural failure.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'In a clear uptrend structure you typically see…',
        choices: ['Lower highs and lower lows', 'Higher highs and higher lows', 'Only doji days', 'Flat volume forever'],
        correctIndex: 1,
        explanation: 'HH/HL is the basic uptrend definition.',
      },
    ],
  }),

  lesson({
    id: 'ta-candles',
    title: 'Candlesticks in context',
    description: 'Patterns mean little without location and regime.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 14,
    track: 'classic',
    sortOrder: 24,
    isPremium: false,
    tags: ['candles', 'patterns', 'context'],
    relatedLessonIds: ['ta-structure', 'ta-volume', 'dec-regime'],
    practiceLinks: [{ label: 'Chart Replay', href: '/decision/replay' }],
    sections: [
      {
        heading: 'Candles are compression of auction',
        body: 'Open, high, low, close summarize who won the period. Long wicks show rejection; wide ranges show expansion; dojis show balance. Memorizing 30 named patterns without location is trivia.',
      },
      {
        heading: 'Context stack',
        body: 'Ask: Where is this candle (key level)? What regime? What volume? What higher-timeframe bias?\n\nA bullish engulfing into resistance in a risk-off tape is not the same as one at support in a trend pullback.',
        callout: {
          type: 'warning',
          text: 'Trading every hammer you see is a pattern addiction, not a process.',
        },
      },
    ],
    keyTakeaways: [
      'Candles need location and regime.',
      'Rejection and expansion > pattern names.',
      'Fewer, better contextual reads beat pattern spam.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'When is a reversal candle most meaningful?',
        choices: [
          'In the middle of nowhere on low volume',
          'At a relevant level with confirming context',
          'Always, by definition',
          'Only on weekly charts',
        ],
        correctIndex: 1,
        explanation: 'Location and confirmation drive usefulness.',
      },
    ],
  }),

  lesson({
    id: 'ta-trend-range',
    title: 'Trend vs range playbooks',
    description: 'Different markets demand different entries and expectations.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 12,
    track: 'classic',
    sortOrder: 25,
    isPremium: false,
    tags: ['trend', 'range', 'playbook'],
    relatedLessonIds: ['dec-regime', 'ta-structure', 'ta-mtf'],
    practiceLinks: [
      { label: 'Market condition', href: '/decision/regime' },
      { label: 'Chart Replay', href: '/decision/replay' },
      {
        label: 'Decision Lab · Trend',
        href: '/decision/lab?scenario=trend_following',
        description: 'Practice a trend thesis with full invalidation',
      },
    ],
    sections: [
      {
        heading: 'Trend playbook',
        body: 'Prefer pullbacks to structure in the direction of the trend. Be patient; fading strength is usually expensive. Trail or scale using structure rather than hope.',
      },
      {
        heading: 'Range playbook',
        body: 'Fade extremes toward mean with tight invalidation beyond the range boundary. Treat breakouts as guilty until proven — wait for acceptance (holds, retests) if you trade continuation.',
        callout: {
          type: 'tip',
          text: 'If you cannot tell trend from range in 10 seconds, reduce size or stand aside.',
        },
      },
    ],
    keyTakeaways: [
      'Trend: pullbacks with the bias.',
      'Range: extremes + acceptance rules for breaks.',
      'Ambiguity ⇒ smaller or flat.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'In a well-defined range, chasing the first breakout tick often…',
        choices: ['Has excellent expectancy', 'Fails frequently without acceptance', 'Removes all risk', 'Replaces journaling'],
        correctIndex: 1,
        explanation: 'False breaks are common until acceptance proves otherwise.',
      },
    ],
  }),

  lesson({
    id: 'ta-volume',
    title: 'Volume as confirmation',
    description: 'Use participation to stress-test breakouts and reversals.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 11,
    track: 'classic',
    sortOrder: 26,
    isPremium: true,
    tags: ['volume', 'confirmation'],
    relatedLessonIds: ['ta-candles', 'ta-structure'],
    practiceLinks: [{ label: 'Chart Replay', href: '/decision/replay' }],
    sections: [
      {
        heading: 'Participation matters',
        body: 'Price moves on thin volume are easier to reverse. Breakouts with expanding volume suggest broader agreement; breakouts on dying volume deserve skepticism.\n\nVolume is not magic — it is one confirmation layer behind structure and regime.',
      },
      {
        heading: 'Climaxes and dry-ups',
        body: 'Climactic volume can mark exhaustion (especially after long trends). Volume dry-up near support in an uptrend can precede continuation — still require your invalidation.\n\nCrypto and FX volume nuances differ by venue; treat absolute prints carefully.',
      },
    ],
    keyTakeaways: [
      'Volume stresses breakout quality.',
      'Thin moves deserve skepticism.',
      'Still subordinate volume to structure + risk.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'A range breakout on unusually light volume suggests…',
        choices: ['Maximum confidence', 'Higher odds of failure / need more proof', 'Guaranteed trend', 'Ignore structure'],
        correctIndex: 1,
        explanation: 'Light participation often means weak acceptance.',
      },
    ],
  }),

  lesson({
    id: 'ta-mtf',
    title: 'Multi-timeframe alignment',
    description: 'Higher timeframe bias, lower timeframe execution.',
    category: 'technical_analysis',
    difficulty: 'advanced',
    durationMinutes: 13,
    track: 'classic',
    sortOrder: 27,
    isPremium: true,
    tags: ['mtf', 'alignment', 'execution'],
    relatedLessonIds: ['ta-structure', 'ta-trend-range', 'dec-time-budget'],
    practiceLinks: [{ label: 'Chart Replay', href: '/decision/replay' }],
    sections: [
      {
        heading: 'Top-down map',
        body: 'Decide bias on a higher timeframe (daily/4H). Execute timing on a lower one (1H/15m) without inventing a new bias mid-trade.\n\nConflict rule: if HTF is bearish, be very selective with long scalp narratives — or flat.',
      },
      {
        heading: 'Noise discipline',
        body: 'Lower timeframes always look busy. Your research budget should mostly live on the bias timeframe; only drop down when an A-setup is forming.',
        callout: {
          type: 'warning',
          text: 'Switching to a lower TF to “make a bad idea look good” is a classic self-deception.',
        },
      },
    ],
    keyTakeaways: [
      'HTF bias, LTF timing.',
      'Do not renegotiate bias on noise.',
      'Spend research time where bias lives.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Daily trend down, 5-minute chart looks “buyable.” Default stance?',
        choices: [
          'Full size long',
          'Skeptical / selective / often skip',
          'Ignore daily',
          'Martingale',
        ],
        correctIndex: 1,
        explanation: 'HTF conflict reduces quality; selectivity rises.',
      },
    ],
  }),

  lesson({
    id: 'fund-basics',
    title: 'Fundamentals traders actually use',
    description: 'Catalysts, narrative, and valuation — without becoming an analyst firm.',
    category: 'fundamental_analysis',
    difficulty: 'beginner',
    durationMinutes: 12,
    track: 'classic',
    sortOrder: 28,
    isPremium: false,
    tags: ['fundamentals', 'catalysts', 'narrative'],
    relatedLessonIds: ['fund-calendar', 'dec-research-filter'],
    practiceLinks: [
      { label: 'Economic calendar', href: '/calendar' },
      { label: 'Markets', href: '/markets' },
    ],
    sections: [
      {
        heading: 'Enough fundamental to decide',
        body: 'You rarely need a full DCF to trade. You do need: what is the live narrative, what catalysts can reprice it, and whether the market already priced the obvious.\n\nFor swing ideas, know earnings/events dates before sizing.',
      },
      {
        heading: 'Narrative vs numbers',
        body: 'Price can ignore “cheap” for a long time. Use fundamentals to avoid blind spots and to set thesis invalidation (e.g. guidance break), not as a substitute for risk rules.',
        callout: {
          type: 'tip',
          text: 'Add event dates to your checklist before any multi-day hold.',
        },
      },
    ],
    keyTakeaways: [
      'Focus on narrative + catalysts + positioning.',
      'Know event risk on holds.',
      'Fundamentals inform thesis; they do not replace stops.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Before holding through earnings, you should at least…',
        choices: [
          'Ignore the date',
          'Know the date and decide if gap risk is acceptable',
          'Remove all stops',
          'Triple size',
        ],
        correctIndex: 1,
        explanation: 'Event gap risk is a first-class decision input.',
      },
    ],
  }),

  lesson({
    id: 'fund-calendar',
    title: 'Economic calendar and event risk',
    description: 'Plan around releases that can invalidate structure in seconds.',
    category: 'fundamental_analysis',
    difficulty: 'beginner',
    durationMinutes: 10,
    track: 'classic',
    sortOrder: 29,
    isPremium: false,
    tags: ['calendar', 'macro', 'events'],
    relatedLessonIds: ['fund-basics', 'dec-regime', 'risk-position-sizing'],
    practiceLinks: [
      { label: 'Economic calendar', href: '/calendar' },
      { label: 'High-vol checklist', href: '/academy/checklist/high-volatility' },
    ],
    sections: [
      {
        heading: 'Map the week',
        body: 'High-impact prints (CPI, NFP, central banks) change volatility regime intraday. Either reduce risk into the event, flatten, or trade a dedicated event playbook — do not “accidentally” hold full size.',
      },
      {
        heading: 'Process',
        body: 'Check calendar during morning brief. Tag open positions with event exposure. If you lack an event plan, your default is reduce.\n\nAfter the release, let the first impulse settle before inventing a new thesis unless that is your tested niche.',
        callout: {
          type: 'practice',
          text: 'Open the calendar now and mark the next high-impact event on your mental brief.',
        },
      },
    ],
    keyTakeaways: [
      'Events change vol and invalidate casual holds.',
      'Default to reduce without a plan.',
      'Brief includes calendar, not only charts.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'No event playbook, large CPI due in 10 minutes, full risk on. Best action?',
        choices: ['Hold and hope', 'Reduce or flatten per rules', 'Add size', 'Disable alerts'],
        correctIndex: 1,
        explanation: 'Unplanned event exposure is unmanaged risk.',
      },
    ],
  }),

  lesson({
    id: 'opt-basics',
    title: 'Options basics for risk expression',
    description: 'Defined risk, leverage, and when not to use options.',
    category: 'options',
    difficulty: 'intermediate',
    durationMinutes: 16,
    track: 'classic',
    sortOrder: 30,
    isPremium: true,
    tags: ['options', 'defined-risk', 'leverage'],
    relatedLessonIds: ['risk-position-sizing', 'dec-invalidation'],
    practiceLinks: [
      {
        label: 'Decision Lab · Risk',
        href: '/decision/lab?scenario=risk_management',
        description: 'Defined-risk thesis practice (process, not options signals)',
      },
      {
        label: 'Invalidation lesson',
        href: '/academy/lesson/dec-invalidation',
        description: 'Expiration is a time stop — revisit invalidation',
      },
    ],
    sections: [
      {
        heading: 'Calls, puts, and defined risk',
        body: 'Long options can define max loss as premium paid — useful when gap risk or asymmetric payoff matters. Short options collect premium but can carry large or undefined risk depending on structure.\n\nIf you do not understand Greeks at a basic level (delta, theta), size tiny or stick to shares.',
      },
      {
        heading: 'When options help discretionary traders',
        body: 'Express a catalyst view with limited loss; hedge a core holding; replace an oversized stock idea with a smaller defined-risk debit spread.\n\nWhen they hurt: lottery tickets, undefined short premium without a hedge, and ignoring expiration as time invalidation.',
        callout: {
          type: 'warning',
          text: 'Expiration is a hard time stop. “I’ll manage it later” is how theta eats process.',
        },
      },
    ],
    keyTakeaways: [
      'Long options define loss; short premium needs respect.',
      'Expiration is time invalidation.',
      'Do not use options to bypass sizing discipline.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Buying a call’s maximum loss is typically…',
        choices: ['Unlimited', 'The premium paid (plus fees)', 'Zero', 'Margin call only'],
        correctIndex: 1,
        explanation: 'Debit long options cap loss at premium.',
      },
    ],
  }),

  lesson({
    id: 'crypto-structure',
    title: 'Crypto market structure essentials',
    description: '24/7 tape, venue risk, and volatility sizing.',
    category: 'crypto',
    difficulty: 'intermediate',
    durationMinutes: 13,
    track: 'classic',
    sortOrder: 31,
    isPremium: true,
    tags: ['crypto', 'volatility', 'structure'],
    relatedLessonIds: ['dec-regime', 'risk-position-sizing', 'fund-calendar'],
    practiceLinks: [
      { label: 'Markets', href: '/markets' },
      { label: 'High-vol checklist', href: '/academy/checklist/high-volatility' },
    ],
    sections: [
      {
        heading: 'What changes vs equities',
        body: 'Crypto trades continuously, gaps less on “opens” but can spike violently anytime. Liquidity fragments across venues; prints and volume need context. Narratives and positioning (funding, crowded leverage) can dominate short horizons.',
      },
      {
        heading: 'Process adaptations',
        body: 'Widen your respect for volatility in sizing. Prefer defined invalidation and smaller risk%. Be careful with overnight (always-on) thesis drift. Stablecoin/venue risk is real — treat custody and exchange exposure as part of risk.',
        callout: {
          type: 'tip',
          text: 'Apply the same research filter: regime, clarity, time budget — then cut size for crypto vol.',
        },
      },
    ],
    keyTakeaways: [
      'Always-on markets need always-on risk rules.',
      'Size for higher vol and venue realities.',
      'Same decision filter; stricter sizing.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Relative to a calm large-cap equity, a typical crypto discretionary idea should often use…',
        choices: ['More leverage by default', 'Smaller risk fraction / tighter process', 'No invalidation', 'Only market orders'],
        correctIndex: 1,
        explanation: 'Higher vol and gap-like spikes argue for smaller risk units.',
      },
    ],
  }),

  lesson({
    id: 'basics-rr',
    title: 'Building a simple trade plan',
    description: 'Entry, invalidation, targets, and size on one card.',
    category: 'basics',
    difficulty: 'beginner',
    durationMinutes: 9,
    track: 'classic',
    sortOrder: 19,
    isPremium: false,
    tags: ['plan', 'basics', 'checklist'],
    relatedLessonIds: ['basics-orders', 'risk-position-sizing', 'dec-invalidation'],
    practiceLinks: [
      { label: 'Pre-trade checklist', href: '/academy/checklist/pre-trade-checklist' },
      { label: 'Journal', href: '/journal' },
    ],
    sections: [
      {
        heading: 'One-page plan',
        body: 'Every candidate gets: bias, setup type, entry trigger, invalidation, targets (or management rules), size math, and event risks. If any field is blank, you are not ready.\n\nThe plan exists to constrain behavior under stress — keep it short enough to follow.',
      },
      {
        heading: 'From plan to journal',
        body: 'Copy the plan into the journal at entry. After exit, mark followed vs broken rules. That loop is how Academy lessons become personal DNA.',
        callout: {
          type: 'practice',
          text: 'Write one full plan today without placing a trade — practice completeness.',
        },
      },
    ],
    keyTakeaways: [
      'Blank fields = not ready.',
      'Short plans beat novels you will ignore.',
      'Journal adherence closes the learning loop.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Which missing field most often turns a plan into gambling?',
        choices: ['Favorite color', 'Invalidation', 'Chart theme', 'Broker logo'],
        correctIndex: 1,
        explanation: 'Without invalidation, loss size is undefined.',
      },
    ],
  }),
];
