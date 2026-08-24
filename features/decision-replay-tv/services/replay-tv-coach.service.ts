import type {
  ReplayTvChecklist,
  ReplayTvCoachNote,
  ReplayTvDecision,
  ReplayTvDecisionRecord,
  ReplayTvEpisode,
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
    freeText: '',
  };
}

export function composeReplayTvReasoning(fields: ReplayTvReasoning): string {
  return [
    fields.thesis.trim() ? `Thesis: ${fields.thesis.trim()}` : null,
    fields.evidence.trim() ? `Evidence: ${fields.evidence.trim()}` : null,
    fields.invalidation.trim() ? `Invalidation: ${fields.invalidation.trim()}` : null,
    fields.mainUncertainty.trim() ? `Uncertainty: ${fields.mainUncertainty.trim()}` : null,
    `Process confidence ${clampConfidence(fields.confidence)}/5 (not a price forecast).`,
    fields.freeText?.trim() || null,
  ]
    .filter(Boolean)
    .join(' ');
}

export function reasoningHasSubstance(fields: ReplayTvReasoning | undefined, fallback = ''): boolean {
  if (!fields) return fallback.trim().length >= 12;
  const packed = `${fields.thesis} ${fields.evidence} ${fields.invalidation} ${fields.mainUncertainty} ${fields.freeText ?? ''} ${fallback}`;
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

  return {
    noticed,
    missed,
    changed,
    consistency,
    invalidationQuestion,
  };
}

export function formatReplayTvCoachReply(note: ReplayTvCoachNote): string {
  return [
    `What you noticed: ${note.noticed}`,
    `What you missed: ${note.missed}`,
    note.changed ? `What changed: ${note.changed}` : null,
    `Was your reasoning internally consistent? ${note.consistency}`,
    `What would have invalidated your thesis? ${note.invalidationQuestion}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
