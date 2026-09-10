import { ALL_LESSONS } from '@/features/academy/content';
import {
  COMPETENCY_DISCLAIMER,
  getCompetencyConcept,
  isApplicationSource,
  isExposureOnlyRecord,
  isIndependentEvidence,
  resolveHelpLevel,
  scoreAllCompetencyMastery,
  selectNextDemonstration,
} from '@/features/competency';
import type {
  CompetencyAssetClass,
  CompetencyEvidenceRecord,
  CompetencyMastery,
  CompetencyScenarioContext,
  HelpLevel,
} from '@/features/competency';
import { LESSON_PRIMARY_CONCEPT } from '@/features/learning-engine/content/learning-graph';
import { composeMistakeLibrary, emptyMistakeLibrary } from '@/features/mistake-library/services/mistake-library.service';

import type {
  AnalyticsSafeLearnerSummary,
  ComposeLearnerModelInput,
  LearnerApplicationSlice,
  LearnerBehaviorSlice,
  LearnerCompetenceState,
  LearnerConceptState,
  LearnerDecisionQualitySlice,
  LearnerExplanation,
  LearnerHelpMix,
  LearnerKnowledgeSlice,
  LearnerModelSnapshot,
  LearnerPracticeSuggestion,
  LearnerSelfConfidence,
  LearnerTransferSlice,
  MentorSafeLearnerSummary,
  ScaffoldingLevel,
} from '../types/learner-model.types';
import { LEARNER_STATE_LABELS } from '../types/learner-model.types';
import { composeLongitudinalProfile, emptyLongitudinalProfile } from './longitudinal-profile.service';

const DAY = 24 * 60 * 60 * 1000;
const SESSION_GAP_MS = 45 * 60 * 1000;
const MARKET_CONDITIONS = new Set<CompetencyScenarioContext>([
  'trend',
  'range',
  'high_volatility',
  'low_volatility',
  'regime_change',
  'event_window',
  'earnings',
]);
const APPLICATION_SOURCES = new Set([
  'practice_drill',
  'calculation_exercise',
  'applied_exercise',
  'event_exercise',
  'replay_decision',
  'simulation_decision',
  'simulation_checkpoint',
  're_demonstration',
  'remediation_exercise',
  'transfer_exercise',
  'surprise_assessment',
]);
const KNOWLEDGE_SOURCES = new Set(['knowledge_check', 'calculation_exercise']);
const MISCONCEPTION_FLAGS: Array<{ flag: keyof NonNullable<NonNullable<CompetencyEvidenceRecord['processMetrics']>['flags']>; label: string }> = [
  { flag: 'missingThesis', label: 'missing thesis' },
  { flag: 'missingInvalidation', label: 'missing invalidation' },
  { flag: 'missingEvidence', label: 'missing evidence' },
  { flag: 'movedInvalidation', label: 'moved invalidation' },
  { flag: 'exceededRiskLimit', label: 'exceeded risk limit' },
  { flag: 'fomoEntry', label: 'impulse entry' },
];

function emptyHelpMix(): LearnerHelpMix {
  return { none: 0, hint: 0, example: 0, worked_solution: 0, repeated_explanation: 0 };
}

function emptyDecisionQuality(): LearnerDecisionQualitySlice {
  return {
    thesisClarity: null,
    evidenceQuality: null,
    invalidationDefinition: null,
    riskAwareness: null,
    positionSizingReasoning: null,
    uncertaintyRecognition: null,
    confirmationDiscipline: null,
    eventAwareness: null,
    emotionalDiscipline: null,
    postDecisionReflection: null,
  };
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return Math.max(0, Math.min(100, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)));
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2) : sorted[mid]!;
}

function helpOf(record: CompetencyEvidenceRecord): HelpLevel {
  return resolveHelpLevel(record);
}

function tallyHelp(records: readonly CompetencyEvidenceRecord[]): LearnerHelpMix {
  const mix = emptyHelpMix();
  for (const record of records) {
    mix[helpOf(record)] += 1;
  }
  return mix;
}

function forConcept(records: readonly CompetencyEvidenceRecord[], conceptId: string): CompetencyEvidenceRecord[] {
  return records.filter((item) => item.conceptId === conceptId).sort((a, b) => a.occurredAt - b.occurredAt);
}

