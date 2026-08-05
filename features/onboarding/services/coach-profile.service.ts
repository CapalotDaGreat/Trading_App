import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { saveTraderMemory } from '@/features/decision/services/trader-intelligence.service';
import {
  createWatchlist,
  getWatchlists,
  updateWatchlist,
} from '@/features/watchlists/services/watchlist.service';
import { canUseFirestore, requireDb } from '@/firebase/config';
import { useSettingsStore } from '@/shared/stores/settings.store';
import type { ActivationGoal, ExperienceLevel, TradingStyle } from '@/shared/types/user';

import type {
  CoachProfile,
  CoachProfileAnswers,
  CoachProfileDerived,
  MentorExperienceLevel,
  ResearchBudgetMinutes,
  TradingStyleInterest,
} from '../types/mentor-setup.types';
import {
  EMPTY_COACH_ANSWERS,
  MARKET_INTEREST_LABELS,
  MENTOR_EXPERIENCE_LABELS,
  RESEARCH_UNIVERSE_MAX,
  RESEARCH_UNIVERSE_MIN,
  TRADING_STYLE_INTEREST_LABELS,
  TRADING_STRUGGLE_LABELS,
} from '../types/mentor-setup.types';

import { completeOnboarding } from './onboarding-completion.service';
import { clearMentorSetupDraft } from './mentor-setup-draft.service';

const PROFILE_KEY_PREFIX = 'tradevision:coach-profile:v1';
const RESEARCH_UNIVERSE_LIST = 'My research universe';

export function coachProfileStorageKey(uid: string): string {
  return `${PROFILE_KEY_PREFIX}:${encodeURIComponent(uid)}`;
}

function budgetLabel(minutes: ResearchBudgetMinutes | null): string {
  if (minutes == null) return 'Flexible';
  if (minutes >= 60) return '60+ min/day';
  return `${minutes} min/day`;
}

export function deriveCoachProfile(answers: CoachProfileAnswers): CoachProfileDerived {
  const experienceLabel = answers.experience
    ? MENTOR_EXPERIENCE_LABELS[answers.experience]
    : 'Trader';
  const stylesLabel = answers.styles.length
    ? answers.styles
        .slice(0, 2)
        .map((s) => TRADING_STYLE_INTEREST_LABELS[s])
        .join(' · ')
    : 'Process-first';
  const marketsLabel = answers.markets.length
    ? answers.markets
        .slice(0, 3)
        .map((m) => MARKET_INTEREST_LABELS[m])
        .join(' + ')
    : 'Multi-market';
  const focusStruggle = answers.struggles[0] ?? null;

  return {
    learningProfileLabel: `${experienceLabel} · ${stylesLabel}`,
    primaryMarketsLabel: marketsLabel,
    primaryStylesLabel: stylesLabel,
    focusStruggle,
    focusStruggleLabel: focusStruggle ? TRADING_STRUGGLE_LABELS[focusStruggle] : null,
    timeBudgetLabel: budgetLabel(answers.timeBudgetMinutes),
  };
}

export function buildEmptyCoachProfile(uid: string): CoachProfile {
  const now = Date.now();
  return {
    uid,
    ...EMPTY_COACH_ANSWERS,
    ...deriveCoachProfile(EMPTY_COACH_ANSWERS),
    mentorSetupCompleted: false,
    mentorSetupCompletedAt: null,
    mentorSetupInviteDismissedAt: null,
    updatedAt: now,
  };
}

function mapExperience(level: MentorExperienceLevel | null): ExperienceLevel {
  switch (level) {
    case 'completely_new':
    case 'beginner':
      return 'beginner';
    case 'advanced':
      return 'advanced';
    case 'professional':
      return 'professional';
    default:
      return 'intermediate';
  }
}

function mapTradingStyle(styles: TradingStyleInterest[]): TradingStyle {
  if (styles.includes('day_trading')) return 'day_trading';
  if (styles.includes('scalping')) return 'scalping';
  if (styles.includes('position') || styles.includes('value_investing')) return 'position';
  if (styles.includes('growth_investing') || styles.includes('trend_following')) return 'long_term';
  return 'swing';
}

