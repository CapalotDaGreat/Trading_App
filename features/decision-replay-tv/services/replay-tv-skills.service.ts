import { REPLAY_TV_EPISODES } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import type {
  ReplayTvEpisode,
  ReplayTvProgress,
  ReplayTvScoringEmphasis,
} from '@/features/decision-replay-tv/types/replay-tv.types';

/** Process skills — never P&L, never “you were right”. */
export type ReplayTvSkillId =
  | 'evidence_gathering'
  | 'invalidation'
  | 'patience'
  | 'regime_recognition'
  | 'confirmation_resistance'
  | 'decision_stamina'
  | 'research_efficiency'
  | 'uncertainty_handling';

export interface ReplayTvSkillProgress {
  id: ReplayTvSkillId;
  label: string;
  detail: string;
  reps: number;
  bestProcess: number | null;
  status: 'not_started' | 'practicing' | 'building';
}

const SKILL_META: Record<ReplayTvSkillId, { label: string; detail: string }> = {
  evidence_gathering: {
    label: 'Evidence gathering',
    detail: 'Naming what is actually on the freeze before committing.',
  },
  invalidation: {
    label: 'Invalidation',
    detail: 'Writing what would kill the research case before the next bar.',
  },
  patience: {
    label: 'Patience',
    detail: 'Waiting or skipping when the freeze is incomplete.',
  },
  regime_recognition: {
    label: 'Regime recognition',
    detail: 'Noticing when conditions change without needing the future.',
  },
  confirmation_resistance: {
    label: 'Confirmation resistance',
    detail: 'Not widening the thesis just to stay in the case.',
  },
  decision_stamina: {
    label: 'Decision stamina',
    detail: 'Staying process-complete across several pauses.',
  },
  research_efficiency: {
    label: 'Research efficiency',
    detail: 'Protecting attention when the case does not deserve more time.',
  },
  uncertainty_handling: {
    label: 'Uncertainty handling',
    detail: 'Saying what you do not know instead of filling the gap.',
  },
};

const EMPHASIS_TO_SKILL: Partial<Record<ReplayTvScoringEmphasis, ReplayTvSkillId>> = {
  evidence: 'evidence_gathering',
  invalidation: 'invalidation',
  patience: 'patience',
  process: 'decision_stamina',
  information_use: 'research_efficiency',
  risk: 'uncertainty_handling',
  alternatives: 'confirmation_resistance',
};

function skillsForEpisode(episode: ReplayTvEpisode): ReplayTvSkillId[] {
  const ids = new Set<ReplayTvSkillId>();
  for (const emphasis of episode.scoringEmphasis) {
    const mapped = EMPHASIS_TO_SKILL[emphasis];
    if (mapped) ids.add(mapped);
  }
  const blob = episode.skills.join(' ').toLowerCase();
  if (/evidence/.test(blob)) ids.add('evidence_gathering');
  if (/invalid/.test(blob)) ids.add('invalidation');
  if (/patience|wait/.test(blob)) ids.add('patience');
  if (/regime/.test(blob)) ids.add('regime_recognition');
  if (/confirm/.test(blob)) ids.add('confirmation_resistance');
  if (/uncertain|ambigu/.test(blob)) ids.add('uncertainty_handling');
  if (episode.inactionIsValidProcess) ids.add('patience');
  if (episode.kinds?.includes('regime_transition')) ids.add('regime_recognition');
  return [...ids];
}

export function deriveReplayTvSkillProgress(progress: ReplayTvProgress): ReplayTvSkillProgress[] {
  const completed = new Set(progress.completedEpisodeIds);
  const counts: Record<ReplayTvSkillId, { reps: number; best: number | null }> = {
    evidence_gathering: { reps: 0, best: null },
    invalidation: { reps: 0, best: null },
    patience: { reps: 0, best: null },
    regime_recognition: { reps: 0, best: null },
    confirmation_resistance: { reps: 0, best: null },
    decision_stamina: { reps: 0, best: null },
    research_efficiency: { reps: 0, best: null },
    uncertainty_handling: { reps: 0, best: null },
  };

  for (const episode of REPLAY_TV_EPISODES) {
    if (!completed.has(episode.id)) continue;
    const process = progress.bestProcessByEpisode[episode.id] ?? null;
    for (const skill of skillsForEpisode(episode)) {
      counts[skill].reps += 1;
      if (process != null) {
        counts[skill].best =
          counts[skill].best == null ? process : Math.max(counts[skill].best, process);
      }
    }
  }

  return (Object.keys(SKILL_META) as ReplayTvSkillId[]).map((id) => {
    const reps = counts[id].reps;
    const status: ReplayTvSkillProgress['status'] =
      reps <= 0 ? 'not_started' : reps < 3 ? 'practicing' : 'building';
    return {
      id,
      label: SKILL_META[id].label,
      detail: SKILL_META[id].detail,
      reps,
      bestProcess: counts[id].best,
      status,
    };
  });
}

export function weakestReplayTvSkill(
  skills: ReplayTvSkillProgress[],
): ReplayTvSkillProgress {
  const ranked = [...skills].sort((a, b) => {
    if (a.reps !== b.reps) return a.reps - b.reps;
    return (a.bestProcess ?? 0) - (b.bestProcess ?? 0);
  });
  return ranked[0] ?? skills[0]!;
}

/** Next room that trains the weakest process skill — catalog only, no second store. */
export function selectReplayTvNextPractice(progress: ReplayTvProgress): {
  skill: ReplayTvSkillProgress;
  episode: ReplayTvEpisode | null;
} {
  const skills = deriveReplayTvSkillProgress(progress);
  const skill = weakestReplayTvSkill(skills);
  const completed = new Set(progress.completedEpisodeIds);
  const episode =
    REPLAY_TV_EPISODES.find((ep) => !completed.has(ep.id) && skillsForEpisode(ep).includes(skill.id)) ??
    REPLAY_TV_EPISODES.find((ep) => !completed.has(ep.id)) ??
    null;
  return { skill, episode };
}
