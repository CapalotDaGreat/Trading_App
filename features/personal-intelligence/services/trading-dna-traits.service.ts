import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { HeatmapScores } from '@/features/decision-heatmap/types/heatmap.types';
import type { JournalCoachInsight, TraderMemory, TradingDna } from '@/features/decision/types/decision.types';
import { buildTradingDna } from '@/features/decision/services/setup-enrichment.service';

import type {
  DnaStyleFingerprint,
  TradingDnaProfile,
  TradingDnaTraitId,
  TradingDnaTraitScore,
  TraitTrend,
} from '../types/personal-intelligence.types';
import {
  buildEvidenceBundle,
  collectEvidence,
  confidenceFromEvidence,
  evidenceItem,
  totalEvidenceCount,
  type DnaEvidenceBundle,
} from './dna-evidence.service';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function trendFromDelta(delta: number | null): TraitTrend {
  if (delta == null) return 'flat';
  if (delta >= 6) return 'up';
  if (delta <= -6) return 'down';
  return 'flat';
}

const TRAIT_META: Record<
  TradingDnaTraitId,
  { label: string; detail: (score: number) => string; minEvidence: number }
> = {
  evidenceDiscipline: {
    label: 'Evidence Discipline',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'You gather checklist evidence before going deeper.'
        : 'Slow down and collect structure evidence before depth.',
  },
  riskAwareness: {
    label: 'Risk Awareness',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Risk and invalidation stay present in your process.'
        : 'Define what would change your mind before researching further.',
  },
  patience: {
    label: 'Patience',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'You wait for confirmation more often than you chase.'
        : 'Impulse research still shows up — protect attention with skips.',
  },
  thesisClarity: {
    label: 'Thesis Clarity',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Decision quality reflects structured theses.'
        : 'Write a one-sentence thesis before expanding research.',
  },
  invalidationDiscipline: {
    label: 'Invalidation Discipline',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'You name and honour what would invalidate the case.'
        : 'Practise stating invalidation before the next deep research block.',
  },
  processConsistency: {
    label: 'Process Consistency',
    minEvidence: 4,
    detail: (s) =>
      s >= 65
        ? 'Process cadence is steady across weeks.'
        : 'Small daily loops beat occasional intensity spikes.',
  },
  emotionalAwareness: {
    label: 'Emotional Awareness',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'Psychology notes show cooler recovery after mistakes.'
        : 'Name the feeling before the next research session.',
  },
  fomoResistance: {
    label: 'FOMO Resistance',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'You pass on urgency that lacks evidence.'
        : 'When urgency rises, require one extra confirmation step.',
  },
  overtradingResistance: {
    label: 'Overtrading Resistance',
    minEvidence: 4,
    detail: (s) =>
      s >= 65
        ? 'Research volume stays matched to reflection.'
        : 'Cap depth: journal or skip before opening another symbol.',
  },
  adaptability: {
    label: 'Adaptability',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'You revise beliefs when evidence changes.'
        : 'When regime shifts, update the thesis instead of forcing the old one.',
  },
  researchEfficiency: {
    label: 'Research Efficiency',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Research sessions are purposeful, not noisy.'
        : 'Fewer, higher-value research blocks beat volume.',
  },
  reflectionQuality: {
    label: 'Reflection Quality',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'You close loops with journals and replay reflection.'
        : 'Reflect after research so DNA can learn from the loop.',
  },
  learningMomentum: {
    label: 'Learning Momentum',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'Academy, replay, and lab practice are compounding.'
        : 'One deliberate practice session moves identity more than more charts.',
  },
};

export interface DnaTraitsInput {
  memory: TraderMemory;
  records: DecisionRecord[];
  heatmapScores?: HeatmapScores | null;
  journalCoach?: JournalCoachInsight | null;
  processScoreWeek?: number;
  nowMs?: number;
  /** Mentor-setup struggle labels — coaching priors only, not fake scores. */
  mentorStruggles?: string[];
}

