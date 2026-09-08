import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import { buildReplayTvDecisionLogNote } from '@/features/decision-replay-tv/services/replay-tv-access.service';
import { getReplayTvEpisode } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import type { ReplayTvDecisionRecord } from '@/features/decision-replay-tv/types/replay-tv.types';

import {
  aggregateReplayProcessEvidence,
  countReplayProcessEvidence,
  encodeReplayProcessEvidenceTags,
  inferLastReplayDecisionFromLog,
  invalidationGapWasPracticed,
  parseReplayProcessEvidence,
} from '../decision-reinforcement-log.service';

const NOW = Date.UTC(2026, 7, 10, 12, 0, 0);

function freeze(
  decision: ReplayTvDecisionRecord['decision'],
  structured?: ReplayTvDecisionRecord['structured'],
  id = 'c1',
): ReplayTvDecisionRecord {
  return {
    checkpointId: id,
    decision,
    reasoning: 'PRIVATE_REASONING_SHOULD_NOT_LEAK',
    structured,
    at: NOW,
  };
}

describe('decision reinforcement log tags', () => {
  it('counts wait + missing invalidation without copying reasoning bodies', () => {
    const counts = countReplayProcessEvidence({
      decisions: [
        freeze('wait', {
          thesis: 'SECRET_THESIS',
          evidence: 'SECRET_EVIDENCE',
          invalidation: '',
          confidence: 2,
          mainUncertainty: 'SECRET_UNCERTAINTY',
        }),
      ],
    });
    expect(counts.checkpoints).toBe(1);
    expect(counts.waits).toBe(1);
    expect(counts.missingInvalidation).toBe(1);
    expect(counts.namedInvalidation).toBe(0);
    expect(counts.thesis).toBe(1);

    const tags = encodeReplayProcessEvidenceTags(counts).join(' ');
    expect(tags).toContain('rtv:ckpt_wait:1');
    expect(tags).toContain('rtv:ckpt_miss_inv:1');
    expect(tags).not.toContain('rtv:wait:1');
    expect(tags).not.toMatch(/SECRET_|PRIVATE_/);
  });

  it('Decision Log note keeps boolean DNA needles and omits private text', () => {
    const episode = getReplayTvEpisode('covid-crash')!;
    const note = buildReplayTvDecisionLogNote({
      episode,
      processQuality: 70,
      evidenceQuality: 50,
      invalidationClarity: 40,
      patience: 55,
      namedInvalidation: false,
      decisions: [
        freeze(
          'wait',
          {
            thesis: 'SECRET_THESIS',
            evidence: 'SECRET_EVIDENCE',
            invalidation: '',
            confidence: 2,
            mainUncertainty: 'SECRET_UNCERTAINTY',
          },
          'c1',
        ),
        freeze('wait', undefined, 'c2'),
        freeze('wait', undefined, 'c3'),
      ],
    });
    expect(note).toContain('rtv:wait');
    expect(note).toContain('rtv:ckpt:3');
    expect(note).toContain('rtv:ckpt_wait:3');
    expect(note).toContain('rtv:ckpt_miss_inv:3');
    expect(note).not.toContain('SECRET_THESIS');
    expect(note).not.toContain('SECRET_EVIDENCE');
    expect(note).not.toContain('PRIVATE_REASONING');
    expect(note.includes('rtv:wait:3')).toBe(false);
  });

  it('infers last wait without invalidation from the existing log', () => {
    const records: DecisionRecord[] = [
      {
        id: 'r1',
        symbol: 'SPY',
        regime: 'trending',
        action: 'replay_completed',
        createdAt: NOW,
        decisionQualityScore: 70,
        researchValueScore: 60,
        note: 'Replay TV · Demo · process 70 · rtv:ckpt:4 rtv:ckpt_wait:4 rtv:ckpt_miss_inv:4 rtv:wait',
      },
    ];
    const inferred = inferLastReplayDecisionFromLog(records);
    expect(inferred?.decision).toBe('wait');
    expect(inferred?.namedInvalidation).toBe(false);
  });

  it('detects an invalidation gap that was later practiced', () => {
    const records: DecisionRecord[] = [
      {
        id: 'old',
        symbol: 'SPY',
        regime: 'trending',
        action: 'replay_completed',
        createdAt: NOW - 86_400_000,
        note: 'rtv:ckpt:2 rtv:ckpt_wait:2 rtv:ckpt_miss_inv:2 rtv:wait',
      },
      {
        id: 'new',
        symbol: 'SPY',
        regime: 'trending',
        action: 'replay_completed',
        createdAt: NOW,
        note: 'rtv:ckpt:2 rtv:ckpt_wait:2 rtv:ckpt_named:2 rtv:wait rtv:invalidation_named',
      },
    ];
    expect(invalidationGapWasPracticed(records, NOW - 7 * 86_400_000)).toBe(true);
    const totals = aggregateReplayProcessEvidence(records, NOW - 7 * 86_400_000);
    expect(totals.waits).toBe(4);
    expect(parseReplayProcessEvidence(records[1]?.note).missingInvalidation).toBe(0);
  });
});
