import type { Lesson } from '../types/academy.types';

const TS = '2026-10-21T00:00:00.000Z';

function lesson(
  partial: Omit<Lesson, 'createdAt' | 'updatedAt' | 'content'> & { content?: string },
): Lesson {
  const content =
    partial.content ?? partial.sections.map((s) => `${s.heading}\n\n${s.body}`).join('\n\n');
  return { ...partial, content, createdAt: TS, updatedAt: TS };
}

const REPLAY_LINK = {
  label: 'Intraday replay (synthetic session)',
  href: '/intraday/replay',
  description: 'Step a fictional session candle by candle. Future candles stay hidden.',
};
const DAY_LINK = {
  label: 'Trading Day simulator',
  href: '/intraday/day',
  description: 'A full simulated day with a written plan and a daily loss limit.',
};
const DRILLS_LINK = {
  label: 'Advanced intraday drills',
  href: '/intraday/drills',
  description: 'Generated, optionally timed scenarios. Untimed is always available.',
};

/**
 * Day Trading & Scalping curriculum.
 * Simulated education only: no signals, no live execution, no promised outcomes.
 * Every number is a labelled educational example.
 */
export const DAY_TRADING_LESSONS: Lesson[] = [
  lesson({
    id: 'dt-foundations',
    title: 'Day trading and scalping: what the intraday world actually is',
    description:
      'Sessions, horizons, volatility, liquidity, and why short-term movement is not the same as predictability.',
    category: 'basics',
    difficulty: 'beginner',
    durationMinutes: 12,
    track: 'classic',
    sortOrder: 201,
    isPremium: false,
    tags: ['day-trading', 'scalping', 'intraday', 'sessions'],
    relatedLessonIds: ['dt-candles-structure', 'dt-scalping-costs', 'dt-session-plan'],
    practiceLinks: [REPLAY_LINK, DAY_LINK],
    conceptIds: ['intraday-structure', 'liquidity', 'volatility-aware-risk'],
    learningObjectives: [
      'Distinguish scalping, intraday trading, swing trading, and investing by horizon and decision speed',
      'Describe sessions, overlaps, volatility, liquidity, and spread in plain language',
      'Separate an observation, a hypothesis, and a confirmed event',
    ],
    whyItMatters:
      'Most intraday harm comes from treating fast price movement as information. This module builds the vocabulary to slow that down.',
    sections: [
      {
        heading: 'Four horizons, four different jobs',
        body: 'Scalping works in seconds-to-minutes and lives or dies on execution costs. Intraday (day) trading holds minutes-to-hours and closes flat by the end of the session. Swing trading holds days-to-weeks. Investing holds months-to-years. The horizon decides everything downstream: which timeframe matters, how much spread you can survive, how fast you must decide, and how much evidence you can realistically gather before acting. Mixing them — a scalp entry defended with a weekly thesis — is the classic beginner failure.',
      },
      {
        heading: 'Sessions and why instruments behave differently',
        body: 'Markets have sessions (for example a US equity session, a European session, an Asian session) and overlaps where participation is deeper. Liquidity — how easily size trades without moving price — changes across the day, and so do spreads and volatility. A large, liquid index future and a thin small-cap stock are different environments even on the same minute chart: the thin instrument gaps, slips, and rejects fills. Instrument choice is a risk decision, not a preference.',
        callout: {
          type: 'warning',
          text: 'A clean candle is not a liquid market. Thin instruments can print beautiful structure you could never actually trade at those prices.',
        },
      },
      {
        heading: 'Observation, hypothesis, confirmation',
        body: 'An observation is what printed: "price crossed above the opening range." A hypothesis is an interpretation you could be wrong about: "buyers may be accepting higher prices." A confirmed event requires the follow-through your hypothesis predicted: acceptance, participation, and a hold. Confusing the first for the third is how breakouts get chased. Write which of the three you have before any simulated order.',
      },
      {
        heading: 'Worked example: same chart, different regime',
        body: 'Educational example: a fictional instrument ranges quietly for two hours (average 5-minute range 0.08%), then a scheduled announcement triples the range (0.25%) for twenty minutes. A breakout rule that looked tidy in the quiet regime now triggers on noise, and stops sized for 0.08% ranges are run over by ordinary movement. The rule did not change; the regime did. Any intraday approach must name the conditions it is designed for — and the conditions where the correct action is to stand aside.',
      },
    ],
    keyTakeaways: [
      'Horizon first: scalping, intraday, swing, and investing are different jobs with different costs.',
      'Liquidity, spread, and volatility change across sessions and instruments.',
      'Observation ≠ hypothesis ≠ confirmation. Name which one you have.',
      'A method can be valid in one regime and harmful in another.',
    ],
    commonMistakes: [
      'Defending a scalp with a long-term thesis',
      'Reading a VWAP cross as confirmation',
      'Trading a thin instrument like a liquid one',
    ],
    practicalExamples: [
      'Label the last hour of any chart as observation, hypothesis, or confirmed event before looking at what happened next.',
    ],
    whenItWorks: [
      'You can describe the session, instrument, and regime before discussing any setup.',
    ],
    whenItFails: [
      'Speed is mistaken for evidence, or a quiet-regime rule is run unchanged into a volatile one.',
    ],
    limitations: [
      'This lesson uses fictional examples. It cannot show a live order book or real fills.',
    ],
    exercises: [
      {
        id: 'dt-foundations-ex1',
        kind: 'explain',
        prompt:
          'A trader enters on a 1-minute breakout, then refuses to exit for three days because "the weekly trend is up". Name the failure in one sentence.',
        explanation:
          'Horizon mixing: a scalp-timed entry defended by an investing-horizon thesis, so neither plan was ever followed.',
        modelAnswer:
          'The entry belonged to a scalping plan and the defence to a swing plan; the position followed neither.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Which statement is a confirmed event rather than an observation?',
        choices: [
          'Price printed above the opening-range high once',
          'Buyers accepted higher prices: closes held above the level with participation and a retest held',
          'The 1-minute candle is the largest of the day',
          'A commentator called the move strong',
        ],
        correctIndex: 1,
        explanation:
          'Confirmation requires the follow-through the hypothesis predicted — acceptance and a hold, not a single print.',
        choiceExplanations: [
          'That is an observation.',
          'Correct: acceptance plus hold.',
          'Size of one candle is still one observation.',
          'Opinion is not market evidence.',
        ],
      },
      {
        id: 'q2',
        prompt: 'Why does the same breakout rule fail when volatility triples?',
        choices: [
          'Breakouts stop working forever',
          'Stops and triggers sized for the old range are now inside ordinary noise',
          'Volume no longer matters',
          'The timeframe must be changed to weekly',
        ],
        correctIndex: 1,
        explanation:
          'Rules embed regime assumptions. When range expands, distances, sizing, and trigger quality must be re-derived — or the correct action is standing aside.',
        choiceExplanations: [
          'Nothing is forever; regimes change.',
          'Correct: the rule was calibrated to a different regime.',
          'Volume matters more, not less.',
          'Changing timeframe does not repair mis-sized risk.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-candles-structure',
    title: 'Intraday candles and structure: trend, range, compression, expansion',
    description:
      '1m–1h candles, swings, zones, breakouts, pullbacks, gaps, acceptance and rejection — and the limits of one candle.',
    category: 'technical_analysis',
    difficulty: 'beginner',
    durationMinutes: 14,
    track: 'classic',
    sortOrder: 202,
    isPremium: false,
    tags: ['candles', 'structure', 'intraday'],
    relatedLessonIds: ['dt-foundations', 'dt-structure-zones', 'dt-multi-timeframe'],
    practiceLinks: [REPLAY_LINK, DRILLS_LINK],
    conceptIds: ['intraday-structure', 'trend-identification', 'support'],
    learningObjectives: [
      'Read OHLC and volume on 1m, 3m, 5m, 15m, and hourly candles',
      'Label trend, range, compression, and expansion regimes intraday',
      'Explain why a candle only means something when it completes',
    ],
    whyItMatters:
      'Intraday charts print 390 one-minute candles a session. Structure is how you turn that noise into a small number of honest statements.',
    sections: [
      {
        heading: 'What a candle compresses — and hides',
        body: 'Each candle compresses open, high, low, close, and volume over its window. A 1-minute candle shows urgency and noise; a 15-minute candle shows the local auction. The same session tells different true stories at different intervals: the 15-minute chart can trend while the 1-minute chart ranges inside each leg. Neither is "the real chart". Choosing an interval is choosing a decision speed, and faster intervals demand faster, cheaper decisions.',
      },
      {
        heading: 'Four intraday regimes',
        body: 'Trend: successive swing highs and lows in one direction with pullbacks that hold. Range: repeated rejection at two boundaries. Compression: shrinking ranges and falling volume — energy storing, direction unknown. Expansion: widening ranges and rising volume — direction being contested loudly. Naming the regime comes before any setup language, because the same candle (a long upper wick, say) means rejection in a range and ordinary profit-taking in a trend.',
        callout: {
          type: 'tip',
          text: 'If you cannot name the regime in one sentence, the correct position size is zero until you can.',
        },
      },
      {
        heading: 'Acceptance, rejection, and the unfinished candle',
        body: 'Acceptance is price spending time and closing beyond a level; rejection is price visiting and being sent back. A candle mid-formation has neither — its close does not exist yet. Acting on an unfinished 5-minute candle because it "looks like" a breakout is acting on a draft. In the replay, decisions are frozen while you decide precisely so the candle you judge is the candle that printed.',
      },
      {
        heading: 'Worked example: compression into expansion (fictional)',
        body: 'Educational example, fictional data: six 5-minute candles shrink from 0.20% to 0.06% ranges on falling volume (compression). The seventh expands to 0.35% and closes above the compression high — an expansion with a direction claim. The disciplined read is still only a hypothesis until a retest of the compression high holds. In the synthetic replay sessions you will see this sequence succeed and fail with identical first candles; the process, not the pattern name, is what transfers.',
      },
    ],
    keyTakeaways: [
      'Interval choice is decision-speed choice.',
      'Name the regime (trend, range, compression, expansion) before any setup.',
      'Only completed candles can be judged; acceptance beats a single print.',
    ],
    commonMistakes: [
      'Trading an unfinished candle',
      'Calling every poke a breakout',
      'Reading one candle without regime context',
    ],
    practicalExamples: [
      'In the replay, pause every 15 minutes of tape and write the regime in one sentence before stepping on.',
    ],
    whenItWorks: ['Structure labels are written before decisions and revised when swings break.'],
    whenItFails: ['Labels are applied afterwards to justify a trade already taken.'],
    limitations: ['Fictional tapes simplify real auctions; no order-book depth is shown.'],
    exercises: [
      {
        id: 'dt-candles-ex1',
        kind: 'identify',
        prompt:
          'Ranges shrink for six candles on falling volume, then one candle expands 4× and closes outside. Label the two phases.',
        choices: [
          'Trend, then crash',
          'Compression, then expansion',
          'Range, then range',
          'Distribution, then reversal',
        ],
        correctIndex: 1,
        explanation:
          'Shrinking range + falling participation is compression; the wide closing candle is expansion. Direction still needs acceptance.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Why must a candle complete before you judge acceptance?',
        choices: [
          'Exchanges only publish completed candles',
          'An unfinished candle has no close — its shape can still invert completely',
          'Indicators require it',
          'It is a platform rule with no reasoning',
        ],
        correctIndex: 1,
        explanation: 'The close is the verdict of the interval. Mid-candle shapes are drafts.',
        choiceExplanations: [
          'Not the reason.',
          'Correct.',
          'Indicators inherit the same issue.',
          'There is a real reason: no close exists yet.',
        ],
      },
      {
        id: 'q2',
        prompt: 'A long upper wick at a range high most likely signals…',
        choices: [
          'Guaranteed reversal',
          'Rejection of higher prices in this context',
          'A bullish continuation',
          'Nothing, wicks are random',
        ],
        correctIndex: 1,
        explanation:
          'Context decides meaning: at a tested boundary, a wick shows sellers rejecting the visit. It is evidence, not a guarantee.',
        choiceExplanations: [
          'Nothing guarantees.',
          'Correct, in range context.',
          'Opposite read at a boundary.',
          'Wicks carry participation information.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-structure-zones',
    title: 'Zones, breakouts, pullbacks, and gaps intraday',
    description:
      'Support and resistance as zones, failed breakouts, continuation pullbacks, and opening gaps.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 13,
    track: 'classic',
    sortOrder: 203,
    isPremium: false,
    tags: ['zones', 'breakout', 'pullback', 'gap'],
    relatedLessonIds: ['dt-candles-structure', 'dt-vwap-volume'],
    practiceLinks: [DRILLS_LINK, REPLAY_LINK],
    conceptIds: ['support', 'breakouts', 'false-breakouts', 'intraday-structure'],
    learningObjectives: [
      'Draw support/resistance as zones with a reason, not lines at exact prices',
      'Distinguish a breakout, a failed breakout, and a pullback continuation',
      'Treat opening gaps as information about overnight repricing, not automatic trades',
    ],
    whyItMatters:
      'Intraday levels are where plans live: entries, invalidation, and targets are all zone statements.',
    sections: [
      {
        heading: 'Zones, not lines',
        body: 'Liquidity is not arranged at one exact price. Prior swing clusters, the opening range, and round psychological levels form zones where behaviour changed before. Draw the zone (a band), name the evidence (two rejections, a congestion shelf), and pre-decide what acceptance beyond it would look like. A line invites false precision: one tick through a line is noise; acceptance beyond a zone is information.',
      },
      {
        heading: 'Breakout, failed breakout, pullback',
        body: 'Breakout: closes beyond the zone with participation. Failed breakout: the excursion returns and closes back inside — the trapped side becomes fuel for the opposite move, and any long thesis written on acceptance is finished. Pullback: after acceptance, price revisits the zone from the other side and holds. The pullback is often the first place risk can be defined tightly, which is a process advantage, not a prediction.',
      },
      {
        heading: 'Opening gaps',
        body: 'A gap is overnight repricing made visible. It tells you information arrived while the market was closed; it does not tell you direction for the session. Gaps into prior structure, gaps into empty space, and gaps that immediately get accepted or rejected are different situations. The disciplined response is to mark the gap, define what acceptance/rejection would mean, and let the first completed candles speak.',
        callout: {
          type: 'warning',
          text: '"Gaps always fill" and "gaps never fill" are both slogans. Mark the zone, define acceptance, wait.',
        },
      },
      {
        heading: 'Worked example: the 0.3% poke (educational)',
        body: 'Fictional example: a two-hour range spans 100.00–101.00. A 5-minute candle pokes to 101.30 on average volume and closes at 100.90, inside the range. Learners who chased the poke own a position whose written thesis ("acceptance above 101") never occurred. Two candles later the range is intact. In the drills you will grade this exact shape repeatedly: the correct action was waiting for a close beyond the zone plus a retest hold.',
      },
    ],
    keyTakeaways: [
      'Zones with named evidence beat precise lines.',
      'Acceptance defines a breakout; return inside defines failure.',
      'Gaps are information, not instructions.',
    ],
    commonMistakes: ['One-tick breakouts', 'Averaging into a failed breakout', 'Gap slogans'],
    practicalExamples: [
      'Before each replay session, mark two zones and write what acceptance beyond each would require.',
    ],
    whenItWorks: ['Invalidation sits beyond the zone, sized from the zone distance.'],
    whenItFails: ['Levels are redrawn after entry to keep a thesis alive.'],
    limitations: [
      'Synthetic zones are cleaner than real auctions; treat live-looking precision with suspicion.',
    ],
    exercises: [
      {
        id: 'dt-zones-ex1',
        kind: 'identify',
        prompt:
          'Price closes above the range zone, retests it twice from above, and holds. Which label fits?',
        choices: ['Failed breakout', 'Acceptance with a pullback hold', 'Compression', 'Gap fill'],
        correctIndex: 1,
        explanation:
          'Closes beyond plus retest holds are the acceptance sequence; risk can now be defined against the zone.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt:
          'A breakout candle closes back inside the range. The long thesis written on acceptance is…',
        choices: [
          'Stronger — the level was tested',
          'Finished — its condition no longer exists',
          'Unchanged — closes do not matter intraday',
          'Doubled — failed breakouts always reverse profitably',
        ],
        correctIndex: 1,
        explanation:
          'The condition that justified the trade is gone. Keeping the position is a new, unwritten trade.',
        choiceExplanations: [
          'Tests are not acceptance.',
          'Correct.',
          'Closes are the verdict.',
          'Reversals are not owed to anyone.',
        ],
      },
      {
        id: 'q2',
        prompt: 'Why draw zones instead of exact lines?',
        choices: [
          'Zones look better',
          'Liquidity clusters across a band; one tick through a line is noise',
          'Lines are not supported by charts',
          'Zones guarantee reactions',
        ],
        correctIndex: 1,
        explanation:
          'Zones encode how orders actually cluster and prevent one-print false signals.',
        choiceExplanations: [
          'Cosmetics are irrelevant.',
          'Correct.',
          'Lines render fine; the model is the issue.',
          'Nothing guarantees reactions.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-multi-timeframe',
    title: 'Multi-timeframe analysis without the fairy tale',
    description:
      'Top-down context, intraday structure, lower-timeframe timing — and what to do when they conflict.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 13,
    track: 'classic',
    sortOrder: 204,
    isPremium: false,
    tags: ['multi-timeframe', 'mtf', 'process'],
    relatedLessonIds: ['dt-candles-structure', 'dt-vwap-volume'],
    practiceLinks: [DRILLS_LINK, REPLAY_LINK],
    conceptIds: ['multi-timeframe', 'confirmation-bias', 'uncertainty'],
    learningObjectives: [
      'Run a three-layer read: higher-timeframe context, intraday structure, lower-timeframe timing',
      'Act correctly when layers conflict (the answer is usually "not yet")',
      'Catch confirmation bias when shopping timeframes for agreement',
    ],
    whyItMatters:
      'Timeframe conflict is where intraday traders manufacture certainty. A fixed top-down routine replaces shopping with process.',
    sections: [
      {
        heading: 'The three layers',
        body: "Context layer (hourly/daily): regime, major zones, scheduled event risk. Structure layer (15m/5m): today's trend or range, acceptance, VWAP side. Timing layer (5m/1m): the completed-candle trigger your plan defined. Each layer answers a different question, and no layer may answer another layer's question. The hourly trend cannot time an entry; the 1-minute trigger cannot repeal the hourly regime.",
      },
      {
        heading: 'Conflict is information',
        body: 'Hourly up, 5-minute breaking down through VWAP with expanding range: the honest synthesis is "context says look for longs; structure says not yet". Waiting for lower-timeframe structure to agree is not indecision — it is the strategy. Insufficient evidence to form a thesis is a complete analysis, and it sizes at zero.',
        callout: {
          type: 'tip',
          text: 'Write the sentence "Context ___, structure ___, timing ___" before any simulated order. Blank fields block the order.',
        },
      },
      {
        heading: 'Confirmation bias and timeframe shopping',
        body: 'With five intervals open, one will always agree with a trade you want. Deciding the layers in advance — and which layer may veto — removes the shop. Pre-commit: context frames direction of interest, structure must confirm, timing must trigger. If you find yourself opening a new interval after deciding, you are shopping.',
      },
      {
        heading: 'Worked example: two true charts (educational)',
        body: 'Fictional example: hourly candles rise steadily; the 5-minute chart breaks VWAP down and makes lower highs for 40 minutes. A learner buys "the dip" three times against intraday structure and is stopped three times — each loss small, the lesson expensive. The top-down read said: hourly context bullish, intraday structure bearish, therefore no timing signal exists yet. The first 5-minute higher low that holds above VWAP is where the layers begin to agree.',
      },
    ],
    keyTakeaways: [
      "Layers have jobs; none may do another's job.",
      'Conflict = not yet, sized at zero.',
      'Pre-commit which layer can veto, or you will shop for agreement.',
    ],
    commonMistakes: [
      'HTF direction as entry timing',
      'Opening new intervals after deciding',
      'Averaging conflicting layers into half-size impulses',
    ],
    practicalExamples: ['In drills, write the three-layer sentence before viewing choices.'],
    whenItWorks: ['Every simulated entry can cite all three layers in one sentence each.'],
    whenItFails: ['The fastest chart quietly becomes the only chart.'],
    limitations: ['More layers do not create probability; they organise evidence.'],
    exercises: [
      {
        id: 'dt-mtf-ex1',
        kind: 'scenario',
        prompt:
          'Hourly: range. 15m: compression at the range high. 1m: one poke above. Write the three-layer sentence and the action.',
        explanation:
          'Context range, structure compression at resistance, timing unconfirmed — action: wait for acceptance or rejection to complete.',
        modelAnswer: 'No trade yet: acceptance has not printed.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt:
          'Higher timeframe uptrend, lower timeframe structure breaking down. Correct synthesis?',
        choices: [
          'Buy — the big trend guarantees the dip works',
          'Sell — the small chart always wins',
          'No trade yet — wait for structure to agree with context',
          'Half size immediately to average the signals',
        ],
        correctIndex: 2,
        explanation:
          'Context never times entries and never guarantees short-term direction. Conflict means insufficient evidence.',
        choiceExplanations: [
          'Guarantee is the fairy tale.',
          'Fast charts do not repeal context either.',
          'Correct.',
          'Averaging opinions is not a plan.',
        ],
      },
      {
        id: 'q2',
        prompt: 'Opening a sixth timeframe after deciding to trade is usually…',
        choices: [
          'Diligence',
          'Timeframe shopping — seeking agreement for a decision already made',
          'Required by professionals',
          'Risk management',
        ],
        correctIndex: 1,
        explanation:
          'The layers and their veto rights are chosen in advance; new charts after the decision serve the bias, not the plan.',
        choiceExplanations: [
          'Diligence happens before the decision.',
          'Correct.',
          'No such requirement exists.',
          'Risk is sized, not shopped.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-vwap-volume',
    title: 'Volume, relative volume, and VWAP — context, not crystal ball',
    description:
      'Participation, VWAP and its limits, opening ranges, and why stacking indicators manufactures confidence.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 14,
    track: 'classic',
    sortOrder: 205,
    isPremium: false,
    tags: ['vwap', 'volume', 'opening-range', 'indicators'],
    relatedLessonIds: ['dt-multi-timeframe', 'dt-scalping-costs'],
    practiceLinks: [REPLAY_LINK, DRILLS_LINK],
    conceptIds: ['vwap-interpretation', 'volume', 'false-signals', 'intraday-structure'],
    learningObjectives: [
      "Interpret volume expansion/contraction and relative volume against the session's own baseline",
      'State what VWAP is, what resets it, and three things it cannot do',
      'Use the opening range as a zone with acceptance/failure rules',
    ],
    whyItMatters:
      'VWAP is the most abused intraday line. Used as context it organises the day; used as a signal it generates confident noise.',
    sections: [
      {
        heading: 'Volume is participation, judged relatively',
        body: 'Absolute volume means little intraday; volume relative to the same time of day (relative volume) tells you whether today is contested or sleepy. Expansion on a level break supports acceptance; the same break on thinning volume invites failure. Contraction inside compression is normal; contraction at a retest can mean the other side has left. Always ask "compared with what, at this hour?"',
      },
      {
        heading: 'VWAP: definition and honest limits',
        body: "Session VWAP is the volume-weighted average price since the session open: Σ(typical price × volume) ÷ Σ(volume). It resets each session and drifts toward where business actually transacted. Price above VWAP says today's average participant is in profit on longs — context about positioning, not a forecast. VWAP cannot tell you direction next, it lags in fast tapes, and on zero-volume data it is undefined rather than zero. A cross is an event to interpret, never a completed setup.",
        callout: {
          type: 'warning',
          text: 'Crossing VWAP ≠ change of structure. Structure is swings and acceptance; VWAP is an average catching up.',
        },
      },
      {
        heading: 'Opening range and indicator discipline',
        body: "The opening range (for example the first 15–30 minutes) is the session's first agreed zone. Acceptance beyond it, failed acceptance back inside, and rotation around it are three different days. One or two context tools suffice: VWAP plus your zones, perhaps one moving average. Each additional indicator that agrees adds confidence but rarely evidence — most are the same data re-averaged. Redundant confirmation feels like rigour and trades like noise.",
      },
      {
        heading: 'Worked example: the sixth cross (educational)',
        body: 'Fictional example: price crosses VWAP six times by midday on falling relative volume. A cross-trading rule fires six entries; the session is a range and every fill is near the average price — gross movement per trade approaches zero while spread and fees are certain. The VWAP-context read was "balanced, thinning day: no acceptance either side". The correct trade count was zero, which the no-trade drill trains directly.',
      },
    ],
    keyTakeaways: [
      'Judge volume relatively, by time of day.',
      'VWAP = where volume traded; crosses need structure to matter.',
      'Fewer, understood tools beat stacked redundant confirmation.',
    ],
    commonMistakes: [
      'VWAP-cross systems in ranges',
      'Absolute volume comparisons',
      'Five indicators, one dataset',
    ],
    practicalExamples: [
      'In the replay, note relative volume and VWAP side at every decision freeze.',
    ],
    whenItWorks: ['VWAP informs the thesis sentence; it never replaces it.'],
    whenItFails: ['The line becomes the thesis and ranges generate six confident losses.'],
    limitations: ['Synthetic volume is rule-generated; real participation is messier.'],
    exercises: [
      {
        id: 'dt-vwap-ex1',
        kind: 'calculate',
        prompt:
          'Two candles: typical prices 100 and 102, volumes 300 and 100. Compute the VWAP of the two.',
        expectedValue: 100.5,
        tolerance: 0.01,
        unit: 'price',
        explanation:
          '(100×300 + 102×100) ÷ 400 = 100.5. Volume pulls the average toward where business happened.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Price crosses above VWAP on thinning volume inside a range. Best read?',
        choices: [
          'Confirmed uptrend',
          'A cross without acceptance — context unchanged until structure confirms',
          'Short squeeze starting',
          'VWAP is broken today',
        ],
        correctIndex: 1,
        explanation:
          'Crosses inside balanced, thinning tapes are noise. Structure (acceptance, swings) must change before context does.',
        choiceExplanations: [
          'One cross confirms nothing.',
          'Correct.',
          'No evidence of that.',
          'VWAP computes fine; interpretation failed.',
        ],
      },
      {
        id: 'q2',
        prompt: 'Why can VWAP be undefined early in a session?',
        choices: [
          'It needs 100 candles',
          'With zero traded volume there is no weighted average to compute',
          'Exchanges delay it',
          'It only works on daily charts',
        ],
        correctIndex: 1,
        explanation:
          'Division by total volume: no volume, no average. Honest tools show "not yet" instead of inventing a value.',
        choiceExplanations: [
          'No fixed candle count.',
          'Correct.',
          'No such delay.',
          'VWAP is intraday by design.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-scalping-costs',
    title: 'Scalping mechanics: where small moves go to pay rent',
    description: 'Spread, slippage, fees, latency, and why a theoretical entry is not a fill.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 13,
    track: 'classic',
    sortOrder: 206,
    isPremium: false,
    tags: ['scalping', 'costs', 'spread', 'slippage'],
    relatedLessonIds: ['dt-vwap-volume', 'dt-execution-orders'],
    practiceLinks: [
      {
        label: 'Scalping practice (spread-aware)',
        href: '/intraday/scalp',
        description: 'Short synthetic sessions where friction is charged honestly.',
      },
      DRILLS_LINK,
    ],
    conceptIds: ['execution-mechanics', 'liquidity', 'intraday-structure'],
    learningObjectives: [
      'Compute net outcome of a scalp after spread, slippage, and fees',
      'Explain latency and why chart precision is not execution precision',
      'Recognise market conditions where a scalping approach is unsuitable by arithmetic, not opinion',
    ],
    whyItMatters:
      'Scalping margins are thinner than trading costs are wide. This arithmetic, done in advance, prevents most scalping losses.',
    sections: [
      {
        heading: 'The friction stack',
        body: 'Every round trip pays: half the spread entering, half exiting (embedded in fill prices), slippage when the print moves between decision and fill, and explicit fees. Educational example: an 8¢ target with a 3¢ spread, 1¢ slippage per side, and 2¢ fees keeps 8 − 3 − 2 − 2 = 1¢ before being wrong once. A single ordinary loss erases many such wins. This is why the cost-drag drill exists: gross chart distance is not money.',
      },
      {
        heading: 'Latency and the honest fill',
        body: 'Between your decision and any fill, time passes and price moves. Simulated latency in this app delays fills by whole candles so the effect is visible and testable. A limit order may never fill; a market order fills at a price that already moved. Apparent precision — entering "at" a level to the tick — survives neither. Plans must be robust to fills a few ticks worse, or they are not plans.',
        callout: {
          type: 'warning',
          text: 'If a method only works with perfect fills, it does not work. Test it with spread, slippage, and one candle of latency — as the simulator does.',
        },
      },
      {
        heading: 'When scalping is unsuitable',
        body: "Thin participation (wide spreads, partial fills), event windows (ranges triple, stops gap), and choppy balanced tapes (gross movement per trade near zero) all fail the arithmetic before any chart opinion. Part of scalping skill is declining days. The simulator's zero-volume candles demonstrate the extreme: no liquidity, no fill, no fabricated price to rescue the scenario.",
      },
      {
        heading: 'Worked example: the profitable loser (educational)',
        body: 'Fictional example: ten scalps, six winners of +6¢ gross, four losers of −8¢ gross. Gross: +4¢ — "a winning day". Costs at 5¢ per round trip: −50¢. Net: −46¢. Nothing failed except arithmetic that was knowable at 09:30. Strategy evaluation (Module 10) starts from net, per-trade expectancy, never from gross win rate.',
      },
    ],
    keyTakeaways: [
      'Net = gross − spread − slippage − fees, computed before trading.',
      'Latency and unfilled limits are normal, not bad luck.',
      'Some days fail scalping arithmetic at the open. Decline them.',
    ],
    commonMistakes: [
      'Judging scalps gross',
      'Assuming chart price = fill price',
      'Increasing frequency to outrun costs',
    ],
    practicalExamples: [
      'Run a scalping session and compare gross versus net in the review — the gap is the lesson.',
    ],
    whenItWorks: ['Target distances are chosen after the friction stack, not before.'],
    whenItFails: ['Frequency rises to compensate for negative expectancy.'],
    limitations: [
      'Simulated friction is deterministic and documented; real friction varies and can be worse.',
    ],
    exercises: [
      {
        id: 'dt-costs-ex1',
        kind: 'calculate',
        prompt:
          'A scalp gains 10¢ gross. Spread 4¢ total, slippage 1¢ per side, fees 1¢ total. Net result in cents?',
        expectedValue: 3,
        tolerance: 0.01,
        unit: '¢',
        explanation: '10 − 4 − 2 − 1 = 3¢. Costs consumed 70% of the move.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'A method wins 60% of scalps gross but loses money net. First suspect?',
        choices: [
          'Win rate must reach 90%',
          'Per-trade friction exceeds average gross edge',
          'The timeframe is wrong',
          'More trades will fix it',
        ],
        correctIndex: 1,
        explanation:
          'Expectancy is net. When costs exceed gross edge, frequency multiplies the loss.',
        choiceExplanations: [
          'Unrealistic and unnecessary.',
          'Correct.',
          'Costs follow you across timeframes.',
          'Frequency compounds negative expectancy.',
        ],
      },
      {
        id: 'q2',
        prompt: 'A limit order never fills and price runs to target. Correct accounting?',
        choices: [
          'Count it as a win — the idea was right',
          'No trade occurred; record the observation, not a result',
          'Count half a win',
          'Move the limit after price next time retroactively',
        ],
        correctIndex: 1,
        explanation:
          'An unfilled order is not a trade. Counting it fabricates performance and corrupts every later statistic.',
        choiceExplanations: [
          'Ideas are not fills.',
          'Correct.',
          'No partial credit in accounting.',
          'Retroactive edits are hindsight.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-intraday-risk',
    title: 'Intraday risk: budgets, sizing, and the decision to stop',
    description:
      'Risk per trade, cumulative daily loss, consecutive losses, volatility-adjusted sizing, and stop honesty.',
    category: 'risk_management',
    difficulty: 'intermediate',
    durationMinutes: 15,
    track: 'classic',
    sortOrder: 207,
    isPremium: false,
    tags: ['risk', 'sizing', 'daily-loss', 'stops'],
    relatedLessonIds: ['dt-scalping-costs', 'dt-intraday-psychology', 'dt-session-plan'],
    practiceLinks: [DAY_LINK, DRILLS_LINK],
    conceptIds: [
      'position-sizing',
      'risk-per-trade',
      'drawdown-management',
      'stop-logic',
      'volatility-aware-risk',
    ],
    learningObjectives: [
      'Size a position from equity, a chosen risk budget, entry, and invalidation',
      'Track cumulative daily loss, drawdown, and consecutive losses as session state',
      'Explain why a stop does not guarantee a fill price (gaps, slippage, liquidity)',
    ],
    whyItMatters:
      'Intraday speed compresses mistakes. Pre-committed budgets and a stopping rule are the difference between a bad hour and a bad month.',
    sections: [
      {
        heading: 'Size from invalidation, never from conviction',
        body: 'Quantity = risk budget ÷ distance to invalidation. Educational example: simulated equity $50,000, chosen risk budget 0.5% ($250), entry 100, invalidation 98.50 → risk per share $1.50 → 166 shares. Double the stop distance and size halves automatically — volatility-adjusted sizing is just this formula respected when ranges widen. No percentage is right for every person; the transferable skill is deriving size from a written budget and a written invalidation, in that order.',
      },
      {
        heading: 'The session is a risk object too',
        body: 'Per-trade budgets are not enough intraday, because frequency multiplies them. Track three session numbers: cumulative loss versus the maximum daily loss you set before the open, current drawdown from the session high, and consecutive losses. Each has a pre-written consequence — reduce size, pause, or stop — decided while calm. When the daily limit prints, the circuit breaker blocks new risk; managing or closing existing positions remains allowed, and nothing is silently closed for you.',
        callout: {
          type: 'warning',
          text: 'A stop order triggers an exit process. Gaps, thin liquidity, and fast tapes can fill through it. Size so that a worse-than-planned fill is survivable, not merely unlikely.',
        },
      },
      {
        heading: 'After a stop-out',
        body: 'The minutes after a stop are the highest-risk minutes of the day: the urge to recover is immediate and feels like analysis. Pre-commit the protocol — re-read the plan, require a fresh completed setup, respect any consecutive-loss pause. Correlation counts too: three "different" trades on the same theme are one risk. Concentration is measured across the whole book, not per ticket.',
      },
      {
        heading: 'Worked example: two losses, one decision (educational)',
        body: 'Fictional example: daily max loss $500; two planned losses of $180 and $170 leave $150 of budget. A new setup needs $220 of risk at proper size. Options: skip it, or wait for a location where invalidation distance makes size fit $150. Shrinking the stop to force the trade is not an option — that rewrites risk to fit desire. The plan-conforming outcomes are both acceptable; the rewritten stop is the only failure available.',
      },
    ],
    keyTakeaways: [
      'Quantity = budget ÷ invalidation distance. Always in that order.',
      'Daily loss, drawdown, and loss streaks are session state with pre-written consequences.',
      'Stops trigger exits; they do not guarantee prices.',
    ],
    commonMistakes: [
      'Sizing from conviction',
      'Moving stops to fit a desired size',
      'Recovery trades after stop-outs',
    ],
    practicalExamples: [
      'Set a deliberately tight daily limit in the Trading Day simulator and practise stopping well.',
    ],
    whenItWorks: ['Every simulated fill can be traced to a budget written before the open.'],
    whenItFails: ['Risk numbers are negotiated mid-session with the tape.'],
    limitations: ['Example percentages are teaching values, not personal recommendations.'],
    exercises: [
      {
        id: 'dt-risk-ex1',
        kind: 'calculate',
        prompt:
          'Simulated equity $100,000, risk budget 0.25%, entry 50, invalidation 49. How many shares?',
        expectedValue: 250,
        tolerance: 0.01,
        unit: 'shares',
        explanation: 'Budget $250 ÷ $1.00 per share = 250 shares.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Volatility doubles, so your invalidation distance doubles. Correct size response?',
        choices: [
          'Keep size — conviction unchanged',
          'Halve size so currency risk stays at budget',
          'Double size to keep profit potential',
          'Remove the stop until volatility calms',
        ],
        correctIndex: 1,
        explanation:
          'Risk per share doubled; quantity halves to keep the same planned currency risk.',
        choiceExplanations: [
          'Conviction is not a sizing input.',
          'Correct.',
          'That doubles risk twice over.',
          'Removing invalidation removes the plan.',
        ],
      },
      {
        id: 'q2',
        prompt: 'The daily loss limit is reached mid-session. Which actions remain appropriate?',
        choices: [
          'One small recovery trade',
          'Managing/closing existing positions and completing the review',
          'Doubling size on the best setup',
          'Moving the limit — it was only a guideline',
        ],
        correctIndex: 1,
        explanation:
          'The breaker blocks new risk, never risk reduction or review. Limits rewritten mid-session are not limits.',
        choiceExplanations: [
          'That is the behaviour the limit exists to prevent.',
          'Correct.',
          'Escalation after limits is the classic spiral.',
          'A movable limit is a decoration.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-intraday-psychology',
    title: 'Intraday psychology: speed makes every bias louder',
    description:
      'FOMO, revenge, chasing, moving stops, overtrading, streaks, and fatigue — with timed practice and reflection.',
    category: 'psychology',
    difficulty: 'intermediate',
    durationMinutes: 13,
    track: 'classic',
    sortOrder: 208,
    isPremium: false,
    tags: ['psychology', 'fomo', 'revenge', 'overtrading', 'discipline'],
    relatedLessonIds: ['dt-intraday-risk', 'dt-session-plan'],
    practiceLinks: [DRILLS_LINK, DAY_LINK],
    conceptIds: [
      'fomo',
      'revenge-trading',
      'loss-aversion',
      'discipline',
      'emotional-decision-making',
    ],
    learningObjectives: [
      'Recognise FOMO, revenge, chase, and streak states in the minutes they occur',
      'Apply pre-written interruptions: pause, re-read plan, require fresh evidence',
      'Separate decision quality from outcome when reviewing at speed',
    ],
    whyItMatters:
      'Intraday, the interval between impulse and order is seconds. Psychology is not a soft module here — it is the execution environment.',
    sections: [
      {
        heading: 'The usual suspects, at intraday speed',
        body: 'FOMO enters after a missed move and buys the third push. Revenge re-enters within minutes of a stop, larger. Chasing pays any price to avoid watching. Premature exits amputate planned trades at the first normal pullback; moved invalidations do the opposite damage. Winning streaks inflate size exactly when regression is nearest. Fatigue flattens all of it into carelessness late in the session. Each state has a physical signature — speed. Deciding faster than your plan allows is the earliest measurable symptom.',
      },
      {
        heading: 'Interruptions that are written in advance',
        body: 'Insight does not survive adrenaline; procedures do. Examples used in the drills: after any stop, the next order requires a fresh completed setup plus a re-read of the plan; after two consecutive losses, a timed break; any urge that arrives with the words "get it back" routes to the journal, not the order panel. Waiting, declining, and stopping are scored as correct decisions throughout this app — because in live conditions they are the profitable behaviours nobody applauds.',
        callout: {
          type: 'tip',
          text: 'Measure your decision latency in replay. If entries cluster within seconds of a loss, that cluster — not the market — is the pattern to fix.',
        },
      },
      {
        heading: 'Good decision, bad outcome; bad decision, good outcome',
        body: 'A plan-following loss is tuition already budgeted. A plan-breaking win is the most dangerous event in intraday trading, because it pays you to break the plan again. Review grades the decision at the moment it was made, with the information then available. The journal prompts after every simulated session force exactly this separation.',
      },
      {
        heading: 'Worked example: the 11:35 setup (educational)',
        body: 'Fictional example from the daily-limit drill: two stop-outs reach the daily limit at 11:20; at 11:35 a textbook setup appears. The urge is coherent, articulate, and completely irrelevant — the plan already answered this question at 09:25. Choosing the journal over the order is the entire skill, and it is trainable: the Trading Day simulator will put you in this seat with a tight limit on purpose.',
      },
    ],
    keyTakeaways: [
      'Speed is the symptom; pre-written interruptions are the treatment.',
      'Plan-breaking wins are losses in training value.',
      'Waiting and stopping are scored decisions, not absences of decision.',
    ],
    commonMistakes: [
      'Recovery trades',
      'Size inflation after wins',
      'Exiting planned trades at first pullback',
    ],
    practicalExamples: [
      'After each simulated session, tag one decision as state-driven (FOMO/revenge/fatigue) or plan-driven — honestly.',
    ],
    whenItWorks: ['Interruptions fire without negotiation in the moment.'],
    whenItFails: ['Rules exist but require a fresh decision while emotional.'],
    limitations: [
      'Education is not therapy or financial advice; persistent distress around trading deserves support outside an app.',
    ],
    exercises: [
      {
        id: 'dt-psych-ex1',
        kind: 'scenario',
        prompt:
          ' stopped out 4 minutes ago. A similar setup appears; your first thought is "win it back here". Write the interruption you will execute.',
        explanation:
          'Name the state (revenge), then the procedure: fresh completed setup + plan re-read, or the pre-committed break.',
        modelAnswer:
          'State: revenge. Procedure: stand down, journal the urge, require a new completed setup after a break.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'A trade breaks your rules and profits. In review it should be graded as…',
        choices: [
          'A good trade — outcome is king',
          'A process failure that happened to pay; the most dangerous kind',
          'Neutral — rules and outcome cancel out',
          'Proof the rules are too strict',
        ],
        correctIndex: 1,
        explanation:
          'Rewarded violations train violations. Process grading keeps the lesson; P/L grading teaches gambling.',
        choiceExplanations: [
          'P/L does not grade decisions here.',
          'Correct.',
          'They do not cancel; behaviour was reinforced.',
          'One win proves nothing about a rule.',
        ],
      },
      {
        id: 'q2',
        prompt: 'The earliest measurable sign of an emotional state intraday is…',
        choices: [
          'A losing trade',
          "Decision speed rising above the plan's pace",
          'A red candle',
          'Talking to other traders',
        ],
        correctIndex: 1,
        explanation: 'Latency collapse precedes the bad order. It can be observed and interrupted.',
        choiceExplanations: [
          'Losses happen inside good process too.',
          'Correct.',
          'Candles are not emotions.',
          'Irrelevant either way.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-session-plan',
    title: 'Trading plans and session routines that survive contact with the open',
    description:
      'Pre-session preparation, conditional scenarios, event risk, session review, and shutdown.',
    category: 'decision',
    difficulty: 'beginner',
    durationMinutes: 12,
    track: 'classic',
    sortOrder: 209,
    isPremium: false,
    tags: ['planning', 'routine', 'checklist', 'review'],
    relatedLessonIds: ['dt-intraday-risk', 'dt-intraday-psychology', 'dt-strategy-evaluation'],
    practiceLinks: [DAY_LINK],
    conceptIds: ['session-planning', 'following-a-plan', 'journaling', 'post-decision-review'],
    learningObjectives: [
      'Write a pre-session plan: session, event risk, conditional scenarios, invalidation, daily loss limit',
      'Run a post-session review that finds repeated mistakes, then shut down deliberately',
      'Use the pre-/post-session checklists as journal-integrated routine, not decoration',
    ],
    whyItMatters:
      'Professionals are not calmer people; they are people whose decisions were made earlier. The routine is the edge you control.',
    sections: [
      {
        heading: 'Pre-session: decide while nothing is moving',
        body: 'Define the session you will trade and its hours. Mark scheduled event risk inside it. Write conditional scenarios ("if acceptance above X, the plan is…; if rejection, the plan is…; if neither, flat"). Set maximum daily loss and, if you use one, a maximum trade count. Note instrument-specific costs. The Trading Day simulator refuses your first order until this exists — deliberately.',
      },
      {
        heading: 'During: the plan is a filter, not a script',
        body: 'New information revises scenarios; it does not delete limits. Mid-session, the only questions are which pre-written branch is active and whether evidence still supports it. Unplanned instruments, unplanned hours, and unplanned size are declined by default. Every decision freeze in the replay is a chance to write the branch you are in.',
      },
      {
        heading: 'Post-session: review, then actually stop',
        body: 'Export the session into the journal: plan, decisions, fills, costs, rule violations, one repeated mistake, one kept strength. Grade process, not P/L. Then shut down: no "one more look" that becomes an unplanned evening session. The post-session checklist exists because willpower at the end of a losing day is the least reliable component in the system.',
        callout: {
          type: 'tip',
          text: 'The review is part of the session. A session without a review is practice that refuses to teach.',
        },
      },
      {
        heading: 'Worked example: a complete flat day (educational)',
        body: 'Fictional example: plan says trade only acceptance beyond the opening range, max loss $300, max 3 trades. The tape ranges all day; no acceptance prints; zero trades. Journal: "Branch C (neither) all session. One urge at 10:40, declined. Kept: patience. Repeat-watch: urge followed the day\'s largest candle, again." Process score: high. P/L: zero — and the day was a success by every measure that compounds.',
      },
    ],
    keyTakeaways: [
      'Plans are written calm, executed verbatim, reviewed honestly.',
      'Conditional scenarios replace prediction.',
      'Shutdown is a rule, not a mood.',
    ],
    commonMistakes: [
      'Planning after the first trade',
      'Reviewing only losing days',
      'Evening revenge sessions',
    ],
    practicalExamples: [
      'Use the Pre-Session Checklist before, and Post-Session Checklist after, every Trading Day run.',
    ],
    whenItWorks: ['Journal entries reference plan branches by name.'],
    whenItFails: ['The plan is a paragraph of hope rewritten nightly.'],
    limitations: [
      'Checklists structure behaviour; they cannot supply discipline you decline to practise.',
    ],
    exercises: [
      {
        id: 'dt-plan-ex1',
        kind: 'explain',
        prompt:
          "Write the three conditional branches (acceptance / rejection / neither) for tomorrow's fictional session in one sentence each.",
        explanation:
          'Branches convert forecasting into preparation: each state of the tape already has an answer, including flat.',
        modelAnswer:
          'Above: follow plan A. Below: follow plan B. Inside: no trades, journal observations.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'A session ends flat because no planned setup triggered. Correct evaluation?',
        choices: [
          'Wasted session',
          'A completed, potentially high-quality session — review the observations',
          'Evidence standards are too high',
          'Lower standards tomorrow',
        ],
        correctIndex: 1,
        explanation:
          'Declining low-quality opportunity is the skill. The review still extracts lessons from watched tape.',
        choiceExplanations: [
          'Activity is not the product.',
          'Correct.',
          'Standards are the product.',
          'That manufactures trades, not skill.',
        ],
      },
      {
        id: 'q2',
        prompt: 'Where does maximum daily loss belong?',
        choices: [
          'Decided after the second loss',
          'Written in the pre-session plan, enforced by the circuit breaker',
          'In your head, flexibly',
          'Only for professionals',
        ],
        correctIndex: 1,
        explanation:
          'Limits decided mid-session are negotiated with emotion. Pre-written and machine-enforced is the point.',
        choiceExplanations: [
          'Too late — that is the spiral.',
          'Correct.',
          'Unwritten limits move.',
          'Everyone bleeds the same way.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-execution-orders',
    title: 'Orders and simulated execution: market, limit, stop — honestly',
    description:
      'Trigger rules, partial fills, rejection, latency, cancellation, and the stop-market versus stop-limit trade-off.',
    category: 'decision',
    difficulty: 'advanced',
    durationMinutes: 15,
    track: 'classic',
    sortOrder: 210,
    isPremium: true,
    tags: ['orders', 'execution', 'limit', 'stop', 'fills'],
    relatedLessonIds: ['dt-scalping-costs', 'dt-intraday-risk'],
    practiceLinks: [
      DAY_LINK,
      {
        label: 'Scalping practice',
        href: '/intraday/scalp',
        description:
          'Partial fills, gaps through stops, and unfilled limits — experienced, not described.',
      },
    ],
    conceptIds: ['execution-mechanics', 'stop-logic', 'liquidity'],
    learningObjectives: [
      'Match market, limit, stop-market, and stop-limit orders to plan intent',
      'Predict fill behaviour under gaps, thin volume, and latency in the simulator',
      'State the stop-market versus stop-limit trade-off before entering, not during',
    ],
    whyItMatters:
      'Most intraday plans die in the gap between the order imagined and the order filled. Execution literacy is risk management.',
    sections: [
      {
        heading: 'Four orders, four promises',
        body: 'Market: fill now, price uncertain. Limit: price condition, fill uncertain — it may expire untouched, and an unfilled limit is not a trade. Stop-market: trigger converts to market — exit priority, price uncertain, gaps fill through. Stop-limit: trigger converts to limit — price protected, exit uncertain; in a gap it can watch price fall past your limit forever. None is "best"; each is a choice about which uncertainty you accept, made in the plan.',
      },
      {
        heading: 'Partial fills, rejection, expiry, cancellation',
        body: 'Real size meets finite liquidity. The simulator caps each candle\'s available quantity by participation, so large orders fill across candles at evolving prices — average fill, not a single print. Orders can be rejected (buying power, risk gate), expire (your time condition passed), or be cancelled by you before fill. Cancellation and replacement ("chasing the limit up") is a new decision and belongs in the journal as one.',
        callout: {
          type: 'warning',
          text: 'When both a protective stop and a target are touched inside one candle, nobody knows the order of prints. The simulator resolves it conservatively: stop first. Never backtest on the flattering assumption.',
        },
      },
      {
        heading: 'Latency and duplicate discipline',
        body: 'Simulated orders carry latency measured in candles: decisions fill on later tape, at later prices. Double-submitting does not double speed; it doubles risk. The engine rejects invalid state transitions (a filled order cannot be cancelled), because execution states are a machine, not a mood: pending → partially filled → filled, with cancelled/rejected/expired as terminal exits.',
      },
      {
        heading: 'Worked example: gapped stop (educational)',
        body: 'Fictional example: long at 100.00, protective stop 99.50. An event candle opens at 98.90. Stop-market fills near 98.88 after spread and slippage — a 1.12 loss on a "0.50 risk" plan. The plan was not betrayed; its assumption was. Sizing that survives gaps uses distance plus a slippage allowance, which is why Module 6 sizes from invalidation and this module refuses to call stops guarantees.',
      },
    ],
    keyTakeaways: [
      'Choose which uncertainty you accept: price or fill.',
      'Partial, unfilled, and gapped fills are normal mechanics.',
      'Ambiguous intrabar touches resolve conservatively — stop first.',
    ],
    commonMistakes: [
      'Stop-limit as "safe stop"',
      'Cancelling/replacing toward price',
      'Counting unfilled limits in results',
    ],
    practicalExamples: [
      'Place each order type once in scalping practice and read its fill report line by line.',
    ],
    whenItWorks: ['Order choice is written in the plan with its accepted uncertainty.'],
    whenItFails: ['Order type is chosen in the seconds after a trigger, emotionally.'],
    limitations: [
      'The model is candle-based with documented rules; it does not reproduce a real order book.',
    ],
    exercises: [
      {
        id: 'dt-exec-ex1',
        kind: 'choose',
        prompt:
          'Plan: exit at any price if 99.50 trades. Which order, and what can still go wrong?',
        choices: [
          'Stop-limit at 99.50/99.45 — nothing can go wrong',
          'Stop-market at 99.50 — a gap can fill well below 99.50',
          'Limit sell at 99.50 — guaranteed exit at 99.50 or better',
          'No order — watch and decide live',
        ],
        correctIndex: 1,
        explanation: 'Stop-market prioritises exit; gap risk remains and must be sized for.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'A stop and target are both touched within one candle. Honest backtest rule?',
        choices: [
          'Assume target first — optimistic is motivating',
          'Assume stop first (conservative) or use finer data',
          'Count it as both a win and a loss',
          'Delete the candle',
        ],
        correctIndex: 1,
        explanation:
          'Intrabar order is unknowable from the candle. Conservative resolution or finer data — never the flattering one.',
        choiceExplanations: [
          'Motivation is not evidence.',
          'Correct.',
          'Fabricated accounting.',
          'Deleting data is worse.',
        ],
      },
      {
        id: 'q2',
        prompt: 'An order shows partially filled after a thin candle. Meaning?',
        choices: [
          'The broker is cheating',
          'Available simulated liquidity was less than the order; the remainder is still working',
          'The order failed and must be resent immediately',
          'Price will return to complete it',
        ],
        correctIndex: 1,
        explanation:
          'Partial fills are liquidity arithmetic. The remainder keeps the original conditions unless you deliberately cancel.',
        choiceExplanations: [
          'It is a model of finite liquidity.',
          'Correct.',
          'Resending duplicates risk.',
          'Nothing is owed a completion.',
        ],
      },
    ],
  }),

  lesson({
    id: 'dt-strategy-evaluation',
    title: 'Testing an intraday idea without lying to yourself',
    description:
      'Expectancy, sample size, costs, regimes, overfitting, out-of-sample testing, and rule-violation accounting.',
    category: 'decision',
    difficulty: 'expert',
    durationMinutes: 16,
    track: 'classic',
    sortOrder: 211,
    isPremium: true,
    tags: ['evaluation', 'expectancy', 'overfitting', 'backtest'],
    relatedLessonIds: ['dt-session-plan', 'dt-scalping-costs'],
    practiceLinks: [DAY_LINK, DRILLS_LINK],
    conceptIds: ['avoiding-hindsight', 'scenario-thinking', 'uncertainty', 'post-decision-review'],
    learningObjectives: [
      'Compute expectancy from win rate and average win/loss — net of all costs',
      'Explain why small synthetic samples cannot prove profitability',
      'Design a training/evaluation split with out-of-sample sessions and a rule-violation log',
    ],
    whyItMatters:
      'Intraday generates data fast, which means it generates convincing false patterns fast. Evaluation discipline is the immune system.',
    sections: [
      {
        heading: 'Define before you test',
        body: 'A strategy is a complete sentence: instrument class, session, setup conditions, entry order, invalidation, target logic, sizing, daily limits, and the regimes it declines. Anything adjusted after seeing results is a new strategy and restarts the sample. Hindsight bias enters through "obvious" re-reads of completed charts; the replay engine fights it mechanically by hiding the future until you commit.',
      },
      {
        heading: 'Expectancy and the limits of win rate',
        body: "Expectancy = (win rate × average net win) − (loss rate × average net loss). Educational example: 40% wins of +$120 and 60% losses of −$70 gives 0.4×120 − 0.6×70 = +$6 per trade before any cost underestimation — a coin-flip's edge, inside noise for dozens of trades. Win rate alone is marketing. Maximum drawdown, cost totals, and sample size are part of the same sentence, and simulated P/L never grades whether individual decisions were good.",
      },
      {
        heading: 'Overfitting, regimes, and out-of-sample honesty',
        body: 'Every parameter tuned to one tape — this stop distance, that VWAP filter — fits the noise of that tape a little more. Defences: keep rules few and principled; separate training scenarios (where you learn) from evaluation scenarios (fresh seeds you never tuned on); demand the idea survive the regime it was not built in, or explicitly restrict it. A method that only works on quiet synthetic ranges has learned your generator, not a market.',
        callout: {
          type: 'warning',
          text: 'A profitable small sample of synthetic scenarios proves only that the arithmetic ran. Treat any "it works" feeling before ~100 rule-following trades as a hypothesis wearing a costume.',
        },
      },
      {
        heading: 'Worked example: two ledgers (educational)',
        body: 'Fictional example: Ledger A shows +$840 over 25 trades with 9 rule violations quietly edited out. Ledger B shows +$210 over 25 trades, zero violations, costs itemised. B is the only evaluable strategy; A evaluated a trader who does not follow it. Record violations as data, keep training and evaluation seeds apart, and let the review — not the balance — say what to practise next.',
      },
    ],
    keyTakeaways: [
      'Define completely, then test; edits restart the sample.',
      'Expectancy is net, contextual, and humble about sample size.',
      'Fresh-seed evaluation and violation logs keep you honest.',
    ],
    commonMistakes: [
      'Tuning to one tape',
      'Quoting win rate gross of costs',
      'Deleting violating trades',
    ],
    practicalExamples: [
      'Run five Trading Day sessions on fresh seeds with frozen rules; grade violations before P/L.',
    ],
    whenItWorks: ['Conclusions cite sample size, costs, regime, and violations together.'],
    whenItFails: ['A screenshot of one good day becomes a strategy.'],
    limitations: [
      'Synthetic evaluation teaches method. It cannot validate a real-world edge, and this app never claims otherwise.',
    ],
    exercises: [
      {
        id: 'dt-eval-ex1',
        kind: 'calculate',
        prompt: 'Win rate 50%, average net win $80, average net loss $60. Expectancy per trade?',
        expectedValue: 10,
        tolerance: 0.01,
        unit: '$',
        explanation:
          '0.5×80 − 0.5×60 = +$10 per trade — before questioning sample size and cost estimates.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Twelve winning trades on the same synthetic seed you practised on prove…',
        choices: [
          'The strategy is profitable',
          'Almost nothing — training and evaluation data were the same, and the sample is tiny',
          'The generator is realistic',
          'Risk can be doubled',
        ],
        correctIndex: 1,
        explanation:
          'Contaminated, tiny samples cannot carry conclusions. Fresh seeds, frozen rules, honest counts.',
        choiceExplanations: [
          'That is exactly what cannot be concluded.',
          'Correct.',
          'Generators teach mechanics, not realism certificates.',
          'Nothing here sizes real risk.',
        ],
      },
      {
        id: 'q2',
        prompt: 'A trade violated the written rules and won. In evaluation it is recorded as…',
        choices: [
          'A win — results only',
          'A rule violation with a lucky outcome; excluded from strategy evidence, kept in behaviour evidence',
          'Deleted',
          'Proof to amend the rules immediately',
        ],
        correctIndex: 1,
        explanation:
          'Strategy evidence requires the strategy to have been followed. Behaviour evidence keeps the violation visible.',
        choiceExplanations: [
          'Violations corrupt the sample.',
          'Correct.',
          'Deleting hides the pattern.',
          'One trade amends nothing.',
        ],
      },
    ],
  }),
];
