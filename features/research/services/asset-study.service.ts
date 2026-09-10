import { REPLAY_TV_EPISODES } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import { getPracticeDrill } from '@/features/practice/content/practice-drills';
import type { PracticeDrill } from '@/features/practice/content/practice-drills';
import type { DataSourceKind } from '@/features/markets/constants/data-source';
import type { RsiResult } from '@/features/charts/utils/indicators/rsi';

export type StudyConceptId =
  | 'trend'
  | 'support_resistance'
  | 'volume'
  | 'volatility'
  | 'momentum'
  | 'structure';

export interface StudyConcept {
  id: StudyConceptId;
  title: string;
  question: string;
  lessonId: string;
  practiceDrillId: string;
}

/** Concepts a chart can teach — each links to Academy + a matching drill. */
export const STUDY_CONCEPTS: readonly StudyConcept[] = [
  {
    id: 'trend',
    title: 'Trend',
    question: 'Are swings making higher highs, lower lows, or overlapping?',
    lessonId: 'ta-trend-range',
    practiceDrillId: 'identify-trend',
  },
  {
    id: 'support_resistance',
    title: 'Support & Resistance',
    question: 'Where has the auction repeatedly paused?',
    lessonId: 'ta-structure',
    practiceDrillId: 'find-support',
  },
  {
    id: 'volume',
    title: 'Volume',
    question: 'Did participation expand with the move, or was it thin?',
    lessonId: 'ta-volume',
    practiceDrillId: 'breakout-quality',
  },
  {
    id: 'volatility',
    title: 'Volatility',
    question: 'How wide is the recent range relative to the usual tape?',
    lessonId: 'risk-position-sizing',
    practiceDrillId: 'position-size',
  },
  {
    id: 'momentum',
    title: 'Momentum',
    question: 'How one-sided have recent closes been — and what that cannot prove?',
    lessonId: 'ta-momentum',
    practiceDrillId: 'missing-evidence',
  },
  {
    id: 'structure',
    title: 'Market Structure',
    question: 'What would have to break before a thesis is invalid?',
    lessonId: 'ta-structure',
    practiceDrillId: 'breakout-quality',
  },
] as const;

export interface StudyProvenance {
  kindLabel: string;
  sourceLabel: string;
  detail: string;
  isLiveImplied: boolean;
}

export function describeStudyProvenance(input: {
  kind?: DataSourceKind;
  provider?: string;
}): StudyProvenance {
  const provider = (input.provider ?? '').toLowerCase();
  const synthetic = provider.includes('synthetic') || input.kind === 'mock';
  const external =
    provider.includes('finnhub') ||
    provider.includes('alpha') ||
    provider.includes('coingecko') ||
    provider.includes('exchange-rate');

  if (synthetic || input.kind === 'mock') {
    return {
      kindLabel: 'Synthetic',
      sourceLabel: 'Generated for study',
      detail: 'This tape is built for practice. It is not a live market and not a quote to trade.',
      isLiveImplied: false,
    };
  }
  if (input.kind === 'sample') {
    return {
      kindLabel: 'Sample',
      sourceLabel: external ? 'Externally sourced sample' : 'Educational sample',
      detail: 'Sample candles for study. Do not treat them as a live, complete book.',
      isLiveImplied: false,
    };
  }
  if (input.kind === 'delayed') {
    return {
      kindLabel: 'Delayed',
      sourceLabel: external ? 'Externally sourced · delayed' : 'Delayed',
      detail: 'Prints are delayed. This is historical context, not a live trading board.',
      isLiveImplied: false,
    };
  }
  if (input.kind === 'approximate') {
    return {
      kindLabel: 'Approximate',
      sourceLabel: 'Teaching chart',
      detail: 'An approximate educational chart. Useful for concepts, not for execution.',
      isLiveImplied: false,
    };
  }
  if (input.kind === 'live') {
    return {
      kindLabel: 'Live or near-live',
      sourceLabel: external ? 'Externally sourced' : 'Vendor print',
      detail: 'A recent print for context. It is still not a recommendation to buy or sell.',
      isLiveImplied: true,
    };
  }
  return {
    kindLabel: 'Source pending',
    sourceLabel: 'Unlabelled',
    detail: 'Provenance is not confirmed yet. Do not assume this is live data.',
    isLiveImplied: false,
  };
}

export function findStudyReplayEpisodes(symbol: string, limit = 2): ReplayTvEpisode[] {
  const needle = symbol.trim().toUpperCase();
  if (!needle) return [];
  const compact = needle.replace(/[^A-Z0-9]/g, '');
  return REPLAY_TV_EPISODES.filter((episode) => {
    const ep = episode.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const label = episode.symbolLabel.toUpperCase();
    return ep === compact || ep.startsWith(compact) || compact.startsWith(ep) || label.includes(needle);
  }).slice(0, limit);
}

export function studyDrillsForConcepts(concepts: readonly StudyConcept[] = STUDY_CONCEPTS): PracticeDrill[] {
  const ids = [...new Set(concepts.map((item) => item.practiceDrillId))];
  return ids
    .map((id) => getPracticeDrill(id))
    .filter((drill): drill is PracticeDrill => Boolean(drill));
}

export function educationalRsiReading(rsi: unknown): { value: string; lessonHint: string } | null {
  const result = rsi as RsiResult | undefined;
  const last = result?.values?.at(-1)?.value;
  if (last == null || !Number.isFinite(last)) return null;
  return {
    value: last.toFixed(0),
    lessonHint: 'Learn what a stretched reading can and cannot tell you.',
  };
}
