import type { Lesson } from '@/features/academy/types/academy.types';
import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type {
  ReplayTvChecklist,
  ReplayTvDecision,
} from '@/features/decision-replay-tv/types/replay-tv.types';
import {
  countActions,
  countNoteAny,
} from '@/features/personal-intelligence/services/dna-evidence.service';
import type {
  DnaJournalEvidence,
  TradingDnaProfile,
  TradingDnaTraitScore,
} from '@/features/personal-intelligence/types/personal-intelligence.types';

import { resolveAcademyLessonForTrait } from './decision-reinforcement-academy.service';
import type {
  DecisionReinforcementSnapshot,
  PracticeRecommendation,
  ReinforcementAcademyProgress,
  ReinforcementCoachPrefs,
  ReinforcementDirection,
  ReinforcementEvidenceQuality,
  ReinforcementEvidenceRef,
  ReinforcementMentorContext,
  ReinforcementObservation,
  ReinforcementSource,
  ReinforcementTodayCue,
  ReinforcementTraitId,
  ReplayPracticeConnection,
} from '@/features/decision/types/decision-reinforcement.types';
import {
  REINFORCEMENT_TRAIT_IDS,
  REINFORCEMENT_TRAIT_LABELS,
} from '@/features/decision/types/decision-reinforcement.types';

const DAY_MS = 86_400_000;
const RECENT_PRACTICE_MS = 2 * DAY_MS;
const RECENT_LESSON_MS = 14 * DAY_MS;
const FREE_WINDOW_MS = 30 * DAY_MS;
const PREMIUM_WINDOW_MS = 90 * DAY_MS;

const GUILT = /\b(you failed|falling behind|you ignored|you need to fix|poor emotional|anxious trader|you have fomo)\b/i;

export function emptyDecisionReinforcement(
  enabled = false,
  preferredMarkets: string[] = [],
): DecisionReinforcementSnapshot {
  return {
    enabled,
    observations: [],
    primaryPractice: null,
    academyLesson: null,
    todayCue: null,
    mentorContext: {
      known: [],
      inference: [],
      unknown: [
        enabled
          ? 'Not enough Decision Log, Replay, Journal process, or Academy evidence is attached yet.'
          : 'Decision reinforcement is turned off.',
      ],
      observationLine: null,
    },
    replayPracticeConnection: null,
    preferredMarkets,
  };
}

export function isReinforcementTraitId(value: string): value is ReinforcementTraitId {
  return (REINFORCEMENT_TRAIT_IDS as readonly string[]).includes(value);
}

function evidenceQualityFromCount(count: number): ReinforcementEvidenceQuality {
  if (count >= 5) return 'high';
  if (count >= 3) return 'moderate';
  if (count >= 1) return 'limited';
  return 'insufficient';
}

function isBeginner(experience?: string | null): boolean {
  return experience === 'completely_new' || experience === 'beginner';
}

function isStronglyImproving(trait: TradingDnaTraitScore | undefined): boolean {
  if (!trait || trait.status !== 'scored') return false;
  return (
    (trait.longitudinalTrend === 'improving' || trait.trend === 'up') && (trait.score ?? 0) >= 70
  );
}

function isImproving(trait: TradingDnaTraitScore | undefined): boolean {
  if (!trait || trait.status !== 'scored') return false;
  return trait.longitudinalTrend === 'improving' || trait.trend === 'up';
}

function totalRefCount(refs: ReinforcementEvidenceRef[]): number {
  return refs.reduce((sum, item) => sum + item.count, 0);
}

