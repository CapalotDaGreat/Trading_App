import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
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
}): string {
  const tags: string[] = [
    `skills:${input.episode.skills.slice(0, 4).join(',')}`,
    `emphasis:${input.episode.scoringEmphasis.slice(0, 3).join(',')}`,
  ];
  if (
    input.episode.collectionIds.includes('crashes') ||
    input.episode.collectionIds.includes('psychology') ||
    input.patience >= 75
  ) {
    tags.push('rtv:calm_vol');
  }
  if (input.evidenceQuality >= 70) tags.push('rtv:evidence');
  if (input.namedInvalidation && input.invalidationClarity >= 75) {
    tags.push('rtv:invalidation');
  }

  return [
    `Replay TV · ${input.episode.title} · process ${input.processQuality}`,
    tags.join(' '),
  ].join(' · ');
}
