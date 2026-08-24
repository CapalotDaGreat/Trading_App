import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { HeatmapScores } from '@/features/decision-heatmap/types/heatmap.types';
import type { JournalCoachInsight, TraderMemory, TradingDna } from '@/features/decision/types/decision.types';
import { buildTradingDna } from '@/features/decision/services/setup-enrichment.service';

import type {
  DnaJournalEvidence,
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
  formatWhyBullets,
  formatWhySummary,
  invalidationRatioSentence,
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
        ? 'Observed tendency: checklist evidence shows up before research deepens.'
        : 'Observed tendency: depth sometimes starts before structure evidence is collected.',
  },
  riskAwareness: {
    label: 'Risk Awareness',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: risk and invalidation stay present in the process.'
        : 'Observed tendency: risk notes are thinner than research volume.',
  },
  patience: {
    label: 'Patience',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: confirmation and skips show up more often than chase opens.'
        : 'Observed tendency: research opens sometimes arrive before confirmation.',
  },
  thesisClarity: {
    label: 'Thesis Clarity',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: decision quality reflects a written thesis.'
        : 'Observed tendency: theses are still short or missing on several loops.',
  },
  invalidationDiscipline: {
    label: 'Invalidation Discipline',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: invalidation is named before the case continues.'
        : 'Observed tendency: cases often proceed without an explicit invalidation.',
  },
  processConsistency: {
    label: 'Process Consistency',
    minEvidence: 4,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: process cadence is steady across weeks.'
        : 'Observed tendency: activity clusters in bursts rather than a steady loop.',
  },
  emotionalAwareness: {
    label: 'Emotional Awareness',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: psychology notes appear after charged sessions.'
        : 'Observed tendency: feeling-state is rarely named before the next session.',
  },
  fomoResistance: {
    label: 'FOMO Resistance',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: urgency without evidence is passed over.'
        : 'Observed tendency: urgency still opens research before an evidence gate.',
  },
  overtradingResistance: {
    label: 'Overtrading Resistance',
    minEvidence: 4,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: research volume stays matched to reflection.'
        : 'Observed tendency: research volume outpaces closed loops.',
  },
  adaptability: {
    label: 'Adaptability',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: cases are revised when evidence changes.'
        : 'Observed tendency: older theses sometimes persist after the tape changes.',
  },
  researchEfficiency: {
    label: 'Research Efficiency',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: research blocks stay purposeful rather than noisy.'
        : 'Observed tendency: attention spreads across more symbols than closed loops.',
  },
  reflectionQuality: {
    label: 'Reflection Quality',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: journals and replay close the research loop.'
        : 'Observed tendency: research often ends without a written reflection.',
  },
  learningMomentum: {
    label: 'Learning consistency',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: Academy, replay, and lab practice keep compounding.'
        : 'Observed tendency: practice sessions are still infrequent versus chart time.',
  },
  confirmationResistance: {
    label: 'Confirmation resistance',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: you close or skip once evidence is enough, rather than hunting extra confirmation.'
        : 'Observed tendency: extra research or skips still pile up before a closed thesis.',
  },
  decisionStamina: {
    label: 'Decision stamina',
    minEvidence: 3,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: loops stay complete as volume rises — research is closed, not dumped.'
        : 'Observed tendency: research opens outpace closed loops as the session lengthens.',
  },
  uncertaintyHandling: {
    label: 'Uncertainty handling',
    minEvidence: 2,
    detail: (s) =>
      s >= 65
        ? 'Observed tendency: mixed evidence leads to wait, skip, or named invalidation — not a forced call.'
        : 'Observed tendency: mixed tapes still get a forced research open more often than a wait.',
  },
};

