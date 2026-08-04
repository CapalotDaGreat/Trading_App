import { getReplayTvEpisode, REPLAY_TV_EPISODES } from '../../content/replay-tv.catalog';
import { buildEducationalCandles, visibleCandlesAt } from '../replay-tv-path.service';
import { scoreReplayTvSession } from '../replay-tv-score.service';
import {
  advanceReplayTvPhase,
  createReplayTvSession,
  getVisibleCandlesForSession,
  submitReplayTvDecision,
} from '../replay-tv-session.service';

describe('Decision Replay TV', () => {
  it('ships a curated catalog of historical episodes', () => {
    expect(REPLAY_TV_EPISODES.length).toBeGreaterThanOrEqual(10);
    expect(getReplayTvEpisode('covid-crash')?.title).toMatch(/COVID/i);
    expect(getReplayTvEpisode('gamestop-squeeze')).toBeTruthy();
    for (const episode of REPLAY_TV_EPISODES) {
      expect(episode.dataKind).toBe('sample');
      expect(episode.historicalOutcome.length).toBeGreaterThan(40);
      expect(episode.teaser.toLowerCase()).not.toMatch(/bought the bottom|guaranteed/);
      expect(episode.checkpoints.length).toBeGreaterThan(0);
    }
  });

  it('builds deterministic educational candles and hides the future', () => {
    const episode = getReplayTvEpisode('covid-crash')!;
    const a = buildEducationalCandles(episode);
    const b = buildEducationalCandles(episode);
    expect(a).toHaveLength(episode.barCount);
    expect(a[10]?.close).toBe(b[10]?.close);

    const freeze = episode.checkpoints[0]!.freezeIndex;
    const visible = visibleCandlesAt(a, freeze);
    expect(visible).toHaveLength(freeze + 1);
    expect(visible[visible.length - 1]?.timestamp).toBe(a[freeze]?.timestamp);
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
      },
    };
    session = advanceReplayTvPhase(session);
    expect(session.phase).toBe('reveal');
    expect(session.revealed).toBe(true);

    session = advanceReplayTvPhase(session);
    expect(session.phase).toBe('coaching');
    expect(session.scores?.processQuality).toBeGreaterThan(50);
    expect(session.scores?.journalPrompt.toLowerCase()).toContain('process');
    expect(JSON.stringify(session.scores).toLowerCase()).not.toMatch(/p&l contest|profit target/);
  });

  it('scores process quality without using path direction as a grade', () => {
    const episode = getReplayTvEpisode('ftx-collapse')!;
    const scores = scoreReplayTvSession({
      episode,
      decisions: [
        {
          checkpointId: 'c1',
          decision: 'protect_attention',
          reasoning: 'Counterparty risk is opaque; skip until custody clarity improves.',
          at: Date.now(),
        },
      ],
      checklist: {
        namedInvalidation: true,
        notedRegime: true,
        consideredTimeBudget: true,
        wroteReasoning: true,
      },
    });
    expect(scores.overall).toBeGreaterThan(60);
    expect(scores.academyHint?.lessonId).toBeTruthy();
  });
});
