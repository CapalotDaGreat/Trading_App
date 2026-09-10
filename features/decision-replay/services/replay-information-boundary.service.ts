import type {
  ReplayBar,
  ReplayClassifiedInformation,
  ReplayHistoricalEvent,
  ReplayLeakReport,
  ReplayNewsMeta,
  ReplayScenarioPackage,
  ReplayVisibleSlice,
} from '@/features/decision-replay/types/replay-scenario.types';
import { REPLAY_TIMESTAMP_HONESTY } from '@/features/decision-replay/types/replay-scenario.types';

export function timestampsAreOrdered(bars: ReplayBar[]): boolean {
  for (let i = 1; i < bars.length; i += 1) {
    if (bars[i]!.timestamp <= bars[i - 1]!.timestamp) return false;
  }
  return bars.length > 0;
}

export function barsAtOrBefore(bars: ReplayBar[], cutoffTimestamp: number): ReplayBar[] {
  return bars.filter((bar) => bar.timestamp <= cutoffTimestamp);
}

export function eventsAvailableAt(
  events: ReplayHistoricalEvent[],
  cutoffTimestamp: number,
): ReplayHistoricalEvent[] {
  return events
    .filter((event) => event.availableAtTimestamp <= cutoffTimestamp)
    .map((event) => ({ ...event, outcome: undefined }));
}

export function newsAvailableAt(news: ReplayNewsMeta[], cutoffTimestamp: number): ReplayNewsMeta[] {
  return news.filter((item) => item.availableAtTimestamp <= cutoffTimestamp);
}

export function visibleReplaySlice(
  scenario: ReplayScenarioPackage,
  cutoffTimestamp: number,
): ReplayVisibleSlice {
  return {
    bars: barsAtOrBefore(scenario.bars, cutoffTimestamp),
    events: eventsAvailableAt(scenario.events, cutoffTimestamp),
    news: newsAvailableAt(scenario.news, cutoffTimestamp),
    cutoffTimestamp,
  };
}

function laterEvents(events: ReplayHistoricalEvent[], cutoffTimestamp: number, revealed: boolean): ReplayHistoricalEvent[] {
  if (!revealed) return [];
  return events.filter((event) => event.availableAtTimestamp > cutoffTimestamp);
}

function laterNews(news: ReplayNewsMeta[], cutoffTimestamp: number, revealed: boolean): ReplayNewsMeta[] {
  if (!revealed) return [];
  return news.filter((item) => item.availableAtTimestamp > cutoffTimestamp);
}

/**
 * Splits a package into historical (available at T), later (after T), and educational metadata.
 * Later facts are empty until reveal.
 */
export function classifyReplayInformation(
  scenario: ReplayScenarioPackage,
  cutoffTimestamp: number,
  revealed = false,
): ReplayClassifiedInformation {
  const historical = visibleReplaySlice(scenario, cutoffTimestamp);
  return {
    cutoffTimestamp,
    historical: {
      bars: historical.bars,
      events: historical.events,
      news: historical.news,
    },
    later: {
      bars: revealed ? scenario.bars.filter((bar) => bar.timestamp > cutoffTimestamp) : [],
      events: laterEvents(scenario.events, cutoffTimestamp, revealed),
      news: laterNews(scenario.news, cutoffTimestamp, revealed),
      outcomes: revealed
        ? [
            scenario.reveal.historicalOutcome,
            ...scenario.reveal.teachingNotes,
            ...scenario.reveal.laterEventOutcomes.map((item) => item.outcome),
          ].filter(Boolean)
        : [],
    },
    educationalMetadata: {
      teaser: scenario.meta.teaser,
      eraLabel: scenario.meta.eraLabel,
      practiceDifficulty: scenario.meta.practiceDifficulty,
      provenanceNote: scenario.meta.provenanceNote,
      license: scenario.meta.license,
      timestampFidelity: scenario.meta.timestampFidelity ?? 'educational',
      timestampHonestyNote: scenario.meta.timestampHonestyNote ?? REPLAY_TIMESTAMP_HONESTY,
    },
  };
}

function blobHasFutureOutcome(blob: string, scenario: ReplayScenarioPackage, revealed: boolean): boolean {
  if (revealed) return false;
  const outcome = scenario.reveal.historicalOutcome.trim();
  if (outcome.length < 24) return false;
  return blob.toLowerCase().includes(outcome.slice(0, 24).toLowerCase());
}

/**
 * Point-in-time contract: nothing after the cutoff may appear in a blind view.
 */
export function scanReplayInformationLeaks(input: {
  scenario: ReplayScenarioPackage;
  cutoffTimestamp: number;
  revealed: boolean;
  visibleBars: ReplayBar[];
  visibleEvents?: ReplayHistoricalEvent[];
  visibleNews?: ReplayNewsMeta[];
  publicBlob?: string;
}): ReplayLeakReport {
  const reasons: string[] = [];
  const { scenario, cutoffTimestamp, revealed } = input;

  if (!timestampsAreOrdered(scenario.bars)) {
    reasons.push('bar timestamps are not strictly increasing');
  }

  for (const bar of input.visibleBars) {
    if (bar.timestamp > cutoffTimestamp) {
      reasons.push(`visible bar ${bar.timestamp} is after cutoff`);
    }
  }

  for (const event of input.visibleEvents ?? []) {
    if (event.availableAtTimestamp > cutoffTimestamp) {
      reasons.push(`event ${event.id} is not yet available`);
    }
    if (!revealed && event.outcome) {
      reasons.push(`event ${event.id} leaked an outcome before reveal`);
    }
  }

  for (const item of input.visibleNews ?? []) {
    if (item.availableAtTimestamp > cutoffTimestamp) {
      reasons.push(`news ${item.id} is not yet available`);
    }
  }

  if (!revealed) {
    for (const note of scenario.reveal.teachingNotes) {
      if (input.publicBlob?.includes(note) && note.length > 12) {
        reasons.push('teaching note leaked before reveal');
      }
    }
    if (input.publicBlob && blobHasFutureOutcome(input.publicBlob, scenario, revealed)) {
      reasons.push('historical outcome leaked before reveal');
    }
  }

  return { ok: reasons.length === 0, reasons };
}
