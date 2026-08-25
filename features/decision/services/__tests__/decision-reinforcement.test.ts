import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { TraderMemory } from '@/features/decision/types/decision.types';
import { composeReplayTvCoachNote } from '@/features/decision-replay-tv/services/replay-tv-coach.service';
import { buildReplayTvDecisionLogNote } from '@/features/decision-replay-tv/services/replay-tv-access.service';
import { getReplayTvEpisode } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import { rankReplayTvEpisodes } from '@/features/decision-replay-tv/services/replay-tv-rank.service';
import { REPLAY_TV_EPISODES } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import { composeTradingDna } from '@/features/personal-intelligence/services/dna-longitudinal.service';
import { buildDnaMentorSummary } from '@/features/personal-intelligence/services/dna-mentor-summary.service';
import { buildPersonalizedToday } from '@/features/personal-intelligence/services/personalized-today.service';
import { composeStructuredMentorAnswer } from '@/features/ai/services/ai-mentor-response.service';
import type { AiEnrichedContext } from '@/features/ai/types/ai.types';

import { resolveAcademyLessonForTrait } from '../decision-reinforcement-academy.service';
import {
  composeDecisionReinforcement,
  composeReplayPracticeConnection,
  emptyDecisionReinforcement,
  observationsFromReplayCommit,
} from '../decision-reinforcement.service';

const NOW = Date.UTC(2026, 7, 10, 12, 0, 0);
const DAY_MS = 86_400_000;

const memory: TraderMemory = {
  favoriteAssets: ['EUR/USD'],
  tradingStyle: 'swing',
  riskTolerance: 'moderate',
  avgHoldHint: 'Multi-day',
  typicalMistakes: ['Early entries'],
  favoriteIndicators: ['EMA'],
  bestSetups: ['Pullback'],
  weakestSetups: ['Chase'],
  notes: ['Wait for confirmation'],
  updatedAt: NOW,
};

function record(
  action: DecisionRecord['action'],
  daysAgo: number,
  extras: Partial<DecisionRecord> = {},
): DecisionRecord {
  return {
    id: `${action}-${daysAgo}-${extras.symbol ?? 'SPY'}`,
    symbol: extras.symbol ?? 'SPY',
    regime: 'trending',
    action,
    createdAt: NOW - daysAgo * 86_400_000,
    decisionQualityScore: 70,
    researchValueScore: 62,
    ...extras,
  };
}

function dnaWith(records: DecisionRecord[]) {
  return composeTradingDna({ memory, records, nowMs: NOW });
}

