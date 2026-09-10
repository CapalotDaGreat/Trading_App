import type { CompetencyEvidenceRecord, EvidenceQuality } from '../types/competency.types';
import { isExposureOnlySource } from './evidence.service';

const DAY = 24 * 60 * 60 * 1000;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function outcome(record: CompetencyEvidenceRecord): number | null {
  if (record.result === 'pass') return 1;
  if (record.result === 'partial') return 0.55;
  if (record.result === 'fail') return 0;
  return null;
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return clamp((values.reduce((sum, value) => sum + value, 0) / values.length) * 100);
}

const KNOWLEDGE_SOURCES = new Set(['knowledge_check', 'practice_drill', 'calculation_exercise']);
const APPLICATION_SOURCES = new Set([
  'replay_decision',
  'simulation_decision',
  're_demonstration',
  'calculation_exercise',
]);

/**
 * Internal evidence-quality dimensions. Not a user-facing mastery percentage.
 */
export function scoreEvidenceQuality(
  records: readonly CompetencyEvidenceRecord[],
  now: number,
): EvidenceQuality {
  const graded = records.filter((item) => !isExposureOnlySource(item.sourceType) && outcome(item) != null);

  const knowledge = mean(
    graded
      .filter((item) => KNOWLEDGE_SOURCES.has(item.sourceType))
      .map((item) => (item.independent && !item.hintsUsed ? outcome(item)! : outcome(item)! * 0.65)),
  );

  const application = mean(
    graded
      .filter((item) => APPLICATION_SOURCES.has(item.sourceType))
      .map((item) => {
        const value = outcome(item)!;
        return item.independent && !item.hintsUsed ? value : value * 0.65;
      }),
  );

  const independenceValues = graded.map((item) => (item.independent && !item.hintsUsed ? 1 : 0.35));
  const independence = independenceValues.length ? clamp(mean(independenceValues.map((value) => value)) ?? 0) : null;

  const recent = graded.slice(-4);
  const consistency =
    recent.length >= 2 ? clamp((1 - recent.filter((item) => item.result === 'fail').length / recent.length) * 100) : null;

  const difficultyWeights = { foundations: 0.7, applied: 0.85, complex: 1 };
  const difficulty =
    graded.length === 0
      ? null
      : clamp(
          (graded.reduce((sum, item) => sum + difficultyWeights[item.difficulty], 0) / graded.length) * 100,
        );

  const last = graded.at(-1)?.occurredAt ?? records.at(-1)?.occurredAt;
  const recency =
    last == null ? null : clamp(Math.exp((-Math.LN2 * Math.max(0, now - last) / DAY) / 28) * 100);

  const contexts = new Set(
    graded
      .filter((item) => item.independent && !item.hintsUsed && item.result === 'pass')
      .map((item) => item.scenarioContext)
      .filter((context): context is NonNullable<typeof context> => Boolean(context) && context !== 'standard'),
  );
  const variety = contexts.size === 0 ? null : clamp((contexts.size / 4) * 100);

  return {
    knowledge,
    application,
    independence,
    consistency,
    difficulty,
    recency,
    variety,
  };
}