function explanationFor(
  traitId: ReinforcementTraitId,
  direction: ReinforcementDirection,
  refs: ReinforcementEvidenceRef[],
  beginner: boolean,
): string {
  const waits = refs.find((r) => /wait/i.test(r.label))?.count ?? 0;
  const deferrals = refs.find((r) => /defer/i.test(r.label))?.count ?? 0;
  if (traitId === 'patience' && direction !== 'focus') {
    return beginner
      ? `Your recent decisions show more frequent waiting when evidence is incomplete${waits ? ` (${waits} replay wait tags)` : ''}. Waiting is a research choice, not a forecast.`
      : `Recent replay and log events show more waiting when evidence is incomplete.`;
  }
  if (traitId === 'invalidationDiscipline' && direction === 'focus') {
    return beginner
      ? 'Several recent loops continued without a clearly named invalidation. Naming what would kill the case is the next process practice — not a personality label.'
      : 'Invalidation is still missing on some recent process events.';
  }
  if (traitId === 'invalidationDiscipline') {
    return 'Recent decisions name invalidation more often before the case continues.';
  }
  if (traitId === 'uncertaintyHandling') {
    return 'Recent decisions leave mixed tapes undecided instead of forcing a call.';
  }
  if (traitId === 'evidenceDiscipline') {
    return 'Recent loops collect structure evidence before deepening research.';
  }
  if (traitId === 'researchEfficiency') {
    return 'Recent skip and wait choices keep the research budget tighter.';
  }
  if (traitId === 'confirmationResistance') {
    return 'Recent decisions contain fewer immediate continuation choices after incomplete evidence.';
  }
  if (traitId === 'decisionStamina') {
    return 'Recent loops close more often before opening extra symbols.';
  }
  if (traitId === 'adaptability') {
    return 'Recent decisions update the case when evidence changes, including named invalidation.';
  }
  if (deferrals > 0) {
    return `Observed tendency: ${REINFORCEMENT_TRAIT_LABELS[traitId].toLowerCase()} shows up in recent process events.`;
  }
  return `Observed tendency: ${REINFORCEMENT_TRAIT_LABELS[traitId].toLowerCase()} is visible in the Decision Log.`;
}

function sanitizeLine(line: string): string {
  return line.replace(GUILT, 'recent process evidence').trim();
}

/**
 * Cheap, freeze-local observations. Never reads future tape or historical outcome.
 */
export function observationsFromReplayCommit(input: {
  decision: ReplayTvDecision;
  namedInvalidation: boolean;
  wroteReasoning?: boolean;
  consideredAlternative?: boolean;
  nowMs?: number;
}): ReinforcementObservation[] {
  const now = input.nowMs ?? Date.now();
  const out: ReinforcementObservation[] = [];
  const push = (
    traitId: ReinforcementTraitId,
    direction: ReinforcementDirection,
    source: ReinforcementSource,
    explanation: string,
    quality: ReinforcementEvidenceQuality = 'limited',
  ) => {
    out.push({
      traitId,
      direction,
      evidenceRefs: [
        {
          source,
          count: 1,
          label: `1 replay freeze · ${input.decision.replace(/_/g, ' ')}`,
        },
      ],
      evidenceQuality: quality,
      source,
      createdAt: now,
      explanation: sanitizeLine(explanation),
    });
  };

  if (input.decision === 'wait') {
    push(
      'patience',
      'strength',
      'replay',
      'Waiting was a disciplined choice because the evidence at this freeze was still incomplete.',
    );
    push(
      'uncertaintyHandling',
      'developing',
      'replay',
      'You left a mixed freeze undecided rather than forcing a call.',
    );
    if (!input.namedInvalidation) {
      push(
        'invalidationDiscipline',
        'focus',
        'replay',
        'Invalidation criteria were not clearly defined at this freeze.',
      );
    }
  } else if (input.decision === 'research_more') {
    push(
      'researchEfficiency',
      'developing',
      'replay',
      'You chose to continue researching instead of forcing a close.',
    );
    push(
      input.wroteReasoning ? 'evidenceDiscipline' : 'evidenceDiscipline',
      input.wroteReasoning ? 'developing' : 'focus',
      'replay',
      input.wroteReasoning
        ? 'You kept gathering freeze evidence before committing further.'
        : 'Continuing research is valid; citing freeze evidence would make the next pause checkable.',
    );
  } else if (input.decision === 'mark_invalidation') {
    push(
      'invalidationDiscipline',
      'strength',
      'replay',
      'You marked invalidation under a blind tape — process quality, not a path grade.',
    );
    push(
      'adaptability',
      'developing',
      'replay',
      'Naming what would kill the case is how the thesis stays revisable.',
    );
  } else if (input.decision === 'skip' || input.decision === 'protect_attention') {
    push(
      'researchEfficiency',
      'strength',
      'replay',
      'Skipping or protecting attention kept the research budget from expanding on an incomplete freeze.',
    );
    push(
      'patience',
      'developing',
      'replay',
      'Passing on this freeze is a process choice, not a missed forecast.',
    );
  }

  return out;
}

