import type {
  CompetencyEvidenceRecord,
  CompetencyEvidenceType,
  CompetencyScenarioContext,
  JournalEvidenceSignals,
  ProcessFlags,
  ProcessMetrics,
} from '@/features/competency/types/competency.types';

import { MISTAKE_LIBRARY_DISCLAIMER, MISTAKE_PATTERN_CATALOG } from '../content/mistake-pattern-catalog';
import type {
  AnalyticsSafeMistakeSummary,
  ComposeMistakeLibraryInput,
  MistakeEvidenceKey,
  MistakeImprovementEvidence,
  MistakeImprovementTrend,
  MistakeLibrarySnapshot,
  MistakeObservation,
  MistakePatternDefinition,
  MistakePatternId,
  MistakePatternRecord,
  MistakeRecommendationPriority,
  MistakeTrainingLink,
} from '../types/mistake-library.types';

const DAY = 24 * 60 * 60 * 1000;
const HALF_LIFE_DAYS = 14;
const RECENT_WINDOW_MS = 21 * DAY;
const TREND_WINDOW_MS = 14 * DAY;
const CLUSTER_MS = 2 * 60 * 60 * 1000;
const EXCESSIVE_WINDOW_MS = 24 * 60 * 60 * 1000;
const EXCESSIVE_DECISION_COUNT = 6;
const REVIEW_LOOKBACK_MS = 14 * DAY;
const REVIEW_FOLLOWUP_MS = 2 * DAY;
const REVIEW_GAP_MIN_DECISIONS = 3;
const APPLICATION_SOURCES = new Set<CompetencyEvidenceType>([
  'simulation_decision',
  'replay_decision',
  'simulation_checkpoint',
  're_demonstration',
  'transfer_exercise',
]);
const ENTRY_SOURCES = new Set<CompetencyEvidenceType>(['simulation_decision', 'replay_decision']);
const REVIEW_SOURCES = new Set<CompetencyEvidenceType>(['journal_reflection', 'review_finding']);
const EVENT_CONTEXTS = new Set<CompetencyScenarioContext>(['earnings', 'event_window']);
const JUDGMENTAL =
  /\b(emotional trader|you are an? |disorder|addicted|compulsive|diagnos|adhd|mentally|gambling addict|tilt junkie)\b/i;

interface DecisionEvent {
  uid: string;
  sourceType: CompetencyEvidenceType;
  sourceId: string;
  occurredAt: number;
  result: CompetencyEvidenceRecord['result'];
  independent: boolean;
  conceptIds: string[];
  flags: ProcessFlags;
  metrics: ProcessMetrics;
  journalSignals?: JournalEvidenceSignals;
  scenarioContext?: CompetencyScenarioContext;
}

function emptyLibrary(uid: string, now: number): MistakeLibrarySnapshot {
  return {
    uid,
    generatedAt: now,
    patterns: [],
    activePatternIds: [],
    disclaimer: MISTAKE_LIBRARY_DISCLAIMER,
  };
}

function recencyWeight(at: number, now: number): number {
  const ageDays = Math.max(0, (now - at) / DAY);
  return 2 ** (-ageDays / HALF_LIFE_DAYS);
}

function mergeFlags(a: ProcessFlags | undefined, b: ProcessFlags | undefined): ProcessFlags {
  return {
    exceededRiskLimit: Boolean(a?.exceededRiskLimit || b?.exceededRiskLimit),
    movedInvalidation: Boolean(a?.movedInvalidation || b?.movedInvalidation),
    missingInvalidation: Boolean(a?.missingInvalidation || b?.missingInvalidation),
    missingThesis: Boolean(a?.missingThesis || b?.missingThesis),
    missingEvidence: Boolean(a?.missingEvidence || b?.missingEvidence),
    fomoEntry: Boolean(a?.fomoEntry || b?.fomoEntry),
  };
}

function minMetric(a: number | undefined, b: number | undefined): number | undefined {
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}