const STRENGTH_HABITS: Partial<Record<TradingDnaTraitId, string>> = {
  patience: 'Patient research',
  invalidationDiscipline: 'Clear invalidation',
  processConsistency: 'Consistent review',
  reflectionQuality: 'Closing the loop',
  evidenceDiscipline: 'Evidence before depth',
  researchEfficiency: 'Focused research budget',
  riskAwareness: 'Risk kept in view',
  adaptability: 'Updating when evidence changes',
  learningMomentum: 'Deliberate practice',
  thesisClarity: 'Written theses',
  fomoResistance: 'Passing on urgency',
  overtradingResistance: 'Matching volume to reflection',
  emotionalAwareness: 'Naming the feeling',
  confirmationResistance: 'Closing once evidence is enough',
  decisionStamina: 'Finishing loops before opening another',
  uncertaintyHandling: 'Waiting when the tape is mixed',
};

const FOCUS_COACHING: Partial<Record<TradingDnaTraitId, string>> = {
  invalidationDiscipline: 'Pause before committing when evidence is mixed — define what would change your thesis.',
  patience: 'When the case is mixed, wait for one more confirmation before deepening research.',
  researchEfficiency: 'Two assets are enough for today’s research budget.',
  overtradingResistance: 'Close or skip a loop before opening another symbol.',
  evidenceDiscipline: 'Collect structure evidence before depth.',
  reflectionQuality: 'Write one short reflection after the next research block.',
  processConsistency: 'One brief → research or skip → journal loop beats a burst of charts.',
  fomoResistance: 'When urgency rises, require one extra confirmation step.',
  thesisClarity: 'Write a one-sentence thesis before expanding research.',
  adaptability: 'When conditions change, update the thesis instead of forcing the old one.',
  riskAwareness: 'Name the risk case before the next deep research block.',
  emotionalAwareness: 'Name the feeling before the next research session.',
  learningMomentum: 'One Replay or Academy session moves process more than more charts.',
  confirmationResistance: 'When evidence is enough, skip extra confirmation and close or pass.',
  decisionStamina: 'Close one loop before opening a fourth symbol.',
  uncertaintyHandling: 'When the case is mixed, wait or name invalidation instead of forcing a call.',
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
  /** Live journal signals (edits/deletes). Undefined falls back to decision-log journaled events. */
  journalEvidence?: DnaJournalEvidence[] | null;
  /** When set, score this exact window instead of auto week/month. */
  evidenceSinceMs?: number;
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
    whySummary: insufficient ? 'Not enough observable process events yet.' : formatWhySummary(input.evidence),
    whyBullets: insufficient ? [] : formatWhyBullets(input.evidence),
    score30dAgo: null,
    score90dAgo: null,
    allTimeScore: null,
    longitudinalTrend: 'insufficient',
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
      Math.min(10, (bundle.replayTvEvidence ?? 0) * 5) +
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
      Math.min(15, bundle.replay * 6) +
      Math.min(10, (bundle.replayTvPatience ?? 0) * 5) -
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
      Math.min(12, (bundle.replayTvInvalidation ?? 0) * 6) +
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

  const unclosed = Math.max(0, bundle.researched - bundle.journaled - bundle.skipped);
  const confirmationResistance = clamp(
    42 +
      Math.min(20, bundle.journaled * 6) +
      Math.min(14, bundle.skipped * 4) +
      Math.min(12, (bundle.replayTvConfirmation || bundle.replayTvPatience) * 5) +
      Math.min(10, bundle.checklist * 4) -
      Math.min(22, unclosed * 5) -
      (bundle.researched >= 5 && bundle.invalidated === 0 ? 8 : 0),
  );

  const decisionStamina = clamp(
    44 +
      Math.min(22, bundle.journaled * 7) +
      Math.min(16, bundle.replay * 6) +
      Math.min(10, bundle.replayTvStamina * 6) +
      (bundle.avgDqs != null && bundle.avgDqs >= 55 ? 8 : bundle.avgDqs != null && bundle.avgDqs < 48 ? -8 : 0) -
      Math.min(20, Math.max(0, bundle.researched - 5) * 4) -
      Math.min(12, bundle.ignored * 3),
  );

  const uncertaintyHandling = clamp(
    40 +
      Math.min(22, bundle.skipped * 7) +
      Math.min(16, bundle.invalidated * 6) +
      Math.min(14, (bundle.replayTvUncertainty || bundle.replayTvPatience) * 5) +
      Math.min(8, bundle.journalProcess * 3) -
      Math.min(16, bundle.ignored * 5),
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
    confirmationResistance,
    decisionStamina,
    uncertaintyHandling,
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
        evidenceItem('replay', b.replay, 'replay decisions', '/decision/replay-tv'),
        evidenceItem('journal', b.journalProcess || b.journaled, 'journal process entries', '/journal'),
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
        evidenceItem('journal', b.journalProcess || b.journaled, 'journal process entries', '/journal'),
        evidenceItem('replay', b.replay, 'replay reflections', '/(tabs)/review'),
      );
    case 'learningMomentum':
      return collectEvidence(
        evidenceItem('replay', b.replay, 'replay completions', '/decision/replay-tv'),
        evidenceItem('lab', b.labClosed, 'lab closures', '/decision/lab'),
        evidenceItem('academy', b.heatmap?.learningScore ? 1 : 0, 'learning heatmap', '/academy'),
      );
    case 'confirmationResistance':
      return collectEvidence(
        evidenceItem('decision_log', b.skipped, 'skips after enough evidence', '/decision/radar'),
        evidenceItem('journal', b.journalProcess, 'journal process entries', '/journal'),
        evidenceItem('replay', b.replayTvConfirmation || b.replay, 'replay decisions', '/decision/replay-tv'),
      );
    case 'decisionStamina':
      return collectEvidence(
        evidenceItem('decision_log', b.researched, 'research sessions', '/decision/radar'),
        evidenceItem('journal', b.journaled, 'closed loops', '/journal'),
        evidenceItem('replay', b.replayTvStamina || b.replay, 'replay decisions', '/decision/replay-tv'),
      );
    case 'uncertaintyHandling':
      return collectEvidence(
        evidenceItem('decision_log', b.skipped, 'wait or skip events', '/decision/radar'),
        evidenceItem('decision_log', b.invalidated, 'named invalidations'),
        evidenceItem(
          'replay',
          b.replayTvUncertainty || b.replay,
          'replay decisions',
          '/decision/replay-tv',
        ),
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

  const bundleInput = {
    records: input.records,
    memory: input.memory,
    heatmapScores: input.heatmapScores,
    journalCoach: input.journalCoach,
    journalEvidence: input.journalEvidence,
  };

  const forcedSince = input.evidenceSinceMs;
  const recent = buildEvidenceBundle({
    ...bundleInput,
    sinceMs: forcedSince ?? weekAgo,
    windowMs: forcedSince != null ? Math.max(1, now - forcedSince) : 7 * 86_400_000,
  });

  const priorRecords = input.records.filter((r) => r.createdAt >= priorStart && r.createdAt < priorEnd);
  const priorJournal =
    input.journalEvidence?.filter((j) => j.createdAtMs >= priorStart && j.createdAtMs < priorEnd) ??
    input.journalEvidence;
  const prior = buildEvidenceBundle({
    records: priorRecords,
    memory: input.memory,
    heatmapScores: input.heatmapScores,
    journalCoach: input.journalCoach,
    journalEvidence: Array.isArray(input.journalEvidence) ? priorJournal : undefined,
    sinceMs: priorStart,
    windowMs: 23 * 86_400_000,
  });

  // Prefer month window when week is thin so early users can still score honestly.
  const monthBundle = buildEvidenceBundle({
    ...bundleInput,
    sinceMs: forcedSince ?? monthAgo,
    windowMs: forcedSince != null ? Math.max(1, now - forcedSince) : 30 * 86_400_000,
  });
  const weekUnits = totalEvidenceCount(
    collectEvidence(
      evidenceItem('decision_log', recent.researched + recent.skipped + recent.journaled, 'week'),
    ),
  );
  const active = forcedSince != null ? recent : weekUnits >= 3 ? recent : monthBundle;

  const raw = computeRawScores(active, input.processScoreWeek);
  const priorRaw = computeRawScores(prior, input.processScoreWeek);

  const struggleBlob = (input.mentorStruggles ?? input.memory.typicalMistakes).join(' ').toLowerCase();
  const focusFor = (id: TradingDnaTraitId) => {
    if (id === 'patience' && /patience|impuls|chase/.test(struggleBlob)) return true;
    if (id === 'fomoResistance' && /fomo|chase/.test(struggleBlob)) return true;
    if (id === 'riskAwareness' && /risk|size|invalid/.test(struggleBlob)) return true;
    if (id === 'invalidationDiscipline' && /invalid/.test(struggleBlob)) return true;
    if (id === 'overtradingResistance' && /overtrad|busy|volume/.test(struggleBlob)) return true;
    if (id === 'confirmationResistance' && /confirm|over.?analys/.test(struggleBlob)) return true;
    if (id === 'decisionStamina' && /fatigue|stamina|overtrad/.test(struggleBlob)) return true;
    if (id === 'uncertaintyHandling' && /uncertai|ambigu|chop/.test(struggleBlob)) return true;
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
  const rankedHigh = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const rankedLow = [...scored].sort((a, b) => (a.score ?? 100) - (b.score ?? 100));
  const strengths = rankedHigh.slice(0, 3).map((t) => t.label);
  const growthEdges = rankedLow.slice(0, 2).map((t) => t.label);
  const strengthHabits = rankedHigh
    .slice(0, 3)
    .map((t) => STRENGTH_HABITS[t.id] ?? t.label);
  const focusAreas = rankedLow
    .slice(0, 2)
    .map((t) => FOCUS_COACHING[t.id] ?? `Practise ${t.label.toLowerCase()} on the next loop.`)
    .slice(0, 2);

  const invTrait = traits.find((t) => t.id === 'invalidationDiscipline');
  if (invTrait && invTrait.status === 'scored') {
    const ratio = invalidationRatioSentence(input.records);
    if (ratio) invTrait.ratioSentence = ratio;
  }

  return {
    styleLabel: dna.styleLabel,
    becomingLabel: buildBecomingLabel(dna.styleLabel, traits),
    decisionStyleSummary: buildDecisionStyleSummary(traits, scored.length),
    styleFingerprint: fingerprint,
    traits,
    strengths: strengths.length ? strengths : ['Building evidence'],
    strengthHabits: strengthHabits.length ? strengthHabits : ['Gathering process evidence'],
    growthEdges: growthEdges.length ? growthEdges : ['Gather more process evidence'],
    focusAreas: scored.length ? focusAreas : [],
    developingHabits: [],
    focusPractices: [],
    processInsights: [],
    observedTendencies: [],
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

function buildDecisionStyleSummary(traits: TradingDnaTraitScore[], scoredCount: number): string {
  if (scoredCount < 3) {
    return 'Not enough process evidence yet to describe how you decide.';
  }
  const top = [...traits]
    .filter((t) => t.status === 'scored' && t.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const edge = [...traits]
    .filter((t) => t.status === 'scored' && t.score != null)
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0];
  if (!top) return 'Process evidence is accumulating — scores describe habits, not profitability.';
  if (edge && edge.id !== top.id) {
    return `Observed: ${top.label.toLowerCase()} is currently the strongest habit; ${edge.label.toLowerCase()} is the quieter growth edge. Not a diagnosis, and not a P&L score.`;
  }
  return `Observed: ${top.label.toLowerCase()} is the strongest current habit in your process. Not a diagnosis, and not a P&L score.`;
}

export function getTraitScore(dna: TradingDnaProfile, id: TradingDnaTraitId): number | null {
  return dna.traits.find((t) => t.id === id)?.score ?? null;
}