/**
 * One practice-connection block for Replay coach. O(1) on the current freeze.
 * Does not load DNA history. Outcome is never an input.
 */
export function composeReplayPracticeConnection(input: {
  decision: ReplayTvDecision;
  checklist: Pick<ReplayTvChecklist, 'namedInvalidation' | 'wroteReasoning'>;
  enabled?: boolean;
  nowMs?: number;
}): ReplayPracticeConnection | null {
  if (input.enabled === false) return null;
  const named = input.checklist.namedInvalidation;
  if (input.decision === 'wait' && !named) {
    return {
      traitId: 'invalidationDiscipline',
      evidenceQuality: 'limited',
      workingOn: 'You are currently working on patience under uncertainty.',
      nextPractice:
        'Waiting was disciplined because the evidence was incomplete. Next practice: define invalidation before the next freeze — or open the Academy invalidation lesson after this room.',
    };
  }
  if (input.decision === 'wait' && named) {
    return {
      traitId: 'patience',
      evidenceQuality: 'limited',
      workingOn: 'You waited with invalidation named.',
      nextPractice:
        'No additional practice is needed for this pause. If useful, replay another incomplete freeze later.',
    };
  }
  if (input.decision === 'research_more' && !input.checklist.wroteReasoning) {
    return {
      traitId: 'evidenceDiscipline',
      evidenceQuality: 'limited',
      workingOn: 'You are currently working on evidence quality.',
      nextPractice: 'Next practice: cite only evidence that is actually on this freeze.',
    };
  }
  if (input.decision === 'skip' || input.decision === 'protect_attention') {
    if (named) return null;
    return {
      traitId: 'researchEfficiency',
      evidenceQuality: 'limited',
      workingOn: 'You protected attention on an incomplete freeze.',
      nextPractice: 'If useful, name invalidation on the next skip so the pass stays checkable.',
    };
  }
  if (input.decision === 'mark_invalidation') {
    return null;
  }
  return null;
}

