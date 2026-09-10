import type { ReplayTvChecklist, ReplayTvDecisionRecord, ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';

export interface ReplayProcessGrade {
  thesisQuality: number;
  evidence: number;
  invalidation: number;
  risk: number;
  uncertainty: number;
  alternatives: number;
  informationResponse: number;
  hindsightHygiene: number;
  composite: number;
  /** Process vs tape — never “you were wrong because price fell.” */
  outcomeNote: string;
  knewThen: string;
  happenedAfter: string;
  reminder: string;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasText(value?: string): boolean {
  return Boolean(value?.trim() && value.trim().length >= 8);
}

function joined(decisions: ReplayTvDecisionRecord[]): string {
  return decisions
    .map((item) => `${item.reasoning} ${item.structured?.thesis ?? ''} ${item.structured?.evidence ?? ''}`)
    .join(' ')
    .toLowerCase();
}

function consistentPlan(decisions: ReplayTvDecisionRecord[], checklist: ReplayTvChecklist): boolean {
  const last = decisions[decisions.length - 1];
  return (
    checklist.namedInvalidation ||
    hasText(last?.structured?.invalidation) ||
    hasText(last?.structured?.expectedRisk) ||
    hasText(last?.structured?.riskAssessment)
  );
}

function exceededStatedRisk(decisions: ReplayTvDecisionRecord[]): boolean {
  const last = decisions[decisions.length - 1];
  if (!last) return false;
  const size = (last.structured?.intendedSize ?? '').toLowerCase();
  const risk = (last.structured?.expectedRisk ?? last.structured?.riskAssessment ?? '').toLowerCase();
  if (last.decision !== 'enter') return false;
  if (size.includes('0') && (size.includes('no size') || size.includes('zero'))) return true;
  if (risk.includes('too large') || risk.includes('exceed')) return true;
  if (!hasText(last.structured?.intendedSize) && !hasText(last.structured?.expectedRisk)) return true;
  return false;
}

function pathMovedAgainst(
  episode: ReplayTvEpisode,
  decisions: ReplayTvDecisionRecord[],
  freezeClose?: number,
  laterClose?: number,
): boolean | null {
  void episode;
  const last = decisions[decisions.length - 1];
  if (last?.decision !== 'enter') return null;
  if (freezeClose == null || laterClose == null || freezeClose <= 0) return null;
  const change = (laterClose - freezeClose) / freezeClose;
  if (Math.abs(change) < 0.01) return null;
  return change < 0;
}

export function gradeReplayProcess(input: {
  episode: ReplayTvEpisode;
  decisions: ReplayTvDecisionRecord[];
  checklist: ReplayTvChecklist;
  freezeClose?: number;
  laterClose?: number;
  revealed?: boolean;
}): ReplayProcessGrade {
  const { decisions, checklist, episode } = input;
  const last = decisions[decisions.length - 1];
  const notes = joined(decisions);

  const thesisQuality = clamp(
    (decisions.filter((item) => hasText(item.structured?.thesis) || /thesis|believe|working case/i.test(item.reasoning)).length /
      Math.max(1, decisions.length)) *
      100,
  );
  const evidence = clamp(
    (checklist.wroteReasoning ? 40 : 15) +
      (hasText(last?.structured?.evidence) ? 35 : 0) +
      (/evidence|structure|headline|level|tape/i.test(notes) ? 25 : 0),
  );
  const invalidation = clamp(
    (checklist.namedInvalidation ? 55 : 15) +
      (hasText(last?.structured?.invalidation) || hasText(last?.structured?.whatWouldChangeMind) ? 45 : 0),
  );
  const risk = clamp(
    (hasText(last?.structured?.riskAssessment) || hasText(last?.structured?.expectedRisk) ? 55 : 20) +
      (/risk|size|gap|liquidity|downside/i.test(notes) ? 25 : 0) +
      (checklist.consideredTimeBudget ? 20 : 0),
  );
  const uncertainty = clamp(
    (hasText(last?.structured?.mainUncertainty) ? 60 : 20) +
      (typeof last?.structured?.confidence === 'number' && last.structured.confidence <= 3 ? 25 : 0) +
      (/uncertain|unknown|incomplete/i.test(notes) ? 15 : 0),
  );
  const alternatives = clamp(
    (checklist.consideredAlternative ? 50 : 20) +
      (hasText(last?.structured?.alternatives) ? 30 : 0) +
      (/instead|alternative|wait|skip|no trade/i.test(notes) ? 20 : 0),
  );
  const informationResponse = clamp(
    40 +
      decisions.filter((item) => item.decision === 'wait' || item.decision === 'research_more' || item.decision === 'reduce')
        .length *
        18 +
      (checklist.notedRegime ? 12 : 0),
  );
  const hindsightHygiene = clamp(
    decisions.length === 0
      ? 0
      : (decisions.filter((item) => item.committedBlind !== false).length / decisions.length) * 100,
  );

  const composite = clamp(
    (thesisQuality + evidence + invalidation + risk + uncertainty + alternatives + informationResponse + hindsightHygiene) / 8,
  );

  const against = pathMovedAgainst(episode, decisions, input.freezeClose, input.laterClose);
  const planOk = consistentPlan(decisions, checklist);
  const sizeOk = !exceededStatedRisk(decisions);

  let outcomeNote = 'Outcome does not determine decision quality.';
  if (input.revealed && against === true && planOk) {
    outcomeNote =
      'The scenario moved against your thesis, but your original risk and invalidation were consistent with the plan.';
  } else if (input.revealed && against === false && !sizeOk) {
    outcomeNote = 'The outcome was profitable, but the position exceeded your stated risk tolerance.';
  } else if (input.revealed && against === false && planOk) {
    outcomeNote =
      'The later path was favorable. That does not prove the process was strong — only that the tape continued after you committed.';
  } else if (input.revealed && against === true && !planOk) {
    outcomeNote =
      'The scenario moved against the working case. The gap is the missing invalidation or risk note — not the later print itself.';
  }

  const knewBits = [
    last?.structured?.evidence?.trim() || last?.reasoning.trim() || 'the visible tape and headlines at the freeze',
    last?.structured?.invalidation?.trim() ? `invalidation: ${last.structured.invalidation.trim()}` : null,
  ].filter(Boolean);

  return {
    thesisQuality,
    evidence,
    invalidation,
    risk,
    uncertainty,
    alternatives,
    informationResponse,
    hindsightHygiene,
    composite,
    outcomeNote,
    knewThen: `What you knew then: ${knewBits.join(' · ')}.`,
    happenedAfter: input.revealed
      ? `What happened afterward: ${episode.historicalOutcome}`
      : 'What happened afterward is still hidden until you commit and reveal.',
    reminder: 'Outcome does not determine decision quality.',
  };
}
