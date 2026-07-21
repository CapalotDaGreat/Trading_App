import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  findNodeHandle,
  Pressable,
  View,
} from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { DecisionBriefHeader } from '@/features/decision/components/DecisionBriefHeader';
import { ResearchQueueCard } from '@/features/decision/components/ResearchQueueCard';
import { SetupCard } from '@/features/decision/components/SetupCard';
import { useDecisionBrief } from '@/features/decision/hooks/useDecision';
import type { ResearchQueueItem } from '@/features/decision/types/decision.types';
import { ActivationStepHeader } from '@/features/onboarding/components/ActivationStepHeader';
import {
  ensureDemoSeedData,
  DEMO_WATCHLIST,
} from '@/features/onboarding/services/demo-seed.service';
import {
  finishActivation,
  finishDemoGuide,
  normalizeActivationInput,
  persistActivationPersonalization,
} from '@/features/onboarding/services/onboarding-activation.service';
import { useOnboardingStore } from '@/features/onboarding/stores/onboarding.store';
import type {
  OnboardingCompletionInput,
  OnboardingDraft,
} from '@/features/onboarding/types/onboarding.types';
import { DEMO_USER_UID } from '@/firebase/config';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useSettingsStore } from '@/shared/stores/settings.store';
import type { ActivationGoal } from '@/shared/types/user';
import { cn } from '@/shared/utils/cn';

const BUDGETS = [10, 20, 30, 45] as const;
const GOALS: { value: ActivationGoal; title: string; detail: string }[] = [
  {
    value: 'research_more_selectively',
    title: 'Selective researcher',
    detail: 'Spend time only where the research value is clearest.',
  },
  {
    value: 'build_decision_discipline',
    title: 'Process builder',
    detail: 'Practice a repeatable research-or-skip decision.',
  },
  {
    value: 'improve_review_habit',
    title: 'Reflective improver',
    detail: 'Close the loop with a useful decision journal.',
  },
];

