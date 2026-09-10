import { PRACTICE_DRILLS, type PracticeDrill } from '@/features/practice/content/practice-drills';
import type { TargetComplexity } from '../types/learning-engine.types';
import type { ConceptEvidenceSlice } from './learning-evidence.service';
import { getConcept } from './learning-graph.service';

/**
 * Raise conceptual complexity after consistent success.
 * Lower it after struggle. Do not pad copy.
 */
export function targetComplexityFor(slice: ConceptEvidenceSlice | undefined): TargetComplexity {
  if (!slice) return 'foundations';
  const n = slice.drillRecentTotal || slice.drillAttempts;
  const hits = slice.drillRecentTotal ? slice.drillCorrectRecent : Math.max(0, slice.drillAttempts - slice.drillMisses);
  if (n < 2) return 'foundations';
  const accuracy = hits / n;
  if (accuracy >= 0.8 && n >= 3) return 'complex';
  if (accuracy < 0.5) return 'foundations';
  return 'applied';
}

export function pickDrillForConcept(conceptId: string, complexity: TargetComplexity): PracticeDrill | undefined {
  const node = getConcept(conceptId);
  const ids = node?.drillIds ?? [];
  const drills = ids
    .map((id) => PRACTICE_DRILLS.find((drill) => drill.id === id))
    .filter((drill): drill is PracticeDrill => Boolean(drill));
  if (drills.length === 0) return undefined;
  if (complexity === 'foundations') {
    return drills.find((drill) => drill.difficulty === 'beginner') ?? drills[0];
  }
  if (complexity === 'complex') {
    return drills.find((drill) => drill.difficulty === 'intermediate') ?? drills[drills.length - 1];
  }
  return drills[Math.min(1, drills.length - 1)] ?? drills[0];
}

export function pickReplayForConcept(conceptId: string, complexity: TargetComplexity): string | undefined {
  const node = getConcept(conceptId);
  if (!node?.replayIds.length) return undefined;
  if (complexity === 'foundations') return node.replayIds[0];
  return node.replayIds[node.replayIds.length - 1];
}
