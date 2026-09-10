import type {
  EventReactionStyle,
  ScenarioAssetConfig,
  ScenarioClimate,
  ScenarioComplexity,
  ScenarioDifficulty,
  ScenarioEvent,
  ScenarioEventKind,
  ScenarioFocus,
} from '../types/scenario.types';
import { intIn, pick, pickN } from './scenario-rng';

const EVENT_KINDS: readonly ScenarioEventKind[] = [
  'inflation',
  'rate_decision',
  'employment',
  'gdp',
  'earnings',
  'guidance',
  'product',
  'regulatory',
  'geopolitical',
  'commodity_shock',
  'banking_stress',
  'sector_news',
  'liquidity_shock',
  'false_breakout',
  'volatility_expansion',
];

const REACTIONS: readonly EventReactionStyle[] = [
  'impulse_extend',
  'gap_fade',
  'muted',
  'vol_only',
  'delayed',
  'gap_reverse',
];

interface EventTemplate {
  kind: ScenarioEventKind;
  title: string;
  briefing: string;
  expectedValue?: string;
  actuals: Array<{ actual: string; surprise: number; outcome: string }>;
  sectors: string[];
  marketRelevance: [number, number];
}

const TEMPLATES: readonly EventTemplate[] = [
  {
    kind: 'inflation',
    title: 'Fictional inflation print',
    briefing:
      'A scheduled inflation report is due. Consensus is only a guess. The print is not known yet.',
    expectedValue: 'Consensus +0.2% monthly',
    actuals: [
      {
        actual: '+0.5% (hotter than the fictional consensus)',
        surprise: 0.72,
        outcome:
          'The print ran hot. Volatility expanded. Rate-sensitive names did not move as a single block — some faded after the first hour.',
      },
      {
        actual: '0.0% (cooler than the fictional consensus)',
        surprise: -0.55,
        outcome:
          'The print cooled. Duration caught a bid that later stalled. The first reaction was not the whole story.',
      },
      {
        actual: '+0.2% (in line)',
        surprise: 0.08,
        outcome:
          'The print matched the guess. The statement around it still widened the range. Prediction was not the skill.',
      },
    ],
    sectors: ['financials', 'utilities', 'technology', 'index'],
    marketRelevance: [0.7, 0.95],
  },
  {
    kind: 'rate_decision',
    title: 'Policy decision (fictional committee)',
    briefing:
      'A policy decision is scheduled. The path of rates is not knowable in advance. Size as if the statement can disagree with the decision.',
    expectedValue: 'Hold, gradual path',
    actuals: [
      {
        actual: 'Hold, hawkish statement',
        surprise: 0.4,
        outcome:
          'The decision matched the guess; the statement did not. Path uncertainty rose more than the headline.',
      },
      {
        actual: 'Cut, larger than expected',
        surprise: -0.7,
        outcome:
          'The cut surprised. Risk assets and duration moved together at first, then leadership split.',
      },
      {
        actual: 'Hold, as expected',
        surprise: 0.05,
        outcome:
          'No headline surprise. Ranges still widened into the press conference. Waiting was a valid process.',
      },
      {
        actual: 'Mixed interpretation — decision and statement disagreed',
        surprise: 0.22,
        outcome:
          'Traders split on whether the path was easier or tighter. Adaptation mattered more than the first label.',
      },
    ],
    sectors: ['financials', 'utilities', 'index', 'technology'],
    marketRelevance: [0.75, 1],
  },
  {
    kind: 'employment',
    title: 'Labor-market report',
    briefing:
      'A labor-market report is due. Revisions can matter as much as the headline. The number is not known yet.',
    expectedValue: 'Consensus +160k',
    actuals: [
      {
        actual: '+290k with upward revisions',
        surprise: 0.65,
        outcome:
          'The print was firmer than expected. Rate-sensitive names sold first; cyclicals did not all follow.',
      },
      {
        actual: '+40k with downward revisions',
        surprise: -0.6,
        outcome:
          'The print was softer. Volatility rose. The second session disagreed with the first take.',
      },
    ],
    sectors: ['index', 'consumer', 'financials'],
    marketRelevance: [0.6, 0.9],
  },
  {
    kind: 'gdp',
    title: 'Growth estimate',
    briefing:
      'A growth estimate is scheduled. One print does not define a regime. The figure is not known yet.',
    expectedValue: '+1.8% annualized',
    actuals: [
      {
        actual: '+2.6%',
        surprise: 0.45,
        outcome: 'Growth printed firmer. Cyclicals led briefly, then breadth narrowed.',
      },
      {
        actual: '+0.4%',
        surprise: -0.5,
        outcome: 'Growth printed softer. Defensive names held up better than the index.',
      },
    ],
    sectors: ['index', 'industrials', 'consumer'],
    marketRelevance: [0.45, 0.75],
  },
  {
    kind: 'earnings',
    title: 'Quarterly results',
    briefing:
      'A listed company reports results. The print and the guidance are not known yet. An upside surprise can still sell off.',
    actuals: [
      {
        actual: 'Revenue +8% vs a soft estimate; cautious guidance',
        surprise: 0.55,
        outcome:
          'The print beat a soft estimate; the move faded as guidance stayed cautious. The first gap was not the thesis.',
      },
      {
        actual: 'Revenue missed; margins compressed',
        surprise: -0.7,
        outcome:
          'The print missed. The gap was larger than a tight stop allowed. Invalidation belonged under the gap, not inside it.',
      },
      {
        actual: 'In-line print, raised outlook',
        surprise: 0.35,
        outcome:
          'The print was ordinary; the outlook was not. Follow-through depended on whether buyers held the opening range.',
      },
    ],
    sectors: [],
    marketRelevance: [0.4, 0.7],
  },
  {
    kind: 'guidance',
    title: 'Outlook update',
    briefing:
      'Management updates the outlook. Updates can matter more than last quarter. The wording is not known yet.',
    actuals: [
      {
        actual: 'Outlook raised on demand',
        surprise: 0.5,
        outcome: 'Guidance was raised. The stock still faded when the multiple was already stretched.',
      },
      {
        actual: 'Outlook withdrawn',
        surprise: -0.8,
        outcome: 'Guidance was pulled. Uncertainty, not the last print, became the story.',
      },
    ],
    sectors: [],
    marketRelevance: [0.35, 0.65],
  },
  {
    kind: 'product',
    title: 'Product announcement',
    briefing:
      'A product announcement is expected. Markets often price the rumor, then argue about the details.',
    actuals: [
      {
        actual: 'Launch on time, narrower than hoped',
        surprise: -0.25,
        outcome: 'The product arrived. The addressable market looked smaller than the story.',
      },
      {
        actual: 'Launch delayed',
        surprise: -0.45,
        outcome: 'The delay was the news. The first session overshot; the second session argued about how much.',
      },
    ],
    sectors: ['technology'],
    marketRelevance: [0.25, 0.5],
  },
  {
    kind: 'regulatory',
    title: 'Regulatory decision',
    briefing:
      'A regulatory decision is pending. Timing and wording are uncertain. Do not treat a leak as a conclusion.',
    actuals: [
      {
        actual: 'Approval with conditions',
        surprise: 0.3,
        outcome: 'Approval arrived with conditions. The relief rally faded as the conditions were read.',
      },
      {
        actual: 'Review extended',
        surprise: -0.35,
        outcome: 'The review was extended. Time, not a binary yes, became the risk.',
      },
    ],
    sectors: ['healthcare', 'financials'],
    marketRelevance: [0.3, 0.6],
  },
  {
    kind: 'geopolitical',
    title: 'Geopolitical headline',
    briefing:
      'A geopolitical headline is developing. First takes are often wrong. Correlation can rise before facts do.',
    actuals: [
      {
        actual: 'Headline worse than the follow-up',
        surprise: -0.55,
        outcome: 'The first headline was worse than the follow-up. The open gap partly filled.',
      },
      {
        actual: 'Situation escalated overnight',
        surprise: -0.75,
        outcome: 'The situation escalated. Correlation across risk assets jumped. Size mattered more than a view.',
      },
    ],
    sectors: ['energy', 'index', 'industrials'],
    marketRelevance: [0.55, 0.9],
  },
  {
    kind: 'commodity_shock',
    title: 'Commodity supply headline',
    briefing:
      'A commodity supply headline is circulating. Energy and materials can move together — or not. The size of the disruption is not known yet.',
    actuals: [
      {
        actual: 'Short disruption, quickly walked back',
        surprise: 0.2,
        outcome: 'The disruption was walked back. Energy gave back the first spike.',
      },
      {
        actual: 'Sustained supply concern',
        surprise: 0.7,
        outcome: 'Supply concern persisted. Energy led; rate-sensitive names lagged. Not every book needed to chase.',
      },
    ],
    sectors: ['energy', 'materials'],
    marketRelevance: [0.4, 0.75],
  },
  {
    kind: 'banking_stress',
    title: 'Funding-market stress',
    briefing:
      'Funding markets look less comfortable. Stress can stay contained or spread. You will not know which on the first print.',
    actuals: [
      {
        actual: 'Contained to one fictional lender',
        surprise: -0.35,
        outcome: 'Stress stayed contained. Financials bounced; the first session still punished tight stops.',
      },
      {
        actual: 'Funding spreads widened across the group',
        surprise: -0.8,
        outcome: 'Spreads widened. Liquidity thinned. Correlation rose. Process meant reducing size, not predicting the bottom.',
      },
    ],
    sectors: ['financials', 'index'],
    marketRelevance: [0.6, 0.95],
  },
  {
    kind: 'sector_news',
    title: 'Sector leadership shift',
    briefing:
      'Leadership inside the book may be changing. The index can be quiet while names rotate. You will see it in relative strength, not a headline first.',
    actuals: [
      {
        actual: 'Defensives led, cyclicals lagged',
        surprise: -0.2,
        outcome: 'Defensive names led. Cyclicals lagged even as the index was flat.',
      },
      {
        actual: 'Cyclicals squeezed, then faded',
        surprise: 0.25,
        outcome: 'Cyclicals led a short squeeze that faded when breadth failed.',
      },
    ],
    sectors: ['index'],
    marketRelevance: [0.35, 0.6],
  },
  {
    kind: 'liquidity_shock',
    title: 'Thinner books',
    briefing:
      'Dealers report thinner books. Spreads may widen without a new fundamental fact. Small size can still move price.',
    actuals: [
      {
        actual: 'Liquidity thinned into the close',
        surprise: -0.3,
        outcome: 'Liquidity thinned into the close. A small order moved price more than usual.',
      },
      {
        actual: 'Liquidity returned after the first hour',
        surprise: 0.1,
        outcome: 'Liquidity returned after the first hour. The early move was not the story.',
      },
    ],
    sectors: ['index'],
    marketRelevance: [0.3, 0.55],
  },
  {
    kind: 'false_breakout',
    title: 'Watched level under test',
    briefing:
      'Price is pressing a well-watched level. Acceptance is not guaranteed. The first print through is not confirmation.',
    actuals: [
      {
        actual: 'Close held beyond the level; follow-through uneven',
        surprise: 0.35,
        outcome: 'The breakout held a close beyond the level. Follow-through was uneven.',
      },
      {
        actual: 'Close back inside the range',
        surprise: -0.4,
        outcome: 'The breakout failed. Price closed back inside the range.',
      },
    ],
    sectors: ['index'],
    marketRelevance: [0.25, 0.5],
  },
  {
    kind: 'volatility_expansion',
    title: 'Volatility regime check',
    briefing:
      'Implied and realized vol may diverge. Size matters more than a directional call. You do not know whether the range will stay wide.',
    actuals: [
      {
        actual: 'Range roughly doubled',
        surprise: 0.5,
        outcome: 'Range doubled. Stops that were too tight became noise, not invalidation.',
      },
      {
        actual: 'Vol expanded, then contracted',
        surprise: 0.15,
        outcome: 'Vol expanded then contracted. Chasing the first spike was costly.',
      },
    ],
    sectors: ['index'],
    marketRelevance: [0.35, 0.65],
  },
];