function hasTransferApplication(records: readonly CompetencyEvidenceRecord[]): boolean {
  return records.some(
    (item) =>
      isApplicationSource(item.sourceType) ||
      item.sourceType === 're_demonstration' ||
      item.sourceType === 'practice_drill' ||
      item.sourceType === 'calculation_exercise' ||
      item.sourceType === 'applied_exercise' ||
      item.sourceType === 'transfer_exercise' ||
      item.sourceType === 'event_exercise',
  );
}

export function learnerStateFromMastery(
  mastery: CompetencyMastery,
  _records: readonly CompetencyEvidenceRecord[],
): LearnerCompetenceState | null {
  if (mastery.competenceState === 'not_started') return null;
  return mastery.competenceState;
}

function knowledgeSlice(
  conceptId: string,
  records: readonly CompetencyEvidenceRecord[],
  mastery: CompetencyMastery,
  allMastery: CompetencyMastery[],
): LearnerKnowledgeSlice {
  const checks = records.filter((item) => KNOWLEDGE_SOURCES.has(item.sourceType) && item.result !== 'observed');
  const passes = checks.filter((item) => item.result === 'pass').length;
  const fails = records.filter((item) => item.sourceType === 'knowledge_check' && item.result === 'fail');
  const misconceptionFlags = new Set<string>();
  if (fails.length >= 2) misconceptionFlags.add('repeated knowledge-check misses');
  for (const record of records) {
    const flags = record.processMetrics?.flags;
    if (!flags) continue;
    for (const row of MISCONCEPTION_FLAGS) {
      if (flags[row.flag]) misconceptionFlags.add(row.label);
    }
  }

  const masteryById = new Map(allMastery.map((row) => [row.conceptId, row]));
  const related = getCompetencyConcept(conceptId)?.relatedIds ?? [];
  const lessonPrereqs = ALL_LESSONS.filter((lesson) => (LESSON_PRIMARY_CONCEPT[lesson.id] ?? lesson.id) === conceptId)
    .flatMap((lesson) => lesson.prerequisiteIds ?? [])
    .map((id) => LESSON_PRIMARY_CONCEPT[id] ?? id);
  const prerequisiteGaps = [...new Set([...lessonPrereqs, ...related])]
    .filter((id) => id !== conceptId)
    .filter((id) => {
      const row = masteryById.get(id);
      if (!row) return records.some((item) => !isExposureOnlyRecord(item));
      return row.state === 'not_started' || row.state === 'learning' || row.state === 'needs_remediation';
    })
    .slice(0, 8);

  return {
    understanding: mastery.quality.knowledge,
    knowledgeCheckPassRate: checks.length ? Math.round((passes / checks.length) * 100) : null,
    knowledgeCheckAttempts: checks.length,
    misconceptionFlags: [...misconceptionFlags],
    prerequisiteGaps,
  };
}

function applicationSlice(records: readonly CompetencyEvidenceRecord[]): LearnerApplicationSlice {
  const pass = (type: CompetencyEvidenceRecord['sourceType']) =>
    records.filter((item) => item.sourceType === type);
  const appliedPass = records.filter(
    (item) => APPLICATION_SOURCES.has(item.sourceType) && (item.result === 'pass' || item.result === 'partial'),
  );
  return {
    simulationDecisions: pass('simulation_decision').length,
    practiceAttempts: pass('practice_drill').length,
    replayDecisions: pass('replay_decision').length,
    appliedExercises:
      pass('calculation_exercise').length +
      pass('practice_drill').length +
      pass('applied_exercise').length +
      pass('event_exercise').length,
    transferPasses: appliedPass.filter((item) => (item.scenarioContext && item.scenarioContext !== 'standard') || isApplicationSource(item.sourceType)).length,
    independentApplicationPasses: appliedPass.filter((item) => isIndependentEvidence(item) && item.result === 'pass').length,
    helpDependentPasses: appliedPass.filter((item) => !isIndependentEvidence(item) && item.result === 'pass').length,
  };
}

