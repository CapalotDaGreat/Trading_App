import { composeReplayPracticeConnection } from '@/features/decision/services/decision-reinforcement.service';
import type {
  ReplayTvChecklist,
  ReplayTvCoachNote,
  ReplayTvDecision,
  ReplayTvDecisionRecord,
  ReplayTvEpisode,
  ReplayTvProcessComparison,
  ReplayTvReasoning,
} from '@/features/decision-replay-tv/types/replay-tv.types';

const BUY_SELL = /\b(buy|sell|bought|sold|long now|short now|you should have)\b/i;

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function emptyReplayTvReasoning(): ReplayTvReasoning {
  return {
    thesis: '',
    evidence: '',
    invalidation: '',
    confidence: 3,
    mainUncertainty: '',
    why: '',
    whatWouldChangeMind: '',
    riskAssessment: '',
    intendedSize: '',
    expectedRisk: '',
    alternatives: '',
    freeText: '',
  };
}

export function composeReplayTvReasoning(fields: ReplayTvReasoning): string {
  return [
    fields.thesis.trim() ? `Thesis: ${fields.thesis.trim()}` : null,
    fields.why?.trim() ? `Why: ${fields.why.trim()}` : null,
    fields.evidence.trim() ? `Evidence: ${fields.evidence.trim()}` : null,
    fields.invalidation.trim() ? `Invalidation: ${fields.invalidation.trim()}` : null,
    fields.whatWouldChangeMind?.trim() ? `Would change mind: ${fields.whatWouldChangeMind.trim()}` : null,
    fields.mainUncertainty.trim() ? `Uncertainty: ${fields.mainUncertainty.trim()}` : null,
    fields.riskAssessment?.trim() ? `Risk: ${fields.riskAssessment.trim()}` : null,
    fields.intendedSize?.trim() ? `Size: ${fields.intendedSize.trim()}` : null,
    fields.expectedRisk?.trim() ? `Expected risk: ${fields.expectedRisk.trim()}` : null,
    fields.alternatives?.trim() ? `Alternatives: ${fields.alternatives.trim()}` : null,
    `Process confidence ${clampConfidence(fields.confidence)}/5 (not a price forecast).`,
    fields.freeText?.trim() || null,
  ]
    .filter(Boolean)
    .join(' ');
}

export function reasoningHasSubstance(fields: ReplayTvReasoning | undefined, fallback = ''): boolean {
  if (!fields) return fallback.trim().length >= 12;
  const packed = `${fields.thesis} ${fields.why ?? ''} ${fields.evidence} ${fields.invalidation} ${fields.whatWouldChangeMind ?? ''} ${fields.mainUncertainty} ${fields.riskAssessment ?? ''} ${fields.intendedSize ?? ''} ${fields.alternatives ?? ''} ${fields.freeText ?? ''} ${fallback}`;
  return packed.trim().length >= 12;
}

function sanitizeCoachLine(line: string): string {
  return line.replace(BUY_SELL, 'reallocate research time').trim();
}

function decisionLabel(decision: ReplayTvDecision): string {
  switch (decision) {
    case 'research_more':
      return 'continue researching';
    case 'wait':
      return 'wait for more evidence';
    case 'no_trade':
      return 'take no trade';
    case 'enter':
      return 'enter a paper thesis';
    case 'reduce':
      return 'reduce exposure';
    case 'exit':
      return 'stand down';
    case 'skip':
      return 'skip';
    case 'protect_attention':
      return 'protect attention';
    case 'write_thesis':
      return 'form a research thesis';
    case 'mark_invalidation':
      return 'mark invalidation';
    case 'review_other':
      return 'review another asset';
    default:
      return 'pause';
  }
}

/**
 * Local, offline-safe coach after a committed freeze.
 * Never uses future candles, outcomes, or buy/sell language.
 */
