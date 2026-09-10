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
    id: 'foundations-market',
    title: 'What a market actually is',
    description: 'A usable model of buyers, sellers, and why a quote is not a promise.',
    category: 'basics',
    difficulty: 'beginner',
    durationMinutes: 10,
    track: 'classic',
    sortOrder: 5,
    isPremium: false,
    tags: ['foundations', 'market', 'bid', 'ask', 'liquidity'],
    searchKeywords: ['what is a market', 'bid ask', 'liquidity', 'spread', 'exchange'],
    relatedLessonIds: ['basics-orders', 'ta-candles'],
    practiceLinks: [
      {
        label: 'Practice · Identify the trend',
        href: '/practice?drill=identify-trend',
        description: 'Read structure on an educational chart',
      },
      {
        label: 'Apply in simulation',
        href: '/simulate',
        description: 'Place a tiny simulated order only after naming the bid/ask idea',
      },
    ],
    commonMistakes: [
      'Treating the last print as a guaranteed next price.',
      'Ignoring that a wide spread is a cost, not a rounding error.',
    ],
    whenItWorks: ['You need a mental model before indicators or news.'],
    whenItFails: ['The model does not tell you what happens next — only how matching works.'],
    sections: [
      {
        heading: 'Learning objectives',
        body: 'By the end you can explain, in one sentence, how a trade happens, why bid and ask differ, and why liquidity changes how “the price” feels.',
      },
      {
        heading: 'Why this matters',
        body: 'Charts are a recording of matched orders. If you skip the matching story, every later tool becomes a fortune-telling gadget.\n\nTradeAcademy is not a broker. This lesson is so you can practice reading a market, not so you can send live orders.',
      },
      {
        heading: 'Core explanation',
        body: 'A market is a matching engine: someone willing to buy at a price meets someone willing to sell. The bid is the best advertised buy; the ask is the best advertised sell. The last trade is history, not a contract that the next trade must occur there.\n\nLiquidity is how much size you can transact without walking the book. In a thin name, your own simulated size would move the picture; in a deep name, it would not.',
      },
      {
        heading: 'Visual / chart link',
        body: 'A candle is four prints (open, high, low, close) over a chosen window. It compresses many bids and asks into a rectangle. That is useful — and it hides the order book. Do not confuse a clean candle with a liquid market.',
      },
      {
        heading: 'Practical example',
        body: 'You want to “buy at 100.” If the ask is 100.40 with little size, a marketable buy pays 100.40+ and may slip. A limit at 100 may never fill. Neither outcome is a moral failure; it is the matching rule you chose.',
        callout: {
          type: 'practice',
          text: 'Say out loud: “I am paying the ask / I am waiting on the bid” before any simulated order.',
        },
      },
      {
        heading: 'Common mistakes',
        body: 'Calling the last price “the market.” Ignoring spread as a cost. Assuming an indicator can override an empty book.',
      },
      {
        heading: 'When the idea fails',
        body: 'Halts, gaps, and auctions change matching. Overnight and weekend crypto sessions are not the same as a primary equity auction. The model still helps; the details change.',
      },
      {
        heading: 'Key takeaways',
        body: 'Price is a meeting, not a prophecy. Spread and depth are part of the decision. Simulated fills in this app still teach the language — they do not prove a live fill.',
      },
    ],
    keyTakeaways: [
      'A market matches willing buyers and sellers; the last print is history.',
      'Bid/ask and liquidity are costs and constraints, not decoration.',
      'Charts summarise matching. They do not guarantee the next trade.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'You need to buy immediately. Which description is most accurate?',
        choices: [
          'You transact at last price by definition',
          'You are lifting the ask and may pay more than the last print',
          'The bid will fill you because you are a buyer',
          'An oscillator decides the fill price',
        ],
        correctIndex: 1,
        explanation: 'Immediate buys typically lift the ask. Last price is not a fill guarantee.',
      },
    ],
  }),
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
    searchKeywords: ['position size', '1% rule', 'how many shares', 'risk budget'],
    relatedLessonIds: ['dec-invalidation', 'risk-expectancy', 'dec-portfolio-risk', 'risk-per-trade'],
    conceptIds: ['position-sizing', 'risk-per-trade'],
    learningObjectives: [
      'Compute quantity from cash risk and distance to invalidation.',
      'Treat 1% as a ceiling, not a quota you must spend.',
      'Skip the idea when the honest stop makes size meaningless.',
    ],
    whyItMatters:
      'Without a size rule, a “good chart” becomes an unbounded bet. Real-world survival is how you lose, not how often you are right.',
    practicalExamples: [
      'Paper equity $100,000, risk 0.5%, stop $2.00 away ⇒ 250 units before fees.',
      'Same idea, stop $8.00 away because structure is farther ⇒ 62 units. You did not “chicken out”; you kept cash risk constant.',
      'Two correlated paper longs that each “risk 1%” are closer to one 2% theme if they fail together.',
    ],
    limitations: [
      'Gaps and slippage can exceed planned cash risk. A budget is not a guarantee.',
      'This is paper math on labelled synthetic prices. Live fills, borrow, and overnight gaps are harsher.',
      'The 1% figure is a teaching rail, not advice for your live account.',
    ],
    commonMistakes: [
      'Picking a comfortable loss first, then inventing a stop that happens to match it.',
      'Enlarging size because the setup “looks special”.',
      'Ignoring that three similar positions are one bet.',
    ],
    whenItWorks: ['You already wrote invalidation, then asked what size that distance allows.'],
    whenItFails: [
      'When the stop is inside noise, so you get shaken and re-enter at full risk.',
      'When an event gap opens through the stop and the planned loss is a fantasy.',
    ],
    educationalCharts: [
      {
        id: 'sizing-rr',
        kind: 'risk_reward',
        title: 'Distance to invalidation sets quantity',
        caption: 'Educational R:R sketch. Wider stop ⇒ fewer units for the same cash risk. Not a live ticket.',
      },
    ],
    exercises: [
      {
        id: 'ex-size-calc',
        kind: 'calculate',
        prompt: 'Simulated equity 100,000. You accept 1% cash risk. Invalidation is 4.00 away. Quantity?',
        expectedValue: 250,
        tolerance: 0.01,
        unit: 'units',
        explanation: '1,000 cash risk / 4.00 = 250. If that size feels “too small to bother”, skip — do not widen risk%.',
        conceptId: 'position-sizing',
        askEvidence: true,
      },
    ],
    practiceLinks: [
      {
        label: '1% size drill',
        href: '/practice?drill=position-size',
        description: 'Keep cash risk stable when the stop widens.',
      },
      { label: 'Portfolio risk', href: '/decision/risk' },
      {
        label: 'Decision Lab · Risk practice',
        href: '/decision/lab?scenario=risk_management',
        description: 'Thesis-first paper trade. Simulated P/L is not the grade.',
      },
    ],
    simulationLinks: [
      {
        label: 'Size a paper order',
        href: '/simulate?start=1',
        description: 'Write invalidation, then size. Reckless size is a process miss even if the tape goes your way.',
      },
    ],
    journalHref: '/journal?from=academy&notes=Cash%20risk%20and%20stop%20distance',
    sections: [
      {
        heading: 'Risk first, size second',
        body: 'Decide how much account equity you will lose if invalidation hits (commonly 0.5–1% for teaching). Measure the distance from entry to that level. Quantity ≈ (equity × risk%) / distance per unit.\n\nIf computed size is tiny, the location is wrong for the account — skip rather than widen risk%.',
      },
      {
        heading: 'The 1% rule is a ceiling, not a target',
        body: 'You do not need to spend 1% every trade. Into a high-impact release, or when two positions share a theme, risk less. Never enlarge size to “make the trade worth it.” That is ego sizing.',
        callout: {
          type: 'practice',
          text: 'On Replay, pick an entry and a structure stop. Compute units for 0.5% of a round paper number. If you would not take that size, you do not have a trade.',
        },
      },
      {
        heading: 'Counterexample',
        body: 'A trader risks 0.25% “until they are sure,” then triples size after two wins. The third idea is the same quality as the first — only the mood changed. That is not position sizing. That is a streak story.',
      },
    ],
    keyTakeaways: [
      'Size from cash risk and stop distance.',
      '1% is a max mindset, not a quota.',
      'Tiny computed size ⇒ skip or better location.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Account $10,000, risk 1%, stop $2 away. Approx share size?',
        choices: ['50', '100', '500', '5'],
        correctIndex: 0,
        explanation: '($10,000 × 0.01) / $2 = 50 shares.',
        conceptId: 'position-sizing',
        choiceExplanations: [
          'Cash risk $100 / $2 = 50. This is paper arithmetic, not a recommendation.',
          'That would be 2% risk, or a $1 stop — neither was given.',
          'That ignores the $2 stop and treats 1% as share count.',
          'That is 0.1% risk, or a $20 stop.',
        ],
      },
      {
        id: 'q2',
        prompt: 'The honest stop is so far that size is tiny. What is the process move?',
        choices: [
          'Widen risk% so the trade “matters”',
          'Skip or wait for a location that fits the budget',
          'Drop the stop and “manage it”',
          'Double size because you are more confident',
        ],
        correctIndex: 1,
        explanation: 'Budget first. Location is optional. Ego size is not a strategy.',
        conceptId: 'position-sizing',
        choiceExplanations: [
          'Changing the budget to fit the chart is the opposite of a rule.',
          'If structure and budget disagree, you pass. That is competence.',
          'No stop is undefined risk, not freedom.',
          'Confidence is not a size input.',
        ],
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
    tags: ['structure', 'levels', 'swings', 'support', 'resistance'],
    searchKeywords: ['support', 'resistance', 'higher high', 'retest', 'rejection'],
    prerequisiteIds: ['ta-candles'],
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
        chart: {
          id: 'sr-zones',
          kind: 'support_resistance',
          title: 'Support, resistance, hold, and break',
          caption:
            'Educational example. Zones, a hold at support, then a later break. This is not a live chart.',
          exercise: {
            prompt: 'The labelled support zone is most useful as…',
            choices: [
              'An exact price that cannot break',
              'An area of prior demand to watch for hold, failure, or retest',
              'A buy signal',
              'Proof the next breakout will work',
            ],
            correctIndex: 1,
            explanation:
              'Zones describe where auction previously changed. What happens next still needs acceptance and invalidation.',
          },
        },
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
    tags: ['candles', 'patterns', 'context', 'ohlc'],
    searchKeywords: ['candlestick', 'wick', 'body', 'bullish', 'bearish', 'doji'],
    prerequisiteIds: ['ta-structure'],
    relatedLessonIds: ['ta-structure', 'ta-volume', 'dec-regime'],
    practiceLinks: [{ label: 'Chart Replay', href: '/decision/replay' }],
    sections: [
      {
        heading: 'Candles are compression of auction',
        body: 'Open, high, low, close summarize who won the period. Long wicks show rejection; wide ranges show expansion; dojis show balance. Memorizing 30 named patterns without location is trivia.',
        chart: {
          id: 'candle-anatomy',
          kind: 'candles',
          title: 'Bodies, wicks, and range',
          caption:
            'Educational example. Bullish and bearish closes, wicks, and a wide-range bar. Not live data.',
          exercise: {
            prompt: 'A long lower wick at a relevant support zone most usefully suggests…',
            choices: [
              'A guaranteed reversal',
              'Buyers defended that area during the period — still check location and follow-through',
              'You should buy',
              'The timeframe does not matter',
            ],
            correctIndex: 1,
            explanation:
              'Wicks describe rejection inside that bar. Meaning still depends on location, volume, and what happens next.',
          },
        },
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
    tags: ['trend', 'range', 'playbook', 'breakout'],
    searchKeywords: ['higher high', 'breakout', 'failed breakout', 'pullback'],
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
        chart: {
          id: 'trend-hhhl',
          kind: 'trend',
          title: 'Higher highs and higher lows',
          caption: 'Educational example of an uptrend structure. Use it to practise naming swings — not to copy a trade.',
        },
      },
      {
        heading: 'Range playbook',
        body: 'Fade extremes toward mean with tight invalidation beyond the range boundary. Treat breakouts as guilty until proven — wait for acceptance (holds, retests) if you trade continuation.',
        chart: {
          id: 'breakout-retest',
          kind: 'breakout',
          title: 'Range, break, failure, then acceptance',
          caption:
            'Educational example. First break fails; a later break holds. Confirmation is behaviour, not a single tick.',
          exercise: {
            prompt: 'The first labelled break is most honestly described as…',
            choices: [
              'A confirmed trend that must be traded',
              'A break that still needed acceptance — here it failed to hold',
              'Proof breakouts never work',
              'Live market data',
            ],
            correctIndex: 1,
            explanation:
              'Breaks fail often until price holds beyond the range and, ideally, retests. Process over prediction.',
          },
        },
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
        chart: {
          id: 'volume-expansion',
          kind: 'volume',
          title: 'Expansion versus contraction',
          caption:
            'Educational example. Quiet range, then volume expansion on the advance, then contraction. Not a live tape.',
          exercise: {
            prompt: 'A breakout printed on unusually light volume is best treated as…',
            choices: [
              'Maximum confidence',
              'Weaker evidence — ask for acceptance or more participation',
              'A guaranteed trend',
              'A reason to ignore structure',
            ],
            correctIndex: 1,
            explanation: 'Light participation often means weak agreement. Volume still sits behind structure and risk.',
          },
        },
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
      { label: 'Market Events', href: '/events' },
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
    durationMinutes: 12,
    track: 'classic',
    sortOrder: 29,
    isPremium: false,
    tags: ['calendar', 'macro', 'events'],
    searchKeywords: ['economic calendar', 'CPI', 'FOMC', 'event risk', 'news trading'],
    relatedLessonIds: ['fund-basics', 'dec-regime', 'risk-position-sizing', 'dec-uncertainty'],
    conceptIds: ['event-risk', 'uncertainty'],
    learningObjectives: [
      'Explain why a scheduled release can gap through a stop.',
      'Name a default action when you have no event playbook.',
      'Use a calendar as study context — never as a buy/sell instruction.',
    ],
    whyItMatters:
      'A clean chart can be honest at 13:59 and obsolete at 14:01. Event risk is a process input: size, flatten, or accept gap risk on purpose.',
    practicalExamples: [
      'You hold a paper long into CPI with no written plan. The print misses and the next bid is far below your stop. The planned 1% was a wish.',
      'You flatten or cut size the session before a central-bank decision because you do not trade the first spike.',
      'Consensus “as expected” still moves markets if positioning was crowded. The number is not the whole story.',
    ],
    limitations: [
      'Calendars in this app may be delayed, mock, or cached. Timestamps are study labels, not a live wire.',
      'A linked official source is not a scraped article and not a trade call.',
      'Knowing the time of a release does not tell you the direction of the next candle.',
    ],
    commonMistakes: [
      'Treating a headline as a signal.',
      'Holding full size “by accident” into a known print.',
      'Inventing a new thesis in the first thirty seconds after the number.',
    ],
    whenItWorks: ['You brief the week, tag event exposure, and decide reduce / flatten / dedicated playbook before the clock.'],
    whenItFails: [
      'When you confuse “I knew the time” with “I had a plan”.',
      'When you size up because you “know” how CPI will print.',
    ],
    educationalCharts: [
      {
        id: 'event-gap-sketch',
        kind: 'breakout',
        title: 'A release can skip your level',
        caption: 'Educational tape. The gap is the lesson: stops assume a continuous auction. Events often do not.',
      },
    ],
    exercises: [
      {
        id: 'ex-event-default',
        kind: 'compare',
        prompt: 'No written event playbook. High-impact print in ten minutes. Full paper risk on. Which process is honest?',
        leftLabel: 'Hold — I already like the chart',
        rightLabel: 'Reduce or flatten per a pre-written rule',
        correctIndex: 1,
        explanation:
          'Liking the chart does not cancel gap risk. Without a playbook, the default is reduce. That is not a prediction that the print is bad.',
        conceptId: 'event-risk',
        askEvidence: true,
      },
    ],
    practiceLinks: [
      {
        label: 'Rate-decision uncertainty drill',
        href: '/practice?drill=rate-decision-uncertainty',
        description: 'Two honest readings of the same print. Direction is not the grade.',
      },
      {
        label: 'Inflation effects drill',
        href: '/practice?drill=inflation-asset-effects',
        description: 'Map a print to process, not to a ticker tip.',
      },
      { label: 'High-vol checklist', href: '/academy/checklist/high-volatility' },
    ],
    simulationLinks: [
      {
        label: 'Fictional rate-decision path',
        href: '/simulate?start=1&prep=rates',
        description: 'Uncertain paper event. Future information stays hidden. Simulated P/L is context.',
      },
    ],
    journalHref: '/journal?from=academy&notes=Event%20plan%20or%20I%20reduced',
    sections: [
      {
        heading: 'Map the week',
        body: 'High-impact prints (CPI, employment, central banks, major earnings) can change the volatility regime in seconds. Either reduce risk into the event, flatten, or run a dedicated event playbook — do not “accidentally” hold full size.\n\nIf you later use Market Events, read them as study: what it is, why it may matter, what concept to practice. Never as a signal feed.',
      },
      {
        heading: 'Process',
        body: 'Check a calendar during the brief. Tag open paper positions with event exposure. If you lack an event plan, the default is reduce.\n\nAfter the release, let the first impulse settle before inventing a new thesis unless that is a tested niche — most people do not have one.',
        callout: {
          type: 'practice',
          text: 'Write one line: next high-impact event, your default (reduce / flatten / playbook), and what would invalidate a hold.',
        },
      },
      {
        heading: 'Counterexample',
        body: 'A headline says “inflation cooler.” Someone buys the index because the word sounds bullish. They skipped: vs consensus, vs prior, vs what was priced, and whether their size survives a reversal. That is news-following, not event process.',
      },
    ],
    keyTakeaways: [
      'Events change vol and can skip casual stops.',
      'Default to reduce without a written plan.',
      'A calendar is a brief item, not a signal list.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'No event playbook, large CPI due in 10 minutes, full risk on. Best action?',
        choices: ['Hold and hope', 'Reduce or flatten per rules', 'Add size', 'Disable alerts'],
        correctIndex: 1,
        explanation: 'Unplanned event exposure is unmanaged risk.',
        conceptId: 'event-risk',
        choiceExplanations: [
          'Hope is not a hedge against a gap.',
          'Rules exist for the minutes you cannot think clearly.',
          'Adding size into unknown gap risk is the opposite of a plan.',
          'Hiding the clock does not remove the print.',
        ],
      },
      {
        id: 'q2',
        prompt: 'A calendar time is useful because it…',
        choices: [
          'Tells you which way to buy',
          'Marks when gap and vol risk may jump, so you can choose size or stay flat',
          'Guarantees the consensus number is right',
          'Replaces the need for invalidation',
        ],
        correctIndex: 1,
        explanation: 'Time is a risk input. It is not a direction.',
        conceptId: 'event-risk',
        choiceExplanations: [
          'Times are not signals.',
          'You decide exposure before the auction changes character.',
          'Consensus is a survey, not truth.',
          'You still need a thesis-killer after the print.',
        ],
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
