import { replayTvEpisodeHref } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import type { CompetencyScenarioContext, RemediationPlan, RemediationStep } from '../types/competency.types';

function steps(items: RemediationStep[]): RemediationStep[] {
  return items;
}

const POSITION_SIZING: RemediationPlan = {
  conceptId: 'position-sizing',
  diagnosis:
    'Recent decisions show a recurring pattern of taking more risk than the written limit. Position sizing needs practice.',
  verifyInNewContext: true,
  steps: steps([
    {
      kind: 'lesson',
      title: 'Short sizing lesson',
      reason: 'Revisit how size is chosen from risk, not from conviction.',
      href: '/academy/lesson/risk-position-sizing',
      sourceId: 'risk-position-sizing',
    },
    {
      kind: 'calculation',
      title: 'Sizing calculation',
      reason: 'Work a constrained risk-per-trade example independently.',
      href: '/practice?drill=position-size',
      sourceId: 'position-size',
      requiresRetry: true,
    },
    {
      kind: 'simulation',
      title: 'Constrained practice scenario',
      reason: 'Apply the same limit in a paper book with a written size.',
      href: '/simulate?start=1&focus=position_sizing',
    },
    {
      kind: 'redemonstration',
      title: 'Independent re-test',
      reason: 'Later, size a decision in a mixed scenario without being told which skill is under review.',
      href: '/simulate?start=1',
      concealConcept: true,
    },
  ]),
};

const INVALIDATION: RemediationPlan = {
  conceptId: 'invalidation',
  diagnosis:
    'Recent decisions show a recurring pattern of changing invalidation after entry. Name the line before size, then keep it.',
  verifyInNewContext: true,
  steps: steps([
    {
      kind: 'lesson',
      title: 'Invalidation lesson',
      reason: 'Revisit what would prove the idea wrong before the fill.',
      href: '/academy/lesson/dec-invalidation',
      sourceId: 'dec-invalidation',
    },
    {
      kind: 'practice',
      title: 'Before / after scenario',
      reason: 'Compare the written invalidation with what actually happened.',
      href: '/practice?drill=rr-compare',
      sourceId: 'rr-compare',
      requiresRetry: true,
    },
    {
      kind: 'replay',
      title: 'Historical replay',
      reason: 'Hold invalidation on a tape where the first idea fails.',
      href: replayTvEpisodeHref('failed-setup-patience'),
      sourceId: 'failed-setup-patience',
    },
    {
      kind: 'redemonstration',
      title: 'Independent simulation',
      reason: 'Write invalidation before size in a new paper scenario.',
      href: '/simulate?start=1',
      concealConcept: true,
    },
  ]),
};

const FOMO: RemediationPlan = {
  conceptId: 'fomo',
  diagnosis:
    'Your recent decisions show a recurring pattern of entering after rapid price movement. That is a process pattern, not a diagnosis of a medical condition.',
  verifyInNewContext: true,
  steps: steps([
    {
      kind: 'lesson',
      title: 'Psychology lesson',
      reason: 'Name the urge to enter because others already did.',
      href: '/academy/lesson/psych-fomo',
      sourceId: 'psych-fomo',
    },
    {
      kind: 'practice',
      title: 'Recognition exercise',
      reason: 'Practice spotting a chase versus a written reason to wait.',
      href: '/practice?drill=fomo-chase',
      sourceId: 'fomo-chase',
      requiresRetry: true,
    },
    {
      kind: 'replay',
      title: 'Act-or-wait scenario',
      reason: 'A historical tape where standing down was the process choice.',
      href: replayTvEpisodeHref('gamestop-squeeze'),
      sourceId: 'gamestop-squeeze',
    },
    {
      kind: 'redemonstration',
      title: 'Independent wait-or-act simulation',
      reason: 'Decide from the written plan, not from the last print.',
      href: '/simulate?start=1',
      concealConcept: true,
    },
  ]),
};

const GENERIC: RemediationPlan = {
  conceptId: '',
  diagnosis: 'Recent performance shows a recurring process miss on this concept. It needs more practice.',
  verifyInNewContext: true,
  steps: steps([
    {
      kind: 'lesson',
      title: 'Review the related lesson',
      reason: 'Exposure again, then demonstrate — reading is not mastery.',
      href: '/academy',
    },
    {
      kind: 'practice',
      title: 'Short practice drill',
      reason: 'A constrained check before applying the idea again.',
      href: '/practice',
      requiresRetry: true,
    },
    {
      kind: 'redemonstration',
      title: 'Independent re-test',
      reason: 'Show the process in another context.',
      href: '/simulate?start=1',
      concealConcept: true,
    },
  ]),
};

