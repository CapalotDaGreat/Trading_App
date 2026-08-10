import type {
  DnaChangeInsight,
  DnaEvidenceSource,
  DnaMentorSummary,
  ProcessGoalId,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';

const PROCESS_GOAL_LABELS: Record<ProcessGoalId, string> = {
  improve_patience: 'Improve patience',
  improve_risk_awareness: 'Improve risk awareness',
  reduce_fomo: 'Reduce FOMO',
  improve_thesis_clarity: 'Improve thesis clarity',
  research_efficiency: 'Research more efficiently',
  build_consistency: 'Build consistency',
  improve_invalidation: 'Improve invalidation discipline',
  improve_reflection: 'Improve reflection quality',
};

function weekKey(nowMs: number): string {
  const d = new Date(nowMs);
  const onejan = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86_400_000 + onejan.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

function hashPick(key: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return modulo === 0 ? 0 : h % modulo;
}

/**
 * Compact Mentor/AI DNA context — never includes raw journal text.
 * Observation rotates by uid + week so the same line is not repeated constantly.
 */
export function buildDnaMentorSummary(input: {
  dna: TradingDnaProfile;
  whatsChanging: DnaChangeInsight[];
  selectedGoals?: ProcessGoalId[];
  uid?: string;
  nowMs?: number;
}): DnaMentorSummary {
  const now = input.nowMs ?? Date.now();
  const uid = input.uid ?? 'demo-guest';
  const key = `${uid}:${weekKey(now)}`;

  const evidenceCounts: Partial<Record<DnaEvidenceSource, number>> = {};
  for (const trait of input.dna.traits) {
    for (const item of trait.evidence) {
      evidenceCounts[item.source] = (evidenceCounts[item.source] ?? 0) + item.count;
    }
  }

  const candidates: string[] = [];
  const patience = input.dna.traits.find((t) => t.id === 'patience');
  if (patience?.trend === 'up' && patience.status === 'scored') {
    candidates.push(
      `You've told yourself patience is hard. Recent process evidence suggests you're actually improving here.`,
    );
  }
  const evidence = input.dna.traits.find((t) => t.id === 'evidenceDiscipline');
  const invalidation = input.dna.traits.find((t) => t.id === 'invalidationDiscipline');
  if (
    evidence?.status === 'scored' &&
    (evidence.score ?? 0) >= 65 &&
    invalidation?.status === 'scored' &&
    (invalidation.score ?? 100) < 55
  ) {
    candidates.push(
      `Recent loops show strong evidence gathering, but invalidation reasoning is still inconsistent.`,
    );
  }
  for (const change of input.whatsChanging.slice(0, 2)) {
    if (change.id !== 'gathering') candidates.push(change.title);
  }
  if (input.dna.growthEdges[0]) {
    candidates.push(`Growth edge this week: ${input.dna.growthEdges[0]} — one deliberate practice session helps.`);
  }
  if (!candidates.length) {
    candidates.push('Keep logging research, skips, and journals so Trading DNA can coach from evidence.');
  }

  const observationLine = candidates[hashPick(key, candidates.length)] ?? candidates[0];

  return {
    becomingLabel: input.dna.becomingLabel,
    strengths: input.dna.strengths,
    growthEdges: input.dna.growthEdges,
    selectedGoals: (input.selectedGoals ?? []).map((g) => PROCESS_GOAL_LABELS[g]),
    whatsChanging: input.whatsChanging.filter((c) => c.id !== 'gathering').map((c) => c.title).slice(0, 3),
    evidenceCounts,
    observationKey: key,
    observationLine,
  };
}

export { PROCESS_GOAL_LABELS };