function mergeMetrics(a: ProcessMetrics | undefined, b: ProcessMetrics | undefined): ProcessMetrics {
  return {
    processQuality: minMetric(a?.processQuality, b?.processQuality),
    thesis: minMetric(a?.thesis, b?.thesis),
    evidence: minMetric(a?.evidence, b?.evidence),
    invalidation: minMetric(a?.invalidation, b?.invalidation),
    risk: minMetric(a?.risk, b?.risk),
    discipline: minMetric(a?.discipline, b?.discipline),
    positionSizing: minMetric(a?.positionSizing, b?.positionSizing),
    uncertainty: minMetric(a?.uncertainty, b?.uncertainty),
    confirmation: minMetric(a?.confirmation, b?.confirmation),
    eventAwareness: minMetric(a?.eventAwareness, b?.eventAwareness),
    emotionalDiscipline: minMetric(a?.emotionalDiscipline, b?.emotionalDiscipline),
    reflection: minMetric(a?.reflection, b?.reflection),
    flags: mergeFlags(a?.flags, b?.flags),
  };
}

function mergeJournal(
  a: JournalEvidenceSignals | undefined,
  b: JournalEvidenceSignals | undefined,
): JournalEvidenceSignals | undefined {
  if (!a) return b;
  if (!b) return a;
  const specRank = { absent: 0, vague: 1, specific: 2 };
  const specificity = specRank[a.thesisSpecificity] <= specRank[b.thesisSpecificity] ? a.thesisSpecificity : b.thesisSpecificity;
  return {
    thesisPresent: a.thesisPresent && b.thesisPresent,
    thesisSpecificity: specificity,
    invalidationPresent: a.invalidationPresent && b.invalidationPresent,
    riskConsidered: a.riskConsidered && b.riskConsidered,
    uncertaintyAcknowledged: a.uncertaintyAcknowledged || b.uncertaintyAcknowledged,
    reflectionCompleted: a.reflectionCompleted && b.reflectionCompleted,
  };
}

function toDecisionEvents(records: readonly CompetencyEvidenceRecord[]): DecisionEvent[] {
  const map = new Map<string, DecisionEvent>();
  for (const row of records) {
    const key = `${row.sourceType}|${row.sourceId}|${row.occurredAt}`;
    const flags = mergeFlags(row.processMetrics?.flags, undefined);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        uid: row.uid,
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        occurredAt: row.occurredAt,
        result: row.result,
        independent: row.independent,
        conceptIds: [row.conceptId, ...(row.interactingConceptIds ?? [])],
        flags,
        metrics: mergeMetrics(row.processMetrics, { flags }),
        journalSignals: row.journalSignals,
        scenarioContext: row.scenarioContext,
      });
      continue;
    }
    existing.independent = existing.independent && row.independent;
    if (row.result === 'fail' || (row.result === 'partial' && existing.result !== 'fail')) {
      existing.result = row.result;
    }
    existing.conceptIds = [...new Set([...existing.conceptIds, row.conceptId, ...(row.interactingConceptIds ?? [])])];
    existing.flags = mergeFlags(existing.flags, row.processMetrics?.flags);
    existing.metrics = mergeMetrics(existing.metrics, { ...row.processMetrics, flags: existing.flags });
    existing.journalSignals = mergeJournal(existing.journalSignals, row.journalSignals);
    existing.scenarioContext = existing.scenarioContext ?? row.scenarioContext;
  }
  return [...map.values()].sort((a, b) => a.occurredAt - b.occurredAt);
}

function observation(
  event: Pick<DecisionEvent, 'sourceType' | 'sourceId' | 'occurredAt' | 'conceptIds' | 'scenarioContext'>,
  keys: MistakeEvidenceKey[],
): MistakeObservation {
  return {
    at: event.occurredAt,
    sourceType: event.sourceType,
    sourceId: event.sourceId,
    conceptIds: [...new Set(event.conceptIds)],
    scenarioContext: event.scenarioContext,
    evidenceKeys: keys,
  };
}