export default function ActivationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ journaled?: string; symbol?: string }>();
  const { status, user } = useAuth();
  const draft = useOnboardingStore((state) => state.draft);
  const hydrate = useOnboardingStore((state) => state.hydrate);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const preferences = useSettingsStore((state) => state.preferences);
  const isDemo = user?.uid === DEMO_USER_UID;
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(preferences.timeBudgetMinutes);
  const [goal, setGoal] = useState<ActivationGoal>(preferences.activationGoal);
  const [symbolsText, setSymbolsText] = useState(preferences.selectedUniverse.join(', '));
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finishingRef = useRef(false);
  const headingRef = useRef<View>(null);
  const universe = isDemo
    ? DEMO_WATCHLIST.symbols
    : symbolsText
        .split(/[\s,]+/)
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean);
  const briefQuery = useDecisionBrief(isDemo ? 20 : budget, universe);

  useEffect(() => {
    if (status !== 'authenticated' || !user?.uid) return;
    void (async () => {
      if (isDemo) await ensureDemoSeedData(user.uid);
      const saved = await hydrate(user.uid);
      setStep(isDemo ? Math.max(1, saved.currentStep) : saved.currentStep);
      setBudget(saved.timeBudgetMinutes ?? preferences.timeBudgetMinutes);
      setGoal(saved.activationGoal ?? preferences.activationGoal);
      setSymbolsText((saved.selectedUniverse ?? preferences.selectedUniverse).join(', '));
      setIsReady(true);
    })();
  }, [
    status,
    user?.uid,
    isDemo,
    hydrate,
    preferences.activationGoal,
    preferences.selectedUniverse,
    preferences.timeBudgetMinutes,
  ]);

  useEffect(() => {
    if (!isReady) return;
    const label = isDemo
      ? step === 1
        ? 'Demo guide: decision brief'
        : 'Demo guide: research or skip'
      : `Activation step ${step + 1} of 3`;
    AccessibilityInfo.announceForAccessibility(label);
    const handle = findNodeHandle(headingRef.current);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  }, [isDemo, isReady, step]);

  useEffect(() => {
    if (params.journaled !== '1' || isDemo || !user?.uid || !draft || finishingRef.current) return;
    const input = completionInputFromDraft(draft);
    if (!input) return;
    finishingRef.current = true;
    setIsSaving(true);
    void finishActivation(user.uid, input)
      .then(() => router.replace('/(tabs)' as never))
      .catch((cause: unknown) => {
        finishingRef.current = false;
        setError(cause instanceof Error ? cause.message : 'Could not finish activation.');
      })
      .finally(() => setIsSaving(false));
  }, [params.journaled, isDemo, user?.uid, draft, router]);

  if (status !== 'authenticated' || !user || !isReady) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator />
      </Screen>
    );
  }

  const moveToStep = async (next: number) => {
    setError(null);
    await updateDraft(user.uid, { currentStep: next });
    setStep(next);
  };

  const savePersonalization = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const input = normalizeActivationInput({
        timeBudgetMinutes: budget,
        activationGoal: goal,
        selectedUniverse: universe,
      });
      await updateDraft(user.uid, { ...input, currentStep: 1 });
      await persistActivationPersonalization(user.uid, input);
      setSymbolsText(input.selectedUniverse.join(', '));
      setStep(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your choices.');
    } finally {
      setIsSaving(false);
    }
  };

  const finish = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (isDemo) {
        await finishDemoGuide();
      } else {
        const input = draft ? completionInputFromDraft(draft) : null;
        if (!input) throw new Error('Your personalization is incomplete. Go back to Step 1.');
        await finishActivation(user.uid, input);
      }
      router.replace('/(tabs)' as never);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not finish activation.');
    } finally {
      setIsSaving(false);
    }
  };

  const recordOutcome = (item: ResearchQueueItem, action: 'researched' | 'skipped') => {
    void updateDraft(user.uid, {
      currentStep: 2,
      outcomeSymbol: item.symbol,
      outcomeAction: action,
    });
  };

  const outcomeSymbol = draft?.outcomeSymbol;
  const totalSteps = isDemo ? 2 : 3;
  const displayStep = isDemo ? step : step + 1;

  return (
    <Screen scrollable contentClassName="pb-10">
      <View className="pt-4">
        <Text variant="caption" className="text-accent">
          {isDemo
            ? `DEMO GUIDE · ${displayStep}/2`
            : `SET UP YOUR COACH · ${displayStep}/${totalSteps}`}
        </Text>
        <ActivationStepHeader ref={headingRef} step={step} isDemo={isDemo} />

        {error ? (
          <Text accessibilityRole="alert" variant="body-sm" className="mt-4 text-bearish">
            {error}
          </Text>
        ) : null}

        <View className="mt-5 gap-4">
          {!isDemo && step === 0 ? (
            <PersonalizationStep
              budget={budget}
              goal={goal}
              symbolsText={symbolsText}
              onBudget={setBudget}
              onGoal={setGoal}
              onSymbols={setSymbolsText}
            />
          ) : null}

          {step === 1 ? (
            <>
              {briefQuery.isLoading && !briefQuery.data ? <ActivityIndicator /> : null}
              {briefQuery.data ? (
                <>
                  <DecisionBriefHeader brief={briefQuery.data} />
                  <GlassCard className="p-4">
                    <Text variant="label">How to read the scores</Text>
                    <Text variant="body-sm" className="mt-2 text-text-secondary">
                      RVS ranks where your limited research time may be most useful. DQS grades the
                      quality of the decision process. Neither predicts price direction.
                    </Text>
                  </GlassCard>
                  {briefQuery.data.topSetups[0] ? (
                    <SetupCard setup={briefQuery.data.topSetups[0]} highlight />
                  ) : null}
                </>
              ) : null}
              {briefQuery.isError ? (
                <GlassCard className="p-4">
                  <Text variant="label">The brief is temporarily unavailable</Text>
                  <Text variant="body-sm" className="mt-2 text-text-secondary">
                    Retry when market data is available. No setup or score has been invented.
                  </Text>
                  <Button
                    className="mt-3"
                    variant="outline"
                    onPress={() => void briefQuery.refetch()}
                    testID="activation-retry-brief"
                  >
                    Retry brief
                  </Button>
                </GlassCard>
              ) : null}
            </>
          ) : null}

          {step === 2 ? (
            <>
              {briefQuery.data?.researchQueue?.length ? (
                <ResearchQueueCard
                  queue={briefQuery.data.researchQueue.slice(0, 1)}
                  regime={briefQuery.data.regimeLabel}
                  onOutcome={recordOutcome}
                />
              ) : (
                <GlassCard className="p-4">
                  <Text variant="label">No queue item is clear enough</Text>
                  <Text variant="body-sm" className="mt-2 text-text-secondary">
                    Waiting is valid. Refresh the real brief later; this guide will not fabricate an
                    outcome.
                  </Text>
                  <Button
                    className="mt-3"
                    variant="ghost"
                    fullWidth
                    loading={isSaving}
                    onPress={() => void finish()}
                    testID="activation-finish-no-queue"
                  >
                    {isDemo ? 'Explore demo now' : 'Finish without a queue event'}
                  </Button>
                </GlassCard>
              )}
              {outcomeSymbol ? (
                <GlassCard className="p-4" testID="activation-outcome-next">
                  <Text variant="label">
                    {draft?.outcomeAction === 'skipped' ? 'Skip recorded' : 'Research recorded'} ·{' '}
                    {outcomeSymbol}
                  </Text>
                  <Text variant="body-sm" className="mt-2 text-text-secondary">
                    Journal the decision to close the loop, or finish without creating a journal
                    entry.
                  </Text>
                  {!isDemo ? (
                    <Button
                      className="mt-4"
                      fullWidth
                      onPress={() =>
                        router.push(
                          `/journal?symbol=${encodeURIComponent(outcomeSymbol)}&from=onboarding` as never,
                        )
                      }
                      testID="activation-journal"
                    >
                      Journal this decision
                    </Button>
                  ) : null}
                  <Button
                    className="mt-2"
                    variant="ghost"
                    fullWidth
                    loading={isSaving}
                    onPress={() => void finish()}
                    testID="activation-finish-without-journal"
                  >
                    {isDemo ? 'Explore demo now' : 'Finish without journal'}
                  </Button>
                </GlassCard>
              ) : null}
            </>
          ) : null}
        </View>

        <View className="mt-6 gap-2">
          {!isDemo && step === 0 ? (
            <Button
              fullWidth
              loading={isSaving}
              onPress={() => void savePersonalization()}
              testID="activation-personalize-continue"
            >
              Build my brief
            </Button>
          ) : null}
          {step === 1 ? (
            <Button
              fullWidth
              disabled={!briefQuery.data && !briefQuery.isError}
              onPress={() => void moveToStep(2)}
              testID="activation-brief-continue"
            >
              {briefQuery.isError ? 'Continue without inventing a brief' : 'Try research or skip'}
            </Button>
          ) : null}
          {step > (isDemo ? 1 : 0) ? (
            <Button
              variant="ghost"
              fullWidth
              onPress={() => void moveToStep(step - 1)}
              testID="activation-back"
            >
              Back
            </Button>
          ) : null}
          {isDemo ? (
            <Button
              variant="outline"
              fullWidth
              loading={isSaving}
              onPress={() => void finish()}
              testID="activation-explore-demo"
            >
              Explore demo now
            </Button>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function PersonalizationStep({
  budget,
  goal,
  symbolsText,
  onBudget,
  onGoal,
  onSymbols,
}: {
  budget: number;
  goal: ActivationGoal;
  symbolsText: string;
  onBudget: (value: number) => void;
  onGoal: (value: ActivationGoal) => void;
  onSymbols: (value: string) => void;
}) {
  return (
    <>
      <GlassCard className="p-4">
        <Text variant="label">Daily research budget</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {BUDGETS.map((minutes) => (
            <Pressable
              key={minutes}
              accessibilityRole="radio"
              accessibilityState={{ checked: budget === minutes }}
              accessibilityLabel={`${minutes} minutes`}
              onPress={() => onBudget(minutes)}
              className={cn(
                'min-h-11 min-w-16 items-center justify-center rounded-full px-4',
                budget === minutes ? 'bg-accent' : 'bg-surface',
              )}
              testID={`activation-budget-${minutes}`}
            >
              <Text
                variant="label"
                className={budget === minutes ? 'text-text-inverse' : undefined}
              >
                {minutes} min
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <GlassCard className="p-4">
        <Text variant="label">Your style and experience goal</Text>
        <View className="mt-3 gap-2">
          {GOALS.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: goal === item.value }}
              onPress={() => onGoal(item.value)}
              className={cn(
                'min-h-11 rounded-xl p-3',
                goal === item.value ? 'bg-accent-muted' : 'bg-surface',
              )}
              testID={`activation-goal-${item.value}`}
            >
              <Text variant="label" className={goal === item.value ? 'text-accent' : undefined}>
                {item.title}
              </Text>
              <Text variant="caption" className="mt-1 text-text-secondary">
                {item.detail}
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <GlassCard className="p-4">
        <Input
          label="Your 3–5 symbol universe"
          hint="Separate symbols with commas or spaces."
          value={symbolsText}
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={onSymbols}
          testID="activation-symbols"
        />
      </GlassCard>
    </>
  );
}

function completionInputFromDraft(
  draft: Pick<OnboardingDraft, 'timeBudgetMinutes' | 'activationGoal' | 'selectedUniverse'>,
): OnboardingCompletionInput | null {
  if (!draft.timeBudgetMinutes || !draft.activationGoal || !draft.selectedUniverse) return null;
  return {
    timeBudgetMinutes: draft.timeBudgetMinutes,
    activationGoal: draft.activationGoal,
    selectedUniverse: draft.selectedUniverse,
  };
}