function refsForTrait(
  traitId: ReinforcementTraitId,
  records: DecisionRecord[],
  journalEvidence: DnaJournalEvidence[] | null | undefined,
  sinceMs: number,
): ReinforcementEvidenceRef[] {
  const refs: ReinforcementEvidenceRef[] = [];
  const waits = countNoteAny(records, 'replay_completed', ['rtv:wait', 'rtv:patience'], sinceMs);
  const replayInvalidation = countNoteAny(
    records,
    'replay_completed',
    ['rtv:invalidation'],
    sinceMs,
  );
  const replayEvidence = countNoteAny(records, 'replay_completed', ['rtv:evidence'], sinceMs);
  const replayUncertainty = countNoteAny(
    records,
    'replay_completed',
    ['rtv:uncertainty', 'rtv:inaction_ok'],
    sinceMs,
  );
  const replayConfirmation = countNoteAny(
    records,
    'replay_completed',
    ['rtv:confirmation'],
    sinceMs,
  );
  const replayStamina = countNoteAny(records, 'replay_completed', ['rtv:stamina'], sinceMs);
  const skipped = countActions(records, 'skipped', sinceMs);
  const invalidated = countActions(records, 'invalidated', sinceMs);
  const journaled = countActions(records, 'journaled', sinceMs);
  const journalProcess = (journalEvidence ?? []).filter(
    (item) =>
      item.createdAtMs >= sinceMs &&
      (item.hasLesson || item.hasPsychology || item.planAdhered != null),
  ).length;

  const push = (source: ReinforcementSource, count: number, label: string) => {
    if (count > 0) refs.push({ source, count, label });
  };

  switch (traitId) {
    case 'patience':
      push('replay', waits, `${waits} replay decision${waits === 1 ? '' : 's'} where you waited`);
      push(
        'decision_log',
        skipped,
        `${skipped} decision-log event${skipped === 1 ? '' : 's'} showing deliberate deferral`,
      );
      push(
        'journal',
        journalProcess,
        `${journalProcess} journal process ${journalProcess === 1 ? 'entry' : 'entries'}`,
      );
      break;
    case 'invalidationDiscipline':
      push(
        'replay',
        replayInvalidation,
        `${replayInvalidation} replay freeze${replayInvalidation === 1 ? '' : 's'} with named invalidation`,
      );
      push(
        'decision_log',
        invalidated,
        `${invalidated} decision-log invalidation event${invalidated === 1 ? '' : 's'}`,
      );
      push(
        'journal',
        journalProcess,
        `${journalProcess} journal process ${journalProcess === 1 ? 'entry' : 'entries'}`,
      );
      break;
    case 'uncertaintyHandling':
      push(
        'replay',
        replayUncertainty,
        `${replayUncertainty} uncertainty-focused replay event${replayUncertainty === 1 ? '' : 's'}`,
      );
      push('replay', waits, `${waits} wait-tagged replay event${waits === 1 ? '' : 's'}`);
      break;
    case 'evidenceDiscipline':
      push(
        'replay',
        replayEvidence,
        `${replayEvidence} replay event${replayEvidence === 1 ? '' : 's'} with evidence tags`,
      );
      push(
        'decision_log',
        countActions(records, 'checklist_done', sinceMs),
        `${countActions(records, 'checklist_done', sinceMs)} checklist completions`,
      );
      break;
    case 'researchEfficiency':
      push('decision_log', skipped, `${skipped} skip event${skipped === 1 ? '' : 's'}`);
      push('replay', waits, `${waits} wait-tagged replay event${waits === 1 ? '' : 's'}`);
      break;
    case 'confirmationResistance':
      push(
        'replay',
        replayConfirmation,
        `${replayConfirmation} confirmation-resistance replay tag${replayConfirmation === 1 ? '' : 's'}`,
      );
      break;
    case 'decisionStamina':
      push(
        'replay',
        replayStamina,
        `${replayStamina} stamina-tagged replay event${replayStamina === 1 ? '' : 's'}`,
      );
      push('journal', journaled, `${journaled} journal close${journaled === 1 ? '' : 's'}`);
      break;
    case 'adaptability':
      push(
        'decision_log',
        invalidated,
        `${invalidated} invalidation event${invalidated === 1 ? '' : 's'}`,
      );
      break;
    default:
      break;
  }

  return refs.filter((item) => item.count > 0 && item.label.length > 0);
}

function directionForTrait(trait: TradingDnaTraitScore | undefined, focusGap: boolean): ReinforcementDirection | null {
  if (focusGap) return 'focus';
  if (!trait || trait.status !== 'scored') return null;
  if (isStronglyImproving(trait)) return 'strength';
  if (isImproving(trait)) return 'developing';
  if ((trait.score ?? 100) < 55) return 'focus';
  if ((trait.score ?? 0) >= 65) return 'strength';
  return 'developing';
}