function detectForEvent(event: DecisionEvent): Array<{ id: MistakePatternId; keys: MistakeEvidenceKey[] }> {
  const hits: Array<{ id: MistakePatternId; keys: MistakeEvidenceKey[] }> = [];
  const flags = event.flags;
  const metrics = event.metrics;
  const journal = event.journalSignals;
  const isEntry = ENTRY_SOURCES.has(event.sourceType);
  const isApplication = APPLICATION_SOURCES.has(event.sourceType);

  if (flags.fomoEntry) {
    hits.push({ id: 'fomo_chase', keys: ['flags.fomoEntry'] });
  }
  if (isEntry && flags.missingThesis && flags.missingInvalidation) {
    hits.push({ id: 'premature_entry', keys: ['flags.missingThesis', 'flags.missingInvalidation'] });
  }
  if (
    isApplication &&
    ((metrics.confirmation != null && metrics.confirmation < 40) ||
      (flags.missingEvidence && metrics.confirmation != null && metrics.confirmation < 55))
  ) {
    hits.push({
      id: 'confirmation_seeking',
      keys: metrics.confirmation != null && metrics.confirmation < 40 ? ['metrics.confirmation'] : ['flags.missingEvidence', 'metrics.confirmation'],
    });
  }
  if (
    (flags.exceededRiskLimit && (flags.fomoEntry || flags.missingInvalidation)) ||
    (flags.exceededRiskLimit && metrics.emotionalDiscipline != null && metrics.emotionalDiscipline < 40)
  ) {
    const keys: MistakeEvidenceKey[] = ['flags.exceededRiskLimit'];
    if (flags.fomoEntry) keys.push('flags.fomoEntry');
    if (flags.missingInvalidation) keys.push('flags.missingInvalidation');
    if (metrics.emotionalDiscipline != null && metrics.emotionalDiscipline < 40) keys.push('metrics.emotionalDiscipline');
    hits.push({ id: 'conviction_without_process', keys });
  }
  if (flags.missingInvalidation || flags.movedInvalidation) {
    hits.push({
      id: 'insufficient_invalidation',
      keys: flags.movedInvalidation ? ['flags.movedInvalidation'] : ['flags.missingInvalidation'],
    });
  }
  if (flags.exceededRiskLimit) {
    hits.push({ id: 'oversized_position', keys: ['flags.exceededRiskLimit'] });
  }
  if (
    flags.missingThesis ||
    (journal && (journal.thesisSpecificity === 'absent' || journal.thesisSpecificity === 'vague'))
  ) {
    const keys: MistakeEvidenceKey[] = flags.missingThesis ? ['flags.missingThesis'] : ['journal.thesisSpecificity'];
    hits.push({ id: 'unclear_thesis', keys });
  }
  if (flags.missingEvidence || (isApplication && metrics.evidence != null && metrics.evidence < 35)) {
    hits.push({
      id: 'skipped_conflicting_evidence',
      keys: flags.missingEvidence ? ['flags.missingEvidence'] : ['metrics.evidence'],
    });
  }
  if (
    EVENT_CONTEXTS.has(event.scenarioContext as CompetencyScenarioContext) &&
    (flags.missingEvidence || (metrics.eventAwareness != null && metrics.eventAwareness < 40) || event.conceptIds.includes('event-risk') && event.result === 'fail')
  ) {
    const keys: MistakeEvidenceKey[] =
      metrics.eventAwareness != null && metrics.eventAwareness < 40 ? ['metrics.eventAwareness'] : ['flags.missingEvidence'];
    hits.push({ id: 'event_risk_neglect', keys });
  }
  if (event.conceptIds.includes('event-risk') && event.result === 'fail' && isApplication) {
    if (!hits.some((row) => row.id === 'event_risk_neglect')) {
      hits.push({ id: 'event_risk_neglect', keys: ['metrics.eventAwareness'] });
    }
  }

  return hits;
}

function processMiss(event: DecisionEvent): boolean {
  return (
    event.result === 'fail' ||
    event.scenarioContext === 'losing_position' ||
    Boolean(event.flags.fomoEntry || event.flags.exceededRiskLimit || event.flags.missingInvalidation)
  );
}

function detectClusters(events: DecisionEvent[]): MistakeObservation[] {
  const out: MistakeObservation[] = [];
  const entries = events.filter((row) => ENTRY_SOURCES.has(row.sourceType));
  for (let i = 1; i < entries.length; i += 1) {
    const prev = entries[i - 1]!;
    const next = entries[i]!;
    if (next.occurredAt - prev.occurredAt > CLUSTER_MS) continue;
    if (!processMiss(prev)) continue;
    out.push(
      observation(next, ['cluster.after_process_miss']),
    );
  }
  return out;
}

