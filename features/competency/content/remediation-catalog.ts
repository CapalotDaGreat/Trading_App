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
  uncertainty: {
    conceptId: 'uncertainty',
    diagnosis:
      'Recent decisions show a recurring pattern of treating incomplete information as a settled call.',
    verifyInNewContext: true,
    steps: steps([
      {
        kind: 'lesson',
        title: 'Uncertainty lesson',
        reason: 'Revisit sizing and standing aside when evidence conflicts.',
        href: '/academy/lesson/dec-uncertainty',
        sourceId: 'dec-uncertainty',
      },
      {
        kind: 'practice',
        title: 'Conflicting-evidence scenario',
        reason: 'Name the conflict before size. Not the same as a certainty quiz.',
        href: '/practice?drill=uncertainty-conflict',
        sourceId: 'uncertainty-conflict',
        requiresRetry: true,
      },
      {
        kind: 'simulation',
        title: 'Ambiguous paper scenario',
        reason: 'A book that withholds the print. Process is the grade, not the outcome.',
        href: '/simulate?start=1&focus=uncertainty',
      },
      {
        kind: 'redemonstration',
        title: 'Independent mixed tape',
        reason: 'Show the same patience in a concealed scenario.',
        href: '/simulate?start=1&focus=uncertainty',
        concealConcept: true,
      },
    ]),
  },
  thesis: {
    conceptId: 'thesis',
    diagnosis:
      'Recent decisions show a recurring pattern of size arriving before a usable written idea.',
    verifyInNewContext: true,
    steps: steps([
      {
        kind: 'lesson',
        title: 'Thesis lesson',
        reason: 'A claim you can invalidate is the decision, not a slogan.',
        href: '/academy/lesson/dec-thesis',
        sourceId: 'dec-thesis',
      },
      {
        kind: 'practice',
        title: 'Premature-entry scenario',
        reason: 'Spot size-before-plan without repeating the same quiz item.',
        href: '/practice?drill=premature-entry',
        sourceId: 'premature-entry',
        requiresRetry: true,
      },
      {
        kind: 'simulation',
        title: 'Thesis-before-size book',
        reason: 'Write the idea before the simulated fill.',
        href: '/simulate?start=1&focus=thesis_discipline',
      },
      {
        kind: 'redemonstration',
        title: 'Independent thesis check',
        reason: 'A mixed scenario that still requires a written claim.',
        href: '/simulate?start=1',
        concealConcept: true,
      },
    ]),
  },
  'confirmation-bias': {
    conceptId: 'confirmation-bias',
    diagnosis:
      'Recent decisions show a recurring pattern of overweighting agreeing notes and discarding conflict. That is a process pattern, not a diagnosis.',
    verifyInNewContext: true,
    steps: steps([
      {
        kind: 'lesson',
        title: 'Confirmation-bias lesson',
        reason: 'Look for the note that would prove the idea wrong.',
        href: '/academy/lesson/psych-confirmation',
        sourceId: 'psych-confirmation',
      },
      {
        kind: 'practice',
        title: 'Disconfirming-evidence drill',
        reason: 'A constrained recognition of seeking only agreement.',
        href: '/practice?drill=confirmation-bias',
        sourceId: 'confirmation-bias',
        requiresRetry: true,
      },
      {
        kind: 'replay',
        title: 'Two-sided tape',
        reason: 'A historical room where both stories were visible.',
        href: replayTvEpisodeHref('failed-setup-patience'),
        sourceId: 'failed-setup-patience',
      },
      {
        kind: 'redemonstration',
        title: 'Independent conflict simulation',
        reason: 'Hold or skip when evidence disagrees, without being told the skill name.',
        href: '/simulate?start=1&focus=uncertainty',
        concealConcept: true,
      },
    ]),
  },
  overconfidence: {
    conceptId: 'overconfidence',
    diagnosis:
      'Recent decisions show a recurring pattern of raising size after a path of wins without a new written plan.',
    verifyInNewContext: true,
    steps: steps([
      {
        kind: 'lesson',
        title: 'Overconfidence lesson',
        reason: 'A streak is not a new edge.',
        href: '/academy/lesson/psych-overconfidence',
        sourceId: 'psych-overconfidence',
      },
      {
        kind: 'practice',
        title: 'Streak-calibration drill',
        reason: 'Keep planned risk after paper wins.',
        href: '/practice?drill=confidence-check',
        sourceId: 'confidence-check',
        requiresRetry: true,
      },
      {
        kind: 'practice',
        title: 'Recency scenario',
        reason: 'A different prompt: the last print is not the whole file.',
        href: '/practice?drill=recency-bias',
        sourceId: 'recency-bias',
      },
      {
        kind: 'redemonstration',
        title: 'Independent size check',
        reason: 'Write risk before size after a mixed path.',
        href: '/simulate?start=1&focus=position_sizing',
        concealConcept: true,
      },
    ]),
  },
  'event-risk': {
    conceptId: 'event-risk',
    diagnosis:
      'Recent decisions show a recurring pattern of treating a scheduled event as a direction call.',
    verifyInNewContext: true,
    steps: steps([
      {
        kind: 'lesson',
        title: 'Event-calendar lesson',
        reason: 'Events are study context. They are not predictions.',
        href: '/academy/lesson/fund-calendar',
        sourceId: 'fund-calendar',
      },
      {
        kind: 'practice',
        title: 'Rate-decision uncertainty',
        reason: 'Practice standing aside when the print is still unknown.',
        href: '/practice?drill=rate-decision-uncertainty',
        sourceId: 'rate-decision-uncertainty',
        requiresRetry: true,
      },
      {
        kind: 'simulation',
        title: 'Event-window paper book',
        reason: 'A scheduled fictional print. Size for uncertainty, not for a guess.',
        href: '/simulate?start=1&prep=macro',
      },
      {
        kind: 'redemonstration',
        title: 'Independent event scenario',
        reason: 'Another event window without naming the skill.',
        href: '/simulate?start=1&prep=macro',
        concealConcept: true,
      },
    ]),
  },
  earnings: {
    conceptId: 'earnings',
    diagnosis:
      'Recent work shows earnings treated as a timing signal rather than a file about the business.',
    verifyInNewContext: true,
    steps: steps([
      {
        kind: 'lesson',
        title: 'Statements lesson',
        reason: 'Read what the numbers say about the business, not a tick forecast.',
        href: '/academy/lesson/fund-statements',
        sourceId: 'fund-statements',
      },
      {
        kind: 'practice',
        title: 'Changing-margins case',
        reason: 'A fictional company file — recognize, then apply.',
        href: '/practice?drill=changing-margins',
        sourceId: 'changing-margins',
        requiresRetry: true,
      },
      {
        kind: 'practice',
        title: 'Compare two businesses',
        reason: 'Transfer: same skill, different fictional cases.',
        href: '/practice?drill=compare-two-businesses',
        sourceId: 'compare-two-businesses',
      },
      {
        kind: 'redemonstration',
        title: 'Earnings-window simulation',
        reason: 'A paper event window. Not a recommendation on a real company.',
        href: '/simulate?start=1&prep=earnings',
        concealConcept: true,
      },
    ]),
  },
  valuation: {
    conceptId: 'valuation',
    diagnosis:
      'Recent work shows a multiple treated as a buy/sell alarm rather than a comparison under uncertainty.',
    verifyInNewContext: true,
    steps: steps([
      {
        kind: 'lesson',
        title: 'Valuation-quality lesson',
        reason: 'Price paid is one file, separate from a forecast.',
        href: '/academy/lesson/fund-valuation-quality',
        sourceId: 'fund-valuation-quality',
      },
      {
        kind: 'practice',
        title: 'Valuation-uncertainty drill',
        reason: 'A fictional BrightCanvas-style comparison — not a live recommendation.',
        href: '/practice?drill=valuation-uncertainty',
        sourceId: 'valuation-uncertainty',
        requiresRetry: true,
      },
      {
        kind: 'practice',
        title: 'Growth vs quality',
        reason: 'Transfer across a second fictional pair.',
        href: '/practice?drill=growth-vs-quality',
        sourceId: 'growth-vs-quality',
      },
      {
        kind: 'redemonstration',
        title: 'Independent comparison',
        reason: 'Apply the same questions without being told it is a valuation drill.',
        href: '/practice?drill=compare-two-businesses',
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
  'recency-bias': [
    {
      kind: 'practice',
      title: 'Overconfidence / streak drill',
      reason: 'A different example of not treating a path as a new edge.',
      href: '/practice?drill=confidence-check',
      sourceId: 'confidence-check',
      requiresRetry: true,
    },
  ],
  'uncertainty-conflict': [
    {
      kind: 'practice',
      title: 'Missing-evidence drill',
      reason: 'A different ambiguity prompt — not the same conflict item.',
      href: '/practice?drill=missing-evidence',
      sourceId: 'missing-evidence',
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
  uncertainty: ['ambiguous_setup', 'event_window', 'high_volatility', 'regime_change'],
  'confirmation-bias': ['ambiguous_setup', 'trend', 'earnings', 'event_window'],
  overconfidence: ['high_volatility', 'losing_position', 'concentrated_portfolio'],
  'event-risk': ['event_window', 'earnings', 'high_volatility', 'regime_change'],
  earnings: ['earnings', 'event_window', 'ambiguous_setup'],
  valuation: ['earnings', 'ambiguous_setup', 'regime_change'],
  'business-quality': ['earnings', 'ambiguous_setup'],
  'fundamental-uncertainty': ['earnings', 'event_window', 'ambiguous_setup'],
  'recency-bias': ['trend', 'losing_position', 'ambiguous_setup'],
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
