import { ingestReplayDecision, useCompetencyEvidenceStore } from '@/features/competency';
import {
  eventsAvailableAt,
  scanReplayInformationLeaks,
  timestampsAreOrdered,
  visibleReplaySlice,
} from '../replay-information-boundary.service';
import { canRevealReplay, resetReplaySessionState } from '../replay-lifecycle.service';
import { replayConcealsCompetency, replayPracticeDifficulty } from '../replay-practice-difficulty.service';
import { gradeReplayProcess } from '../replay-process-grade.service';
import { toReplayScenarioPackage } from '@/features/decision-replay-tv/services/replay-scenario.adapter';
import { getReplayTvEpisode } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import {
  advanceReplayTvPhase,
  advanceReplayTvReveal,
  canRevealReplayTvSession,
  createReplayTvSession,
  getBlindSafeEpisodeView,
  getFrozenCandlesForSession,
  replayTvHasFutureLeak,
  submitReplayTvDecision,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import { scoreReplayTvSession } from '@/features/decision-replay-tv/services/replay-tv-score.service';
import { buildReplayLabReview } from '@/features/decision-replay-tv/services/replay-tv-review.service';

function advanceToDecision(session: ReturnType<typeof createReplayTvSession>) {
  let next = session;
  next = advanceReplayTvPhase(next);
  next = advanceReplayTvPhase(next);
  next = advanceReplayTvPhase(next);
  next = advanceReplayTvPhase(next);
  next = advanceReplayTvPhase(next);
  next = advanceReplayTvPhase(next);
  next = advanceReplayTvPhase(next);
  return next;
}

const PLAN = {
  namedInvalidation: true,
  notedRegime: true,
  consideredTimeBudget: true,
  wroteReasoning: true,
  consideredAlternative: true,
} as const;

describe('TradeAcademy replay engine', () => {
  beforeEach(() => {
    useCompetencyEvidenceStore.getState().resetAll();
  });

  it('builds a vendor-neutral package from an educational episode', () => {
    const episode = getReplayTvEpisode('nfp-surprise-lab')!;
    const scenario = toReplayScenarioPackage(episode);
    expect(scenario.schemaVersion).toBe(1);
    expect(scenario.meta.license).toBe('educational_sample');
    expect(scenario.meta.dataKind).toBe('sample');
    expect(scenario.instrument.symbol).toBe(episode.symbol);
    expect(scenario.timeframe).toBe(episode.interval);
    expect(timestampsAreOrdered(scenario.bars)).toBe(true);
    expect(scenario.decisionTimestamp).toBeLessThanOrEqual(scenario.informationCutoff);
    expect(scenario.reveal.historicalOutcome.length).toBeGreaterThan(20);
  });

  it('does not leak future bars, news, events, or outcome copy before reveal', () => {
    const episode = getReplayTvEpisode('nvidia-earnings')!;
    const scenario = toReplayScenarioPackage(episode);
    const slice = visibleReplaySlice(scenario, scenario.informationCutoff);
    expect(slice.bars.every((bar) => bar.timestamp <= scenario.informationCutoff)).toBe(true);
    expect(slice.news.every((item) => item.availableAtTimestamp <= scenario.informationCutoff)).toBe(true);
    expect(slice.events.every((item) => !item.outcome)).toBe(true);

    const leak = scanReplayInformationLeaks({
      scenario,
      cutoffTimestamp: scenario.informationCutoff,
      revealed: false,
      visibleBars: slice.bars,
      visibleEvents: slice.events,
      visibleNews: slice.news,
      publicBlob: JSON.stringify({ teaser: scenario.meta.teaser, news: slice.news }),
    });
    expect(leak.reasons).toEqual([]);
    expect(leak.ok).toBe(true);

    let session = createReplayTvSession(episode.id);
    session = advanceToDecision(session);
    expect(replayTvHasFutureLeak(session)).toBe(false);
    expect(getBlindSafeEpisodeView(session).historicalOutcome).toBeNull();
  });

  it('keeps historical event availability on the cutoff', () => {
    const scenario = toReplayScenarioPackage(getReplayTvEpisode('fomc-decision-lab')!);
    const later = scenario.news[scenario.news.length - 1];
    if (!later) return;
    const before = later.availableAtTimestamp - 1;
    expect(eventsAvailableAt(scenario.events, before).every((item) => item.availableAtTimestamp <= before)).toBe(
      true,
    );
    const at = eventsAvailableAt(scenario.events, later.availableAtTimestamp);
    expect(at.some((item) => item.id === `evt_${later.id}`)).toBe(true);
  });

  it('commits a decision and reveals only afterward', () => {
    let session = advanceToDecision(createReplayTvSession('ecb-decision-week'));
    expect(canRevealReplayTvSession(session)).toBe(false);
    expect(
      canRevealReplay({
        committedDecisions: session.decisions.length,
        requiredDecisions: 2,
      }),
    ).toBe(false);

    const forced = advanceReplayTvReveal({ ...session, revealed: true, phase: 'reveal' }, 8);
    expect(forced.revealCursor).toBeUndefined();

    session = submitReplayTvDecision({
      session,
      decision: 'wait',
      reasoning: 'Binary event. I will not size into an unknown statement.',
      structured: {
        thesis: 'No edge into the print',
        evidence: 'Calendar event only',
        invalidation: 'I would need a post-statement structure',
        confidence: 3,
        mainUncertainty: 'The wording',
        alternatives: 'Wait, skip, or research another name',
        intendedSize: 'Zero',
        expectedRisk: 'Gap risk through any tight stop',
      },
    });
    expect(session.decisions[0]?.committedBlind).toBe(true);
    expect(session.revealed).toBe(false);
    expect(getFrozenCandlesForSession(session).length).toBeLessThan(session.fullCandles.length);

    session = submitReplayTvDecision({
      session: { ...session, phase: 'decision' },
      decision: 'no_trade',
      reasoning: 'Still unknown. Stand aside.',
    });
    expect(canRevealReplayTvSession(session)).toBe(true);
    session = advanceReplayTvPhase(session);
    expect(session.phase).toBe('reveal');
    expect(session.revealed).toBe(true);
  });

  it('writes competency evidence from a replay decision', () => {
    ingestReplayDecision({
      uid: 'user-replay',
      episodeId: 'false-breakout-drill',
      checkpointId: 'c1',
      skills: ['invalidation', 'structure'],
      processQuality: 72,
      scenarioContext: 'range',
    });
    const rows = useCompetencyEvidenceStore.getState().evidenceFor('user-replay');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((item) => item.sourceType === 'replay_decision')).toBe(true);
    expect(rows.some((item) => item.conceptId === 'invalidation')).toBe(true);
  });

  it('grades process the same after a win or a loss', () => {
    const episode = getReplayTvEpisode('false-breakout-drill')!;
    const decisions = [
      {
        checkpointId: 'c1',
        decision: 'enter' as const,
        reasoning: 'Level held. Invalidation is a close back through the range.',
        structured: {
          thesis: 'Continuation if the freeze close holds',
          evidence: 'Wick through without acceptance, then reclaim',
          invalidation: 'A close back inside the range',
          confidence: 2,
          mainUncertainty: 'Whether the next freeze confirms',
          alternatives: 'Skip or wait',
          intendedSize: '0.5% of equity to the stop',
          expectedRisk: '0.5% if invalidated',
          riskAssessment: 'False break is the main risk',
        },
        at: Date.now(),
        committedBlind: true,
      },
    ];
    const lose = gradeReplayProcess({
      episode,
      decisions,
      checklist: PLAN,
      freezeClose: 100,
      laterClose: 88,
      revealed: true,
    });
    const win = gradeReplayProcess({
      episode,
      decisions,
      checklist: PLAN,
      freezeClose: 100,
      laterClose: 112,
      revealed: true,
    });
    expect(lose.composite).toBe(win.composite);
    expect(lose.outcomeNote).toMatch(/moved against your thesis/i);
    expect(win.outcomeNote.toLowerCase()).not.toMatch(/you were wrong because price/);
    expect(lose.reminder).toBe('Outcome does not determine decision quality.');
    expect(win.knewThen.toLowerCase()).toContain('what you knew then');
    expect(win.happenedAfter.toLowerCase()).toContain('what happened afterward');

    const oversized = gradeReplayProcess({
      episode,
      decisions: [
        {
          ...decisions[0]!,
          decision: 'enter',
          structured: {
            ...decisions[0]!.structured!,
            intendedSize: '',
            expectedRisk: '',
            riskAssessment: '',
          },
        },
      ],
      checklist: { ...PLAN, namedInvalidation: false },
      freezeClose: 100,
      laterClose: 120,
      revealed: true,
    });
    expect(oversized.outcomeNote).toMatch(/exceeded your stated risk/i);
  });

  it('resets a scenario to a blind intro', () => {
    const live = createReplayTvSession('tesla-rally');
    const advanced = advanceToDecision(live);
    const reset = createReplayTvSession(advanced.episodeId);
    const snapshot = resetReplaySessionState();
    expect(reset.phase).toBe(snapshot.phase);
    expect(reset.revealed).toBe(false);
    expect(reset.decisions).toEqual([]);
    expect(reset.checkpointIndex).toBe(0);
    expect(getBlindSafeEpisodeView(reset).historicalOutcome).toBeNull();
  });

  it('conceals competency on advanced and mixed rooms', () => {
    expect(replayPracticeDifficulty(getReplayTvEpisode('tesla-rally')!)).toBe('beginner');
    expect(replayConcealsCompetency(getReplayTvEpisode('tesla-rally')!)).toBe(false);
    expect(replayPracticeDifficulty(getReplayTvEpisode('gold-regime-risk')!)).toBe('mixed');
    expect(replayConcealsCompetency(getReplayTvEpisode('gold-regime-risk')!)).toBe(true);
    expect(replayConcealsCompetency(getReplayTvEpisode('lehman-weekend')!)).toBe(true);
  });

  it('builds a review that separates then vs after', () => {
    const episode = getReplayTvEpisode('covid-crash')!;
    const scores = scoreReplayTvSession({
      episode,
      decisions: [
        {
          checkpointId: 'c1',
          decision: 'protect_attention',
          reasoning: 'Volatility is rising. Invalidation is a time budget of one session.',
          at: Date.now(),
          committedBlind: true,
        },
      ],
      checklist: PLAN,
    });
    const review = buildReplayLabReview({
      episode,
      session: {
        ...createReplayTvSession(episode.id),
        revealed: true,
        scores,
        decisions: scores ? [{ checkpointId: 'c1', decision: 'protect_attention', reasoning: 'Stand down', at: Date.now() }] : [],
      },
      scores,
    });
    expect(review.knewThen.toLowerCase()).toContain('what you knew then');
    expect(review.happenedAfter.toLowerCase()).toContain('what happened afterward');
    expect(review.reminder).toBe('Outcome does not determine decision quality.');
    expect(JSON.stringify(review).toLowerCase()).not.toMatch(/you were wrong because price fell/);
  });
});