function detectHighFrequency(
  events: DecisionEvent[],
  behaviorEvents: ComposeMistakeLibraryInput['behaviorEvents'],
): MistakeObservation[] {
  const out: MistakeObservation[] = [];
  const entries = events.filter((row) => ENTRY_SOURCES.has(row.sourceType));
  for (let i = 0; i < entries.length; i += 1) {
    const start = entries[i]!.occurredAt;
    const window = entries.filter((row) => row.occurredAt >= start && row.occurredAt <= start + EXCESSIVE_WINDOW_MS);
    if (window.length < EXCESSIVE_DECISION_COUNT) continue;
    const last = window[window.length - 1]!;
    const key = `cluster:frequency:${Math.floor(last.occurredAt / EXCESSIVE_WINDOW_MS)}`;
    if (out.some((row) => row.sourceId === key)) continue;
    out.push({
      at: last.occurredAt,
      sourceType: 'behavior_cluster',
      sourceId: key,
      conceptIds: [...new Set(window.flatMap((row) => row.conceptIds))],
      scenarioContext: last.scenarioContext,
      evidenceKeys: ['cluster.high_frequency'],
    });
  }
  const opens = (behaviorEvents ?? []).filter((row) => row.type === 'activity_opened').sort((a, b) => a.occurredAt - b.occurredAt);
  for (let i = 0; i < opens.length; i += 1) {
    const start = opens[i]!.occurredAt;
    const window = opens.filter((row) => row.occurredAt >= start && row.occurredAt <= start + EXCESSIVE_WINDOW_MS);
    if (window.length < 8) continue;
    const last = window[window.length - 1]!;
    const key = `cluster:opens:${Math.floor(last.occurredAt / EXCESSIVE_WINDOW_MS)}`;
    if (out.some((row) => row.sourceId === key)) continue;
    out.push({
      at: last.occurredAt,
      sourceType: 'behavior_cluster',
      sourceId: key,
      conceptIds: ['decision-process'],
      evidenceKeys: ['cluster.high_frequency'],
    });
  }
  return out;
}

function detectReviewGaps(events: DecisionEvent[]): MistakeObservation[] {
  const reviews = events.filter((row) => REVIEW_SOURCES.has(row.sourceType));
  const entries = events.filter((row) => ENTRY_SOURCES.has(row.sourceType));
  const out: MistakeObservation[] = [];
  for (const event of entries) {
    const followed = reviews.some(
      (row) => row.occurredAt >= event.occurredAt && row.occurredAt <= event.occurredAt + REVIEW_FOLLOWUP_MS,
    );
    const reflected = event.journalSignals?.reflectionCompleted === true || (event.metrics.reflection != null && event.metrics.reflection >= 60);
    if (followed || reflected) continue;
    out.push(observation(event, ['gap.unreviewed_decision']));
  }
  return out;
}

function improvementFor(
  id: MistakePatternId,
  events: DecisionEvent[],
  observations: MistakeObservation[],
): MistakeImprovementEvidence | null {
  if (!observations.length) return null;
  const lastObs = observations[observations.length - 1]!.at;
  const obsContexts = new Set(observations.map((row) => row.scenarioContext).filter(Boolean));
  const related = new Set(MISTAKE_PATTERN_CATALOG.find((row) => row.id === id)?.affectedConcepts ?? []);

  for (const event of events) {
    if (event.occurredAt <= lastObs) continue;
    if (!event.independent) continue;
    if (event.result !== 'pass' && event.result !== 'observed') continue;
    if (!event.conceptIds.some((conceptId) => related.has(conceptId))) continue;
    if (!clearsPattern(id, event)) continue;
    const context = event.scenarioContext;
    return {
      at: event.occurredAt,
      sourceId: event.sourceId,
      conceptId: event.conceptIds.find((conceptId) => related.has(conceptId)) ?? event.conceptIds[0]!,
      scenarioContext: context,
      verifiedInNewContext: Boolean(context && !obsContexts.has(context)),
    };
  }
  return null;
}

function clearsPattern(id: MistakePatternId, event: DecisionEvent): boolean {
  switch (id) {
    case 'fomo_chase':
      return !event.flags.fomoEntry;
    case 'premature_entry':
      return !(event.flags.missingThesis && event.flags.missingInvalidation);
    case 'confirmation_seeking':
      return !event.flags.missingEvidence && (event.metrics.confirmation == null || event.metrics.confirmation >= 60);
    case 'conviction_without_process':
      return !event.flags.exceededRiskLimit && !event.flags.fomoEntry;
    case 'insufficient_invalidation':
      return !event.flags.missingInvalidation && !event.flags.movedInvalidation;
    case 'oversized_position':
      return !event.flags.exceededRiskLimit;
    case 'unclear_thesis':
      return !event.flags.missingThesis && event.journalSignals?.thesisSpecificity !== 'vague' && event.journalSignals?.thesisSpecificity !== 'absent';
    case 'skipped_conflicting_evidence':
      return !event.flags.missingEvidence && (event.metrics.evidence == null || event.metrics.evidence >= 60);
    case 'event_risk_neglect':
      return event.metrics.eventAwareness == null || event.metrics.eventAwareness >= 60;
    case 'post_miss_cluster':
      return event.result === 'pass' && !processMiss(event);
    case 'high_decision_frequency':
      return ENTRY_SOURCES.has(event.sourceType) && event.result === 'pass' && !event.flags.missingThesis;
    case 'review_gap':
      return REVIEW_SOURCES.has(event.sourceType) || event.journalSignals?.reflectionCompleted === true;
    default:
      return false;
  }
}