function styleFingerprint(memory: TraderMemory, dna: TradingDna): DnaStyleFingerprint {
  const style = `${memory.tradingStyle} ${dna.styleLabel}`.toLowerCase();
  const setups = [...memory.bestSetups, ...memory.weakestSetups, ...(dna.bestSetups ?? [])]
    .join(' ')
    .toLowerCase();
  const labels: string[] = [];
  if (style.includes('swing') || style.includes('position') || /pullback|swing/.test(setups)) {
    labels.push('Swing lean');
  }
  if (style.includes('scalp') || style.includes('day')) labels.push('Intraday lean');
  if (/trend|ema|structure|pullback/.test(setups) || dna.bestConditions.some((c) => /trend/i.test(c))) {
    labels.push('Trend structure');
  }
  if (/breakout|momentum|range break/.test(setups)) labels.push('Breakout interest');
  if (!labels.length) labels.push(dna.styleLabel);
  return {
    labels: labels.slice(0, 4),
    tradingStyle: memory.tradingStyle,
    riskTolerance: memory.riskTolerance,
  };
}

function scoreTrait(input: {
  id: TradingDnaTraitId;
  rawScore: number;
  evidenceUnits: number;
  evidence: ReturnType<typeof collectEvidence>;
  previousRaw: number | null;
  now: number;
  focusPrior?: boolean;
}): TradingDnaTraitScore {
  const meta = TRAIT_META[input.id];
  const conf = confidenceFromEvidence(input.evidenceUnits, {
    low: meta.minEvidence,
    medium: meta.minEvidence + 3,
    high: meta.minEvidence + 8,
  });
  // Focus prior from mentor setup slightly lowers confidence, never invents score.
  const confidenceValue = input.focusPrior ? Math.max(0.15, conf.value - 0.08) : conf.value;
  const insufficient = input.evidenceUnits < meta.minEvidence;
  const score = insufficient ? null : clamp(input.rawScore);
  const previousScore =
    input.previousRaw == null || insufficient ? null : clamp(input.previousRaw);
  const trend = insufficient
    ? 'flat'
    : trendFromDelta(score != null && previousScore != null ? score - previousScore : null);

  return {
    id: input.id,
    label: meta.label,
    score,
    previousScore,
    trend,
    detail: insufficient ? 'Not enough evidence yet.' : meta.detail(score ?? 0),
    status: insufficient ? 'insufficient' : 'scored',
    confidence: conf.level,
    confidenceValue,
    evidence: input.evidence,
    lastUpdated: input.now,
  };
}