function transferSlice(records: readonly CompetencyEvidenceRecord[]): LearnerTransferSlice {
  const independentPass = records.filter(
    (item) => isIndependentEvidence(item) && item.result === 'pass' && hasTransferApplication([item]),
  );
  const contexts = independentPass
    .map((item) => item.scenarioContext ?? 'standard')
    .filter((ctx, index, all) => all.indexOf(ctx) === index);
  const familiar = contexts.filter((ctx) => ctx === 'standard' || ctx === contexts[0]);
  const unfamiliar = contexts.filter((ctx) => !familiar.includes(ctx) || (ctx !== 'standard' && ctx !== contexts[0]));
  const marketConditions = contexts.filter((ctx) => MARKET_CONDITIONS.has(ctx));
  const assetClasses = [
    ...new Set(independentPass.map((item) => item.assetClass).filter((item): item is CompetencyAssetClass => Boolean(item))),
  ];
  const sourceGroups = new Map<string, Set<string>>();
  for (const record of records) {
    const extra = record.interactingConceptIds ?? [];
    if (extra.length < 2 && records.filter((item) => item.sourceId === record.sourceId).length < 2) continue;
    const ids = sourceGroups.get(record.sourceId) ?? new Set<string>();
    ids.add(record.conceptId);
    extra.forEach((id) => ids.add(id));
    sourceGroups.set(record.sourceId, ids);
  }
  const multiConceptSourceIds = [...sourceGroups.entries()].filter(([, ids]) => ids.size >= 2).map(([id]) => id);
  const proven = unfamiliar.length >= 1 && (marketConditions.length >= 2 || contexts.filter((ctx) => ctx !== 'standard').length >= 2);

  return {
    familiarContexts: familiar as CompetencyScenarioContext[],
    unfamiliarContexts: unfamiliar as CompetencyScenarioContext[],
    marketConditions,
    assetClasses,
    multiConceptSourceIds,
    proven,
  };
}

function decisionQuality(records: readonly CompetencyEvidenceRecord[]): LearnerDecisionQualitySlice {
  const withProcess = records.filter((item) => item.processMetrics);
  const pick = (key: keyof NonNullable<CompetencyEvidenceRecord['processMetrics']>) =>
    mean(
      withProcess
        .map((item) => item.processMetrics?.[key])
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
    );
  const reflections = records.filter((item) => item.sourceType === 'journal_reflection' || item.sourceType === 'review_finding');
  const reflectionMetric = pick('reflection');
  const reflectionFromCount =
    reflections.length === 0 ? null : Math.min(100, Math.round((reflections.filter((item) => item.result !== 'fail').length / Math.max(1, reflections.length)) * 100));

  return {
    thesisClarity: pick('thesis'),
    evidenceQuality: pick('evidence'),
    invalidationDefinition: pick('invalidation'),
    riskAwareness: pick('risk'),
    positionSizingReasoning: pick('positionSizing') ?? pick('risk'),
    uncertaintyRecognition: pick('uncertainty'),
    confirmationDiscipline: pick('confirmation'),
    eventAwareness: pick('eventAwareness'),
    emotionalDiscipline: pick('emotionalDiscipline') ?? pick('discipline'),
    postDecisionReflection: reflectionMetric ?? reflectionFromCount,
  };
}

function clusterSessions(timestamps: number[]): { count: number; durations: number[] } {
  if (!timestamps.length) return { count: 0, durations: [] };
  const sorted = [...timestamps].sort((a, b) => a - b);
  const sessions: number[][] = [[sorted[0]!]];
  for (const time of sorted.slice(1)) {
    const current = sessions[sessions.length - 1]!;
    if (time - current[current.length - 1]! > SESSION_GAP_MS) {
      sessions.push([time]);
    } else {
      current.push(time);
    }
  }
  return {
    count: sessions.length,
    durations: sessions.map((group) => Math.max(60_000, group[group.length - 1]! - group[0]!)),
  };
}

function retriesOf(records: readonly CompetencyEvidenceRecord[]): number {
  const groups = new Map<string, CompetencyEvidenceRecord[]>();
  for (const record of records) {
    const key = `${record.sourceType}:${record.sourceId}:${record.conceptId}`;
    const list = groups.get(key) ?? [];
    list.push(record);
    groups.set(key, list);
  }
  let retries = 0;
  for (const list of groups.values()) {
    const ordered = list.sort((a, b) => a.occurredAt - b.occurredAt);
    for (let i = 1; i < ordered.length; i += 1) {
      if (ordered[i - 1]?.result === 'fail') retries += 1;
    }
  }
  return retries;
}

function scaffoldingOf(records: readonly CompetencyEvidenceRecord[]): ScaffoldingLevel {
  const graded = records.filter((item) => !isExposureOnlyRecord(item) && item.result !== 'observed').slice(-4);
  if (!graded.length) return 'keep';
  const independent = graded.filter((item) => isIndependentEvidence(item)).length;
  if (independent === graded.length) return 'independent';
  if (independent === 0) return 'keep';
  return 'fade';
}