function trendOf(
  observations: MistakeObservation[],
  improvement: MistakeImprovementEvidence | null,
  now: number,
): MistakeImprovementTrend {
  const recent = observations.filter((row) => row.at >= now - TREND_WINDOW_MS);
  const prior = observations.filter((row) => row.at >= now - 2 * TREND_WINDOW_MS && row.at < now - TREND_WINDOW_MS);
  const recentScore = recent.reduce((sum, row) => sum + recencyWeight(row.at, now), 0);
  const priorScore = prior.reduce((sum, row) => sum + recencyWeight(row.at, now), 0);
  if (improvement && (recent.length === 0 || recentScore < priorScore * 0.7 || improvement.verifiedInNewContext)) {
    return 'improving';
  }
  if (recent.length >= 2 && recentScore > Math.max(0.4, priorScore) * 1.35) return 'increasing';
  if (recent.length >= 2 && prior.length === 0) return 'increasing';
  return 'stable';
}

function priorityOf(
  count: number,
  recentCount: number,
  recencyScore: number,
  trend: MistakeImprovementTrend,
  improvement: MistakeImprovementEvidence | null,
): MistakeRecommendationPriority {
  if (improvement?.verifiedInNewContext && trend === 'improving') return 'watch';
  if (trend === 'improving') return 'low';
  if (recentCount >= 2 && recencyScore >= 1.1) return 'high';
  if (count >= 2 && recentCount >= 1) return 'medium';
  return 'low';
}

function summarize(def: MistakePatternDefinition, count: number): string {
  return count >= 2 ? def.recurringSummary : def.oneOffSummary;
}

function toRecord(
  def: MistakePatternDefinition,
  observations: MistakeObservation[],
  improvement: MistakeImprovementEvidence | null,
  now: number,
): MistakePatternRecord | null {
  if (!observations.length) return null;
  const sorted = [...observations].sort((a, b) => a.at - b.at);
  const recent = sorted.filter((row) => row.at >= now - RECENT_WINDOW_MS);
  const recencyScore = Math.round(sorted.reduce((sum, row) => sum + recencyWeight(row.at, now), 0) * 100) / 100;
  const trend = trendOf(sorted, improvement, now);
  const contexts = [
    ...new Set(sorted.map((row) => row.scenarioContext).filter((row): row is CompetencyScenarioContext => Boolean(row))),
  ];
  const concepts = [
    ...new Set([...def.affectedConcepts, ...sorted.flatMap((row) => row.conceptIds)]),
  ];
  return {
    patternId: def.id,
    title: def.title,
    summary: summarize(def, sorted.length),
    trainingFocus: def.trainingFocus,
    observations: sorted,
    count: sorted.length,
    recentCount: recent.length,
    recentOccurrences: recent.slice(-5).map((row) => row.at),
    contexts,
    affectedConcepts: concepts,
    recencyScore,
    improvementTrend: trend,
    recommendationPriority: priorityOf(sorted.length, recent.length, recencyScore, trend, improvement),
    recommendedTraining: def.recommendedTraining,
    lastDemonstratedImprovement: improvement,
  };
}

/**
 * Infer recurring process patterns from structured evidence only.
 * Does not read journal bodies or call a model.
 */
