import {
  computeDecisionQualityScore,
  computeResearchValueScore,
} from '@/features/decision/services/research-value.service';
import type {
  MarketRegime,
  MtfConsensus,
  RegimeSnapshot,
  SetupCardData,
  TraderMemory,
} from '@/features/decision/types/decision.types';
import type { AiEnrichedContext } from '@/features/ai/types/ai.types';
import type {
  AiDebateResult,
  DebateCase,
  DebateEvidencePoint,
} from '@/features/ai/types/ai-debate.types';

export interface BuildAiDebateInput {
  enriched: AiEnrichedContext;
  timeframe: string;
  regime?: RegimeSnapshot | null;
  mtf?: MtfConsensus | null;
  memory?: TraderMemory | null;
  portfolioSymbols?: string[];
  now?: number;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function point(
  text: string,
  source: DebateEvidencePoint['source'],
  citation?: string,
): DebateEvidencePoint {
  return { text, source, citation };
}

function ensureBalanced(points: DebateEvidencePoint[], fallback: DebateEvidencePoint): DebateEvidencePoint[] {
  return points.length > 0 ? points.slice(0, 5) : [fallback];
}

function buildSetupProxy(input: BuildAiDebateInput): SetupCardData {
  const { enriched, regime, memory } = input;
  const symbol = enriched.symbol ?? 'UNKNOWN';
  const bias = enriched.overallBias ?? 'neutral';
  const confidence = clamp(enriched.biasConfidence ?? 50);
  const why: string[] = [];
  if (enriched.trend) why.push(`Trend context: ${enriched.trend}`);
  if (enriched.rsi) why.push(`RSI ${enriched.rsi.value} (${enriched.rsi.signal})`);
  if (enriched.macd) why.push(`MACD ${enriched.macd.signal}`);

  const risk: SetupCardData['risk'] =
    enriched.adx != null && enriched.adx >= 30
      ? 'high'
      : enriched.atr != null && enriched.atr > 0
        ? 'medium'
        : 'low';

  return {
    id: `debate-${symbol}`,
    symbol,
    title: `${symbol} research debate`,
    bias,
    status: 'watching',
    confidence,
    why,
    risk,
    invalidation:
      bias === 'bearish'
        ? enriched.resistanceLevels?.[0] != null
          ? String(enriched.resistanceLevels[0])
          : undefined
        : enriched.supportLevels?.[0] != null
          ? String(enriched.supportLevels[0])
          : undefined,
    researchChecklist: [
      { id: 'levels', label: 'Levels marked', done: (enriched.supportLevels?.length ?? 0) > 0 },
      { id: 'invalidation', label: 'Invalidation defined', done: Boolean(enriched.supportLevels?.[0] || enriched.resistanceLevels?.[0]) },
      { id: 'regime', label: 'Regime noted', done: Boolean(regime) },
      {
        id: 'news',
        label: 'Headlines reviewed',
        done: (enriched.newsHeadlines?.length ?? 0) > 0,
      },
    ],
    historyNote: memory?.typicalMistakes?.[0]
      ? `Memory cue: ${memory.typicalMistakes[0]}`
      : undefined,
    explainability: {
      confidence,
      factors: [
        {
          label: 'Chart bias',
          agrees: bias !== 'neutral',
          detail: bias,
        },
        {
          label: 'Indicator coverage',
          agrees: Boolean(enriched.rsi || enriched.macd),
          detail: enriched.rsi || enriched.macd ? 'Present' : 'Limited',
        },
      ],
      agrees: bias !== 'neutral' ? 1 : 0,
      disagrees: bias === 'neutral' ? 1 : 0,
      dataAsOf: enriched.assembledAt,
      freshness: 'unknown',
      reasoning: 'Debate setup proxy for RVS/DQS — process scores, not price forecasts.',
    },
  };
}

function buildBullPoints(input: BuildAiDebateInput): DebateEvidencePoint[] {
  const { enriched, regime, mtf, memory, timeframe } = input;
  const points: DebateEvidencePoint[] = [];

  if (enriched.quote && enriched.quote.changePercent > 0.5) {
    points.push(
      point(
        `Quote momentum: +${enriched.quote.changePercent.toFixed(2)}% on the session`,
        'quote',
        `Change ${enriched.quote.changePercent.toFixed(2)}%`,
      ),
    );
  }
  if (enriched.quote?.volume != null && enriched.quote.volume > 0) {
    points.push(
      point(`Volume observed: ${enriched.quote.volume.toLocaleString()}`, 'quote', 'Session volume'),
    );
  }
  if (enriched.rsi && (enriched.rsi.signal === 'bullish' || enriched.rsi.value >= 55)) {
    points.push(
      point(`RSI ${enriched.rsi.value} reads ${enriched.rsi.signal}`, 'indicator', 'RSI(14)'),
    );
  }
  if (enriched.macd && enriched.macd.signal === 'bullish') {
    points.push(
      point(
        `MACD signal bullish${enriched.macd.histogram != null ? ` · hist ${enriched.macd.histogram}` : ''}`,
        'indicator',
        'MACD',
      ),
    );
  }
  if (enriched.trend && /up|bull|rising/i.test(enriched.trend)) {
    points.push(point(`Trend context: ${enriched.trend}`, 'indicator', 'Trend summary'));
  }
  for (const pattern of (enriched.detectedPatterns ?? []).filter((p) => p.bullish).slice(0, 2)) {
    points.push(
      point(
        `Pattern: ${pattern.name} (evidence quality ${pattern.confidence}%)`,
        'pattern',
        pattern.name,
      ),
    );
  }
  if (enriched.supportLevels?.[0] != null) {
    points.push(
      point(`Nearby support marked at ${enriched.supportLevels[0]}`, 'levels', 'Support'),
    );
  }
  if (regime && (regime.regime === 'trending' || regime.regime === 'risk_on')) {
    points.push(
      point(`Regime ${regime.label} can favor continuation research`, 'regime', regime.label),
    );
  }
  if (mtf && mtf.consensus === 'bullish') {
    points.push(
      point(`Multi-timeframe consensus leans bullish (${mtf.consensusScore})`, 'mtf', 'MTF'),
    );
  }
  for (const headline of (enriched.newsHeadlines ?? []).slice(0, 2)) {
    if (/beat|surge|rally|upgrade|growth|record/i.test(headline.title)) {
      points.push(
        point(`Headline context: “${headline.title}”`, 'news', headline.source),
      );
    }
  }
  if (memory?.bestSetups?.length && enriched.overallBias === 'bullish') {
    points.push(
      point(
        `Aligns with setups you execute cleanly: ${memory.bestSetups[0]}`,
        'memory',
        'Trader Memory',
      ),
    );
  }
  points.push(
    point(`Timeframe under review: ${timeframe}`, 'timeframe', timeframe),
  );

  return ensureBalanced(
    points,
    point(
      'Insufficient bullish evidence on this timeframe — bull case stays provisional',
      'indicator',
    ),
  );
}

function buildBearPoints(input: BuildAiDebateInput): DebateEvidencePoint[] {
  const { enriched, regime, mtf, memory, timeframe, portfolioSymbols = [] } = input;
  const points: DebateEvidencePoint[] = [];
  const symbol = enriched.symbol?.toUpperCase();

  if (enriched.quote && enriched.quote.changePercent < -0.5) {
    points.push(
      point(
        `Quote pressure: ${enriched.quote.changePercent.toFixed(2)}% on the session`,
        'quote',
        `Change ${enriched.quote.changePercent.toFixed(2)}%`,
      ),
    );
  }
  if (enriched.rsi && (enriched.rsi.signal === 'bearish' || enriched.rsi.value <= 45)) {
    points.push(
      point(`RSI ${enriched.rsi.value} reads ${enriched.rsi.signal}`, 'indicator', 'RSI(14)'),
    );
  }
  if (enriched.macd && enriched.macd.signal === 'bearish') {
    points.push(point('MACD signal bearish', 'indicator', 'MACD'));
  }
  if (enriched.trend && /down|bear|falling/i.test(enriched.trend)) {
    points.push(point(`Trend context: ${enriched.trend}`, 'indicator', 'Trend summary'));
  }
  for (const pattern of (enriched.detectedPatterns ?? []).filter((p) => !p.bullish).slice(0, 2)) {
    points.push(
      point(
        `Pattern: ${pattern.name} (evidence quality ${pattern.confidence}%)`,
        'pattern',
        pattern.name,
      ),
    );
  }
  if (enriched.resistanceLevels?.[0] != null) {
    points.push(
      point(
        `Resistance overhead marked at ${enriched.resistanceLevels[0]}`,
        'levels',
        'Resistance',
      ),
    );
  }
  if (regime && (regime.regime === 'risk_off' || regime.regime === 'high_volatility' || regime.regime === 'ranging')) {
    points.push(
      point(
        `Regime ${regime.label} raises the bar for bullish research`,
        'regime',
        regime.label,
      ),
    );
  }
  if (mtf && mtf.consensus === 'bearish') {
    points.push(
      point(`Multi-timeframe consensus leans bearish (${mtf.consensusScore})`, 'mtf', 'MTF'),
    );
  }
  if (enriched.fearGreedIndex != null && enriched.fearGreedIndex <= 30) {
    points.push(
      point(
        `Fear & Greed at ${enriched.fearGreedIndex} (${enriched.fearGreedLabel ?? 'fear'})`,
        'regime',
        'Fear & Greed',
      ),
    );
  }
  for (const headline of (enriched.newsHeadlines ?? []).slice(0, 2)) {
    if (/cut|miss|downgrade|fall|weak|risk|warn|lawsuit|probe/i.test(headline.title)) {
      points.push(
        point(`Headline context: “${headline.title}”`, 'news', headline.source),
      );
    }
  }
  if (symbol && portfolioSymbols.some((s) => s.toUpperCase() === symbol)) {
    points.push(
      point('Already held — fresh research may add less new edge', 'portfolio', 'Portfolio'),
    );
  }
  if (memory?.weakestSetups?.length) {
    points.push(
      point(
        `Watch your weak setups: ${memory.weakestSetups[0]}`,
        'memory',
        'Trader Memory',
      ),
    );
  }
  if (memory?.typicalMistakes?.[0]) {
    points.push(
      point(`Personal leak to avoid: ${memory.typicalMistakes[0]}`, 'memory', 'Trader Memory'),
    );
  }
  points.push(point(`Timeframe under review: ${timeframe}`, 'timeframe', timeframe));

  return ensureBalanced(
    points,
    point(
      'Insufficient bearish evidence on this timeframe — bear case stays provisional',
      'indicator',
    ),
  );
}

function buildNeutralPoints(input: BuildAiDebateInput): DebateEvidencePoint[] {
  const { enriched, regime, mtf, timeframe } = input;
  const points: DebateEvidencePoint[] = [];

  if (enriched.overallBias === 'neutral' || !enriched.overallBias) {
    points.push(point('Chart bias is mixed or incomplete — wait for clearer structure', 'indicator'));
  }
  if (enriched.rsi && enriched.rsi.signal === 'neutral') {
    points.push(point(`RSI ${enriched.rsi.value} is neutral`, 'indicator', 'RSI(14)'));
  }
  if (mtf && mtf.consensus === 'neutral') {
    points.push(point('Multi-timeframe frames disagree or stay neutral', 'mtf', 'MTF'));
  }
  if (regime?.regime === 'ranging') {
    points.push(
      point(`Ranging regime (${regime.label}) often favors confirmation over anticipation`, 'regime'),
    );
  }
  if ((enriched.newsHeadlines?.length ?? 0) === 0) {
    points.push(point('No symbol headlines loaded — news side of the debate is incomplete', 'news'));
  }
  if (!enriched.supportLevels?.length || !enriched.resistanceLevels?.length) {
    points.push(point('Support/resistance set is incomplete on this timeframe', 'levels'));
  }
  points.push(
    point(
      `Default stance on ${timeframe}: wait for confirmation before deeper research`,
      'timeframe',
      timeframe,
    ),
  );

  return ensureBalanced(
    points,
    point('Stay neutral until confirmation and invalidation are both defined', 'indicator'),
  );
}

function whatWouldChangeBull(input: BuildAiDebateInput): string[] {
  const { enriched, regime } = input;
  const items: string[] = [];
  if (enriched.resistanceLevels?.[0] != null) {
    items.push(`Acceptance above ${enriched.resistanceLevels[0]} with follow-through volume`);
  }
  if (enriched.rsi) {
    items.push('RSI sustaining above mid-range without immediate exhaustion');
  }
  if (enriched.macd) {
    items.push('MACD histogram staying constructive');
  }
  if (regime) {
    items.push(`Regime remaining compatible (${regime.label}) rather than shifting risk-off`);
  }
  if (items.length === 0) {
    items.push('Clearer bullish structure and defined levels on this timeframe');
  }
  return items.slice(0, 4);
}

function whatWouldChangeBear(input: BuildAiDebateInput): string[] {
  const { enriched, regime } = input;
  const items: string[] = [];
  if (enriched.supportLevels?.[0] != null) {
    items.push(`Loss of ${enriched.supportLevels[0]} on expanding pressure`);
  }
  if (enriched.rsi) {
    items.push('RSI rolling over from mid/high range');
  }
  if (enriched.macd) {
    items.push('MACD crossing or histogram turning negative');
  }
  if (regime) {
    items.push(`Regime deteriorating versus ${regime.label}`);
  }
  if (items.length === 0) {
    items.push('Clearer downside structure and broken supports on this timeframe');
  }
  return items.slice(0, 4);
}

function whatWouldChangeNeutral(input: BuildAiDebateInput): string[] {
  const { enriched } = input;
  const items = [
    'A decisive candle or MTF alignment that resolves the mixed bias',
    'Documented invalidation level before expanding research time',
  ];
  if (enriched.newsHeadlines?.length) {
    items.push('A headline that materially changes the research checklist (verify independently)');
  }
  return items.slice(0, 4);
}

function buildQuestions(input: BuildAiDebateInput): string[] {
  const { enriched, timeframe } = input;
  const questions = [
    'What confirms this structure on the selected timeframe?',
    'What invalidates the thesis before I spend more research time?',
    'What event or data release could change this debate?',
  ];
  if (enriched.resistanceLevels?.[0] != null) {
    questions.push(`What must hold above ${enriched.resistanceLevels[0]} to keep the bull case alive?`);
  }
  if (enriched.supportLevels?.[0] != null) {
    questions.push(`What breaks below ${enriched.supportLevels[0]} that forces a skip?`);
  }
  questions.push(`Is ${timeframe} the right horizon for this research block?`);
  return questions.slice(0, 6);
}

function researchPriorityFromScore(score: number): AiDebateResult['scores']['researchPriority'] {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

/**
 * Builds a balanced AI Debate from existing evidence only.
 * Never invents news, levels, or indicators that were not supplied.
 */
export function buildAiDebate(input: BuildAiDebateInput): AiDebateResult {
  const now = input.now ?? Date.now();
  const symbol = input.enriched.symbol ?? 'UNKNOWN';
  const timeframe = input.timeframe || '1d';

  const bullPoints = buildBullPoints(input);
  const bearPoints = buildBearPoints(input);
  const neutralPoints = buildNeutralPoints(input);

  const setup = buildSetupProxy(input);
  const rvs = computeResearchValueScore({
    setup,
    regime: input.regime?.regime as MarketRegime | undefined,
    memory: input.memory ?? undefined,
    portfolioSymbols: input.portfolioSymbols ?? [],
  });
  const dqs = computeDecisionQualityScore(setup);
  const priority = researchPriorityFromScore(rvs.score);

  const bullCase: DebateCase = {
    side: 'bull',
    title: 'Bull Case',
    summary: 'Evidence that could justify further research — not a buy signal.',
    points: bullPoints,
    whatWouldChange: whatWouldChangeBull(input),
  };
  const bearCase: DebateCase = {
    side: 'bear',
    title: 'Bear Case',
    summary: 'Evidence that argues for caution or a skip — not a sell signal.',
    points: bearPoints,
    whatWouldChange: whatWouldChangeBear(input),
  };
  const neutralCase: DebateCase = {
    side: 'neutral',
    title: 'Neutral View',
    summary: 'Wait for confirmation when evidence is mixed or incomplete.',
    points: neutralPoints,
    whatWouldChange: whatWouldChangeNeutral(input),
  };

  const citations = [
    ...(input.enriched.rsi
      ? [{ label: 'RSI', value: `${input.enriched.rsi.value} · ${input.enriched.rsi.signal}` }]
      : []),
    ...(input.enriched.macd
      ? [{ label: 'MACD', value: input.enriched.macd.signal }]
      : []),
    ...(input.regime
      ? [{ label: 'Regime', value: input.regime.label }]
      : []),
    ...(input.mtf
      ? [{ label: 'MTF consensus', value: `${input.mtf.consensus} · ${input.mtf.consensusScore}` }]
      : []),
    ...(input.enriched.newsHeadlines ?? []).slice(0, 3).map((h) => ({
      label: `News · ${h.source}`,
      value: h.title,
    })),
    { label: 'Timeframe', value: timeframe },
  ];

  const evidenceNotes = [
    `Sources used: indicators${input.enriched.newsHeadlines?.length ? ', news' : ''}${input.regime ? ', regime' : ''}${input.mtf ? ', MTF' : ''}${input.memory ? ', memory' : ''}, timeframe`,
    'Debate never predicts price direction or issues buy/sell instructions.',
  ];

  return {
    symbol,
    timeframe,
    generatedAt: now,
    bullCase,
    bearCase,
    neutralCase,
    scores: {
      researchPriority: priority,
      researchPriorityLabel:
        priority === 'high'
          ? 'High research priority — structure and context justify attention'
          : priority === 'medium'
            ? 'Medium research priority — selective attention only'
            : 'Low research priority — opportunity cost likely favors other ideas',
      researchValueScore: rvs.score,
      researchValueExplanation: rvs.explanation,
      decisionQualityScore: dqs.score,
      decisionQualityExplanation: dqs.explanation,
    },
    questionsBeforeResearch: buildQuestions(input),
    citations,
    evidenceNotes,
    dataAsOf: input.enriched.assembledAt || now,
  };
}