function mapActivationGoal(answers: CoachProfileAnswers): ActivationGoal {
  if (answers.struggles.includes('consistency') || answers.struggles.includes('following_plan')) {
    return 'build_decision_discipline';
  }
  if (
    answers.successDefinitions.includes('learn_faster') ||
    answers.successDefinitions.includes('repeatable_process')
  ) {
    return 'improve_review_habit';
  }
  return 'research_more_selectively';
}

function normalizeUniverse(symbols: string[]): string[] {
  return [
    ...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)),
  ].slice(0, RESEARCH_UNIVERSE_MAX);
}

export function validateCoachAnswersForCompletion(answers: CoachProfileAnswers): CoachProfileAnswers {
  if (!answers.motive) throw new Error('Choose why you are trading.');
  if (!answers.experience) throw new Error('Choose your experience level.');
  if (!answers.markets.length) throw new Error('Select at least one market.');
  if (!answers.frequency) throw new Error('Choose how often you trade.');
  if (!answers.styles.length) throw new Error('Select at least one trading style.');
  if (!answers.struggles.length) throw new Error('Select at least one challenge.');
  if (answers.timeBudgetMinutes == null) throw new Error('Choose a daily research budget.');
  if (!answers.coachTone) throw new Error('Choose how your AI Mentor should coach you.');
  if (!answers.successDefinitions.length) throw new Error('Choose what success looks like.');
  if (!answers.researchTimeOfDay) throw new Error('Choose when you usually research.');
  const researchUniverse = normalizeUniverse(answers.researchUniverse);
  if (
    researchUniverse.length < RESEARCH_UNIVERSE_MIN ||
    researchUniverse.length > RESEARCH_UNIVERSE_MAX
  ) {
    throw new Error(`Select between ${RESEARCH_UNIVERSE_MIN} and ${RESEARCH_UNIVERSE_MAX} assets.`);
  }
  return { ...answers, researchUniverse };
}

/** Maps mentor budgets onto legacy completion budgets (10/20/30/45). */
function legacyBudget(minutes: ResearchBudgetMinutes): 10 | 20 | 30 | 45 {
  if (minutes <= 5) return 10;
  if (minutes <= 10) return 10;
  if (minutes <= 20) return 20;
  if (minutes <= 30) return 30;
  return 45;
}

export async function loadCoachProfile(uid: string): Promise<CoachProfile> {
  if (!uid) return buildEmptyCoachProfile('');
  try {
    const raw = await AsyncStorage.getItem(coachProfileStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw) as CoachProfile;
      const answers: CoachProfileAnswers = {
        ...EMPTY_COACH_ANSWERS,
        ...parsed,
        markets: parsed.markets ?? [],
        styles: parsed.styles ?? [],
        struggles: parsed.struggles ?? [],
        successDefinitions: parsed.successDefinitions ?? [],
        researchUniverse: parsed.researchUniverse ?? [],
      };
      return {
        ...buildEmptyCoachProfile(uid),
        ...parsed,
        ...answers,
        ...deriveCoachProfile(answers),
        uid,
      };
    }
  } catch {
    // fall through
  }

  if (canUseFirestore(uid)) {
    try {
      const snap = await getDoc(doc(requireDb(), 'users', uid));
      const data = snap.data()?.coachProfile as CoachProfile | undefined;
      if (data) {
        const answers: CoachProfileAnswers = {
          ...EMPTY_COACH_ANSWERS,
          ...data,
          markets: data.markets ?? [],
          styles: data.styles ?? [],
          struggles: data.struggles ?? [],
          successDefinitions: data.successDefinitions ?? [],
          researchUniverse: data.researchUniverse ?? [],
        };
        const profile: CoachProfile = {
          ...buildEmptyCoachProfile(uid),
          ...data,
          ...answers,
          ...deriveCoachProfile(answers),
          uid,
        };
        await AsyncStorage.setItem(coachProfileStorageKey(uid), JSON.stringify(profile));
        return profile;
      }
    } catch {
      // local empty
    }
  }

  return buildEmptyCoachProfile(uid);
}

export async function saveCoachProfileLocal(profile: CoachProfile): Promise<void> {
  await AsyncStorage.setItem(coachProfileStorageKey(profile.uid), JSON.stringify(profile));
}