function practicedTraitRecently(
  traitId: ReinforcementTraitId,
  records: DecisionRecord[],
  academyProgress: ReinforcementAcademyProgress[],
  nowMs: number,
  mappedLessonId?: string,
): boolean {
  const since = nowMs - RECENT_PRACTICE_MS;
  const tagNeedles: Record<ReinforcementTraitId, string[]> = {
    patience: ['rtv:wait', 'rtv:patience'],
    invalidationDiscipline: ['rtv:invalidation'],
    uncertaintyHandling: ['rtv:uncertainty', 'rtv:inaction_ok', 'rtv:wait'],
    evidenceDiscipline: ['rtv:evidence'],
    researchEfficiency: ['rtv:wait', 'rtv:patience'],
    confirmationResistance: ['rtv:confirmation'],
    decisionStamina: ['rtv:stamina'],
    adaptability: ['rtv:invalidation'],
  };
  const replayHit = countNoteAny(records, 'replay_completed', tagNeedles[traitId], since) > 0;
  const journalHit = records.some((r) => r.action === 'journaled' && r.createdAt >= since);
  const lessonHit = mappedLessonId
    ? academyProgress.some((p) => {
        if (p.lessonId !== mappedLessonId) return false;
        const at = p.practicedAtMs ?? p.readAtMs ?? 0;
        return at >= nowMs - RECENT_LESSON_MS;
      })
    : false;
  if (traitId === 'patience' || traitId === 'researchEfficiency') {
    return replayHit;
  }
  return replayHit || (traitId === 'decisionStamina' && journalHit) || lessonHit;
}

function academyRecentlyCompleted(
  lessonId: string,
  academyProgress: ReinforcementAcademyProgress[],
  nowMs: number,
): boolean {
  return academyProgress.some((p) => {
    if (p.lessonId !== lessonId) return false;
    const at = p.practicedAtMs ?? p.readAtMs ?? 0;
    return at >= nowMs - RECENT_LESSON_MS;
  });
}

function buildAcademyRec(
  traitId: ReinforcementTraitId,
  reason: string,
  lesson: Lesson | null,
  academyProgress: ReinforcementAcademyProgress[],
  nowMs: number,
  improving: boolean,
): PracticeRecommendation | null {
  if (!lesson) return null;
  if (academyRecentlyCompleted(lesson.id, academyProgress, nowMs)) return null;
  if (improving) return null;
  return {
    traitId,
    practiceType: 'academy',
    destination: { href: `/academy/lesson/${lesson.id}`, label: lesson.title },
    reason,
    priority: 'later',
    lessonId: lesson.id,
    expiresAt: nowMs + RECENT_LESSON_MS,
  };
}

function replayDestination(prefs: ReinforcementCoachPrefs | null | undefined): {
  href: string;
  label: string;
} {
  const markets = (prefs?.markets ?? []).filter(Boolean);
  if (markets.includes('forex')) {
    return { href: '/decision/replay-tv', label: 'Replay TV · Forex-ranked rooms' };
  }
  if (markets.includes('crypto')) {
    return { href: '/decision/replay-tv', label: 'Replay TV · Crypto-ranked rooms' };
  }
  return { href: '/decision/replay-tv', label: 'Decision Replay TV' };
}

function struggleBoost(prefs: ReinforcementCoachPrefs | null | undefined): ReinforcementTraitId | null {
  const blob = (prefs?.struggles ?? []).join(' ').toLowerCase();
  if (/patience/.test(blob)) return 'patience';
  if (/invalidation|risk|exit/.test(blob)) return 'invalidationDiscipline';
  if (/fomo|confirmation/.test(blob)) return 'confirmationResistance';
  if (/overtrad|attention/.test(blob)) return 'researchEfficiency';
  return null;
}