export function composeReplayTvCoachNote(input: {
  episode: ReplayTvEpisode;
  checkpointPrompt: string;
  mentorFollowUp: string;
  decision: ReplayTvDecision;
  structured?: ReplayTvReasoning;
  fallbackReasoning?: string;
  checklist: ReplayTvChecklist;
  previous?: ReplayTvDecisionRecord | null;
}): ReplayTvCoachNote {
  const thesis = input.structured?.thesis.trim() || '';
  const evidence = input.structured?.evidence.trim() || '';
  const invalidationText = input.structured?.invalidation.trim() || '';
  const namedInvalidation = input.checklist.namedInvalidation || invalidationText.length > 0;
  const uncertainty = input.structured?.mainUncertainty.trim() || '';
  const inaction =
    input.decision === 'wait' ||
    input.decision === 'skip' ||
    input.decision === 'protect_attention' ||
    input.decision === 'review_other';

  const noticed = sanitizeCoachLine(
    thesis
      ? `You chose to ${decisionLabel(input.decision)} and named a thesis: “${thesis.slice(0, 140)}”.`
      : evidence
        ? `You chose to ${decisionLabel(input.decision)} and cited evidence available at this freeze.`
        : `You chose to ${decisionLabel(input.decision)} with the tape still incomplete.`,
  );

  const missed = sanitizeCoachLine(
    namedInvalidation
      ? input.mentorFollowUp
      : 'Your invalidation condition was not explicit yet. Name what would kill the research case before the next bar.',
  );

  const changed = input.previous
    ? sanitizeCoachLine(
        input.previous.decision === input.decision
          ? 'Your process choice stayed the same as the prior pause — consistency is useful if the evidence did not change.'
          : `Conditions at this freeze led you to switch from ${decisionLabel(input.previous.decision)} to ${decisionLabel(input.decision)}.`,
      )
    : null;

  const hasThesisAndEvidence = Boolean(thesis && evidence);
  const confidence = input.structured ? clampConfidence(input.structured.confidence) : 3;
  const consistency = sanitizeCoachLine(
    hasThesisAndEvidence
      ? confidence >= 4 && !evidence
        ? 'Process confidence is high relative to the evidence you wrote — consider lowering conviction until the freeze evidence is clearer.'
        : 'Thesis and evidence are both present, which keeps the reasoning internally checkable.'
      : uncertainty
        ? `You named the main uncertainty (“${uncertainty.slice(0, 120)}”), which is internally consistent with waiting or skipping.`
        : inaction
          ? 'Waiting or skipping without a written thesis can still be consistent — if you can say what evidence is still missing.'
          : 'Write thesis and evidence together so the next pause can test whether your reasoning still holds.',
  );

  const invalidationQuestion = sanitizeCoachLine(
    invalidationText
      ? `If “${invalidationText.slice(0, 120)}” prints, would you stop researching this case?`
      : namedInvalidation
        ? 'If your named invalidation prints, would you stop researching this case?'
        : 'What would have invalidated your thesis at this freeze — a level, a time budget, or a regime change?',
  );

  const knew = sanitizeCoachLine(
    evidence
      ? `At this freeze you had: ${evidence.slice(0, 160)}.`
      : 'At this freeze you had the visible tape and any news already available — nothing from the future.',
  );
  const believed = sanitizeCoachLine(
    thesis
      ? `You believed: “${thesis.slice(0, 140)}”.`
      : inaction
        ? 'You believed the case was not ready — waiting or skipping is a valid research decision.'
        : 'You did not write a thesis, so the belief is still implicit.',
  );
  const ignored = sanitizeCoachLine(
    namedInvalidation
      ? uncertainty
        ? `You named uncertainty (“${uncertainty.slice(0, 100)}”) rather than pretending the freeze was complete.`
        : 'Invalidation is named. Check whether you still ignored time budget or an alternative case.'
      : 'You have not yet named invalidation — that is the main process gap at this freeze.',
  );
  const considered = sanitizeCoachLine(
    input.checklist.consideredAlternative
      ? 'You considered an alternative use of research time.'
      : inaction
        ? 'You considered not spending more time here. That can be the expert move.'
        : 'Record whether you considered waiting, skipping, or reviewing another asset.',
  );

  const decided = sanitizeCoachLine(
    `You decided to ${decisionLabel(input.decision)} — a research-time process choice, not a prediction of what the tape would do next.`,
  );

  const didWell = sanitizeCoachLine(
    namedInvalidation && (inaction || thesis)
      ? inaction
        ? 'You protected attention and named invalidation. Doing nothing can be the correct process.'
        : 'You wrote a checkable thesis and named what would kill the case.'
      : inaction
        ? 'Waiting or skipping is valid. The next upgrade is naming invalidation before the following freeze.'
        : evidence
          ? 'You cited freeze evidence instead of guessing the hidden path.'
          : 'You committed a process choice under a blind tape. That is the skill this room trains.',
  );

  const practiceNext = sanitizeCoachLine(
    !namedInvalidation
      ? 'Practice naming invalidation in one sentence before the next pause.'
      : uncertainty
        ? 'Practice stating uncertainty without filling it with a forecast.'
        : inaction
          ? 'Practice the same wait/skip rule on the next incomplete freeze.'
          : 'Practice citing only evidence that is actually on this freeze.',
  );

  const practiceConnection = composeReplayPracticeConnection({
    decision: input.decision,
    checklist: input.checklist,
  });

  return {
    noticed,
    missed,
    changed,
    consistency,
    invalidationQuestion,
    knew,
    believed,
    ignored,
    considered,
    decided,
    didWell,
    practiceNext,
    practiceConnection,
  };
}

