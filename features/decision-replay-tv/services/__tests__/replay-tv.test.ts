import {
  getReplayTvEpisode,
  REPLAY_TV_EPISODES,
  listShortSessions,
} from '../../content/replay-tv.catalog';
import {
  buildReplayTvDecisionLogNote,
  episodeRequiresPremium,
  evaluateReplayTvBeginAccess,
} from '../replay-tv-access.service';
import {
  buildReplayTvJournalEntryInput,
  buildReplayTvJournalReflection,
} from '../replay-tv-journal.service';
import {
  buildEducationalCandles,
  chunkVisibleCandles,
  getEducationalCandles,
  visibleCandlesAt,
} from '../replay-tv-path.service';
import { episodesForDnaGrowth, rankReplayTvEpisodes } from '../replay-tv-rank.service';
import { scoreReplayTvSession } from '../replay-tv-score.service';
import {
  advanceReplayTvPhase,
  createReplayTvSession,
  getBlindSafeEpisodeView,
  getFrozenCandlesForSession,
  getVisibleCandlesForSession,
  getVisibleNewsForSession,
  hydrateReplayTvSessionCandles,
  submitReplayTvDecision,
} from '../replay-tv-session.service';
import { evaluatePassportAchievements } from '@/features/decision-passport/services/passport-achievements.service';
import type { PassportCounts } from '@/features/decision-passport/types/passport.types';

jest.mock('@/features/subscription/services/entitlement.service', () => ({
  canConsumeMonthly: jest.fn(async () => ({ allowed: true, used: 0, limit: 5 })),
  incrementMonthlyUsage: jest.fn(async () => 1),
}));

const { canConsumeMonthly } = jest.requireMock(
  '@/features/subscription/services/entitlement.service',
) as {
  canConsumeMonthly: jest.Mock;
};

