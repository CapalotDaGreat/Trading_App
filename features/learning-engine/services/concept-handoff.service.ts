import type { TrainingHandoff, TrainingLoopStep, TrainingPriority } from '../types/learning-engine.types';

const LOOP_STEPS: TrainingLoopStep[] = [
  'learn',
  'demonstrate',
  'practice',
  'apply',
  'review',
  'remediate',
  'redemonstrate',
];

const PRIORITIES: TrainingPriority[] = [
  'remediation',
  'redemonstration',
  'in_progress',
  'weak_competency',
  'curriculum',
  'varied_practice',
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
  },
): string {
  if (!input.conceptId) return href;
  const [path, query] = href.split('?');
  const params = new URLSearchParams(query ?? '');
  params.set('concept', input.conceptId);
  if (input.loop) params.set('loop', input.loop);
  if (input.conceal) params.set('conceal', '1');
  if (input.priority) params.set('priority', input.priority);
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
  };
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
