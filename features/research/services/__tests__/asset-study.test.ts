import { getLocalLessonById } from '@/features/academy/content';

import {
  STUDY_CONCEPTS,
  describeStudyProvenance,
  educationalRsiReading,
  findStudyReplayEpisodes,
  studyDrillsForConcepts,
} from '../asset-study.service';

describe('asset study helpers', () => {
  it('never labels synthetic or sample data as live', () => {
    expect(describeStudyProvenance({ kind: 'mock', provider: 'synthetic' }).isLiveImplied).toBe(
      false,
    );
    expect(describeStudyProvenance({ kind: 'sample' }).kindLabel).toBe('Sample');
    expect(describeStudyProvenance({ kind: 'delayed', provider: 'finnhub' }).detail).toMatch(
      /delayed|historical/i,
    );
    expect(describeStudyProvenance({}).kindLabel).toBe('Source pending');
  });

  it('links every study concept to a real lesson and drill', () => {
    for (const concept of STUDY_CONCEPTS) {
      expect(getLocalLessonById(concept.lessonId)?.id).toBe(concept.lessonId);
    }
    expect(studyDrillsForConcepts().length).toBeGreaterThanOrEqual(4);
  });

  it('finds historical rooms by symbol without inventing trades', () => {
    const nvidia = findStudyReplayEpisodes('NVDA');
    expect(nvidia[0]?.symbol).toBe('NVDA');
    expect(findStudyReplayEpisodes('ZZZZNOPE')).toEqual([]);
  });

  it('shows RSI as a number, not an overbought signal', () => {
    const reading = educationalRsiReading({
      period: 14,
      values: [{ timestamp: 1, value: 72.4 }],
    });
    expect(reading?.value).toBe('72');
    expect(`${reading?.value} ${reading?.lessonHint}`.toLowerCase()).not.toMatch(
      /overbought|buy|sell|signal/,
    );
  });
});