function behaviorSlice(input: ComposeLearnerModelInput, records: readonly CompetencyEvidenceRecord[], now: number): LearnerBehaviorSlice {
  const eventTimes = [
    ...records.map((item) => item.occurredAt),
    ...(input.behaviorEvents ?? []).map((item) => item.occurredAt),
  ];
  const sessions = clusterSessions(eventTimes);
  const weekSpan = (() => {
    if (eventTimes.length < 2) return 1;
    const min = Math.min(...eventTimes);
    return Math.max(1, (now - min) / (7 * DAY));
  })();
  const helpMix = tallyHelp(records);
  const opened = (input.behaviorEvents ?? []).filter((item) => item.type === 'activity_opened');
  const abandonedExplicit = (input.behaviorEvents ?? []).filter((item) => item.type === 'activity_abandoned').length;
  const abandonedOpened = opened.filter((open) => {
    const later = records.some((item) => item.occurredAt >= open.occurredAt && item.occurredAt - open.occurredAt < 2 * 60 * 60 * 1000);
    return !later;
  }).length;
  const deferrals =
    Object.values(input.dispositions ?? {}).reduce((sum, row) => sum + (row.deferCount ?? 0), 0) +
    Object.values(input.conceptDeferCounts ?? {}).reduce((sum, value) => sum + value, 0);

  return {
    sessionCount: sessions.count,
    sessionFrequencyPerWeek: sessions.count ? Math.round((sessions.count / weekSpan) * 10) / 10 : null,
    medianSessionDurationMs: median(sessions.durations),
    retries: retriesOf(records),
    hintUsage: helpMix.hint,
    explanationUsage:
      helpMix.example +
      helpMix.worked_solution +
      helpMix.repeated_explanation +
      (input.behaviorEvents ?? []).filter((item) => item.type === 'explanation_opened').length,
    independentCompletions: records.filter((item) => isIndependentEvidence(item) && item.result === 'pass').length,
    deferrals,
    abandonment: abandonedExplicit + abandonedOpened,
    reviewEvents: records.filter((item) => item.sourceType === 'journal_reflection' || item.sourceType === 'review_finding').length,
    spacedRedemonstrations: records.filter((item) => item.sourceType === 're_demonstration').length,
    helpMix,
    scaffolding: scaffoldingOf(records),
  };
}

function selfConfidenceOf(input: ComposeLearnerModelInput): LearnerSelfConfidence {
  const reports = (input.selfConfidenceReports ?? []).filter((item) => item.uid === input.uid).sort((a, b) => a.occurredAt - b.occurredAt);
  if (reports.length === 0) {
    return {
      reportCount: 0,
      latest: null,
      interpreted: false,
      note: 'No self-confidence reports. Competence is demonstrated evidence, not a feeling.',
    };
  }
  if (reports.length < 3) {
    return {
      reportCount: reports.length,
      latest: reports[reports.length - 1]?.value ?? null,
      interpreted: false,
      note: 'Too few self-reports to interpret. This is kept separate from demonstrated competence.',
    };
  }
  return {
    reportCount: reports.length,
    latest: reports[reports.length - 1]?.value ?? null,
    interpreted: true,
    note: 'Self-confidence is a separate channel from demonstrated competence.',
  };
}

function conceptState(
  mastery: CompetencyMastery,
  records: readonly CompetencyEvidenceRecord[],
  allMastery: CompetencyMastery[],
  now: number,
): LearnerConceptState | null {
  const mine = forConcept(records, mastery.conceptId);
  const state = learnerStateFromMastery(mastery, mine);
  if (!state) return null;
  const transfer = transferSlice(mine);
  const helpMix = tallyHelp(mine);
  const stale =
    mastery.state === 'due_for_redemonstration' ||
    Boolean(mastery.nextRedemonstrationAt && now >= mastery.nextRedemonstrationAt) ||
    (mastery.lastIndependentSuccessAt != null && now - mastery.lastIndependentSuccessAt > 28 * DAY && mastery.state !== 'learning');
  const prompt = mastery.nextDemonstration ?? (state === 'transfer_unproven' || state === 'needs_revisit' ? selectNextDemonstration(mastery.conceptId, mine) : null);

  return {
    conceptId: mastery.conceptId,
    title: mastery.title,
    state,
    label: LEARNER_STATE_LABELS[state],
    masteryState: mastery.state,
    knowledge: knowledgeSlice(mastery.conceptId, mine, mastery, allMastery),
    application: applicationSlice(mine),
    transfer: { ...transfer, proven: transfer.proven && state !== 'transfer_unproven' },
    helpMix,
    lastEvidenceAt: mastery.lastEvidenceAt,
    lastIndependentSuccessAt: mastery.lastIndependentSuccessAt,
    evidenceStale: stale && state !== 'learning',
    helpDependent: (() => {
      const passes = mine.filter((item) => item.result === 'pass');
      return passes.length > 0 && passes.every((item) => !isIndependentEvidence(item));
    })(),
    nextHref: prompt?.href,
    nextReason: prompt?.reason,
  };
}