export function formatReplayTvCoachReply(note: ReplayTvCoachNote): string {
  return [
    `What you knew: ${note.knew}`,
    `What you decided: ${note.decided}`,
    note.changed ? `What changed: ${note.changed}` : null,
    `What you missed: ${note.missed}`,
    `What you did well: ${note.didWell}`,
    `What to practice next: ${note.practiceNext}`,
    note.practiceConnection
      ? `Practice connection: ${note.practiceConnection.workingOn} ${note.practiceConnection.nextPractice}`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * After the tape is revealed: compare process to what became visible.
 * Never implies that a profitable or “correct” path proves decision quality.
 */
export function composeReplayTvProcessComparison(input: {
  episode: ReplayTvEpisode;
  decisions: ReplayTvDecisionRecord[];
  checklist: ReplayTvChecklist;
  weakestSkillLabel: string;
}): ReplayTvProcessComparison {
  const last = input.decisions[input.decisions.length - 1];
  const choices = input.decisions.map((d) => decisionLabel(d.decision)).join(', then ');
  const evidenceBits = input.decisions
    .map((d) => d.structured?.evidence.trim() || d.reasoning.trim())
    .filter(Boolean)
    .slice(0, 2);
  const inaction = input.decisions.some(
    (d) =>
      d.decision === 'wait' ||
      d.decision === 'skip' ||
      d.decision === 'protect_attention' ||
      d.decision === 'review_other',
  );

  const knew = sanitizeCoachLine(
    evidenceBits.length
      ? `At the freezes you had: ${evidenceBits.map((bit) => bit.slice(0, 100)).join(' · ')}.`
      : 'At the freezes you had only the visible tape and news already available — never the later path.',
  );

  const decided = sanitizeCoachLine(
    choices
      ? `You decided to ${choices}. Those are research-time process choices, not a grade of the historical path.`
      : 'No process choice was logged. The room still grades presence under a blind tape, never P&L.',
  );

  const changed = sanitizeCoachLine(
    `After you committed, the educational tape continued: ${input.episode.historicalOutcome.slice(0, 180)} That describes what became visible — it does not prove or disprove the quality of your process.`,
  );

  const missed = sanitizeCoachLine(
    input.checklist.namedInvalidation
      ? last?.coach?.missed ??
        'The later tape can show information you could not have known. Missing a future fact is not a process failure.'
      : 'Invalidation was not explicit on every pause. Name what would kill the case before the next bar — that is independent of how the path printed.',
  );

  const didWell = sanitizeCoachLine(
    inaction
      ? 'You treated waiting, skipping, or reviewing another case as a legitimate decision. A later move on the tape does not retroactively make that patience “wrong.”'
      : input.checklist.namedInvalidation
        ? 'You named invalidation under uncertainty. Process quality is that habit — not whether the historical reconstruction “paid.”'
        : 'You stayed with a blind tape and committed a process choice. That is the skill, regardless of the later path.',
  );

  const practiceNext = sanitizeCoachLine(
    `Practice ${input.weakestSkillLabel} on the next blind pause. Do not chase the historical outcome; repeat the process under a new freeze.`,
  );

  const lastDecision = last?.decision;
  const practiceConnection = lastDecision
    ? composeReplayPracticeConnection({
        decision: lastDecision,
        checklist: input.checklist,
      })
    : null;

  return { knew, decided, changed, missed, didWell, practiceNext, practiceConnection };
}