function computeRawScores(bundle: DnaEvidenceBundle, processScoreWeek?: number) {
  const weekProcess = processScoreWeek ?? bundle.heatmap?.disciplineScore ?? bundle.journalCoach?.processScore ?? 45;
  const fomoPrior = bundle.memory.typicalMistakes.some((m) => /fomo|chase|impuls|revenge|tilt/i.test(m));
  const earlyPrior = bundle.memory.typicalMistakes.some((m) => /impuls|chase|early/i.test(m));

  const evidenceDiscipline = clamp(
    35 +
      Math.min(25, bundle.researched * 6) +
      Math.min(20, bundle.checklist * 10) +
      Math.min(15, bundle.journaled * 5) +
      (bundle.briefOpened > 0 ? 5 : 0),
  );

  const riskBase =
    bundle.memory.riskTolerance === 'conservative'
      ? 72
      : bundle.memory.riskTolerance === 'aggressive'
        ? 48
        : 60;
  const riskAwareness = clamp(
    riskBase +
      Math.min(18, bundle.invalidated * 8) +
      (bundle.journalCoach?.avgRr && bundle.journalCoach.avgRr >= 1.2 ? 10 : 0) -
      (bundle.memory.typicalMistakes.some((m) => /oversiz|stop/i.test(m)) ? 10 : 0),
  );

  const patience = clamp(
    40 +
      Math.min(25, bundle.skipped * 8) +
      Math.min(15, bundle.replay * 6) -
      Math.min(20, bundle.ignored * 7) +
      (earlyPrior ? -8 : 8),
  );

  const thesisClarity = clamp(
    (bundle.avgDqs ?? weekProcess) * 0.7 +
      Math.min(20, bundle.journaled * 5) +
      (bundle.briefOpened > 0 ? 6 : 0),
  );

  const invalidationDiscipline = clamp(
    40 +
      Math.min(35, bundle.invalidated * 12) +
      Math.min(15, bundle.replay * 5) +
      Math.min(10, bundle.checklist * 4),
  );

  const processConsistency = clamp(
    (bundle.heatmap?.consistencyScore ?? Math.min(70, bundle.researched * 4 + bundle.journaled * 5)) *
      0.55 +
      weekProcess * 0.25 +
      Math.min(20, bundle.journaled * 6),
  );

  const emotionalAwareness = clamp(
    50 +
      (bundle.journalCoach?.psychology ? 12 : 0) +
      Math.min(15, bundle.journaled * 5) -
      (fomoPrior ? 12 : 0) +
      (bundle.replay > 0 ? 8 : 0),
  );

  const fomoResistance = clamp(
    45 +
      Math.min(25, bundle.skipped * 7) -
      Math.min(25, bundle.ignored * 6) -
      (fomoPrior ? 10 : 0) +
      Math.min(15, bundle.replay * 4),
  );

  const overtradingResistance = clamp(
    55 +
      Math.min(20, bundle.journaled * 6) +
      Math.min(15, bundle.skipped * 4) -
      Math.min(25, Math.max(0, bundle.researched - 5) * 5) -
      (bundle.researched >= 5 && bundle.journaled < bundle.researched * 0.4 ? 12 : 0),
  );

  const adaptability = clamp(
    45 +
      Math.min(20, bundle.invalidated * 7) +
      Math.min(15, bundle.labClosed * 8) +
      Math.min(15, bundle.replay * 5) +
      (bundle.avgDqs != null && bundle.avgDqs >= 60 ? 8 : 0),
  );

  const researchEfficiency = clamp(
    35 +
      Math.min(25, (bundle.avgRvs ?? 50) * 0.35) +
      Math.min(20, bundle.researched * 5) -
      Math.min(20, Math.max(0, bundle.researched - 6) * 4) +
      Math.min(15, bundle.journaled * 4),
  );

  const reflectionQuality = clamp(
    40 +
      Math.min(30, bundle.journaled * 8) +
      Math.min(20, bundle.replay * 7) +
      (bundle.researched > 0 && bundle.journaled === 0 ? -15 : 0),
  );

  const learningMomentum = clamp(
    35 +
      Math.min(25, bundle.replay * 8) +
      Math.min(20, bundle.labClosed * 10) +
      Math.min(20, (bundle.heatmap?.learningScore ?? 40) * 0.35),
  );

  return {
    evidenceDiscipline,
    riskAwareness,
    patience,
    thesisClarity,
    invalidationDiscipline,
    processConsistency,
    emotionalAwareness,
    fomoResistance,
    overtradingResistance,
    adaptability,
    researchEfficiency,
    reflectionQuality,
    learningMomentum,
  } as Record<TradingDnaTraitId, number>;
}