function explanationOf(concepts: LearnerConceptState[], behavior: LearnerBehaviorSlice): LearnerExplanation {
  const understands = concepts
    .filter((row) => (row.knowledge.understanding ?? 0) >= 55 && row.knowledge.knowledgeCheckPassRate != null && row.knowledge.knowledgeCheckPassRate >= 60)
    .map((row) => row.title);
  const demonstrated = concepts.filter((row) => row.state === 'demonstrated' || row.state === 'strong').map((row) => row.title);
  const uncertain = concepts
    .filter((row) => row.state === 'developing' || row.state === 'learning' || (row.knowledge.understanding == null && row.application.independentApplicationPasses === 0))
    .map((row) => row.title);
  const weak = concepts.filter((row) => row.state === 'needs_revisit' || row.knowledge.misconceptionFlags.length > 0).map((row) => row.title);
  const stale = concepts.filter((row) => row.evidenceStale).map((row) => row.title);
  const transfer = concepts.filter((row) => row.state === 'transfer_unproven' || !row.transfer.proven).map((row) => row.title);
  const helped = behavior.helpMix.hint + behavior.helpMix.example + behavior.helpMix.worked_solution + behavior.helpMix.repeated_explanation;
  const helpReliance =
    helped === 0
      ? 'Recent attempts were independent. Hints stay available if useful.'
      : behavior.scaffolding === 'keep'
        ? 'Hints and examples have been useful on recent attempts. They remain available — scaffolding can fade when independent attempts land.'
        : 'Some recent attempts used help and some did not. That is expected. Try the next one independently when ready.';
  const practiceNext = concepts
    .filter((row) => row.state === 'needs_revisit' || row.state === 'transfer_unproven' || row.state === 'developing' || row.state === 'learning')
    .slice(0, 5)
    .map((row) => row.title);

  return {
    currentlyUnderstands: understands,
    demonstrated,
    uncertain,
    weak,
    staleEvidence: stale,
    transferUnproven: [...new Set(transfer)],
    helpReliance,
    practiceNext,
  };
}

function nextPracticeOf(concepts: LearnerConceptState[]): LearnerPracticeSuggestion[] {
  const rank: Record<LearnerCompetenceState, number> = {
    needs_revisit: 0,
    transfer_unproven: 1,
    developing: 2,
    learning: 3,
    demonstrated: 4,
    strong: 5,
  };
  return [...concepts]
    .filter((row) => row.state !== 'strong')
    .sort((a, b) => rank[a.state] - rank[b.state] || (b.evidenceStale ? 1 : 0) - (a.evidenceStale ? 1 : 0))
    .slice(0, 6)
    .map((row) => ({
      conceptId: row.conceptId,
      title: row.title,
      reason:
        row.nextReason ??
        (row.state === 'needs_revisit'
          ? `${row.title} needs another look. Retrieval, not a new chapter.`
          : row.state === 'transfer_unproven'
            ? `${row.title} has not yet been shown in a second context.`
            : row.state === 'learning'
              ? `${row.title} has exposure or knowledge checks, not applied demonstration.`
              : `Practice ${row.title.toLowerCase()} next. Process counts; simulated P/L does not.`),
      href: row.nextHref ?? '/practice',
      state: row.state,
    }));
}

