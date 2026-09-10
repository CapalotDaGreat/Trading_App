import type { MistakePatternDefinition } from '../types/mistake-library.types';

/**
 * Neutral educational catalog. Titles describe process observations, not identities.
 * Detection rules live in the detector — this file is copy + training links only.
 */
export const MISTAKE_PATTERN_CATALOG: readonly MistakePatternDefinition[] = [
  {
    id: 'fomo_chase',
    title: 'Entry after a missed move',
    trainingFocus: 'waiting for a defined thesis and invalidation',
    oneOffSummary:
      'A recent decision was recorded shortly after a move that was already underway. Training focus: waiting for a defined thesis and invalidation.',
    recurringSummary:
      'You have recently made several decisions shortly after missing a move. Training focus: waiting for a defined thesis and invalidation.',
    affectedConcepts: ['fomo', 'emotional-decision-making', 'thesis', 'invalidation'],
    practiceDrillIds: ['confirmation-bias'],
    simulationFocus: 'fomo_chase',
    replayConceptIds: ['fomo', 'emotional-decision-making'],
    replayCollections: ['psychology', 'patience', 'manias'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=confirmation-bias',
        label: 'Practice: wait vs chase',
        reason: 'Spot a chase versus a written reason to wait.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=fomo_chase',
        label: 'Simulation: written plan first',
        reason: 'Size only after thesis and invalidation are named.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=gamestop-squeeze',
        label: 'Replay: act or wait',
        reason: 'A historical tape where standing down was a valid process choice.',
      },
      {
        loop: 'planner',
        href: '/academy/lesson/psych-fomo',
        label: 'Lesson: naming the chase',
        reason: 'Revisit how a missed move shows up in the decision sequence.',
      },
    ],
  },
  {
    id: 'premature_entry',
    title: 'Entry before a written plan',
    trainingFocus: 'naming thesis and invalidation before size',
    oneOffSummary:
      'A recent simulated or replay decision was recorded without both a thesis and an invalidation. Training focus: naming thesis and invalidation before size.',
    recurringSummary:
      'Several recent decisions were recorded before both a thesis and an invalidation were named. Training focus: naming thesis and invalidation before size.',
    affectedConcepts: ['thesis', 'invalidation', 'decision-process'],
    practiceDrillIds: ['rr-compare'],
    simulationFocus: 'thesis_discipline',
    replayConceptIds: ['thesis', 'invalidation'],
    replayCollections: ['patience', 'false_breakouts'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=rr-compare',
        label: 'Practice: plan before size',
        reason: 'Write the levels, then choose size.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=thesis_discipline',
        label: 'Simulation: thesis first',
        reason: 'A paper book that asks for the written idea before the fill.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: wait for the setup',
        reason: 'Hold the plan on a tape where the first print is incomplete.',
      },
      {
        loop: 'planner',
        href: '/academy/lesson/dec-invalidation',
        label: 'Lesson: invalidation before entry',
        reason: 'Revisit what would prove the idea wrong before size.',
      },
    ],
  },
  {
    id: 'confirmation_seeking',
    title: 'Seeking only confirming information',
    trainingFocus: 'listing conflicting evidence before size',
    oneOffSummary:
      'A recent decision recorded supporting information and skipped contrary facts. Training focus: listing conflicting evidence before size.',
    recurringSummary:
      'Recent decisions recorded supporting information and skipped contrary facts. Training focus: listing conflicting evidence before size.',
    affectedConcepts: ['confirmation-bias', 'evidence-quality', 'thesis'],
    practiceDrillIds: ['confirmation-bias'],
    simulationFocus: 'overconfidence',
    replayConceptIds: ['confirmation-bias', 'evidence-quality'],
    replayCollections: ['psychology', 'uncertainty'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=confirmation-bias',
        label: 'Practice: contrary facts',
        reason: 'Name the process miss of protecting a story.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=overconfidence',
        label: 'Simulation: mixed evidence',
        reason: 'A scenario where contrary facts are visible on the tape.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: incomplete story',
        reason: 'Practice recording what would weaken the idea.',
      },
      {
        loop: 'review',
        href: '/review',
        label: 'Review: contrary list',
        reason: 'Look back at what was skipped, not only what confirmed the idea.',
      },
    ],
  },
  {
    id: 'conviction_without_process',
    title: 'High conviction without matching process',
    trainingFocus: 'matching size and invalidation to the written plan',
    oneOffSummary:
      'A recent decision combined a high-conviction or oversized simulated size with missing process checks. Training focus: matching size and invalidation to the written plan.',
    recurringSummary:
      'Several recent decisions combined high conviction or oversized simulated size with missing process checks. Training focus: matching size and invalidation to the written plan.',
    affectedConcepts: ['overconfidence', 'position-sizing', 'invalidation', 'risk-per-trade'],
    practiceDrillIds: ['position-size'],
    simulationFocus: 'overconfidence',
    replayConceptIds: ['overconfidence', 'position-sizing'],
    replayCollections: ['psychology', 'risk_management'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=position-size',
        label: 'Practice: size from risk',
        reason: 'Choose size from the written limit, not from conviction.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=overconfidence',
        label: 'Simulation: constrained size',
        reason: 'Apply the same risk limit when the tape looks obvious.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: obvious-looking tape',
        reason: 'Keep the written invalidation when the first idea feels certain.',
      },
      {
        loop: 'planner',
        href: '/academy/lesson/risk-position-sizing',
        label: 'Lesson: size from risk',
        reason: 'Revisit how size is chosen from risk, not from conviction.',
      },
    ],
  },
  {
    id: 'insufficient_invalidation',
    title: 'Invalidation not defined or later moved',
    trainingFocus: 'naming the invalidation line before size, then keeping it',
    oneOffSummary:
      'A recent decision was missing an invalidation or changed it after entry. Training focus: naming the invalidation line before size, then keeping it.',
    recurringSummary:
      'Recent decisions were missing an invalidation or changed it after entry. Training focus: naming the invalidation line before size, then keeping it.',
    affectedConcepts: ['invalidation', 'stop-logic'],
    practiceDrillIds: ['rr-compare'],
    simulationFocus: 'invalidation_discipline',
    replayConceptIds: ['invalidation', 'stop-logic'],
    replayCollections: ['risk_management', 'false_breakouts'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=rr-compare',
        label: 'Practice: written invalidation',
        reason: 'Compare the written line with what actually happened.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=invalidation_discipline',
        label: 'Simulation: keep the line',
        reason: 'Write invalidation before size in a paper book.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: first idea fails',
        reason: 'Hold invalidation on a tape where the first idea does not work.',
      },
      {
        loop: 'planner',
        href: '/academy/lesson/dec-invalidation',
        label: 'Lesson: what would prove it wrong',
        reason: 'Revisit invalidation before the fill.',
      },
    ],
  },
  {
    id: 'oversized_position',
    title: 'Simulated size above the written limit',
    trainingFocus: 'choosing simulated size from the risk limit',
    oneOffSummary:
      'A recent simulated position was larger than the written risk limit. Training focus: choosing simulated size from the risk limit.',
    recurringSummary:
      'Several recent simulated positions were larger than the written risk limit. Training focus: choosing simulated size from the risk limit.',
    affectedConcepts: ['position-sizing', 'risk-per-trade', 'volatility-aware-risk'],
    practiceDrillIds: ['position-size'],
    simulationFocus: 'position_sizing',
    replayConceptIds: ['position-sizing', 'risk-per-trade'],
    replayCollections: ['risk_management'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=position-size',
        label: 'Practice: risk-per-decision size',
        reason: 'Work a constrained risk-per-trade example.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=position_sizing',
        label: 'Simulation: constrained book',
        reason: 'Apply the same limit in a paper book with a written size.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: size under stress',
        reason: 'Keep the written size when the tape speeds up.',
      },
      {
        loop: 'planner',
        href: '/academy/lesson/risk-position-sizing',
        label: 'Lesson: sizing from risk',
        reason: 'Revisit how size is chosen from risk, not from conviction.',
      },
    ],
  },
  {
    id: 'unclear_thesis',
    title: 'Thesis missing or vague',
    trainingFocus: 'writing a specific thesis before size',
    oneOffSummary:
      'A recent decision had no thesis, or only a vague one. Training focus: writing a specific thesis before size.',
    recurringSummary:
      'Recent decisions had no thesis, or only a vague one. Training focus: writing a specific thesis before size.',
    affectedConcepts: ['thesis', 'uncertainty'],
    practiceDrillIds: ['identify-trend'],
    simulationFocus: 'thesis_discipline',
    replayConceptIds: ['thesis', 'uncertainty'],
    replayCollections: ['uncertainty', 'patience'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=identify-trend',
        label: 'Practice: name the structure',
        reason: 'State the idea in a sentence before the fill.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=thesis_discipline',
        label: 'Simulation: written thesis',
        reason: 'A paper book that asks for the idea in writing.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: thesis at the freeze',
        reason: 'Write what you believe, with the information available then.',
      },
      {
        loop: 'review',
        href: '/journal',
        label: 'Journal: one-sentence thesis',
        reason: 'Record the idea in structured fields, not as a later story.',
      },
    ],
  },
  {
    id: 'skipped_conflicting_evidence',
    title: 'Conflicting information not recorded',
    trainingFocus: 'logging contrary facts before size',
    oneOffSummary:
      'A recent decision did not record conflicting information. Training focus: logging contrary facts before size.',
    recurringSummary:
      'Recent decisions did not record conflicting information. Training focus: logging contrary facts before size.',
    affectedConcepts: ['evidence-quality', 'confirmation-bias', 'thesis'],
    practiceDrillIds: ['confirmation-bias'],
    simulationFocus: 'thesis_discipline',
    replayConceptIds: ['evidence-quality', 'confirmation-bias'],
    replayCollections: ['uncertainty', 'psychology'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=confirmation-bias',
        label: 'Practice: contrary facts',
        reason: 'Name what would weaken the idea.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=thesis_discipline',
        label: 'Simulation: mixed tape',
        reason: 'Record supporting and conflicting facts in the same decision.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: incomplete evidence',
        reason: 'Practice writing what is missing, not only what fits.',
      },
      {
        loop: 'review',
        href: '/review',
        label: 'Review: evidence checklist',
        reason: 'Look back at which facts were skipped.',
      },
    ],
  },
  {
    id: 'event_risk_neglect',
    title: 'Event window without event awareness',
    trainingFocus: 'checking the calendar before size in an event window',
    oneOffSummary:
      'A recent decision in an event window did not record event awareness. Training focus: checking the calendar before size in an event window.',
    recurringSummary:
      'Recent decisions in event windows did not record event awareness. Training focus: checking the calendar before size in an event window.',
    affectedConcepts: ['event-risk', 'information-timing', 'event-volatility', 'earnings'],
    practiceDrillIds: ['confirmation-bias'],
    simulationFocus: 'event_adaptation',
    replayConceptIds: ['event-risk', 'earnings', 'information-timing'],
    replayCollections: ['earnings', 'policy', 'employment'],
    recommendedTraining: [
      {
        loop: 'planner',
        href: '/academy/lesson/fund-calendar',
        label: 'Lesson: why an event is a classroom',
        reason: 'Revisit what an event window changes about the decision.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=event_adaptation',
        label: 'Simulation: event window',
        reason: 'Practice process when a scheduled event is on the tape.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: event tape',
        reason: 'Decide with only the information available at that freeze.',
      },
      {
        loop: 'review',
        href: '/events',
        label: 'Events: upcoming classroom',
        reason: 'Study why the next event matters as practice, not as a prediction.',
      },
    ],
  },
  {
    id: 'post_miss_cluster',
    title: 'Activity clustered after a process miss',
    trainingFocus: 'pausing before the next simulated size',
    oneOffSummary:
      'A follow-up decision was recorded shortly after a process miss. Training focus: pausing before the next simulated size.',
    recurringSummary:
      'Several decisions clustered shortly after a process miss. Training focus: pausing before the next simulated size.',
    affectedConcepts: ['revenge-trading', 'emotional-decision-making', 'fomo'],
    practiceDrillIds: ['confirmation-bias'],
    simulationFocus: 'fomo_chase',
    replayConceptIds: ['revenge-trading', 'emotional-decision-making'],
    replayCollections: ['psychology', 'patience'],
    recommendedTraining: [
      {
        loop: 'planner',
        href: '/academy/lesson/psych-revenge',
        label: 'Lesson: after a miss',
        reason: 'Name the urge to act immediately after a process miss.',
      },
      {
        loop: 'practice',
        href: '/practice?drill=confirmation-bias',
        label: 'Practice: pause vs chase',
        reason: 'Separate the next plan from the last miss.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=fomo_chase',
        label: 'Simulation: one decision at a time',
        reason: 'Write a new thesis after a miss instead of repeating size.',
      },
      {
        loop: 'review',
        href: '/journal',
        label: 'Journal: after-action note',
        reason: 'Record the miss in structured fields before the next fill.',
      },
    ],
  },
  {
    id: 'high_decision_frequency',
    title: 'Unusually high decision frequency',
    trainingFocus: 'fewer, fully specified decisions',
    oneOffSummary:
      'A recent session recorded many simulated or replay decisions in a short window. Training focus: fewer, fully specified decisions.',
    recurringSummary:
      'Recent sessions recorded many simulated or replay decisions in a short window. Training focus: fewer, fully specified decisions.',
    affectedConcepts: ['decision-process', 'emotional-decision-making'],
    practiceDrillIds: ['rr-compare'],
    simulationFocus: 'thesis_discipline',
    replayConceptIds: ['decision-process'],
    replayCollections: ['patience'],
    recommendedTraining: [
      {
        loop: 'practice',
        href: '/practice?drill=rr-compare',
        label: 'Practice: one complete plan',
        reason: 'Slow the sequence: thesis, invalidation, then size.',
      },
      {
        loop: 'simulation',
        href: '/simulate?start=1&focus=thesis_discipline',
        label: 'Simulation: quality over count',
        reason: 'One paper decision with a complete process beats a burst of fills.',
      },
      {
        loop: 'replay',
        href: '/decision/replay-tv?episode=failed-setup-patience',
        label: 'Replay: one freeze at a time',
        reason: 'Stay with a single decision point.',
      },
      {
        loop: 'review',
        href: '/review',
        label: 'Review: session count',
        reason: 'Look at how many decisions were specified versus started.',
      },
    ],
  },
  {
    id: 'review_gap',
    title: 'Decisions without a later review',
    trainingFocus: 'reviewing the process after the session',
    oneOffSummary:
      'A recent decision was not followed by a journal or review note. Training focus: reviewing the process after the session.',
    recurringSummary:
      'Several recent decisions were not followed by a journal or review note. Training focus: reviewing the process after the session.',
    affectedConcepts: ['journaling', 'post-trade-review'],
    practiceDrillIds: ['confirmation-bias'],
    replayConceptIds: ['journaling'],
    replayCollections: [],
    recommendedTraining: [
      {
        loop: 'review',
        href: '/review',
        label: 'Review: last decision',
        reason: 'Grade reasoning, risk, and plan adherence — not simulated profit.',
      },
      {
        loop: 'review',
        href: '/journal',
        label: 'Journal: structured reflection',
        reason: 'Use the thesis, invalidation, and plan-adhered fields.',
      },
      {
        loop: 'planner',
        href: '/academy/lesson/dec-invalidation',
        label: 'Lesson: after-action process',
        reason: 'Revisit what a complete review records.',
      },
      {
        loop: 'practice',
        href: '/practice?drill=confirmation-bias',
        label: 'Practice: process vs outcome',
        reason: 'Separate the grade from simulated P/L.',
      },
    ],
  },
];

export const MISTAKE_LIBRARY_DISCLAIMER =
  'These are recurring process observations from structured training evidence. They are not diagnoses, personality labels, or predictions of live-trading results.';

export function mistakePatternDefinition(id: string): MistakePatternDefinition | undefined {
  return MISTAKE_PATTERN_CATALOG.find((row) => row.id === id);
}