function evidenceForTrait(id: TradingDnaTraitId, b: DnaEvidenceBundle) {
  switch (id) {
    case 'evidenceDiscipline':
      return collectEvidence(
        evidenceItem('decision_log', b.researched, 'research sessions', '/decision/radar'),
        evidenceItem('checklist', b.checklist, 'checklists completed', '/academy'),
        evidenceItem('journal', b.journaled, 'journal loops', '/journal'),
      );
    case 'riskAwareness':
      return collectEvidence(
        evidenceItem('decision_log', b.invalidated, 'invalidation events', '/decision/radar'),
        evidenceItem('journal', b.journaled, 'journal risk notes', '/journal'),
        evidenceItem('memory', 1, 'risk tolerance prior'),
      );
    case 'patience':
      return collectEvidence(
        evidenceItem('decision_log', b.skipped, 'skipped setups', '/decision/radar'),
        evidenceItem('replay', b.replay, 'replay sessions', '/decision/decision-replay'),
        evidenceItem('decision_log', b.ignored, 'ignored low-value ideas'),
      );
    case 'thesisClarity':
      return collectEvidence(
        evidenceItem('decision_log', b.avgDqs != null ? Math.round(b.avgDqs / 20) : 0, 'DQS samples'),
        evidenceItem('journal', b.journaled, 'journal theses', '/journal'),
        evidenceItem('decision_log', b.briefOpened, 'brief reviews'),
      );
    case 'invalidationDiscipline':
      return collectEvidence(
        evidenceItem('decision_log', b.invalidated, 'invalidation marks', '/decision/radar'),
        evidenceItem('replay', b.replay, 'replay practice', '/decision/replay-tv'),
        evidenceItem('checklist', b.checklist, 'checklist completions'),
      );
    case 'processConsistency':
      return collectEvidence(
        evidenceItem('heatmap', b.heatmap ? 1 : 0, 'heatmap consistency', '/decision/heatmap'),
        evidenceItem('journal', b.journaled, 'journal cadence', '/journal'),
        evidenceItem('decision_log', b.researched, 'research cadence'),
      );
    case 'emotionalAwareness':
      return collectEvidence(
        evidenceItem('journal', b.journalCoach?.psychology ? 1 : b.journaled, 'psychology notes', '/journal'),
        evidenceItem('replay', b.replay, 'process reflections'),
        evidenceItem('memory', b.memory.typicalMistakes.length ? 1 : 0, 'known struggle patterns'),
      );
    case 'fomoResistance':
      return collectEvidence(
        evidenceItem('decision_log', b.skipped, 'deliberate skips'),
        evidenceItem('decision_log', b.ignored, 'ignored chase ideas'),
        evidenceItem('mentor_setup', 1, 'coach focus priors'),
      );
    case 'overtradingResistance':
      return collectEvidence(
        evidenceItem('decision_log', b.researched, 'research volume'),
        evidenceItem('journal', b.journaled, 'closed loops'),
        evidenceItem('decision_log', b.skipped, 'attention saves'),
      );
    case 'adaptability':
      return collectEvidence(
        evidenceItem('decision_log', b.invalidated, 'revised cases'),
        evidenceItem('lab', b.labClosed, 'lab sessions', '/decision/lab'),
        evidenceItem('replay', b.replay, 'replay adaptations'),
      );
    case 'researchEfficiency':
      return collectEvidence(
        evidenceItem('decision_log', b.researched, 'research sessions'),
        evidenceItem(
          'decision_log',
          b.avgRvs != null ? Math.max(1, Math.round(b.avgRvs / 25)) : 0,
          'research-value samples',
        ),
        evidenceItem('journal', b.journaled, 'post-research journals'),
      );
    case 'reflectionQuality':
      return collectEvidence(
        evidenceItem('journal', b.journaled, 'journal entries', '/journal'),
        evidenceItem('replay', b.replay, 'replay reflections', '/(tabs)/review'),
      );
    case 'learningMomentum':
      return collectEvidence(
        evidenceItem('replay', b.replay, 'replay completions', '/decision/replay-tv'),
        evidenceItem('lab', b.labClosed, 'lab closures', '/decision/lab'),
        evidenceItem('academy', b.heatmap?.learningScore ? 1 : 0, 'learning heatmap', '/academy'),
      );
    default:
      return [];
  }
}

/**
 * Derive continuous Trading DNA trait scores from existing memory, log, heatmap, and journal coach.
 * Pure function — does not write storage. Never invents scores without evidence.
 */
