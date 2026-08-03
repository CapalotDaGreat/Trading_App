import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { HeatmapScores } from '@/features/decision-heatmap/types/heatmap.types';
import type { JournalCoachInsight, TraderMemory, TradingDna } from '@/features/decision/types/decision.types';
import { buildTradingDna } from '@/features/decision/services/setup-enrichment.service';

import type {
  TradingDnaProfile,
  TradingDnaTraitId,
  TradingDnaTraitScore,
  TraitTrend,
} from '../types/personal-intelligence.types';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function trendFromDelta(delta: number): TraitTrend {
  if (delta >= 6) return 'up';
  if (delta <= -6) return 'down';
  return 'flat';
}

function countActions(records: DecisionRecord[], action: DecisionRecord['action'], sinceMs: number) {
  return records.filter((r) => r.action === action && r.createdAt >= sinceMs).length;
}

function avgDqs(records: DecisionRecord[], sinceMs: number): number | null {
  const scored = records.filter(
    (r) => r.createdAt >= sinceMs && typeof r.decisionQualityScore === 'number',
  );
  if (!scored.length) return null;
  return scored.reduce((s, r) => s + (r.decisionQualityScore ?? 0), 0) / scored.length;
}

const TRAIT_META: Record<TradingDnaTraitId, { label: string; detail: (score: number) => string }> = {
  patience: {
    label: 'Patience',
    detail: (s) =>
      s >= 65 ? 'You wait for confirmation more often than you chase.' : 'Impulse entries still show up — slow the first click.',
  },
  discipline: {
    label: 'Discipline',
    detail: (s) =>
      s >= 65 ? 'Loop follow-through (brief → research → journal) is holding.' : 'Close the loop before opening more research.',
  },
  risk: {
    label: 'Risk awareness',
    detail: (s) =>
      s >= 65 ? 'Risk framing stays present in your process.' : 'Define invalidation before depth of research.',
  },
  research: {
    label: 'Research',
    detail: (s) =>
      s >= 65 ? 'Research sessions are purposeful, not noisy.' : 'Fewer, higher-quality research blocks beat volume.',
  },
  consistency: {
    label: 'Consistency',
    detail: (s) =>
      s >= 65 ? 'Process cadence is steady across weeks.' : 'Small daily loops beat occasional intensity spikes.',
  },
  confidence: {
    label: 'Confidence',
    detail: (s) =>
      s >= 65
        ? 'Decision confidence is grounded in checklist quality — not prediction.'
        : 'Build confidence from completed process, not from market outcomes.',
  },
  emotionalControl: {
    label: 'Emotional control',
    detail: (s) =>
      s >= 65 ? 'Psychology notes show cooler recovery after mistakes.' : 'Journal emotions before the next research session.',
  },
  trendFollowing: {
    label: 'Trend following',
    detail: (s) => (s >= 55 ? 'Trend structure fits your stated edge.' : 'Trend preference is light — still exploring.'),
  },
  breakoutPreference: {
    label: 'Breakout preference',
    detail: (s) => (s >= 55 ? 'Breakout setups are in your playbook.' : 'Breakouts are not your primary identity.'),
  },
  swingPreference: {
    label: 'Swing preference',
    detail: (s) => (s >= 55 ? 'Multi-day swings match your hold style.' : 'Swing hold is secondary right now.'),
  },
  scalpingPreference: {
    label: 'Scalping preference',
    detail: (s) => (s >= 55 ? 'Short-horizon process shows up in your style.' : 'Scalping is not your core identity.'),
  },
  riskManagement: {
    label: 'Risk management',
    detail: (s) =>
      s >= 65 ? 'Risk definition and sizing discipline are visible.' : 'Treat risk rules as non-negotiable checklist items.',
  },
  decisionQuality: {
    label: 'Decision quality',
    detail: (s) =>
      s >= 65 ? 'DQS tracking shows structured decisions.' : 'Raise Decision Quality by finishing checklists before depth.',
  },
};

export interface DnaTraitsInput {
  memory: TraderMemory;
  records: DecisionRecord[];
  heatmapScores?: HeatmapScores | null;
  journalCoach?: JournalCoachInsight | null;
  processScoreWeek?: number;
  nowMs?: number;
}

function preferenceScores(memory: TraderMemory, dna: TradingDna) {
  const style = `${memory.tradingStyle} ${dna.styleLabel}`.toLowerCase();
  const setups = [...memory.bestSetups, ...memory.weakestSetups, ...(dna.bestSetups ?? [])]
    .join(' ')
    .toLowerCase();

  const swing =
    style.includes('swing') || style.includes('position') || /pullback|swing/.test(setups)
      ? 72
      : style.includes('day')
        ? 40
        : 48;
  const scalp = style.includes('scalp') || style.includes('day') ? 68 : 28;
  const trend =
    /trend|ema|structure|pullback/.test(setups) || dna.bestConditions.some((c) => /trend/i.test(c))
      ? 70
      : 45;
  const breakout = /breakout|momentum|range break/.test(setups) ? 68 : 38;

  return { swing, scalp, trend, breakout };
}

/**
 * Derive continuous Trading DNA trait scores from existing memory, log, heatmap, and journal coach.
 * Pure function — does not write storage.
 */