export function composeMistakeLibrary(input: ComposeMistakeLibraryInput): MistakeLibrarySnapshot {
  const uid = input.uid.trim() || 'demo-guest';
  const now = input.now ?? Date.now();
  const records = input.records.filter((item) => item.uid === uid);
  const behavior = (input.behaviorEvents ?? []).filter((item) => item.uid === uid);
  if (!records.length && !behavior.length) return emptyLibrary(uid, now);

  const events = toDecisionEvents(records);
  const byPattern = new Map<MistakePatternId, MistakeObservation[]>();
  const add = (id: MistakePatternId, obs: MistakeObservation) => {
    const list = byPattern.get(id) ?? [];
    if (list.some((row) => row.sourceId === obs.sourceId && row.at === obs.at)) return;
    list.push(obs);
    byPattern.set(id, list);
  };

  for (const event of events) {
    for (const hit of detectForEvent(event)) {
      add(hit.id, observation(event, hit.keys));
    }
  }
  for (const obs of detectClusters(events)) add('post_miss_cluster', obs);
  for (const obs of detectHighFrequency(events, behavior)) add('high_decision_frequency', obs);

  const reviewObs = detectReviewGaps(events);
  const recentEntries = events.filter(
    (row) => ENTRY_SOURCES.has(row.sourceType) && row.occurredAt >= now - REVIEW_LOOKBACK_MS,
  );
  const recentReviews = events.filter(
    (row) => REVIEW_SOURCES.has(row.sourceType) && row.occurredAt >= now - REVIEW_LOOKBACK_MS,
  );
  if (reviewObs.length >= REVIEW_GAP_MIN_DECISIONS && recentEntries.length >= REVIEW_GAP_MIN_DECISIONS && recentReviews.length === 0) {
    for (const obs of reviewObs) add('review_gap', obs);
  } else if (recentEntries.length >= REVIEW_GAP_MIN_DECISIONS && recentReviews.length === 0 && reviewObs.length >= REVIEW_GAP_MIN_DECISIONS) {
    for (const obs of reviewObs) add('review_gap', obs);
  }

  const patterns: MistakePatternRecord[] = [];
  for (const def of MISTAKE_PATTERN_CATALOG) {
    const observations = byPattern.get(def.id) ?? [];
    const improvement = improvementFor(def.id, events, observations);
    const record = toRecord(def, observations, improvement, now);
    if (record) patterns.push(record);
  }

  patterns.sort((a, b) => {
    const rank: Record<MistakeRecommendationPriority, number> = { high: 0, medium: 1, low: 2, watch: 3 };
    return rank[a.recommendationPriority] - rank[b.recommendationPriority] || b.recencyScore - a.recencyScore || a.patternId.localeCompare(b.patternId);
  });

  return {
    uid,
    generatedAt: now,
    patterns,
    activePatternIds: patterns
      .filter((row) => row.recommendationPriority === 'high' || row.recommendationPriority === 'medium')
      .map((row) => row.patternId),
    disclaimer: MISTAKE_LIBRARY_DISCLAIMER,
  };
}

export function emptyMistakeLibrary(uid: string, now = Date.now()): MistakeLibrarySnapshot {
  return emptyLibrary(uid, now);
}

export function queryParam(href: string, key: string): string | null {
  const query = href.split('?')[1];
  if (!query) return null;
  return new URLSearchParams(query).get(key);
}

export function hrefsRelated(candidateHref: string, trainingHref: string): boolean {
  if (candidateHref === trainingHref) return true;
  const drillA = queryParam(candidateHref, 'drill');
  const drillB = queryParam(trainingHref, 'drill');
  if (drillA && drillA === drillB) return true;
  const episodeA = queryParam(candidateHref, 'episode');
  const episodeB = queryParam(trainingHref, 'episode');
  if (episodeA && episodeA === episodeB) return true;
  const focusA = queryParam(candidateHref, 'focus');
  const focusB = queryParam(trainingHref, 'focus');
  if (candidateHref.startsWith('/simulate') && trainingHref.startsWith('/simulate') && focusA && focusA === focusB) {
    return true;
  }
  const pathA = candidateHref.split('?')[0] ?? candidateHref;
  const pathB = trainingHref.split('?')[0] ?? trainingHref;
  if (pathA.includes('/academy/lesson/') && pathA === pathB) return true;
  if (pathA === '/review' && pathB === '/review') return true;
  if (pathA === '/journal' && pathB === '/journal') return true;
  if (pathA === '/events' && pathB === '/events') return true;
  return false;
}

export function patternMatchesTraining(
  pattern: Pick<MistakePatternRecord, 'affectedConcepts' | 'recommendedTraining'>,
  candidate: { href: string; conceptId?: string },
): boolean {
  if (candidate.conceptId && pattern.affectedConcepts.includes(candidate.conceptId)) return true;
  return pattern.recommendedTraining.some((link) => hrefsRelated(candidate.href, link.href));
}