function reactionFor(rand: () => number, surprise: number): EventReactionStyle {
  if (Math.abs(surprise) < 0.15) return pick(rand, ['muted', 'vol_only']);
  if (rand() < 0.22) return pick(rand, REACTIONS);
  if (Math.abs(surprise) > 0.65 && rand() < 0.35) return pick(rand, ['gap_fade', 'gap_reverse', 'impulse_extend']);
  return pick(rand, ['impulse_extend', 'gap_fade', 'delayed', 'vol_only']);
}

const BEGINNER_KINDS = new Set<ScenarioEventKind>([
  'inflation',
  'employment',
  'earnings',
  'false_breakout',
]);

const ADVANCED_PRESSURE_KINDS = new Set<ScenarioEventKind>([
  'geopolitical',
  'commodity_shock',
  'banking_stress',
  'liquidity_shock',
  'rate_decision',
]);

export function generateScenarioEvents(input: {
  rand: () => number;
  assets: ScenarioAssetConfig[];
  complexity: ScenarioComplexity;
  climate: ScenarioClimate;
  horizonDays: number;
  preferredKind?: ScenarioEventKind;
  difficulty?: ScenarioDifficulty;
  focus?: ScenarioFocus;
}): ScenarioEvent[] {
  const events: ScenarioEvent[] = [];
  const usedDays = new Set<number>();
  const count = input.complexity.eventCount;
  const pool =
    input.difficulty === 'beginner'
      ? TEMPLATES.filter((item) => BEGINNER_KINDS.has(item.kind))
      : TEMPLATES;
  const templates = pool.length ? pool : TEMPLATES;

  for (let i = 0; i < count; i += 1) {
    const preferred =
      i === 0 && input.preferredKind
        ? TEMPLATES.find((item) => item.kind === input.preferredKind)
        : undefined;
    const template =
      preferred ??
      (input.difficulty === 'expert' && i === 1
        ? pick(
            input.rand,
            templates.filter((item) => ADVANCED_PRESSURE_KINDS.has(item.kind)).length
              ? templates.filter((item) => ADVANCED_PRESSURE_KINDS.has(item.kind))
              : templates,
          )
        : pick(input.rand, templates));
    let announceDay = preferred ? 2 : 2 + intIn(input.rand, 0, Math.max(2, input.horizonDays - 8));
    let guard = 0;
    while (usedDays.has(announceDay) && guard < 8) {
      announceDay = 2 + intIn(input.rand, 0, Math.max(2, input.horizonDays - 8));
      guard += 1;
    }
    usedDays.add(announceDay);
    const resolveLag = input.rand() > 0.45 + input.complexity.incompleteInformation * 0.2 ? 1 : 0;
    const resolveDay = Math.min(input.horizonDays - 1, announceDay + resolveLag);
    const actual = pick(input.rand, template.actuals);
    const company =
      template.kind === 'earnings' || template.kind === 'guidance' || template.kind === 'product'
        ? pick(
            input.rand,
            input.assets.filter((item) => item.assetType === 'equity'),
          ) ?? input.assets[0]
        : undefined;

    const sectorPool = template.sectors.length
      ? template.sectors
      : company
        ? [company.sector]
        : [pick(input.rand, input.assets).sector];
    const related = company
      ? [company.symbol, ...pickN(input.rand, input.assets, 1).map((item) => item.symbol)]
      : input.assets
          .filter((item) => sectorPool.includes(item.sector) || item.sector === 'index' || input.rand() > 0.55)
          .map((item) => item.symbol);
    const symbols = [...new Set(related.length ? related : [input.assets[0]!.symbol])];
    const relevance =
      template.marketRelevance[0]! +
      input.rand() * (template.marketRelevance[1]! - template.marketRelevance[0]!);
    const sign = actual.surprise >= 0 ? 1 : -1;
    const shock = Math.round(
      sign * (35 + input.rand() * 160) * (0.55 + input.complexity.volatility) * (0.5 + Math.abs(actual.surprise)),
    );

    const hideConsensus = (input.difficulty === 'advanced' || input.difficulty === 'expert') && input.rand() > 0.35;
    const competing =
      input.difficulty === 'expert'
        ? ' More than one explanation fits this tape. The first move is not the answer.'
        : input.difficulty === 'advanced'
          ? ' Information is incomplete until the print.'
          : '';
    events.push({
      id: `evt_${i + 1}`,
      announceDay,
      resolveDay,
      kind: template.kind,
      title: company ? `${company.name}: ${template.title}` : template.title,
      briefing: `${template.briefing}${competing}`.trim(),
      companyName: company?.name,
      expectedValue: hideConsensus ? undefined : template.expectedValue,
      actualValue: company ? `${company.name} — ${actual.actual}` : actual.actual,
      surpriseMagnitude: actual.surprise,
      marketRelevance: relevance,
      affectedSectors: sectorPool,
      symbols,
      volatilityEffect: 0.2 + Math.abs(actual.surprise) * 0.7,
      sentimentEffect: actual.surprise * (input.climate.sentiment === 'complacent' ? 1.15 : 0.9),
      reactionStyle: reactionFor(input.rand, actual.surprise),
      outcome: actual.outcome,
      shockBps: shock,
    });
  }

  const ordered = events.sort((a, b) => a.announceDay - b.announceDay || a.id.localeCompare(b.id));
  if (input.focus !== 'overconfidence' || !ordered.length) return ordered;
  return ordered.map((event, index) => ({
    ...event,
    briefing:
      index === 0
        ? `${event.briefing} Early tape has been consistent with the educational consensus. That can change.`.trim()
        : `${event.briefing} A later reading now conflicts with the first story. Neither print is a trade instruction.`.trim(),
  }));
}

export { EVENT_KINDS };