async function syncCoachProfileRemote(profile: CoachProfile): Promise<void> {
  if (!canUseFirestore(profile.uid)) return;
  await setDoc(
    doc(requireDb(), 'users', profile.uid),
    {
      coachProfile: profile,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

export async function dismissMentorSetupInvite(uid: string): Promise<CoachProfile> {
  const current = await loadCoachProfile(uid);
  const next: CoachProfile = {
    ...current,
    mentorSetupInviteDismissedAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveCoachProfileLocal(next);
  void syncCoachProfileRemote(next);
  return next;
}

export async function persistCoachPersonalization(
  uid: string,
  answers: CoachProfileAnswers,
): Promise<CoachProfile> {
  const normalized = validateCoachAnswersForCompletion(answers);
  const derived = deriveCoachProfile(normalized);
  const now = Date.now();
  const profile: CoachProfile = {
    uid,
    ...normalized,
    ...derived,
    mentorSetupCompleted: true,
    mentorSetupCompletedAt: now,
    mentorSetupInviteDismissedAt: null,
    updatedAt: now,
  };

  const budget = legacyBudget(normalized.timeBudgetMinutes ?? 20);
  const activationGoal = mapActivationGoal(normalized);

  useSettingsStore.getState().setPreferences({
    experienceLevel: mapExperience(normalized.experience),
    tradingStyle: mapTradingStyle(normalized.styles),
    timeBudgetMinutes: budget,
    activationGoal,
    selectedUniverse: normalized.researchUniverse,
    defaultMarket: normalized.markets[0] ?? 'stocks',
  });
  useSettingsStore.getState().setMentorSetupCompleted(true);

  const watchlists = await getWatchlists(uid);
  const list =
    watchlists.find((item) => item.name === RESEARCH_UNIVERSE_LIST) ?? watchlists[0];
  if (list) {
    await updateWatchlist(uid, list.id, { symbols: normalized.researchUniverse });
  } else {
    await createWatchlist(uid, {
      name: RESEARCH_UNIVERSE_LIST,
      symbols: normalized.researchUniverse,
    });
  }

  const styleLabel = normalized.styles[0] ?? 'swing';
  await saveTraderMemory({
    favoriteAssets: normalized.researchUniverse,
    tradingStyle: styleLabel,
    typicalMistakes: normalized.struggles.map((s) => TRADING_STRUGGLE_LABELS[s]).slice(0, 6),
    notes: [
      `Coach tone: ${normalized.coachTone}`,
      `Research window: ${normalized.researchTimeOfDay}`,
      `Markets: ${derived.primaryMarketsLabel}`,
      ...(derived.focusStruggle
        ? [`Focus: ${TRADING_STRUGGLE_LABELS[derived.focusStruggle]}`]
        : []),
    ],
    coachTone: normalized.coachTone ?? undefined,
    markets: normalized.markets,
    struggles: normalized.struggles,
    researchTimeOfDay: normalized.researchTimeOfDay ?? undefined,
    successDefinitions: normalized.successDefinitions,
    tradeFrequency: normalized.frequency ?? undefined,
    tradingMotive: normalized.motive ?? undefined,
  });

  await saveCoachProfileLocal(profile);
  await syncCoachProfileRemote(profile);

  return profile;
}

export async function finishMentorSetup(uid: string, answers: CoachProfileAnswers): Promise<void> {
  const profile = await persistCoachPersonalization(uid, answers);
  const budget = legacyBudget(profile.timeBudgetMinutes ?? 20);
  await completeOnboarding(uid, {
    timeBudgetMinutes: budget,
    activationGoal: mapActivationGoal(profile),
    selectedUniverse: profile.researchUniverse.slice(0, 5),
  });
  await clearMentorSetupDraft(uid);
  useSettingsStore.getState().setMentorSetupCompleted(true);
}

export function shouldShowMentorSetupInvite(profile: CoachProfile, hasCompletedOnboarding: boolean): boolean {
  if (!hasCompletedOnboarding) return false;
  if (profile.mentorSetupCompleted) return false;
  if (profile.mentorSetupInviteDismissedAt) return false;
  return true;
}
