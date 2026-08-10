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

/** Decision-coach curriculum — how to decide what deserves research time. */
export const DECISION_LESSONS: Lesson[] = [
  lesson({
    id: 'dec-research-filter',
    title: 'Should I research this?',
    description: 'A filter for opportunity cost before you open a chart.',
    category: 'decision',
    difficulty: 'beginner',
    durationMinutes: 10,
    track: 'decision',
    sortOrder: 1,
    isPremium: false,
    tags: ['decision', 'research', 'time-budget'],
    relatedLessonIds: ['dec-time-budget', 'dec-setup-quality', 'dec-why-not'],
    practiceLinks: [
      {
        label: 'Open Setup Radar',
        href: '/decision/radar',
        description: 'Rank ideas before deep research',
      },
      {
        label: 'Today Brief',
        href: '/',
        description: 'See what the app already prioritized',
      },
      {
        label: 'Decision Lab',
        href: '/decision/lab',
        description: 'Practice a full thesis before any simulated open',
      },
    ],
    sections: [
      {
        heading: 'The real scarce resource',
        body: 'Most traders treat capital as the scarce resource. In practice, attention is scarcer. Every ticker you “just check” costs focus you could spend on a higher-quality setup, your journal, or staying flat.\n\nTradeVision is built around one question: should this idea earn research time right now? That is different from “is this a good trade?” — you answer the second question only after the first passes.',
      },
      {
        heading: 'A practical gate',
        body: 'Before diving into indicators, ask three gates in order:\n\n1. Regime fit — Does today’s market condition favor this kind of idea?\n2. Edge clarity — Can you state entry, invalidation, and what would make you pass in one sentence?\n3. Time cost — Will this take 5 minutes or 45? Is that worth it vs other open ideas?\n\nIf any gate fails, skip without guilt. Skipping is a skill.',
        callout: {
          type: 'tip',
          text: 'Write the one-sentence thesis before opening more than one timeframe. If you cannot, you are browsing, not researching.',
        },
      },
      {
        heading: 'Common failure modes',
        body: '“Interesting chart” is not a thesis. Social urgency is not a thesis. A green day in your watchlist is not a thesis.\n\nAlso watch sunk-cost research: after 20 minutes of charts you feel obligated to trade. Separate research completion from trade permission. Completing research can correctly end in “no trade.”',
        callout: {
          type: 'warning',
          text: 'If you cannot name what would make the idea invalid, you do not have a setup — you have a hope.',
        },
      },
    ],
    keyTakeaways: [
      'Attention is scarcer than capital; filter before deep work.',
      'Pass regime fit, edge clarity, and time cost before researching.',
      'Finishing research with “no trade” is a successful outcome.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'What should you decide before deep chart work?',
        choices: [
          'Exact share size',
          'Whether the idea deserves research time',
          'Which indicator pack to use',
          'Broker commission tier',
        ],
        correctIndex: 1,
        explanation:
          'The academy and product center on research prioritization — trade construction comes after.',
      },
      {
        id: 'q2',
        prompt: 'Which gate failure should stop research earliest?',
        choices: [
          'You have not checked every social feed',
          'Regime clearly does not favor the setup type',
          'You have not watched a YouTube review',
          'Price has not moved 2% today',
        ],
        correctIndex: 1,
        explanation: 'Regime mismatch wastes the most time on low-odds ideas.',
      },
    ],
  }),

  lesson({
    id: 'dec-regime',
    title: 'Market regimes that change your playbook',
    description: 'Risk-on, risk-off, trend, chop, and high vol — and what to do in each.',
    category: 'decision',
    difficulty: 'beginner',
    durationMinutes: 14,
    track: 'decision',
    sortOrder: 2,
    isPremium: false,
    tags: ['regime', 'context', 'playbook'],
    relatedLessonIds: ['dec-research-filter', 'ta-trend-range', 'dec-invalidation'],
    practiceLinks: [
      { label: 'Market condition', href: '/decision/regime', description: 'See current regime label' },
      { label: 'Chart Replay', href: '/decision/replay', description: 'Practice labeling regimes bar by bar' },
      {
        label: 'Decision Replay TV',
        href: '/decision/replay-tv',
        description: 'Blind historical episodes for regime process practice',
      },
    ],
    sections: [
      {
        heading: 'Why regime first',
        body: 'The same breakout pattern has different expectancy in a clean trend versus a choppy range versus a panic tape. Indicators do not know the regime; you must.\n\nA regime is a temporary market climate: how volatility, correlation, and directional persistence behave. Your job is not to predict the next regime — it is to trade (or stand aside) appropriately for the current one.',
      },
      {
        heading: 'A workable map',
        body: 'Risk-on — Risk assets bid together; dips often get bought; momentum strategies work better.\nRisk-off — Defensive flows, wider correlations to “fear,” mean-reversion traps on “cheap” dips.\nTrending — Directional persistence; pullback entries can work; fading the move is expensive.\nRanging / chop — Support and resistance matter more; breakouts fail more often.\nHigh volatility — Size down; widen invalidation carefully or skip; news can dominate structure.',
        callout: {
          type: 'practice',
          text: 'In Chart Replay, pause every 20 bars and force a regime label before you talk about entries.',
        },
      },
      {
        heading: 'Playbook changes, not vibes',
        body: 'Write a one-line rule per regime for yourself. Example: “In high vol, only A+ setups, half size.” Example: “In chop, no breakout chases — only mean reversion at extremes with tight invalidation.”\n\nWhen regime and setup disagree, trust regime. A beautiful pattern in the wrong climate is still a low-quality research candidate.',
        callout: {
          type: 'tip',
          text: 'Pair this lesson with the Pre-Trade checklist items highlighted for the current regime.',
        },
      },
    ],
    keyTakeaways: [
      'Regime is climate; setups are weather events inside it.',
      'Change size, selectivity, and setup types by regime — not just entries.',
      'When regime and pattern conflict, deprioritize the pattern.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'In a choppy range, which behavior is usually costly?',
        choices: [
          'Fading extremes with defined invalidation',
          'Chasing breakouts without confirmation',
          'Standing aside',
          'Reducing size',
        ],
        correctIndex: 1,
        explanation: 'False breakouts are common in ranges; chasing them burns capital and attention.',
      },
      {
        id: 'q2',
        prompt: 'What is the primary job regarding regimes?',
        choices: [
          'Predict next week’s regime perfectly',
          'Align behavior with the current regime',
          'Ignore regime and trust indicators',
          'Always trade the same way',
        ],
        correctIndex: 1,
        explanation: 'Adaptation beats prediction for most retail processes.',
      },
    ],
  }),

  lesson({
    id: 'dec-setup-quality',
    title: 'Setup quality vs trade impulse',
    description: 'Score ideas so FOMO does not set your research queue.',
    category: 'decision',
    difficulty: 'intermediate',
    durationMinutes: 12,
    track: 'decision',
    sortOrder: 3,
    isPremium: false,
    tags: ['setups', 'quality', 'radar'],
    relatedLessonIds: ['dec-research-filter', 'dec-invalidation', 'risk-expectancy'],
    practiceLinks: [
      { label: 'Setup Radar', href: '/decision/radar' },
      { label: 'Decision Brief', href: '/' },
      {
        label: 'Decision Replay TV',
        href: '/decision/replay-tv',
        description: 'Grade setup quality on a blind historical tape — never chase the path',
      },
    ],
    sections: [
      {
        heading: 'Impulse feels urgent; quality is boring',
        body: 'Impulse says “moving now.” Quality asks: clear structure, clear invalidation, acceptable risk, regime fit, and a reason this is better than other open ideas.\n\nBuild a personal scorecard (even mental): structure 0–2, invalidation 0–2, risk clarity 0–2, regime fit 0–2, catalyst awareness 0–2. Research only ideas that clear a threshold (e.g. 7/10).',
      },
      {
        heading: 'Status language',
        body: 'TradeVision setups use statuses like forming vs confirmed for a reason. Forming means watchlist / light research. Confirmed means your checklist criteria are met — not that you must trade.\n\nKeep a “parking lot” for interesting but sub-threshold ideas. Revisit only if status improves; do not doom-scroll them.',
        callout: {
          type: 'warning',
          text: 'Raising size because a low-quality idea is “almost working” is impulse wearing a suit.',
        },
      },
      {
        heading: 'Queue discipline',
        body: 'Your research queue should be ranked, capped, and time-boxed. Three strong ideas beat twelve mediocre tabs. If Radar ranks something below your cut line, treat that as information — either trust the filter or consciously override with a written reason.',
      },
    ],
    keyTakeaways: [
      'Score setups; do not let urgency set priority.',
      'Forming ≠ permission to trade; confirmed ≠ obligation.',
      'Cap the queue; parking-lot weak ideas instead of obsessing.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'A setup is “forming.” Best next action?',
        choices: [
          'Full size entry immediately',
          'Light monitoring / light research until criteria confirm',
          'Delete it forever',
          'Double risk to compensate',
        ],
        correctIndex: 1,
        explanation: 'Forming means incomplete criteria — watch, do not force.',
      },
    ],
  }),

  lesson({
    id: 'dec-invalidation',
    title: 'Invalidation: knowing when you are wrong',
    description: 'Define the thesis-killer before you care about targets.',
    category: 'decision',
    difficulty: 'intermediate',
    durationMinutes: 13,
    track: 'decision',
    sortOrder: 4,
    isPremium: false,
    tags: ['invalidation', 'risk', 'process'],
    relatedLessonIds: ['dec-setup-quality', 'risk-position-sizing', 'ta-structure'],
    practiceLinks: [
      { label: 'Chart Replay', href: '/decision/replay' },
      {
        label: 'Decision Replay TV',
        href: '/decision/replay-tv',
        description: 'Name invalidation on a blind historical tape',
      },
      { label: 'Pre-trade checklist', href: '/academy' },
    ],
    sections: [
      {
        heading: 'Invalidation is part of the thesis',
        body: 'A trade idea without invalidation is a wish. Invalidation is the price, time, or condition that proves your premise false — not merely “a stop you hope will not hit.”\n\nPrice invalidation: structure break, failed hold of a level, reclaim against you.\nTime invalidation: idea must work within N sessions or it is dead.\nThesis invalidation: catalyst outcome opposite to your view.',
      },
      {
        heading: 'Place it before entry fantasy',
        body: 'Write invalidation first, then ask whether risk to that level is acceptable. If the stop must sit beyond a distance that breaks your risk rule, skip or wait for a better location — do not invent a tighter stop that structure does not support.',
        callout: {
          type: 'tip',
          text: 'In replay, hide the right edge and force yourself to state invalidation aloud before each hypothetical entry.',
        },
      },
      {
        heading: 'After invalidation',
        body: 'When hit, the job is exit and review — not “average down to be right.” Journal what failed: structure read, regime, patience, or size. Invalidation is feedback, not insult.',
        callout: {
          type: 'warning',
          text: 'Moving stops farther because you “still like it” converts a defined risk into an open-ended argument with the market.',
        },
      },
    ],
    keyTakeaways: [
      'Invalidation defines when the thesis is false.',
      'Risk is measured to true invalidation, not a hopeful tight stop.',
      'Honor invalidation; journal the miss; do not negotiate.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Best definition of invalidation?',
        choices: [
          'A profit target',
          'The condition that proves the thesis wrong',
          'Any red candle',
          'Broker margin call',
        ],
        correctIndex: 1,
        explanation: 'Invalidation is thesis-linked, not cosmetic price noise.',
      },
      {
        id: 'q2',
        prompt: 'Stop is farther than your risk rule allows. What next?',
        choices: [
          'Enter anyway with tiny stop inside noise',
          'Skip or wait for better location / smaller size premise',
          'Remove the stop',
          'Add to the loser early',
        ],
        correctIndex: 1,
        explanation: 'Structure and risk rules beat forced participation.',
      },
    ],
  }),

  lesson({
    id: 'dec-time-budget',
    title: 'Time budget for research',
    description: 'Cap how long an idea may steal from your day.',
    category: 'decision',
    difficulty: 'beginner',
    durationMinutes: 9,
    track: 'decision',
    sortOrder: 5,
    isPremium: false,
    tags: ['time', 'research', 'discipline'],
    relatedLessonIds: ['dec-research-filter', 'dec-why-not'],
    practiceLinks: [
      { label: 'Today Brief', href: '/' },
      { label: 'Research queue checklist', href: '/academy/checklist/research-budget' },
      {
        label: 'Decision Replay TV',
        href: '/decision/replay-tv',
        description: 'Short blind rooms to practise attention budgets under uncertainty',
      },
    ],
    sections: [
      {
        heading: 'Research expands to fill the void',
        body: 'Without a budget, charts expand until you are tired and impulsive. Assign each queued idea a max research block (e.g. 10–20 minutes). When the timer ends, decide: trade candidate, watchlist, or discard.\n\nHard rule: no “five more minutes” loops more than once.',
      },
      {
        heading: 'Match depth to rank',
        body: 'Top Radar ideas earn deeper time. Marginal ideas get a skim. Never spend an hour on a low-confidence curiosity while an A-setup sits unreviewed.\n\nBatch admin work (alerts, journal tags) outside peak decision windows.',
        callout: {
          type: 'practice',
          text: 'Tomorrow: set a 15-minute timer on your top idea only. Force a written decision at the bell.',
        },
      },
    ],
    keyTakeaways: [
      'Time-box research; end with a decision state.',
      'Depth should follow priority rank.',
      'Protect decision windows from admin churn.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Timer ends with no clear thesis. Best action?',
        choices: [
          'Keep researching until exhausted',
          'Park as watch/discard and move on',
          'Enter small “just in case”',
          'Ask a forum to decide',
        ],
        correctIndex: 1,
        explanation: 'Budget expiry is a decision point, not a suggestion.',
      },
    ],
  }),

  lesson({
    id: 'dec-portfolio-risk',
    title: 'Portfolio risk and correlation',
    description: 'One theme can be five tickers — and one risk bet.',
    category: 'risk_management',
    difficulty: 'intermediate',
    durationMinutes: 14,
    track: 'decision',
    sortOrder: 6,
    isPremium: true,
    tags: ['portfolio', 'correlation', 'concentration'],
    relatedLessonIds: ['risk-position-sizing', 'dec-setup-quality'],
    practiceLinks: [
      { label: 'Portfolio risk', href: '/decision/risk' },
      { label: 'Portfolio tab', href: '/portfolio' },
      {
        label: 'Decision Replay TV',
        href: '/decision/replay-tv',
        description: 'Crisis and stress rooms for downside framing before depth',
      },
    ],
    sections: [
      {
        heading: 'Name risk vs ticker risk',
        body: 'Holding five semiconductor names is not five independent bets. Correlation turns them into one concentrated theme. Measure risk at the portfolio level: sector, factor, and macro exposure.\n\nBefore adding a position, ask: what else I already own moves with this?',
      },
      {
        heading: 'Practical guards',
        body: 'Cap theme exposure (e.g. max % of equity in one narrative). Reduce size when adding a correlated name. In risk-off or high-vol regimes, cut gross exposure even if single-name stops look fine.\n\nDiversification that only exists on a watchlist spreadsheet is fake; price co-movement is what matters.',
        callout: {
          type: 'tip',
          text: 'Use the Portfolio risk view before unlocking a second idea in the same theme.',
        },
      },
    ],
    keyTakeaways: [
      'Correlated names = shared risk.',
      'Cap themes, not just single positions.',
      'Stress regime can invalidate “diversified” books.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'You hold four highly correlated longs. Adding a fifth similar name mainly increases…',
        choices: [
          'True diversification',
          'Theme concentration',
          'Cash yield',
          'Tax lot variety only',
        ],
        correctIndex: 1,
        explanation: 'Similar exposures stack risk rather than diversify it.',
      },
    ],
  }),

  lesson({
    id: 'dec-journaling',
    title: 'Journal for process, not just P&L',
    description: 'Capture decisions so patterns — not luck — drive improvement.',
    category: 'journaling',
    difficulty: 'beginner',
    durationMinutes: 11,
    track: 'decision',
    sortOrder: 7,
    isPremium: false,
    tags: ['journal', 'review', 'process'],
    relatedLessonIds: ['dec-psychology', 'dec-trading-dna', 'dec-invalidation'],
    practiceLinks: [
      { label: 'Trade journal', href: '/journal' },
      { label: 'Journal coach', href: '/decision/coach' },
      { label: 'Post-trade checklist', href: '/academy/checklist/post-trade' },
    ],
    sections: [
      {
        heading: 'What to record',
        body: 'Minimum viable journal: thesis, invalidation, size rationale, regime tag, emotion tag, and outcome vs plan (followed / bent / broke).\n\nP&L alone teaches survivorship vibes. Process tags teach repeatable edges and leaks.',
      },
      {
        heading: 'Review cadence',
        body: 'Daily: 5-minute skim for rule breaks. Weekly: cluster mistakes (late entries, moved stops, revenge adds). Monthly: update your Trading DNA notes — what setups you actually execute well.\n\nCoach features work better when journal rows are honest and complete.',
        callout: {
          type: 'practice',
          text: 'Log one “no trade” decision this week with the same care as an entry — it trains the filter muscle.',
        },
      },
    ],
    keyTakeaways: [
      'Journal process fields, not only P&L.',
      'Tag regime, plan adherence, and emotion.',
      'Review on a cadence; feed your trading profile.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Most useful journal field for long-term skill?',
        choices: [
          'Only final P&L',
          'Whether you followed the plan and why',
          'Friend’s opinion',
          'Intraday meme count',
        ],
        correctIndex: 1,
        explanation: 'Plan adherence reveals controllable skill.',
      },
    ],
  }),

  lesson({
    id: 'dec-psychology',
    title: 'Process over outcome',
    description: 'Separate good decisions from short-term results.',
    category: 'psychology',
    difficulty: 'intermediate',
    durationMinutes: 12,
    track: 'decision',
    sortOrder: 8,
    isPremium: false,
    tags: ['psychology', 'discipline', 'variance'],
    relatedLessonIds: ['dec-journaling', 'risk-expectancy', 'dec-trading-dna'],
    practiceLinks: [
      { label: 'Journal coach', href: '/decision/coach' },
      { label: 'Your trading profile', href: '/decision/memory' },
      {
        label: 'Decision Replay TV',
        href: '/decision/replay-tv',
        description: 'Blind rooms score process — never whether the historical path paid',
      },
    ],
    sections: [
      {
        heading: 'Variance lies in the short run',
        body: 'A good process can lose today; a bad process can win today. If you update rules from one outcome, you fit noise.\n\nGrade the decision quality with your checklist and journal tags. Let expectancy show up over a sample of trades, not a mood.',
      },
      {
        heading: 'Emotional protocols',
        body: 'After a loss: mandatory pause, no size-up, short walk or checklist reset.\nAfter a win: same risk rules — forbid “house money” fantasy.\nTilt tells: urgency, forum refreshing, abandoning invalidation.\n\nPre-commit responses so you do not invent discipline mid-drawdown.',
        callout: {
          type: 'warning',
          text: 'Revenge trading is research debt coming due — you skipped the filter and tried to collect emotionally.',
        },
      },
    ],
    keyTakeaways: [
      'Judge process quality separate from P&L noise.',
      'Pre-commit tilt protocols.',
      'Wins do not authorize rule breaks.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'You followed the plan and lost. Correct framing?',
        choices: [
          'Process failed; abandon the setup forever today',
          'Outcome variance; review execution, keep grading process',
          'Double next trade',
          'Ignore journal',
        ],
        correctIndex: 1,
        explanation: 'Short-run outcomes are noisy; process grading is the signal.',
      },
    ],
  }),

  lesson({
    id: 'dec-why-not',
    title: 'Why not: opportunity cost of every idea',
    description: 'Explicitly reject ideas so your queue stays honest.',
    category: 'decision',
    difficulty: 'intermediate',
    durationMinutes: 10,
    track: 'decision',
    sortOrder: 9,
    isPremium: true,
    tags: ['why-not', 'filter', 'queue'],
    relatedLessonIds: ['dec-research-filter', 'dec-time-budget', 'dec-setup-quality'],
    practiceLinks: [{ label: 'Today Brief', href: '/' }],
    sections: [
      {
        heading: 'Rejection is a first-class output',
        body: '“Why not” notes capture why an idea failed the filter: regime mismatch, unclear invalidation, correlated overload, event risk, or time budget.\n\nWriting the rejection prevents the same ticker from re-entering your head as a vague itch.',
      },
      {
        heading: 'Use rejections in review',
        body: 'Weekly, scan why-not reasons. If half are “unclear invalidation,” that is a skill gap to train in replay. If half are “already maxed theme risk,” your portfolio process is working.\n\nCelebration metric: clean rejections, not trade count.',
        callout: {
          type: 'tip',
          text: 'A day with zero trades and three solid why-nots can be an A+ process day.',
        },
      },
    ],
    keyTakeaways: [
      'Log rejections with reasons.',
      'Mine why-not tags for skill gaps.',
      'Flat + disciplined can beat busy + random.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Primary purpose of a why-not note?',
        choices: [
          'Shame yourself',
          'Make opportunity cost explicit and reusable',
          'Guarantee next trade wins',
          'Replace risk management',
        ],
        correctIndex: 1,
        explanation: 'Explicit rejection trains the filter and frees attention.',
      },
    ],
  }),

  lesson({
    id: 'dec-trading-dna',
    title: 'Build your Trading DNA',
    description: 'Know the setups, regimes, and habits you actually execute well.',
    category: 'psychology',
    difficulty: 'advanced',
    durationMinutes: 15,
    track: 'decision',
    sortOrder: 10,
    isPremium: true,
    tags: ['dna', 'edge', 'self-knowledge'],
    relatedLessonIds: ['dec-journaling', 'dec-psychology', 'dec-setup-quality'],
    practiceLinks: [
      { label: 'Your trading profile', href: '/decision/memory' },
      { label: 'Journal', href: '/journal' },
    ],
    sections: [
      {
        heading: 'Edge is personal and empirical',
        body: 'Borrowed strategies fail when they clash with your schedule, temperament, and skill. Trading DNA is the living map of: setups you execute cleanly, regimes you mishandle, times of day you tilt, and markets you overtrade.\n\nBuild it from journal evidence, not aspiration.',
      },
      {
        heading: 'How to update DNA',
        body: 'Every month: list top 3 setup types by plan-adherence and expectancy proxy. List bottom 3 leak patterns. Adjust Radar priorities and personal scorecard thresholds accordingly.\n\nShrink the playbook until it is boring and competent — then expand carefully.',
        callout: {
          type: 'practice',
          text: 'Open Memory / profile after 10 journaled decisions and write one sentence: “I will not research X in Y regime.”',
        },
      },
    ],
    keyTakeaways: [
      'DNA comes from logged behavior, not wishlists.',
      'Narrow playbook beats scattered imitation.',
      'Update monthly from journal clusters.',
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Best input for Trading DNA?',
        choices: [
          'A viral thread',
          'Your own journaled decisions over a sample',
          'One lucky winner',
          'Changing strategy daily',
        ],
        correctIndex: 1,
        explanation: 'Self-knowledge requires your data.',
      },
    ],
  }),
];