const BY_ID: Record<string, RemediationPlan> = {
  'position-sizing': POSITION_SIZING,
  'risk-per-trade': {
    ...POSITION_SIZING,
    conceptId: 'risk-per-trade',
    diagnosis:
      'Recent decisions show a recurring pattern of skipping a named risk amount before the fill.',
  },
  invalidation: INVALIDATION,
  'stop-logic': { ...INVALIDATION, conceptId: 'stop-logic' },
  fomo: FOMO,
  'emotional-decision-making': { ...FOMO, conceptId: 'emotional-decision-making' },
  'revenge-trading': {
    ...FOMO,
    conceptId: 'revenge-trading',
    diagnosis:
      'Recent decisions show a recurring pattern of acting to “get it back” after a loss. That is a process pattern, not a medical label.',
    steps: FOMO.steps.map((step) => {
      if (step.sourceId === 'psych-fomo') {
        return { ...step, href: '/academy/lesson/psych-revenge', sourceId: 'psych-revenge', title: 'Revenge-trading lesson' };
      }
      if (step.sourceId === 'fomo-chase') {
        return {
          ...step,
          href: '/practice?drill=revenge-interrupt',
          sourceId: 'revenge-interrupt',
          title: 'Revenge interrupt',
        };
      }
      return step;
    }),
  },
  'loss-aversion': {
    conceptId: 'loss-aversion',
    diagnosis:
      'Recent decisions show a recurring pattern of moving the exit after a loss starts. That is a process pattern, not a diagnosis.',
    verifyInNewContext: true,
    steps: steps([
      {
        kind: 'lesson',
        title: 'Loss-aversion lesson',
        reason: 'Revisit why a written scratch is process, not failure.',
        href: '/academy/lesson/psych-loss-aversion',
        sourceId: 'psych-loss-aversion',
      },
      {
        kind: 'practice',
        title: 'Exit-discipline drill',
        reason: 'Spot the leak of widening a stop to avoid booking the loss.',
        href: '/practice?drill=loss-aversion',
        sourceId: 'loss-aversion',
        requiresRetry: true,
      },
      {
        kind: 'replay',
        title: 'Hold-or-scratch tape',
        reason: 'A historical room where standing down after invalidation is the process choice.',
        href: replayTvEpisodeHref('failed-setup-patience'),
        sourceId: 'failed-setup-patience',
      },
      {
        kind: 'redemonstration',
        title: 'Independent exit simulation',
        reason: 'Write the exit before size in a new paper scenario.',
        href: '/simulate?start=1',
        concealConcept: true,
      },
    ]),
  },
};

export function remediationPlanFor(conceptId: string): RemediationPlan {
  const named = BY_ID[conceptId];
  if (named) return named;
  return {
    ...GENERIC,
    conceptId,
    diagnosis: `Recent performance shows a recurring process miss on this concept. It needs more practice.`,
  };
}

/** Alternate activities so remediation does not repeat the exact same question. */
export const ALTERNATE_ACTIVITIES: Record<string, RemediationStep[]> = {
  'position-size': [
    {
      kind: 'calculation',
      title: 'Risk/reward comparison',
      reason: 'A different sizing question — not the same drill you just missed.',
      href: '/practice?drill=rr-compare',
      sourceId: 'rr-compare',
      requiresRetry: true,
    },
  ],
  'rr-compare': [
    {
      kind: 'calculation',
      title: 'Position size calculation',
      reason: 'A different numbers problem so this is not the same question.',
      href: '/practice?drill=position-size',
      sourceId: 'position-size',
      requiresRetry: true,
    },
  ],
  'confirmation-bias': [
    {
      kind: 'practice',
      title: 'Missing-evidence drill',
      reason: 'A different example of waiting for independent evidence.',
      href: '/practice?drill=missing-evidence',
      sourceId: 'missing-evidence',
      requiresRetry: true,
    },
  ],
  'missing-evidence': [
    {
      kind: 'practice',
      title: 'Confirmation-bias drill',
      reason: 'A different example rather than the same prompt again.',
      href: '/practice?drill=confirmation-bias',
      sourceId: 'confirmation-bias',
      requiresRetry: true,
    },
  ],
  'loss-aversion': [
    {
      kind: 'practice',
      title: 'Invalidation naming drill',
      reason: 'A different exercise — write the exit before size, not the same prompt.',
      href: '/practice?drill=name-invalidation',
      sourceId: 'name-invalidation',
      requiresRetry: true,
    },
  ],
  'fomo-chase': [
    {
      kind: 'practice',
      title: 'Premature-entry drill',
      reason: 'A different pressure scenario — thesis first, not the same chase prompt.',
      href: '/practice?drill=premature-entry',
      sourceId: 'premature-entry',
      requiresRetry: true,
    },
  ],
};

export const MIXED_CONTEXTS: CompetencyScenarioContext[] = [
  'trend',
  'high_volatility',
  'low_volatility',
  'earnings',
  'losing_position',
  'concentrated_portfolio',
  'regime_change',
  'range',
  'event_window',
  'ambiguous_setup',
];

/** Position sizing (and similar risk skills) must transfer across these conditions. */
export const POSITION_SIZING_TRANSFER_CONTEXTS: CompetencyScenarioContext[] = [
  'low_volatility',
  'high_volatility',
  'event_window',
  'losing_position',
  'concentrated_portfolio',
  'ambiguous_setup',
];

export const TRANSFER_CONTEXTS: Partial<Record<string, CompetencyScenarioContext[]>> = {
  'position-sizing': POSITION_SIZING_TRANSFER_CONTEXTS,
  'volatility-aware-risk': POSITION_SIZING_TRANSFER_CONTEXTS,
  'risk-per-trade': POSITION_SIZING_TRANSFER_CONTEXTS,
  invalidation: ['trend', 'range', 'ambiguous_setup', 'event_window', 'high_volatility'],
  thesis: ['trend', 'ambiguous_setup', 'regime_change', 'event_window'],
};

export const CONTEXT_HREFS: Record<CompetencyScenarioContext, string> = {
  trend: '/simulate?start=1&focus=thesis_discipline',
  high_volatility: '/simulate?start=1&focus=position_sizing',
  low_volatility: '/simulate?start=1&focus=uncertainty',
  earnings: '/simulate?start=1&prep=earnings',
  losing_position: '/simulate?start=1',
  concentrated_portfolio: '/simulate?start=1&focus=correlation',
  regime_change: '/simulate?start=1&focus=event_adaptation',
  range: '/practice?drill=identify-trend',
  event_window: '/simulate?start=1&prep=macro',
  ambiguous_setup: '/simulate?start=1&focus=uncertainty',
  standard: '/simulate?start=1',
};