export function buildTradingDnaTraits(input: DnaTraitsInput): TradingDnaProfile {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const monthAgo = now - 30 * 86_400_000;
  const priorStart = monthAgo;
  const priorEnd = weekAgo;

  const dna = input.memory.dna ?? buildTradingDna(input.memory);
  const fingerprint = styleFingerprint(input.memory, dna);

  const recent = buildEvidenceBundle({
    records: input.records,
    memory: input.memory,
    heatmapScores: input.heatmapScores,
    journalCoach: input.journalCoach,
    sinceMs: weekAgo,
    windowMs: 7 * 86_400_000,
  });

  const priorRecords = input.records.filter((r) => r.createdAt >= priorStart && r.createdAt < priorEnd);
  const prior = buildEvidenceBundle({
    records: priorRecords,
    memory: input.memory,
    heatmapScores: input.heatmapScores,
    journalCoach: input.journalCoach,
    sinceMs: priorStart,
    windowMs: 23 * 86_400_000,
  });

  // Prefer month window when week is thin so early users can still score honestly.
  const monthBundle = buildEvidenceBundle({
    records: input.records,
    memory: input.memory,
    heatmapScores: input.heatmapScores,
    journalCoach: input.journalCoach,
    sinceMs: monthAgo,
    windowMs: 30 * 86_400_000,
  });
  const active =
    totalEvidenceCount(
      collectEvidence(
        evidenceItem('decision_log', recent.researched + recent.skipped + recent.journaled, 'week'),
      ),
    ) >= 3
      ? recent
      : monthBundle;

  const raw = computeRawScores(active, input.processScoreWeek);
  const priorRaw = computeRawScores(prior, input.processScoreWeek);

  const struggleBlob = (input.mentorStruggles ?? input.memory.typicalMistakes).join(' ').toLowerCase();
  const focusFor = (id: TradingDnaTraitId) => {
    if (id === 'patience' && /patience|impuls|chase/.test(struggleBlob)) return true;
    if (id === 'fomoResistance' && /fomo|chase/.test(struggleBlob)) return true;
    if (id === 'riskAwareness' && /risk|size|invalid/.test(struggleBlob)) return true;
    if (id === 'invalidationDiscipline' && /invalid/.test(struggleBlob)) return true;
    if (id === 'overtradingResistance' && /overtrad|busy|volume/.test(struggleBlob)) return true;
    return false;
  };

  const traits: TradingDnaTraitScore[] = (Object.keys(TRAIT_META) as TradingDnaTraitId[]).map((id) => {
    const evidence = evidenceForTrait(id, active);
    const units = totalEvidenceCount(evidence);
    return scoreTrait({
      id,
      rawScore: raw[id],
      previousRaw: prior.researched + prior.journaled + prior.skipped > 0 ? priorRaw[id] : null,
      evidenceUnits: units,
      evidence,
      now,
      focusPrior: focusFor(id),
    });
  });

  const scored = traits.filter((t) => t.status === 'scored' && t.score != null);
  const strengths = [...scored]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((t) => t.label);
  const growthEdges = [...scored]
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
    .slice(0, 3)
    .map((t) => t.label);

  return {
    styleLabel: dna.styleLabel,
    becomingLabel: buildBecomingLabel(dna.styleLabel, traits),
    styleFingerprint: fingerprint,
    traits,
    strengths: strengths.length ? strengths : ['Building evidence'],
    growthEdges: growthEdges.length ? growthEdges : ['Gather more process evidence'],
    updatedAt: now,
    evidenceCount: traits.reduce((sum, t) => sum + totalEvidenceCount(t.evidence), 0),
  };
}

function traitScore(traits: TradingDnaTraitScore[], id: TradingDnaTraitId): number {
  return traits.find((t) => t.id === id)?.score ?? 0;
}

function buildBecomingLabel(styleLabel: string, traits: TradingDnaTraitScore[]): string {
  const patient = traitScore(traits, 'patience') >= 65;
  const consistent = traitScore(traits, 'processConsistency') >= 65;
  const reflective = traitScore(traits, 'reflectionQuality') >= 65;
  const efficient = traitScore(traits, 'researchEfficiency') >= 65;
  const scoredCount = traits.filter((t) => t.status === 'scored').length;

  if (scoredCount < 4) return `Emerging ${styleLabel}`;
  if (patient && consistent && reflective) return 'Reflective Process Operator';
  if (patient && efficient) return `Patient ${styleLabel}`;
  if (consistent && reflective) return 'Disciplined Decision-Maker';
  if (traitScore(traits, 'fomoResistance') < 45 && traitScore(traits, 'patience') < 50) {
    return 'Selectivity in Progress';
  }
  return styleLabel.includes('Trader') || styleLabel.includes('Operator')
    ? styleLabel
    : `${styleLabel} Decision-Maker`;
}

export function getTraitScore(dna: TradingDnaProfile, id: TradingDnaTraitId): number | null {
  return dna.traits.find((t) => t.id === id)?.score ?? null;
}
