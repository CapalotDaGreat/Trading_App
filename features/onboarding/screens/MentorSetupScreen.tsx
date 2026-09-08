import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { MentorQuestionStep } from '@/features/onboarding/components/MentorQuestionStep';
import { MentorReadyStep } from '@/features/onboarding/components/MentorReadyStep';
import { MentorSetupProgress } from '@/features/onboarding/components/MentorSetupProgress';
import { WhyHint } from '@/features/onboarding/components/WhyHint';
import { MENTOR_QUESTIONS } from '@/features/onboarding/content/mentor-setup.questions';
import {
  finishMentorSetup,
  loadCoachProfile,
} from '@/features/onboarding/services/coach-profile.service';
import {
  clampMentorSetupStep,
  loadMentorSetupDraft,
  mergeDraftAnswers,
  saveMentorSetupDraft,
} from '@/features/onboarding/services/mentor-setup-draft.service';
import { recommendResearchUniverse } from '@/features/onboarding/services/research-universe.catalog';
import { useCoachProfileStore } from '@/features/onboarding/stores/coach-profile.store';
import type { CoachProfileAnswers } from '@/features/onboarding/types/mentor-setup.types';
import { EMPTY_COACH_ANSWERS } from '@/features/onboarding/types/mentor-setup.types';
import { DEMO_USER_UID } from '@/firebase/config';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';
import { useTheme } from '@/shared/hooks/useTheme';

const INTRO = 0;
const FIRST_QUESTION = 1;
const LAST_QUESTION = 3;
const READY = 4;

function selectedForField(
  answers: CoachProfileAnswers,
  field: (typeof MENTOR_QUESTIONS)[number]['field'],
): Array<string | number> {
  const value = answers[field];
  if (Array.isArray(value)) return value as Array<string | number>;
  if (value == null) return [];
  return [value as string | number];
}

function canContinue(step: number, answers: CoachProfileAnswers): boolean {
  if (step === INTRO) return true;
  if (step >= FIRST_QUESTION && step <= LAST_QUESTION) {
    const question = MENTOR_QUESTIONS[step - 1];
    const selected = selectedForField(answers, question.field);
    return selected.length > 0;
  }
  if (step === READY) return true;
  return false;
}

export default function MentorSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const uid = user?.uid ?? null;
  const isDemo = uid === DEMO_USER_UID;
  const setProfile = useCoachProfileStore((s) => s.setProfile);

  const [step, setStep] = useState(INTRO);
  const [answers, setAnswers] = useState<CoachProfileAnswers>(EMPTY_COACH_ANSWERS);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void (async () => {
      const [draft, profile] = await Promise.all([
        loadMentorSetupDraft(uid),
        loadCoachProfile(uid),
      ]);
      if (cancelled) return;
      const merged = mergeDraftAnswers({
        ...draft,
        answers: profile.mentorSetupCompleted ? { ...profile, ...draft.answers } : draft.answers,
      });
      setAnswers(merged);
      setStep(clampMentorSetupStep(draft.currentStep || INTRO));
      setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const question = useMemo(
    () => (step >= FIRST_QUESTION && step <= LAST_QUESTION ? MENTOR_QUESTIONS[step - 1] : null),
    [step],
  );

  const persist = async (nextStep: number, nextAnswers: CoachProfileAnswers) => {
    if (!uid) return;
    await saveMentorSetupDraft(uid, {
      currentStep: nextStep,
      answers: nextAnswers,
    });
  };

  const toggleValue = (value: string | number) => {
    if (!question) return;
    const field = question.field;
    setAnswers((prev) => {
      let next: CoachProfileAnswers = { ...prev };
      if (question.mode === 'multi') {
        const current = [...((prev[field] as Array<string | number>) ?? [])];
        const index = current.indexOf(value);
        if (index >= 0) current.splice(index, 1);
        else current.push(value);
        next = { ...prev, [field]: current };
      } else {
        next = { ...prev, [field]: value };
      }
      void persist(step, next);
      return next;
    });
  };

  const goNext = async () => {
    if (!uid || !canContinue(step, answers)) return;
    setError(null);

    if (step === LAST_QUESTION) {
      const recommended = recommendResearchUniverse({
        markets: answers.markets.length ? answers.markets : ['stocks'],
        experience: answers.experience,
        styles: answers.styles,
      });
      const nextAnswers = {
        ...answers,
        researchUniverse:
          answers.researchUniverse.length > 0 ? answers.researchUniverse : recommended,
      };
      setAnswers(nextAnswers);
      setStep(READY);
      await persist(READY, nextAnswers);
      return;
    }

    if (step === READY) {
      setIsSaving(true);
      try {
        await finishMentorSetup(uid, answers);
        setProfile(await loadCoachProfile(uid));
        router.replace('/(tabs)' as never);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save your setup.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const nextStep = step + 1;
    setStep(nextStep);
    await persist(nextStep, answers);
  };

  const goBack = async () => {
    if (step <= INTRO) {
      router.back();
      return;
    }
    const nextStep = step - 1;
    setStep(nextStep);
    if (uid) await persist(nextStep, answers);
  };

  if (!uid || !isReady) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent.primary} size="large" />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-10">
      <MentorSetupProgress step={step} />

      {step === INTRO ? (
        <View className="py-4" testID="onboarding-product-intro">
          <Text variant="h1">{BRAND.product} helps you learn trading through education and simulated practice.</Text>
          <Text variant="body" className="mt-3 text-text-secondary">
            No real money. No brokerage. No guaranteed signals. You learn concepts, practise decisions,
            simulate with paper capital, then review your reasoning.
          </Text>
          <Text variant="body-sm" className="mt-3 text-text-secondary">
            {BRAND.loop}
          </Text>
          <WhyHint text="Next: experience, learning goals, and preferred topics. Nothing that looks like a brokerage application." />
          {isDemo ? (
            <Text variant="caption" className="mt-4 text-text-tertiary">
              Demo mode — answers stay on this device.
            </Text>
          ) : null}
        </View>
      ) : null}

      {question ? (
        <MentorQuestionStep
          question={question}
          selected={selectedForField(answers, question.field)}
          onToggle={toggleValue}
        />
      ) : null}

      {step === READY ? <MentorReadyStep answers={answers} /> : null}

      {error ? (
        <Text variant="body-sm" className="mt-4 text-center text-bearish">
          {error}
        </Text>
      ) : null}

      <View className="mt-8 gap-3">
        <Button
          size="lg"
          fullWidth
          loading={isSaving}
          disabled={!canContinue(step, answers) || isSaving}
          onPress={() => void goNext()}
        >
          {step === READY ? 'Enter TradeAcademy' : step === INTRO ? 'Continue' : 'Continue'}
        </Button>
        {step > INTRO ? (
          <Button variant="ghost" fullWidth disabled={isSaving} onPress={() => void goBack()}>
            Back
          </Button>
        ) : null}
      </View>
    </Screen>
  );
}