export function plannerScoreDeltaForMistakeLibrary(
  candidate: { href: string; conceptId?: string },
  library?: MistakeLibrarySnapshot | null,
): number {
  if (!library?.patterns.length) return 0;
  let delta = 0;
  for (const pattern of library.patterns) {
    if (!patternMatchesTraining(pattern, candidate)) continue;
    if (pattern.recommendationPriority === 'high') delta += 85;
    else if (pattern.recommendationPriority === 'medium') delta += 40;
    else if (pattern.recommendationPriority === 'low') delta += 8;
    else delta -= 45;
  }
  return delta;
}

export function observationalReasonForCandidate(
  candidate: { href: string; conceptId?: string; concealConcept?: boolean },
  library?: MistakeLibrarySnapshot | null,
): string | undefined {
  if (!library || candidate.concealConcept) return undefined;
  const match = library.patterns.find(
    (row) =>
      (row.recommendationPriority === 'high' || row.recommendationPriority === 'medium') &&
      patternMatchesTraining(row, candidate),
  );
  return match?.summary;
}

export function preferredPracticeDrillIds(library?: MistakeLibrarySnapshot | null): string[] {
  if (!library) return [];
  const ids: string[] = [];
  for (const pattern of library.patterns) {
    if (pattern.recommendationPriority === 'watch') continue;
    const def = MISTAKE_PATTERN_CATALOG.find((row) => row.id === pattern.patternId);
    for (const drillId of def?.practiceDrillIds ?? []) {
      if (!ids.includes(drillId)) ids.push(drillId);
    }
  }
  return ids;
}

export function simulationFocusFromMistakeLibrary(
  library?: MistakeLibrarySnapshot | null,
): { focus: NonNullable<MistakePatternDefinition['simulationFocus']>; score: number } | undefined {
  if (!library) return undefined;
  let best: { focus: NonNullable<MistakePatternDefinition['simulationFocus']>; score: number } | undefined;
  for (const pattern of library.patterns) {
    const def = MISTAKE_PATTERN_CATALOG.find((row) => row.id === pattern.patternId);
    if (!def?.simulationFocus) continue;
    const score =
      pattern.recommendationPriority === 'high'
        ? 90
        : pattern.recommendationPriority === 'medium'
          ? 55
          : pattern.recommendationPriority === 'low'
            ? 20
            : 0;
    if (!best || score > best.score) best = { focus: def.simulationFocus, score };
  }
  return best && best.score >= 40 ? best : undefined;
}

export function replayBoostFromMistakeLibrary(library?: MistakeLibrarySnapshot | null): {
  concepts: string[];
  collections: string[];
  score: number;
} {
  const concepts: string[] = [];
  const collections: string[] = [];
  let score = 0;
  if (!library) return { concepts, collections, score };
  for (const pattern of library.patterns) {
    if (pattern.recommendationPriority === 'watch') continue;
    const def = MISTAKE_PATTERN_CATALOG.find((row) => row.id === pattern.patternId);
    if (!def) continue;
    for (const id of def.replayConceptIds) if (!concepts.includes(id)) concepts.push(id);
    for (const id of def.replayCollections) if (!collections.includes(id)) collections.push(id);
    score = Math.max(
      score,
      pattern.recommendationPriority === 'high' ? 80 : pattern.recommendationPriority === 'medium' ? 50 : 15,
    );
  }
  return { concepts, collections, score };
}

export function toAnalyticsSafeMistakeSummary(library: MistakeLibrarySnapshot): AnalyticsSafeMistakeSummary {
  return {
    surfacedPatternCount: library.patterns.length,
    improvingPatternCount: library.patterns.filter((row) => row.improvementTrend === 'improving').length,
    generatedAt: library.generatedAt,
  };
}

export function mistakeLibraryContainsJudgmentalLanguage(value: unknown): boolean {
  return JUDGMENTAL.test(JSON.stringify(value ?? ''));
}

export function trainingLinksForActivePatterns(library: MistakeLibrarySnapshot): MistakeTrainingLink[] {
  const out: MistakeTrainingLink[] = [];
  for (const pattern of library.patterns) {
    if (pattern.recommendationPriority === 'watch') continue;
    for (const link of pattern.recommendedTraining) {
      if (!out.some((row) => row.href === link.href)) out.push(link);
    }
  }
  return out;
}