function selectTodayCue(input: {
  observations: ReinforcementObservation[];
  primary: PracticeRecommendation | null;
  dna: TradingDnaProfile;
  recentlyPracticed: boolean;
  nowMs: number;
}): ReinforcementTodayCue | null {
  const focus = input.observations.find((o) => o.direction === 'focus');
  const patience = input.dna.traits.find((t) => t.id === 'patience');
  if (focus && !isStronglyImproving(input.dna.traits.find((t) => t.id === focus.traitId))) {
    if (input.recentlyPracticed && input.primary?.traitId === focus.traitId) return null;
    const text =
      focus.traitId === 'invalidationDiscipline'
        ? 'Practice cue. You could practice defining invalidation before your next research session.'
        : `One area worth revisiting is ${REINFORCEMENT_TRAIT_LABELS[focus.traitId].toLowerCase()}. If useful, you can practice it on Replay or in Academy.`;
    return {
      id: `reinforcement_${focus.traitId}`,
      text: sanitizeLine(text),
      traitId: focus.traitId,
      evidenceQuality: focus.evidenceQuality,
    };
  }
  if (isStronglyImproving(patience)) return null;
  if (isImproving(patience) && patience?.status === 'scored' && !input.recentlyPracticed) {
    return {
      id: 'patience_practice_cue',
      text: "You've been improving at waiting. A replay session is available if you'd like to practice it again.",
      traitId: 'patience',
      evidenceQuality: evidenceQualityFromCount(
        input.observations.find((o) => o.traitId === 'patience')
          ? totalRefCount(input.observations.find((o) => o.traitId === 'patience')!.evidenceRefs)
          : 1,
      ),
    };
  }
  const strength = input.observations.find((o) => o.direction === 'strength');
  if (strength && !focus) {
    const dnaTrait = input.dna.traits.find((t) => t.id === strength.traitId);
    if (isStronglyImproving(dnaTrait) || isImproving(dnaTrait)) return null;
    return {
      id: `strength_${strength.traitId}`,
      text: `Your recent decisions show stronger ${REINFORCEMENT_TRAIT_LABELS[strength.traitId].toLowerCase()}. Nothing needs your attention here.`,
      traitId: strength.traitId,
      evidenceQuality: strength.evidenceQuality,
    };
  }
  return null;
}

function mentorContextFrom(
  observations: ReinforcementObservation[],
  primary: PracticeRecommendation | null,
  academy: PracticeRecommendation | null,
  beginner: boolean,
): ReinforcementMentorContext {
  const known: string[] = [];
  const inference: string[] = [];
  const unknown: string[] = [];
  for (const obs of observations) {
    for (const ref of obs.evidenceRefs) {
      known.push(ref.label);
    }
    inference.push(obs.explanation);
  }
  if (!observations.length) {
    unknown.push('No recent Replay, Decision Log, or Journal process evidence is attached for these traits.');
  } else {
    unknown.push('Private journal text is not available. Motives and feelings are not inferred beyond process counts.');
    unknown.push('This is not a complete psychological profile, and it is not a forecast of results.');
  }
  const patience = observations.find((o) => o.traitId === 'patience' && o.direction !== 'focus');
  const invalidationFocus = observations.find(
    (o) => o.traitId === 'invalidationDiscipline' && o.direction === 'focus',
  );
  let observationLine: string | null = null;
  if (patience && invalidationFocus) {
    observationLine = beginner
      ? 'Your recent replay and decision-log activity suggests that waiting has become more deliberate. One area still worth practicing is defining invalidation before you commit.'
      : 'Recent waits look more deliberate. Invalidation is still the process gap.';
  } else if (patience) {
    observationLine = patience.explanation;
  } else if (observations[0]) {
    observationLine = observations[0].explanation;
  }
  if (primary?.practiceType === 'replay' && observationLine) {
    observationLine = `${observationLine} If you want to practice that, Replay TV is the matching surface.`;
  } else if (academy && observationLine && !primary) {
    observationLine = `${observationLine} Academy lesson: ${academy.destination.label}.`;
  }
  return {
    known: [...new Set(known)].slice(0, 6),
    inference: [...new Set(inference)].slice(0, 3),
    unknown: unknown.slice(0, 3),
    observationLine: observationLine ? sanitizeLine(observationLine) : null,
  };
}

