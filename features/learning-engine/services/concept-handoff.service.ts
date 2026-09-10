import type { PracticeTransferStep, TrainingHandoff, TrainingLoopStep, TrainingPriority } from '../types/learning-engine.types';

const LOOP_STEPS: TrainingLoopStep[] = [
  'learn',
  'demonstrate',
  'practice',
  'apply',
  'review',
  'remediate',
  'redemonstrate',
];

const TRANSFER_STEPS: PracticeTransferStep[] = [
  'same_format',
  'new_example',
  'new_condition',
  'new_asset',
  'mixed_concept',
  'concealed_scenario',
];

const PRIORITIES: TrainingPriority[] = [
  'remediation',
  'redemonstration',
  'in_progress',
  'weak_competency',
  'transfer_practice',
  'event_driven',
  'curriculum',
  'varied_practice',
  'optional_exploration',
];

/** Stable key for anti-repetition — ignores concept/loop query noise. */
export function activityKey(href: string): string {
  const [path, query] = href.split('?');
  if (!query) return path;
  const params = new URLSearchParams(query);
  const keep = new URLSearchParams();
  for (const name of ['drill', 'episode', 'prep', 'focus', 'start'] as const) {
    const value = params.get(name);
    if (value) keep.set(name, value);
  }
  const qs = keep.toString();
  return qs ? `${path}?${qs}` : path;
}

export function withConceptHandoff(
  href: string,
  input: {
    conceptId?: string;
    loop?: TrainingLoopStep;
    conceal?: boolean;
    priority?: TrainingPriority;
    transferStep?: string;
    showHints?: boolean;
    showExamples?: boolean;
  },
): string {
  if (!input.conceptId) return href;
  const [path, query] = href.split('?');
  const params = new URLSearchParams(query ?? '');
  params.set('concept', input.conceptId);
  if (input.loop) params.set('loop', input.loop);
  if (input.conceal) params.set('conceal', '1');
  if (input.priority) params.set('priority', input.priority);
  if (input.transferStep) params.set('transfer', input.transferStep);
  if (input.showHints === false) params.set('hints', '0');
  if (input.showExamples === false) params.set('examples', '0');
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function parseTrainingHandoff(
  params: Record<string, string | string[] | undefined>,
): TrainingHandoff | null {
  const conceptId = firstParam(params.concept);
  if (!conceptId) return null;
  const loopRaw = firstParam(params.loop);
  const priorityRaw = firstParam(params.priority);
  const transferRaw = firstParam(params.transfer);
  return {
    conceptId,
    loopStep: LOOP_STEPS.includes(loopRaw as TrainingLoopStep)
      ? (loopRaw as TrainingLoopStep)
      : 'practice',
    concealConcept: firstParam(params.conceal) === '1',
    priority: PRIORITIES.includes(priorityRaw as TrainingPriority)
      ? (priorityRaw as TrainingPriority)
      : 'curriculum',
    whyToday: '',
    transferStep: TRANSFER_STEPS.includes(transferRaw as PracticeTransferStep)
      ? (transferRaw as PracticeTransferStep)
      : undefined,
    showHints: firstParam(params.hints) !== '0',
    showExamples: firstParam(params.examples) !== '0',
  };
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