describe('Phase 11 decision reinforcement layer', () => {
  it('A. Replay wait without invalidation writes process observations, never outcome', () => {
    const obs = observationsFromReplayCommit({
      decision: 'wait',
      namedInvalidation: false,
      nowMs: NOW,
    });
    expect(obs.some((o) => o.traitId === 'patience' && o.direction === 'strength')).toBe(true);
    expect(obs.some((o) => o.traitId === 'invalidationDiscipline' && o.direction === 'focus')).toBe(
      true,
    );
    const blob = JSON.stringify(obs).toLowerCase();
    expect(blob).not.toMatch(/profit|buy|sell|you were right|paid/);
  });

  it('A/B. Replay Decision Log tags feed DNA patience without a second event stream', () => {
    const episode = getReplayTvEpisode('covid-crash')!;
    const note = buildReplayTvDecisionLogNote({
      episode,
      processQuality: 72,
      evidenceQuality: 60,
      invalidationClarity: 40,
      patience: 55,
      namedInvalidation: false,
      decisions: ['wait'],
    });
    expect(note).toContain('rtv:wait');
    expect(note).not.toMatch(/dear diary|secret journal/);
    const dna = dnaWith([
      record('skipped', 1),
      record('skipped', 2),
      record('replay_completed', 1, { note }),
      record('journaled', 1),
    ]);
    const patience = dna.traits.find((t) => t.id === 'patience');
    expect(patience?.evidence.some((e) => e.source === 'replay' && e.count > 0)).toBe(true);
  });

  it('C. Replay wait without invalidation recommends invalidation practice', () => {
    const dna = dnaWith([
      record('skipped', 1),
      record('replay_completed', 3, { note: 'rtv:wait rtv:patience' }),
      record('replay_completed', 4, { note: 'rtv:wait' }),
      record('journaled', 2),
    ]);
    const snap = composeDecisionReinforcement({
      dna,
      records: [
        record('skipped', 1),
        record('replay_completed', 3, { note: 'rtv:wait rtv:patience' }),
        record('replay_completed', 4, { note: 'rtv:wait' }),
        record('journaled', 2),
      ],
      nowMs: NOW,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
    });
    expect(snap.primaryPractice?.traitId).toBe('invalidationDiscipline');
    expect(snap.replayPracticeConnection?.nextPractice.toLowerCase()).toMatch(/invalidation/);
    expect(snap.primaryPractice?.practiceType).toBe('replay');
  });

  it('D. DNA focus maps to an existing Academy lesson only', () => {
    const lesson = resolveAcademyLessonForTrait('invalidationDiscipline');
    expect(lesson?.id).toBe('dec-invalidation');
    expect(lesson?.title.toLowerCase()).toContain('invalidation');
    const missing = resolveAcademyLessonForTrait('patience', () => null);
    expect(missing).toBeNull();
  });

  it('N. no supported lesson → no fake recommendation', () => {
    const rec = resolveAcademyLessonForTrait('adaptability', () => null);
    expect(rec).toBeNull();
  });

  it('E. Mentor context separates known, inference, and unknown', () => {
    const records = [
      record('skipped', 1),
      record('skipped', 2),
      record('replay_completed', 1, { note: 'rtv:wait rtv:patience' }),
      record('replay_completed', 2, { note: 'rtv:wait' }),
      record('journaled', 1),
    ];
    const snap = composeDecisionReinforcement({
      dna: dnaWith(records),
      records,
      nowMs: NOW,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
      coachProfile: { experience: 'beginner' },
    });
    expect(snap.mentorContext.known.join(' ').toLowerCase()).toMatch(/replay|wait|deferral/);
    expect(snap.mentorContext.inference.join(' ').toLowerCase()).toMatch(/wait|invalidation/);
    expect(snap.mentorContext.unknown.join(' ').toLowerCase()).toMatch(/journal text|profile/);
    expect(snap.mentorContext.observationLine?.toLowerCase()).toMatch(/wait|invalidation/);
    const mentor = buildDnaMentorSummary({
      dna: dnaWith(records),
      whatsChanging: [],
      uid: 'demo-guest',
      nowMs: NOW,
      reinforcement: snap,
    });
    expect(mentor.observationLine.toLowerCase()).toMatch(/wait|invalidation|deliberate/);
    expect(JSON.stringify(mentor)).not.toMatch(/anxious|fomo diagnosis|dear diary/i);
  });

  it('F. Today surfaces at most one quiet cue, preferring the focus gap', () => {
    const records = [
      record('skipped', 1),
      record('skipped', 2),
      record('replay_completed', 3, { note: 'rtv:wait rtv:patience' }),
      record('journaled', 2),
    ];
    const dna = dnaWith(records);
    const patience = dna.traits.find((t) => t.id === 'patience');
    if (patience) {
      patience.status = 'scored';
      patience.score = 62;
      patience.trend = 'up';
      patience.longitudinalTrend = 'improving';
    }
    const snap = composeDecisionReinforcement({
      dna,
      records,
      nowMs: NOW,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
    });
    const today = buildPersonalizedToday({
      dna,
      nowMs: NOW,
      uid: 'cue-user',
      reinforcement: snap,
    });
    expect(today.todayCue?.toLowerCase()).toMatch(/invalidation/);
    expect(today.todayCue?.toLowerCase()).not.toMatch(/failed|falling behind|ignored/);
    const cueIds = (today.dnaAdaptations ?? []).filter(
      (id) => id.endsWith('_cue') || id.startsWith('insight_') || id.startsWith('reinforcement_'),
    );
    expect(cueIds.length).toBeLessThanOrEqual(1);
  });

  it('G. strongly improving trait suppresses unnecessary recommendation', () => {
    const records = [
      record('skipped', 1),
      record('skipped', 2),
      record('replay_completed', 1, { note: 'rtv:wait rtv:patience rtv:invalidation' }),
      record('replay_completed', 2, { note: 'rtv:wait rtv:invalidation' }),
      record('invalidated', 1),
      record('journaled', 1),
    ];
    const dna = dnaWith(records);
    for (const id of ['patience', 'invalidationDiscipline'] as const) {
      const trait = dna.traits.find((t) => t.id === id);
      if (trait) {
        trait.status = 'scored';
        trait.score = 78;
        trait.trend = 'up';
        trait.longitudinalTrend = 'improving';
      }
    }
    const snap = composeDecisionReinforcement({
      dna,
      records,
      nowMs: NOW,
    });
    expect(snap.primaryPractice).toBeNull();
    expect(snap.todayCue).toBeNull();
    expect(snap.academyLesson).toBeNull();
  });

  it('H. duplicate Academy recommendation is suppressed when recently completed', () => {
    const records = [
      record('skipped', 5),
      record('replay_completed', 5, { note: 'rtv:wait' }),
    ];
    const dna = dnaWith(records);
    const inv = dna.traits.find((t) => t.id === 'invalidationDiscipline');
    if (inv) {
      inv.status = 'scored';
      inv.score = 40;
      inv.longitudinalTrend = 'stable';
    }
    const snap = composeDecisionReinforcement({
      dna,
      records,
      nowMs: NOW,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
      academyProgress: [{ lessonId: 'dec-invalidation', practicedAtMs: NOW - DAY_MS }],
    });
    expect(snap.academyLesson).toBeNull();
  });

  it('I. missing evidence does not fabricate an observation', () => {
    const dna = composeTradingDna({ memory, records: [], nowMs: NOW });
    const snap = composeDecisionReinforcement({ dna, records: [], nowMs: NOW });
    expect(snap.observations).toHaveLength(0);
    expect(snap.primaryPractice).toBeNull();
    expect(snap.todayCue).toBeNull();
    expect(snap.mentorContext.unknown.length).toBeGreaterThan(0);
  });

  it('J. journal bodies are never exposed', () => {
    const records = [
      record('journaled', 1, { note: 'SECRET_JOURNAL_BODY dear diary I bought calls' }),
      record('replay_completed', 1, { note: 'rtv:wait rtv:patience' }),
      record('skipped', 1),
    ];
    const snap = composeDecisionReinforcement({
      dna: dnaWith(records),
      records,
      journalEvidence: [
        {
          id: 'j1',
          createdAtMs: NOW - DAY_MS,
          hasPsychology: true,
          hasLesson: true,
          planAdhered: true,
          emotion: 'anxious',
          mistakeCategory: null,
        },
      ],
      nowMs: NOW,
    });
    const blob = JSON.stringify(snap);
    expect(blob).not.toContain('SECRET_JOURNAL_BODY');
    expect(blob).not.toMatch(/dear diary|bought calls/i);
    expect(blob.toLowerCase()).not.toMatch(/you are an anxious trader/);
  });

  it('K. privacy mode / local-only DNA is not required for local derivation', () => {
    const records = [record('skipped', 1), record('replay_completed', 1, { note: 'rtv:wait' })];
    const snap = composeDecisionReinforcement({
      dna: dnaWith(records),
      records,
      nowMs: NOW,
    });
    expect(JSON.stringify(snap)).not.toMatch(/portfolio|\$[0-9]|chat transcript/i);
  });

  it('L. free users still get the core loop; premium only widens history', () => {
    const records = [
      record('skipped', 1),
      record('replay_completed', 80, { note: 'rtv:wait rtv:patience' }),
      record('replay_completed', 2, { note: 'rtv:wait' }),
    ];
    const dna = dnaWith(records);
    const free = composeDecisionReinforcement({
      dna,
      records,
      nowMs: NOW,
      isPremium: false,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
    });
    const premium = composeDecisionReinforcement({
      dna,
      records,
      nowMs: NOW,
      isPremium: true,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
    });
    expect(free.primaryPractice).toBeTruthy();
    expect(free.replayPracticeConnection).toBeTruthy();
    expect(premium.enabled).toBe(true);
    expect(premium.primaryPractice).toBeTruthy();
  });

  it('M. onboarding market preference influences Replay ranking copy, not hiding markets', () => {
    const records = [
      record('skipped', 1),
      record('replay_completed', 2, { note: 'rtv:wait' }),
    ];
    const snap = composeDecisionReinforcement({
      dna: dnaWith(records),
      records,
      nowMs: NOW,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
      coachProfile: { markets: ['forex'], experience: 'beginner', struggles: ['patience'] },
    });
    expect(snap.preferredMarkets).toContain('forex');
    expect(snap.primaryPractice?.destination.href).toBe('/decision/replay-tv');
    expect(snap.primaryPractice?.reason.toLowerCase()).toMatch(/forex/);
    const ranked = rankReplayTvEpisodes(REPLAY_TV_EPISODES, { markets: ['forex'] });
    expect(ranked.some((ep) => ep.markets.includes('forex'))).toBe(true);
    expect(ranked.some((ep) => !ep.markets.includes('forex'))).toBe(true);
  });

  it('O. outcome never determines process quality', () => {
    const wait = observationsFromReplayCommit({
      decision: 'wait',
      namedInvalidation: false,
      nowMs: NOW,
    });
    const episode = getReplayTvEpisode('covid-crash')!;
    const note = composeReplayTvCoachNote({
      episode,
      checkpointPrompt: episode.checkpoints[0]!.prompt,
      mentorFollowUp: episode.checkpoints[0]!.mentorFollowUp,
      decision: 'wait',
      structured: {
        thesis: '',
        evidence: '',
        invalidation: '',
        confidence: 2,
        mainUncertainty: 'Tape is mixed',
      },
      checklist: {
        namedInvalidation: false,
        notedRegime: false,
        consideredTimeBudget: true,
        wroteReasoning: false,
        consideredAlternative: true,
      },
      previous: null,
    });
    const blob = `${JSON.stringify(wait)} ${JSON.stringify(note)} ${episode.historicalOutcome}`.toLowerCase();
    expect(JSON.stringify(wait)).not.toContain(episode.historicalOutcome.slice(0, 24));
    expect(JSON.stringify(note).toLowerCase()).not.toMatch(/because (price|the path) (paid|fell|rose)/);
    expect(note.practiceConnection?.traitId).toBe('invalidationDiscipline');
    expect(blob).not.toMatch(/you were right because/);
  });

  it('P. feature flag disabled returns an empty reconstructable snapshot', () => {
    const records = [record('replay_completed', 1, { note: 'rtv:wait' })];
    const snap = composeDecisionReinforcement({
      enabled: false,
      dna: dnaWith(records),
      records,
      nowMs: NOW,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
    });
    expect(snap).toEqual(emptyDecisionReinforcement(false, []));
    expect(composeReplayPracticeConnection({
      decision: 'wait',
      checklist: { namedInvalidation: false, wroteReasoning: false },
      enabled: false,
    })).toBeNull();
  });

  it('Q. demo guest mode derives from local records', () => {
    const records = [
      record('skipped', 1),
      record('replay_completed', 1, { note: 'rtv:wait rtv:patience' }),
    ];
    const snap = composeDecisionReinforcement({
      dna: dnaWith(records),
      records,
      nowMs: NOW,
      lastReplayDecision: { decision: 'wait', namedInvalidation: false },
    });
    expect(snap.enabled).toBe(true);
    expect(snap.mentorContext.observationLine).toBeTruthy();
  });

  it('R. offline: composer is pure and does not require network', () => {
    const snap = composeDecisionReinforcement({
      dna: composeTradingDna({ memory, records: [], nowMs: NOW }),
      records: [],
      nowMs: NOW,
    });
    expect(snap.observations).toEqual([]);
  });

  it('Trusted AI keeps Known vs Interpretation when DNA context is attached', () => {
    const context: AiEnrichedContext = {
      symbol: 'EUR/USD',
      quote: { price: 1.08, change: 0, changePercent: 0, volume: 1 },
      assembledAt: NOW,
      decisionIntelligence: {
        psychologyReminder: 'Write invalidation first.',
        recommendedFocus: 'Process',
        tradingDna: {
          becomingLabel: 'Patient swing',
          strengths: ['Patience'],
          growthEdges: ['Invalidation Discipline'],
          observationLine: 'Waiting looks more deliberate. Invalidation is still the gap.',
          known: ['2 replay decisions where you waited'],
          inference: ['Recent waits look more deliberate.'],
          unknown: ['Private journal text is not available.'],
        },
      },
    };
    const answer = composeStructuredMentorAnswer({
      prompt: 'Why do I keep waiting?',
      context: { enriched: context },
      mode: 'coach',
      depth: 'balanced',
      evidenceLevel: 'moderate',
    });
    expect(answer.whatIKnow.join(' ')).toMatch(/waited|invalidation|deliberate/i);
    expect(answer.whatIDontKnow.join(' ').toLowerCase()).toMatch(/journal|unknown|not/);
    expect(answer.interpretation.toLowerCase()).not.toMatch(/buy|sell|you have fomo/);
  });
});