export interface ComposeDecisionReinforcementInput {
  enabled?: boolean;
  dna: TradingDnaProfile;
  records: DecisionRecord[];
  journalEvidence?: DnaJournalEvidence[] | null;
  academyProgress?: ReinforcementAcademyProgress[];
  coachProfile?: ReinforcementCoachPrefs | null;
  isPremium?: boolean;
  nowMs?: number;
  lastReplayDecision?: {
    decision: ReplayTvDecision;
    namedInvalidation: boolean;
    wroteReasoning?: boolean;
  } | null;
}

/**
 * Reconstructable snapshot. Never writes storage. Outcome is not an input.
 */
export function composeDecisionReinforcement(
  input: ComposeDecisionReinforcementInput,
): DecisionReinforcementSnapshot {
  const enabled = input.enabled !== false;
  const markets = (input.coachProfile?.markets ?? []).filter(Boolean);
  if (!enabled) return emptyDecisionReinforcement(false, markets);

  const nowMs = input.nowMs ?? Date.now();
  const windowMs = input.isPremium ? PREMIUM_WINDOW_MS : FREE_WINDOW_MS;
  const sinceMs = nowMs - windowMs;
  const beginner = isBeginner(input.coachProfile?.experience);
  const academyProgress = input.academyProgress ?? [];

  const replayConnection = input.lastReplayDecision
    ? composeReplayPracticeConnection({
        decision: input.lastReplayDecision.decision,
        checklist: {
          namedInvalidation: input.lastReplayDecision.namedInvalidation,
          wroteReasoning: Boolean(input.lastReplayDecision.wroteReasoning),
        },
        enabled: true,
        nowMs,
      })
    : null;

  const freezeObs = input.lastReplayDecision
    ? observationsFromReplayCommit({
        decision: input.lastReplayDecision.decision,
        namedInvalidation: input.lastReplayDecision.namedInvalidation,
        wroteReasoning: input.lastReplayDecision.wroteReasoning,
        nowMs,
      })
    : [];

  const observations: ReinforcementObservation[] = [];
  const seen = new Set<ReinforcementTraitId>();

  for (const freeze of freezeObs) {
    if (seen.has(freeze.traitId)) continue;
    seen.add(freeze.traitId);
    observations.push(freeze);
  }

  for (const traitId of REINFORCEMENT_TRAIT_IDS) {
    if (seen.has(traitId)) continue;
    const dnaTrait = input.dna.traits.find((t) => t.id === traitId);
    const refs = refsForTrait(traitId, input.records, input.journalEvidence, sinceMs);
    const count = totalRefCount(refs);
    if (count === 0 && dnaTrait?.status !== 'scored') continue;
    if (count === 0) continue;
    const quality = evidenceQualityFromCount(count);
    if (quality === 'insufficient') continue;
    const focusGap =
      (traitId === 'invalidationDiscipline' &&
        freezeObs.some((o) => o.traitId === 'invalidationDiscipline' && o.direction === 'focus')) ||
      ((dnaTrait?.score ?? 100) < 55 && dnaTrait?.status === 'scored' && !isImproving(dnaTrait));
    const direction = directionForTrait(dnaTrait, focusGap);
    if (!direction) continue;
    if (isStronglyImproving(dnaTrait) && direction !== 'focus') {
      observations.push({
        traitId,
        direction: 'strength',
        evidenceRefs: refs,
        evidenceQuality: quality,
        source: refs[0]?.source ?? 'decision_log',
        createdAt: nowMs,
        explanation: explanationFor(traitId, 'strength', refs, beginner),
      });
      seen.add(traitId);
      continue;
    }
    observations.push({
      traitId,
      direction,
      evidenceRefs: refs,
      evidenceQuality: quality,
      source: refs[0]?.source ?? 'decision_log',
      createdAt: nowMs,
      explanation: explanationFor(traitId, direction, refs, beginner),
    });
    seen.add(traitId);
  }

  observations.sort((a, b) => {
    const rank = { focus: 0, developing: 1, strength: 2 };
    return rank[a.direction] - rank[b.direction];
  });
  const capped = observations.slice(0, 4);

  const struggle = struggleBoost(input.coachProfile);
  if (struggle) {
    const idx = capped.findIndex((o) => o.traitId === struggle);
    if (idx > 0 && capped[idx]?.direction !== 'strength') {
      const [item] = capped.splice(idx, 1);
      if (item) capped.unshift(item);
    }
  }

  const focus = capped.find((o) => o.direction === 'focus') ?? capped.find((o) => o.direction === 'developing');
  const focusTrait = focus?.traitId;
  const dnaFocus = focusTrait ? input.dna.traits.find((t) => t.id === focusTrait) : undefined;
  const mappedLesson = focusTrait ? resolveAcademyLessonForTrait(focusTrait) : null;
  const recent = focusTrait
    ? practicedTraitRecently(focusTrait, input.records, academyProgress, nowMs, mappedLesson?.id)
    : false;
  const strongly = isStronglyImproving(dnaFocus);

  let primaryPractice: PracticeRecommendation | null = null;
  if (focusTrait && !strongly && !(recent && focus?.direction !== 'focus')) {
    const dest = replayDestination(input.coachProfile);
    const practiceType: PracticeRecommendation['practiceType'] =
      focusTrait === 'invalidationDiscipline' ||
      focusTrait === 'patience' ||
      focusTrait === 'uncertaintyHandling' ||
      focusTrait === 'confirmationResistance'
        ? 'replay'
        : focusTrait === 'evidenceDiscipline' || focusTrait === 'researchEfficiency'
          ? 'replay'
          : 'journal';
    primaryPractice = {
      traitId: focusTrait,
      practiceType,
      destination:
        practiceType === 'replay'
          ? dest
          : { href: '/journal', label: 'Journal process note' },
      reason: sanitizeLine(
        focus?.explanation ??
          `You could practice ${REINFORCEMENT_TRAIT_LABELS[focusTrait].toLowerCase()} on the matching surface.`,
      ),
      priority: focus?.direction === 'focus' ? 'now' : 'later',
      expiresAt: nowMs + RECENT_PRACTICE_MS,
    };
    if (markets.length === 1 && practiceType === 'replay') {
      primaryPractice.reason = `${primaryPractice.reason} Mentor Setup listed ${markets[0]} as a research interest — matching rooms are ranked first, not hidden.`;
    }
  }

  const academyLesson = primaryPractice
    ? buildAcademyRec(
        primaryPractice.traitId,
        sanitizeLine(
          `This existing Academy lesson matches ${REINFORCEMENT_TRAIT_LABELS[primaryPractice.traitId].toLowerCase()}.`,
        ),
        resolveAcademyLessonForTrait(primaryPractice.traitId),
        academyProgress,
        nowMs,
        isImproving(input.dna.traits.find((t) => t.id === primaryPractice.traitId)) &&
          focus?.direction !== 'focus',
      )
    : null;

  const todayCue = selectTodayCue({
    observations: capped,
    primary: primaryPractice,
    dna: input.dna,
    recentlyPracticed: recent,
    nowMs,
  });

  return {
    enabled: true,
    observations: capped,
    primaryPractice,
    academyLesson,
    todayCue,
    mentorContext: mentorContextFrom(capped, primaryPractice, academyLesson, beginner),
    replayPracticeConnection: replayConnection,
    preferredMarkets: markets,
  };
}

export function assertNoGuiltLanguage(text: string): boolean {
  return !GUILT.test(text);
}
