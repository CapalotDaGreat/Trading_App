import type { LessonProgress } from '@/features/academy/stores/academy-progress.store';
import type { PracticeAttempt } from '@/features/practice/stores/practice-progress.store';
import type { JournalMistakeCategory } from '@/features/journal/types/journal.types';
import type { MentorExperienceLevel } from '@/features/onboarding/types/mentor-setup.types';
import type { EventTrainingPlan } from '@/features/events/types/events.types';
import { allConcepts, conceptForDrill, getConcept } from './learning-graph.service';

export interface ConceptEvidenceSlice {
  conceptId: string;
  quizAttempts: number;
  quizMisses: number;
  drillAttempts: number;
  drillMisses: number;
  drillCorrectRecent: number;
  drillRecentTotal: number;
  replayCompletions: number;
  replayBest: number | null;
  lessonRead: boolean;
  lastPracticedAt: number | null;
  lastSuccessAt: number | null;
  successCount: number;
}

export interface LearningEvidenceSnapshot {
  now: number;
  byConcept: Record<string, ConceptEvidenceSlice>;
  journalMistakes: JournalMistakeCategory[];
  journalEmotional: boolean;
  highConfidenceMistakes: number;
  simulationGaps: string[];
  simulationComposite: number;
  simulationDecisions: number;
  nextLessonId: string | null;
  openedLessonIds: string[];
  experience: MentorExperienceLevel | null;
  eventPlan: EventTrainingPlan | null;
  hasJournal: boolean;
  hasSimulation: boolean;
}

export interface BuildLearningEvidenceInput {
  now?: number;
  lessonProgress: Record<string, LessonProgress>;
  conceptResults: Record<string, { attempts: number; misses: number; lastAt?: string }>;
  attempts: PracticeAttempt[];
  journal: Array<{
    mistakeCategory?: JournalMistakeCategory | null;
    emotion?: string | null;
    createdAt: string;
  }>;
  replay: {
    completedEpisodeIds: string[];
    bestProcessByEpisode: Record<string, number>;
  };
  simulation?: { gaps: string[]; composite: number; decisionCount: number };
  hasSimulation?: boolean;
  nextLessonId?: string | null;
  experience?: MentorExperienceLevel | null;
  eventPlan?: EventTrainingPlan | null;
}

function emptySlice(conceptId: string): ConceptEvidenceSlice {
  return {
    conceptId,
    quizAttempts: 0,
    quizMisses: 0,
    drillAttempts: 0,
    drillMisses: 0,
    drillCorrectRecent: 0,
    drillRecentTotal: 0,
    replayCompletions: 0,
    replayBest: null,
    lessonRead: false,
    lastPracticedAt: null,
    lastSuccessAt: null,
    successCount: 0,
  };
}

function ensureSlice(map: Record<string, ConceptEvidenceSlice>, conceptId: string): ConceptEvidenceSlice {
  if (!map[conceptId]) map[conceptId] = emptySlice(conceptId);
  return map[conceptId];
}

function touch(slice: ConceptEvidenceSlice, at: number, success: boolean): void {
  slice.lastPracticedAt = Math.max(slice.lastPracticedAt ?? 0, at);
  if (success) {
    slice.lastSuccessAt = Math.max(slice.lastSuccessAt ?? 0, at);
    slice.successCount += 1;
  }
}

export function buildLearningEvidence(input: BuildLearningEvidenceInput): LearningEvidenceSnapshot {
  const now = input.now ?? Date.now();
  const byConcept: Record<string, ConceptEvidenceSlice> = {};
  for (const node of allConcepts()) {
    byConcept[node.id] = emptySlice(node.id);
  }

  for (const [conceptId, result] of Object.entries(input.conceptResults)) {
    if (!getConcept(conceptId) && !byConcept[conceptId]) {
      byConcept[conceptId] = emptySlice(conceptId);
    }
    const slice = ensureSlice(byConcept, getConcept(conceptId)?.id ?? conceptId);
    slice.quizAttempts += result.attempts;
    slice.quizMisses += result.misses;
    const at = result.lastAt ? Date.parse(result.lastAt) : now;
    if (result.attempts > 0) touch(slice, at, result.misses < result.attempts);
  }

  const attemptsByDrill = new Map<string, PracticeAttempt[]>();
  for (const attempt of input.attempts) {
    const list = attemptsByDrill.get(attempt.drillId) ?? [];
    list.push(attempt);
    attemptsByDrill.set(attempt.drillId, list);
    const concept = conceptForDrill(attempt.drillId);
    if (!concept) continue;
    const slice = ensureSlice(byConcept, concept.id);
    slice.drillAttempts += 1;
    if (!attempt.correct) slice.drillMisses += 1;
    touch(slice, Date.parse(attempt.at) || now, attempt.correct);
  }

  for (const [drillId, rows] of attemptsByDrill) {
    const concept = conceptForDrill(drillId);
    if (!concept) continue;
    const recent = rows.slice(-5);
    const slice = byConcept[concept.id]!;
    slice.drillRecentTotal += recent.length;
    slice.drillCorrectRecent += recent.filter((row) => row.correct).length;
  }

  for (const node of allConcepts()) {
    const slice = byConcept[node.id]!;
    if (node.lessonIds.some((id) => input.lessonProgress[id]?.read || input.lessonProgress[id]?.completed)) {
      slice.lessonRead = true;
    }
    for (const episodeId of node.replayIds) {
      if (!input.replay.completedEpisodeIds.includes(episodeId)) continue;
      slice.replayCompletions += 1;
      const best = input.replay.bestProcessByEpisode[episodeId];
      if (best != null) {
        slice.replayBest = Math.max(slice.replayBest ?? 0, best);
        if (best >= 60) touch(slice, now, true);
      }
    }
  }

  const recentJournal = input.journal.slice(-12);
  const journalMistakes = recentJournal
    .map((entry) => entry.mistakeCategory)
    .filter((item): item is JournalMistakeCategory => Boolean(item) && item !== 'other');

  const openedLessonIds = Object.entries(input.lessonProgress)
    .filter(([, progress]) => Boolean(progress.lastOpenedAt) && !progress.practiced)
    .map(([id]) => id);

  return {
    now,
    byConcept,
    journalMistakes,
    journalEmotional: recentJournal.some(
      (entry) => entry.emotion === 'fomo' || entry.emotion === 'fearful' || entry.emotion === 'greedy',
    ),
    highConfidenceMistakes: recentJournal.filter(
      (entry) => entry.emotion === 'confident' && (entry.mistakeCategory === 'size' || entry.mistakeCategory === 'fomo'),
    ).length,
    simulationGaps: input.simulation?.gaps ?? [],
    simulationComposite: input.simulation?.composite ?? 0,
    simulationDecisions: input.simulation?.decisionCount ?? 0,
    nextLessonId: input.nextLessonId ?? null,
    openedLessonIds,
    experience: input.experience ?? null,
    eventPlan: input.eventPlan ?? null,
    hasJournal: input.journal.length > 0,
    hasSimulation: input.hasSimulation ?? (input.simulation?.decisionCount ?? 0) > 0,
  };
}
