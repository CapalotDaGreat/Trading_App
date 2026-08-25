import type { ReplayTvDecision, ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import {
  canConsumeMonthly,
  incrementMonthlyUsage,
} from '@/features/subscription/services/entitlement.service';

export type ReplayTvAccessBlockReason =
  | 'monthly_limit'
  | 'premium_library'
  | null;

export interface ReplayTvAccessResult {
  allowed: boolean;
  reason: ReplayTvAccessBlockReason;
  used: number;
  limit: number;
  message?: string;
}

/** Advanced / expert rooms and catalog premiumOnly flags require Premium. */
export function episodeRequiresPremium(episode: ReplayTvEpisode): boolean {
  if (episode.premiumOnly) return true;
  return episode.difficulty === 'advanced' || episode.difficulty === 'expert';
}

export async function evaluateReplayTvBeginAccess(input: {
  uid: string;
  episode: ReplayTvEpisode;
  isPremium: boolean;
}): Promise<ReplayTvAccessResult> {
  if (!input.isPremium && episodeRequiresPremium(input.episode)) {
    return {
      allowed: false,
      reason: 'premium_library',
      used: 0,
      limit: 0,
      message:
        'Masterclass and advanced historical rooms are included with Premium — foundation rooms stay free.',
    };
  }

  const monthly = await canConsumeMonthly(input.uid, 'replaySessionsMonthly');
  if (!monthly.allowed) {
    return {
      allowed: false,
      reason: 'monthly_limit',
      used: monthly.used,
      limit: monthly.limit,
      message: `You have used ${monthly.used} of ${monthly.limit} free Replay TV sessions this month. Premium removes the monthly cap.`,
    };
  }

  return {
    allowed: true,
    reason: null,
    used: monthly.used,
    limit: monthly.limit,
  };
}

export async function recordReplayTvMonthlyConsumption(uid: string): Promise<number> {
  return incrementMonthlyUsage(uid, 'replaySessionsMonthly');
}

/** DNA / Decision Log skill tags — process evidence only. */
export function buildReplayTvDecisionLogNote(input: {
  episode: ReplayTvEpisode;
  processQuality: number;
  evidenceQuality: number;
  invalidationClarity: number;
  patience: number;
  namedInvalidation: boolean;
  /** Process choices from this session — never outcome tags. */
  decisions?: ReplayTvDecision[];
}): string {
  const tags: string[] = [
    `skills:${input.episode.skills.slice(0, 4).join(',')}`,
    `emphasis:${input.episode.scoringEmphasis.slice(0, 3).join(',')}`,
  ];
  const decisions = input.decisions ?? [];
  if (decisions.includes('wait')) tags.push('rtv:wait');
  if (decisions.includes('skip') || decisions.includes('protect_attention')) tags.push('rtv:skip');
  if (decisions.includes('research_more')) tags.push('rtv:research_more');
  if (decisions.includes('mark_invalidation') || input.namedInvalidation) {
    tags.push('rtv:invalidation_named');
  }
  if (
    input.episode.collectionIds.includes('crashes') ||
    input.episode.collectionIds.includes('psychology') ||
    input.patience >= 75
  ) {
    tags.push('rtv:calm_vol');
  }
  if (input.patience >= 70 || decisions.includes('wait')) tags.push('rtv:patience');
  if (input.evidenceQuality >= 70) tags.push('rtv:evidence');
  if (
    input.namedInvalidation &&
    (input.invalidationClarity >= 75 || decisions.includes('mark_invalidation'))
  ) {
    tags.push('rtv:invalidation');
  }
  if (input.patience >= 70) tags.push('rtv:skill:patience');
  if (input.evidenceQuality >= 70) tags.push('rtv:skill:evidence');
  if (input.episode.inactionIsValidProcess) tags.push('rtv:inaction_ok');
  if (input.episode.collectionIds.includes('uncertainty') || input.episode.inactionIsValidProcess) {
    tags.push('rtv:uncertainty');
  }
  if (input.episode.scoringEmphasis.includes('alternatives') && input.patience >= 65) {
    tags.push('rtv:confirmation');
    tags.push('rtv:skill:confirmation');
  }
  if (input.episode.scoringEmphasis.includes('process') && input.processQuality >= 70) {
    tags.push('rtv:stamina');
    tags.push('rtv:skill:stamina');
  }

  return [
    `Replay TV · ${input.episode.title} · process ${input.processQuality}`,
    tags.join(' '),
  ].join(' · ');
}