describe('Decision Replay TV', () => {
  beforeEach(() => {
    canConsumeMonthly.mockResolvedValue({ allowed: true, used: 0, limit: 5 });
  });

  it('ships a curated catalog with expanded content fields', () => {
    expect(REPLAY_TV_EPISODES.length).toBeGreaterThanOrEqual(10);
    expect(getReplayTvEpisode('covid-crash')?.title).toMatch(/COVID/i);
    expect(getReplayTvEpisode('lehman-weekend')).toBeTruthy();
    expect(getReplayTvEpisode('inflation-shock-2022')).toBeTruthy();
    expect(getReplayTvEpisode('svb-stress')).toBeTruthy();
    expect(getReplayTvEpisode('false-breakout-drill')).toBeTruthy();
    expect(listShortSessions(15).length).toBeGreaterThan(0);

    for (const episode of REPLAY_TV_EPISODES) {
      expect(episode.dataKind).toBe('sample');
      expect(episode.historicalOutcome.length).toBeGreaterThan(40);
      expect(episode.teaser.toLowerCase()).not.toMatch(/bought the bottom|guaranteed/);
      expect(episode.checkpoints.length).toBeGreaterThanOrEqual(2);
      expect(episode.durationMinutes).toBeGreaterThan(0);
      expect(episode.markets.length).toBeGreaterThan(0);
      expect(episode.scoringEmphasis.length).toBeGreaterThan(0);
      expect(episode.availableNews).toBeDefined();
    }
  });

  it('caches educational paths and hides future bars', () => {
    const episode = getReplayTvEpisode('covid-crash')!;
    const a = getEducationalCandles(episode);
    const b = getEducationalCandles(episode);
    expect(a).toBe(b);
    expect(buildEducationalCandles(episode)).toHaveLength(episode.barCount);

    const freeze = episode.checkpoints[0]!.freezeIndex;
    const visible = visibleCandlesAt(a, freeze);
    expect(visible).toHaveLength(freeze + 1);
    expect(visible[visible.length - 1]?.timestamp).toBe(a[freeze]?.timestamp);

    const chunked = chunkVisibleCandles(a, freeze, 10);
    expect(chunked.length).toBeLessThanOrEqual(10);
    expect(chunked[chunked.length - 1]?.timestamp).toBe(a[freeze]?.timestamp);
  });

  it('never leaks future candles or outcome strings before reveal', () => {
    let session = createReplayTvSession('nvidia-earnings');
    session = advanceReplayTvPhase(session); // context
    session = advanceReplayTvPhase(session); // watching

    const frozen = getFrozenCandlesForSession(session);
    const visible = getVisibleCandlesForSession(session);
    expect(frozen.length).toBeLessThan(session.fullCandles.length);
    expect(visible.length).toBeLessThanOrEqual(frozen.length);
    expect(visible.every((c) => frozen.some((f) => f.timestamp === c.timestamp))).toBe(true);

    const blindView = getBlindSafeEpisodeView(session);
    expect(blindView.historicalOutcome).toBeNull();
    expect(blindView.teachingNotes).toEqual([]);
    expect(JSON.stringify(blindView).toLowerCase()).not.toContain(
      getReplayTvEpisode('nvidia-earnings')!.historicalOutcome.slice(0, 24).toLowerCase(),
    );

    const news = getVisibleNewsForSession(session);
    const freeze = getReplayTvEpisode('nvidia-earnings')!.checkpoints[0]!.freezeIndex;
    expect(news.every((n) => n.availableAtIndex <= freeze)).toBe(true);
  });

  it('preserves freeze on resume hydrate and restart-like recreate', () => {
    let session = createReplayTvSession('tesla-rally');
    session = advanceReplayTvPhase(session);
    session = advanceReplayTvPhase(session);
    const freezeLen = getFrozenCandlesForSession(session).length;

    const stripped = { ...session, fullCandles: [] };
    const hydrated = hydrateReplayTvSessionCandles(stripped);
    expect(hydrated.fullCandles.length).toBeGreaterThan(0);
    expect(getFrozenCandlesForSession(hydrated).length).toBe(freezeLen);
    expect(hydrated.phase).toBe('watching');
    expect(hydrated.revealed).toBe(false);

    const restarted = createReplayTvSession('tesla-rally');
    expect(restarted.phase).toBe('intro');
    expect(restarted.revealed).toBe(false);
  });

  it('runs a blind multi-pause session without grading P&L', () => {
    let session = createReplayTvSession('nvidia-earnings');
    expect(session.phase).toBe('intro');
    session = advanceReplayTvPhase(session);
    expect(session.phase).toBe('context');
    session = advanceReplayTvPhase(session);
    expect(session.phase).toBe('watching');

    const visible = getVisibleCandlesForSession(session);
    expect(visible.length).toBeLessThan(session.fullCandles.length);

    session = advanceReplayTvPhase(session);
    session = submitReplayTvDecision({
      session,
      decision: 'wait',
      reasoning: 'Evidence is mixed; I will protect attention until invalidation is clear.',
    });
    expect(session.phase).toBe('mentor');
    expect(session.mentorReply).toBeTruthy();

    session = advanceReplayTvPhase(session);
    expect(session.phase).toBe('watching');
    session = advanceReplayTvPhase(session);
    session = submitReplayTvDecision({
      session,
      decision: 'write_thesis',
      reasoning: 'Named invalidation below the pre-print structure; time budget one session.',
    });
    session = {
      ...session,
      checklist: {
        namedInvalidation: true,
        notedRegime: true,
        consideredTimeBudget: true,
        wroteReasoning: true,
        consideredAlternative: true,
      },
    };
    session = advanceReplayTvPhase(session);
    expect(session.phase).toBe('reveal');
    expect(session.revealed).toBe(true);

    session = advanceReplayTvPhase(session);
    expect(session.phase).toBe('coaching');
    expect(session.scores?.processQuality).toBeGreaterThan(50);
    expect(session.scores?.evidenceQuality).toBeGreaterThan(0);
    expect(session.scores?.journalPrompt.toLowerCase()).toContain('process');
    expect(JSON.stringify(session.scores).toLowerCase()).not.toMatch(/p&l contest|profit target/);
  });

  it('scores process quality without using path direction as a grade', () => {
    const episode = getReplayTvEpisode('ftx-collapse')!;
    const upPath = scoreReplayTvSession({
      episode,
      decisions: [
        {
          checkpointId: 'c1',
          decision: 'protect_attention',
          reasoning:
            'Counterparty risk is opaque; skip until custody clarity improves. Alternative: wait.',
          at: Date.now(),
        },
      ],
      checklist: {
        namedInvalidation: true,
        notedRegime: true,
        consideredTimeBudget: true,
        wroteReasoning: true,
        consideredAlternative: true,
      },
    });
    const downPath = scoreReplayTvSession({
      episode: { ...episode, pathShape: 'meltup' },
      decisions: [
        {
          checkpointId: 'c1',
          decision: 'protect_attention',
          reasoning:
            'Counterparty risk is opaque; skip until custody clarity improves. Alternative: wait.',
          at: Date.now(),
        },
      ],
      checklist: {
        namedInvalidation: true,
        notedRegime: true,
        consideredTimeBudget: true,
        wroteReasoning: true,
        consideredAlternative: true,
      },
    });
    expect(upPath.overall).toBe(downPath.overall);
    expect(upPath.overall).toBeGreaterThan(60);
    expect(upPath.invalidationClarity).toBeGreaterThan(50);
    expect(upPath.academyHint?.lessonId).toBeTruthy();
  });

  it('enforces monthly free limit and premium library gates', async () => {
    const foundation = getReplayTvEpisode('tesla-rally')!;
    const expert = getReplayTvEpisode('lehman-weekend')!;
    expect(episodeRequiresPremium(expert)).toBe(true);
    expect(episodeRequiresPremium(foundation)).toBe(false);

    const premiumBlock = await evaluateReplayTvBeginAccess({
      uid: 'demo',
      episode: expert,
      isPremium: false,
    });
    expect(premiumBlock.allowed).toBe(false);
    expect(premiumBlock.reason).toBe('premium_library');

    canConsumeMonthly.mockResolvedValueOnce({ allowed: false, used: 5, limit: 5 });
    const monthlyBlock = await evaluateReplayTvBeginAccess({
      uid: 'demo',
      episode: foundation,
      isPremium: false,
    });
    expect(monthlyBlock.allowed).toBe(false);
    expect(monthlyBlock.reason).toBe('monthly_limit');

    const ok = await evaluateReplayTvBeginAccess({
      uid: 'demo',
      episode: foundation,
      isPremium: false,
    });
    expect(ok.allowed).toBe(true);
  });

  it('ranks by mentor profile and DNA growth edges', () => {
    const ranked = rankReplayTvEpisodes(REPLAY_TV_EPISODES, {
      markets: ['crypto'],
      struggles: ['fomo', 'patience'],
      styles: ['day_trading'],
      experience: 'beginner',
      growthEdges: ['Patience', 'Risk'],
      completedIds: ['covid-crash'],
    });
    expect(ranked[0]?.id).not.toBe('covid-crash');
    const dna = episodesForDnaGrowth(REPLAY_TV_EPISODES, ['Patience', 'Invalidation'], []);
    expect(dna.length).toBeGreaterThan(0);
  });

  it('builds a Journal reflection payload with process-only shape', () => {
    const episode = getReplayTvEpisode('false-breakout-drill')!;
    let session = createReplayTvSession(episode.id);
    session = advanceReplayTvPhase(session);
    session = advanceReplayTvPhase(session);
    session = advanceReplayTvPhase(session);
    session = submitReplayTvDecision({
      session,
      decision: 'wait',
      reasoning: 'Need confirmation evidence before researching further.',
    });
    const scores = scoreReplayTvSession({
      episode,
      decisions: session.decisions,
      checklist: {
        namedInvalidation: true,
        notedRegime: false,
        consideredTimeBudget: true,
        wroteReasoning: true,
        consideredAlternative: true,
      },
    });
    const reflection = buildReplayTvJournalReflection({ episode, session, scores });
    expect(reflection.episodeId).toBe(episode.id);
    expect(reflection.processScore).toBe(scores.processQuality);
    expect(reflection.body.toLowerCase()).toContain('process');

    const input = buildReplayTvJournalEntryInput(reflection, episode);
    expect(input.tags).toContain('replay-tv');
    expect(input.linkedReplayHref).toContain(episode.id);
    expect(input.notes.toLowerCase()).not.toMatch(/profit target|p&l contest/);
  });

  it('tags Decision Log notes for DNA / Passport process evidence', () => {
    const episode = getReplayTvEpisode('covid-crash')!;
    const note = buildReplayTvDecisionLogNote({
      episode,
      processQuality: 80,
      evidenceQuality: 75,
      invalidationClarity: 80,
      patience: 80,
      namedInvalidation: true,
    });
    expect(note).toContain('rtv:calm_vol');
    expect(note).toContain('rtv:evidence');
    expect(note).toContain('rtv:invalidation');
    expect(note).toContain('skills:');
  });

  it('composes a demo session without Firebase', () => {
    const session = createReplayTvSession('dotcom-bubble');
    expect(session.id).toMatch(/^rtv_/);
    expect(session.fullCandles.length).toBeGreaterThan(10);
    expect(session.revealed).toBe(false);
  });

  it('unlocks Passport process achievements from Replay TV counters', () => {
    const counts: PassportCounts = {
      journals: 0,
      replays: 10,
      disciplinedActions: 0,
      academyLessonsCompleted: 0,
      academyLessonsPracticed: 0,
      academyTotal: 0,
      checklistCompletions: 0,
      patienceActions: 0,
      riskManagedCloses: 0,
      simulatorSessions: 0,
      labCloses: 0,
      researchSessions: 0,
      replayTvEpisodes: 10,
      replayTvCalmVol: 3,
      replayTvEvidence: 3,
      replayTvInvalidation: 3,
    };
    const achievements = evaluatePassportAchievements({
      counts,
      streakDays: 0,
      consistencyScore: 0,
      unlockedDates: {},
    });
    expect(achievements.find((a) => a.id === 'replay_tv_1')?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'replay_tv_5')?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'replay_tv_10')?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'replay_tv_calm_vol')?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'replay_tv_evidence')?.unlocked).toBe(true);
    expect(achievements.find((a) => a.id === 'replay_tv_invalidation')?.unlocked).toBe(true);
  });
});