export function emptyLearnerModel(uid: string, now = Date.now()): LearnerModelSnapshot {
  return {
    uid,
    generatedAt: now,
    concepts: [],
    decisionQuality: emptyDecisionQuality(),
    behavior: {
      sessionCount: 0,
      sessionFrequencyPerWeek: null,
      medianSessionDurationMs: null,
      retries: 0,
      hintUsage: 0,
      explanationUsage: 0,
      independentCompletions: 0,
      deferrals: 0,
      abandonment: 0,
      reviewEvents: 0,
      spacedRedemonstrations: 0,
      helpMix: emptyHelpMix(),
      scaffolding: 'keep',
    },
    explanation: {
      currentlyUnderstands: [],
      demonstrated: [],
      uncertain: [],
      weak: [],
      staleEvidence: [],
      transferUnproven: [],
      helpReliance: 'No help history yet. Hints are available if useful.',
      practiceNext: [],
    },
    nextPractice: [],
    selfConfidence: {
      reportCount: 0,
      latest: null,
      interpreted: false,
      note: 'No self-confidence reports. Competence is demonstrated evidence, not a feeling.',
    },
    mistakePatterns: emptyMistakeLibrary(uid, now),
    longitudinal: emptyLongitudinalProfile(),
    disclaimer: COMPETENCY_DISCLAIMER,
  };
}

/**
 * Derive the durable learner model from competency evidence.
 * Does not score mastery itself — reuses `scoreAllCompetencyMastery`.
 */
export function composeLearnerModel(input: ComposeLearnerModelInput): LearnerModelSnapshot {
  const uid = input.uid.trim() || 'demo-guest';
  const now = input.now ?? Date.now();
  const records = input.records.filter((item) => item.uid === uid);
  if (!records.length && !(input.behaviorEvents?.length) && !(input.selfConfidenceReports?.length)) {
    return emptyLearnerModel(uid, now);
  }

  const mastery = input.mastery?.length ? input.mastery : scoreAllCompetencyMastery(records, now);
  const concepts = mastery
    .map((row) => conceptState(row, records, mastery, now))
    .filter((row): row is LearnerConceptState => row != null)
    .sort((a, b) => (b.lastEvidenceAt ?? 0) - (a.lastEvidenceAt ?? 0));

  const behavior = behaviorSlice(input, records, now);
  const explanation = explanationOf(concepts, behavior);

  return {
    uid,
    generatedAt: now,
    concepts,
    decisionQuality: decisionQuality(records),
    behavior,
    explanation,
    nextPractice: nextPracticeOf(concepts),
    selfConfidence: selfConfidenceOf(input),
    mistakePatterns: composeMistakeLibrary({
      uid,
      records,
      behaviorEvents: input.behaviorEvents,
      now,
    }),
    longitudinal: composeLongitudinalProfile(records, mastery, now),
    disclaimer: COMPETENCY_DISCLAIMER,
  };
}

export function getLearnerConcept(model: LearnerModelSnapshot, conceptId: string): LearnerConceptState | undefined {
  return model.concepts.find((row) => row.conceptId === conceptId);
}

export function toAnalyticsSafeLearnerSummary(model: LearnerModelSnapshot): AnalyticsSafeLearnerSummary {
  const countsByState: Record<LearnerCompetenceState, number> = {
    learning: 0,
    developing: 0,
    demonstrated: 0,
    strong: 0,
    needs_revisit: 0,
    transfer_unproven: 0,
  };
  for (const row of model.concepts) countsByState[row.state] += 1;
  return {
    conceptCount: model.concepts.length,
    countsByState,
    helpMix: model.behavior.helpMix,
    sessionCount: model.behavior.sessionCount,
    independentCompletions: model.behavior.independentCompletions,
    generatedAt: model.generatedAt,
  };
}

export function toMentorSafeLearnerSummary(model: LearnerModelSnapshot): MentorSafeLearnerSummary {
  return {
    states: model.concepts.map((row) => ({ title: row.title, state: row.state })),
    understands: model.explanation.currentlyUnderstands,
    weak: model.explanation.weak,
    stale: model.explanation.staleEvidence,
    transferUnproven: model.explanation.transferUnproven,
    helpReliance: model.explanation.helpReliance,
    practiceNext: model.explanation.practiceNext,
    selfConfidenceSeparated: true,
  };
}

export function snapshotContainsProseLeak(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const forbidden = ['notes', 'lessonsLearned', 'journalBody', 'body', 'prose'];
  const stack: unknown[] = [value];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    for (const [key, nested] of Object.entries(current as Record<string, unknown>)) {
      if (forbidden.includes(key)) return true;
      if (nested && typeof nested === 'object') stack.push(nested);
    }
  }
  return false;
}
