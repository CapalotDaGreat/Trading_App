import type { ScenarioEventKind } from '@/features/simulation/types/scenario.types';

import type { MarketEventKind } from '../types/events.types';

/**
 * Canonical event → competency graph.
 *
 * Display labels are educational concepts a learner should study.
 * `conceptIds` must resolve through `resolveCompetencyId`.
 */
export interface EventConceptMapping {
  kind: MarketEventKind;
  displayConcepts: string[];
  conceptIds: string[];
  riskConceptIds: string[];
  psychologyConceptIds: string[];
  scenarioEventKind: ScenarioEventKind;
}

const RISK = ['event-volatility', 'volatility-aware-risk', 'position-sizing'] as const;
const PSYCH_PRINT = ['recency-bias', 'overconfidence'] as const;

function mapping(
  kind: MarketEventKind,
  displayConcepts: string[],
  conceptIds: string[],
  extras: {
    riskConceptIds?: string[];
    psychologyConceptIds?: string[];
    scenarioEventKind: ScenarioEventKind;
  },
): EventConceptMapping {
  return {
    kind,
    displayConcepts,
    conceptIds: [...new Set(conceptIds)],
    riskConceptIds: extras.riskConceptIds ?? [...RISK],
    psychologyConceptIds: extras.psychologyConceptIds ?? [...PSYCH_PRINT],
    scenarioEventKind: extras.scenarioEventKind,
  };
}

export const EVENT_CONCEPT_MAP: Record<MarketEventKind, EventConceptMapping> = {
  inflation: mapping(
    'inflation',
    ['inflation', 'event risk', 'volatility', 'uncertainty', 'scenario planning'],
    ['inflation', 'event-risk', 'event-volatility', 'uncertainty', 'scenario-thinking', ...RISK, ...PSYCH_PRINT],
    { scenarioEventKind: 'inflation' },
  ),
  interest_rate: mapping(
    'interest_rate',
    ['interest rates', 'macro uncertainty', 'volatility', 'event preparation'],
    [
      'interest-rates',
      'central-bank',
      'event-risk',
      'uncertainty',
      'event-volatility',
      'scenario-thinking',
      'information-timing',
      ...RISK,
      ...PSYCH_PRINT,
    ],
    { scenarioEventKind: 'rate_decision' },
  ),
  employment: mapping(
    'employment',
    ['employment', 'event risk', 'volatility', 'uncertainty', 'revisions'],
    ['employment', 'economic-releases', 'event-risk', 'event-volatility', 'uncertainty', ...RISK, ...PSYCH_PRINT],
    { scenarioEventKind: 'employment' },
  ),
  gdp: mapping(
    'gdp',
    ['growth', 'event risk', 'uncertainty', 'scenario planning'],
    ['economic-releases', 'event-risk', 'uncertainty', 'scenario-thinking', ...RISK, 'recency-bias'],
    { psychologyConceptIds: ['recency-bias'], scenarioEventKind: 'gdp' },
  ),
  earnings: mapping(
    'earnings',
    ['revenue', 'earnings', 'valuation', 'expectation risk', 'gap behavior'],
    [
      'earnings',
      'revenue-growth',
      'valuation',
      'earnings-events',
      'event-risk',
      'event-volatility',
      'fundamental-uncertainty',
      'concentration-risk',
      ...RISK,
      'recency-bias',
      'fomo',
    ],
    {
      riskConceptIds: ['event-volatility', 'volatility-aware-risk', 'concentration-risk', 'position-sizing'],
      psychologyConceptIds: ['recency-bias', 'fomo'],
      scenarioEventKind: 'earnings',
    },
  ),
  corporate: mapping(
    'corporate',
    ['corporate events', 'guidance', 'expectation risk', 'invalidation'],
    [
      'earnings-events',
      'earnings',
      'fundamental-uncertainty',
      'invalidation',
      'event-risk',
      'event-volatility',
      'recency-bias',
    ],
    {
      riskConceptIds: ['event-volatility', 'concentration-risk'],
      psychologyConceptIds: ['recency-bias', 'fomo'],
      scenarioEventKind: 'guidance',
    },
  ),
  geopolitical: mapping(
    'geopolitical',
    ['uncertainty', 'event risk', 'volatility', 'incomplete information'],
    [
      'geopolitical',
      'event-risk',
      'uncertainty',
      'commodity-shocks',
      'event-volatility',
      'information-timing',
      ...RISK,
      'emotional-decision-making',
      'fomo',
    ],
    {
      psychologyConceptIds: ['emotional-decision-making', 'fomo', 'recency-bias'],
      scenarioEventKind: 'geopolitical',
    },
  ),
  regulatory: mapping(
    'regulatory',
    ['event risk', 'information quality', 'uncertainty', 'sector risk'],
    [
      'event-risk',
      'information-timing',
      'uncertainty',
      'evidence-quality',
      'event-volatility',
      'recency-bias',
    ],
    { psychologyConceptIds: ['recency-bias', 'confirmation-bias'], scenarioEventKind: 'regulatory' },
  ),
  manufacturing: mapping(
    'manufacturing',
    ['survey data', 'event risk', 'growth narrative', 'uncertainty'],
    ['economic-releases', 'event-risk', 'uncertainty', 'scenario-thinking', 'recency-bias'],
    { psychologyConceptIds: ['recency-bias'], scenarioEventKind: 'gdp' },
  ),
  consumer: mapping(
    'consumer',
    ['consumer demand', 'event risk', 'one print vs a series'],
    ['economic-releases', 'event-risk', 'uncertainty', 'recency-bias'],
    { psychologyConceptIds: ['recency-bias'], scenarioEventKind: 'sector_news' },
  ),
  housing: mapping(
    'housing',
    ['housing', 'interest rates', 'lagged data', 'event risk'],
    ['interest-rates', 'economic-releases', 'event-risk', 'uncertainty', 'recency-bias'],
    { psychologyConceptIds: ['recency-bias'], scenarioEventKind: 'rate_decision' },
  ),
  trade: mapping(
    'trade',
    ['trade policy', 'FX', 'uncertainty', 'event risk'],
    ['event-risk', 'fx', 'uncertainty', 'geopolitical', 'information-timing', 'recency-bias'],
    { psychologyConceptIds: ['recency-bias', 'emotional-decision-making'], scenarioEventKind: 'geopolitical' },
  ),
  other: mapping(
    'other',
    ['event risk', 'uncertainty', 'invalidation'],
    ['event-risk', 'uncertainty', 'invalidation', 'scenario-thinking'],
    { psychologyConceptIds: ['recency-bias'], scenarioEventKind: 'volatility_expansion' },
  ),
};

export const LEARNING_CALENDAR_KINDS: readonly MarketEventKind[] = [
  'interest_rate',
  'inflation',
  'employment',
  'gdp',
  'earnings',
];