export function buildTradingDnaTraits(input: DnaTraitsInput): TradingDnaProfile {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const monthAgo = now - 30 * 86_400_000;
  const dna = input.memory.dna ?? buildTradingDna(input.memory);
  const prefs = preferenceScores(input.memory, dna);

  const researchedWeek = countActions(input.records, 'researched', weekAgo);
  const skippedWeek = countActions(input.records, 'skipped', weekAgo);
  const journaledWeek = countActions(input.records, 'journaled', weekAgo);
  const replayWeek = countActions(input.records, 'replay_completed', weekAgo);
  const researchedMonth = countActions(input.records, 'researched', monthAgo);
  const journaledMonth = countActions(input.records, 'journaled', monthAgo);
  const ignoredWeek = countActions(input.records, 'ignored', weekAgo);

  const dqsRecent = avgDqs(input.records, weekAgo);
  const dqsOlder = avgDqs(input.records, monthAgo);
  const heatmap = input.heatmapScores;
  const journalProcess = input.journalCoach?.processScore ?? 0;
  const weekProcess = input.processScoreWeek ?? heatmap?.disciplineScore ?? journalProcess;

  const patience = clamp(
    40 +
      Math.min(25, skippedWeek * 8) +
      Math.min(15, replayWeek * 6) -
      Math.min(20, ignoredWeek * 7) +
      (input.memory.typicalMistakes.some((m) => /impuls|chase|early/i.test(m)) ? -8 : 8),
  );

  const discipline = clamp(
    (heatmap?.disciplineScore ?? 45) * 0.55 +
      weekProcess * 0.25 +
      Math.min(20, journaledWeek * 7) +
      (researchedWeek > 0 && journaledWeek === 0 ? -12 : 0),
  );

  const riskBase =
    input.memory.riskTolerance === 'conservative' ? 72 : input.memory.riskTolerance === 'aggressive' ? 48 : 60;
  const risk = clamp(riskBase + (dna.commonMistakes?.some((m) => /oversiz|stop/i.test(m)) ? -10 : 6));

  const research = clamp(
    35 +
      Math.min(35, researchedWeek * 10) +
      Math.min(15, researchedMonth) -
      Math.min(15, Math.max(0, researchedWeek - 6) * 4),
  );

  const consistency = clamp(heatmap?.consistencyScore ?? Math.min(70, researchedMonth * 4 + journaledMonth * 5));

  const confidence = clamp(
    (dqsRecent ?? weekProcess ?? 50) * 0.7 + Math.min(20, journaledWeek * 5) + (replayWeek > 0 ? 8 : 0),
  );

  const emotionalControl = clamp(
    50 +
      (input.journalCoach?.psychology ? 12 : 0) +
      Math.min(15, journaledWeek * 5) -
      (input.memory.typicalMistakes.some((m) => /revenge|tilt|fomo/i.test(m)) ? 14 : 0) +
      (replayWeek > 0 ? 8 : 0),
  );

  const riskManagement = clamp(
    risk * 0.5 +
      (input.journalCoach?.avgRr && input.journalCoach.avgRr >= 1.2 ? 18 : 8) +
      Math.min(20, journaledMonth * 3),
  );

  const decisionQuality = clamp(dqsRecent ?? weekProcess ?? heatmap?.learningScore ?? 50);

  const raw: Record<TradingDnaTraitId, number> = {
    patience,
    discipline,
    risk,
    research,
    consistency,
    confidence,
    emotionalControl,
    trendFollowing: prefs.trend,
    breakoutPreference: prefs.breakout,
    swingPreference: prefs.swing,
    scalpingPreference: prefs.scalp,
    riskManagement,
    decisionQuality,
  };

  const dqsDelta =
    dqsRecent != null && dqsOlder != null ? dqsRecent - dqsOlder : (heatmap?.trendDelta ?? 0);

  const traits: TradingDnaTraitScore[] = (Object.keys(raw) as TradingDnaTraitId[]).map((id) => {
    const score = raw[id];
    let trend: TraitTrend = 'flat';
    if (id === 'decisionQuality' || id === 'consistency' || id === 'discipline') {
      trend = trendFromDelta(heatmap?.trendDelta ?? dqsDelta);
    } else if (id === 'patience' || id === 'emotionalControl') {
      trend = trendFromDelta(journaledWeek * 4 + skippedWeek * 3 - ignoredWeek * 5);
    } else if (id === 'research') {
      trend = trendFromDelta(researchedWeek + replayWeek * 2 - 3);
    }
    return {
      id,
      label: TRAIT_META[id].label,
      score,
      trend,
      detail: TRAIT_META[id].detail(score),
    };
  });

  const sorted = [...traits].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 3).map((t) => t.label);
  const growthEdges = [...traits].sort((a, b) => a.score - b.score).slice(0, 3).map((t) => t.label);

  const becomingLabel = buildBecomingLabel(dna.styleLabel, traits);

  return {
    styleLabel: dna.styleLabel,
    becomingLabel,
    traits,
    strengths,
    growthEdges,
    updatedAt: now,
  };
}

function buildBecomingLabel(styleLabel: string, traits: TradingDnaTraitScore[]): string {
  const byId = Object.fromEntries(traits.map((t) => [t.id, t.score])) as Record<
    TradingDnaTraitId,
    number
  >;
  const patient = (byId.patience ?? 0) >= 65;
  const disciplined = (byId.discipline ?? 0) >= 65;
  const swing = (byId.swingPreference ?? 0) >= 60;
  const trend = (byId.trendFollowing ?? 0) >= 60;

  if (patient && trend && swing) return 'Patient Trend Trader';
  if (patient && disciplined) return `Patient ${styleLabel}`;
  if (disciplined && swing) return 'Disciplined Swing Trader';
  if ((byId.breakoutPreference ?? 0) >= 65 && (byId.patience ?? 100) < 55) return 'Momentum Chaser in Recovery';
  return styleLabel;
}
