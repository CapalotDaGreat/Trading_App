import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import { TrainingHandoffBanner } from '@/features/learning-engine/components/TrainingHandoffBanner';
import { SimulationCurrencyPanel } from '@/features/simulation/components/SimulationCurrencyPanel';
import { SimulationCloseReviewCard } from '@/features/simulation/components/SimulationCloseReviewCard';
import { SimulationDisclaimer } from '@/features/simulation/components/SimulationDisclaimer';
import { SimulationEducationLinks } from '@/features/simulation/components/SimulationEducationLinks';
import { SimulationPositionList } from '@/features/simulation/components/SimulationPositionList';
import { SimulationResetPanel } from '@/features/simulation/components/SimulationResetPanel';
import { SimulationScenarioPanel } from '@/features/simulation/components/SimulationScenarioPanel';
import { SimulationSummary } from '@/features/simulation/components/SimulationSummary';
import { SimulationTradeTicket } from '@/features/simulation/components/SimulationTradeTicket';
import { SimulationTransactionList } from '@/features/simulation/components/SimulationTransactionList';
import { SELECTABLE_CHALLENGES } from '@/features/simulation/constants/simulation.constants';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { PREP_TO_SCENARIO_KIND } from '@/features/events/services/event-simulation.service';
import type { EventPrepKind } from '@/features/events/types/events.types';
import { SCENARIO_DIFFICULTY_LABELS } from '@/features/simulation/services/scenario-difficulty.service';
import { resetSnapshot } from '@/features/simulation/services/simulation-engine.service';
import type { ScenarioDifficulty, ScenarioFocus, ScenarioStartOptions } from '@/features/simulation/types/scenario.types';
import type {
  SimulationCloseReview,
  SimulationMode,
  SimulationSide,
  SimulationTradeInput,
} from '@/features/simulation/types/simulation.types';
import { IA_GLOSSARY } from '@/features/navigation/config/navigation-ia.config';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

const MODE_OPTIONS: { value: SimulationMode; label: string }[] = [
  { value: 'beginner', label: 'Beginner rails' },
  { value: 'standard', label: 'Standard' },
  { value: 'challenge', label: 'Challenge' },
];

const DIFFICULTY_OPTIONS: { value: ScenarioDifficulty; label: string }[] = [
  { value: 'beginner', label: SCENARIO_DIFFICULTY_LABELS.beginner },
  { value: 'intermediate', label: SCENARIO_DIFFICULTY_LABELS.intermediate },
  { value: 'advanced', label: SCENARIO_DIFFICULTY_LABELS.advanced },
  { value: 'expert', label: SCENARIO_DIFFICULTY_LABELS.expert },
];

const PREP_EVENT_KIND = PREP_TO_SCENARIO_KIND;

function isEventPrep(value?: string): value is EventPrepKind {
  return Boolean(value && value in PREP_TO_SCENARIO_KIND);
}

const PREP_LABEL: Record<string, string> = {
  rates: 'an uncertain rate decision',
  inflation: 'a fictional inflation print',
  employment: 'a fictional labor report',
  earnings: 'a fictional company report',
  macro: 'an uncertain macro event',
};

const SCENARIO_FOCUS = new Set<ScenarioFocus>([
  'position_sizing',
  'false_breakouts',
  'uncertainty',
  'event_adaptation',
  'correlation',
  'thesis_discipline',
]);

function scenarioStartOptions(
  prep?: string,
  focus?: string,
  difficulty?: ScenarioDifficulty,
): ScenarioStartOptions | undefined {
  const fromPrep = isEventPrep(prep)
      ? { focus: 'event_adaptation' as const, preferredEventKind: PREP_EVENT_KIND[prep] }
      : undefined;
  const fromFocus =
    focus && SCENARIO_FOCUS.has(focus as ScenarioFocus) ? { focus: focus as ScenarioFocus } : undefined;
  if (!fromPrep && !fromFocus && !difficulty) return undefined;
  return { ...fromFocus, ...fromPrep, ...(difficulty ? { difficulty } : {}) };
}

export default function SimulateScreen() {
  const router = useRouter();
  const { start: startParam, prep: prepParam, focus: focusParam, difficulty: difficultyParam } = useLocalSearchParams<{
    start?: string;
    prep?: string;
    focus?: string;
    difficulty?: string;
  }>();
  const {
    account,
    archives,
    quotes,
    listedName,
    previewBuy,
    previewSell,
    buy,
    sell,
    recordCloseReview,
    refresh,
    reset,
    advanceClock,
    advanceToNextInformation,
    answerDecision,
    displayCurrency,
    start,
  } = useSimulation();
  const appendDecision = useAppendDecisionRecord();
  const [reviewSymbol, setReviewSymbol] = useState<string | null>(null);
  const [reviewDecisionId, setReviewDecisionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const difficulty =
      difficultyParam === 'beginner' ||
      difficultyParam === 'intermediate' ||
      difficultyParam === 'advanced' ||
      difficultyParam === 'expert'
        ? difficultyParam
        : undefined;
    if (startParam === '1' && !account) start(scenarioStartOptions(prepParam, focusParam, difficulty));
  }, [account, difficultyParam, focusParam, prepParam, start, startParam]);

  useEffect(() => {
    if (account) refresh();
  }, [account, refresh]);

  const openJournal = (symbol: string) => {
    const decision = account?.decisions
      .slice()
      .reverse()
      .find((item) => item.symbol === symbol.toUpperCase());
    const draft = [decision?.thesis, decision?.invalidation ? `Invalidation: ${decision.invalidation}` : '']
      .filter(Boolean)
      .join('\n');
    const qs = new URLSearchParams({ symbol, from: 'simulate' });
    if (draft) qs.set('notes', draft.slice(0, 1800));
    router.push(`/journal?${qs.toString()}` as never);
  };

  const handleConfirm = (side: SimulationSide, input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => {
    const result = side === 'buy' ? buy(input) : sell(input);
    if (!result.ok) return result;

    const symbol = input.symbol.toUpperCase();
    if (side === 'buy') {
      appendDecision.mutate({
        symbol,
        regime: 'simulation',
        action: 'opened',
        invalidation: input.invalidation,
        note: input.thesis ?? input.reason,
        risk: input.confidence === 'high' ? 'high' : input.confidence === 'low' ? 'low' : 'medium',
      });
    } else {
      const remaining = result.value.positions.find((position) => position.symbol === symbol);
      if (!remaining) {
        const decision =
          [...result.value.decisions].reverse().find((item) => item.symbol === symbol && item.closedAt) ??
          result.value.decisions.find((item) => item.id === input.decisionId);
        setReviewSymbol(symbol);
        setReviewDecisionId(decision?.id ?? null);
        appendDecision.mutate({
          symbol,
          regime: 'simulation',
          action: 'completed',
          note: 'Simulated position closed. Review process, not P/L.',
        });
      }
    }
    return result;
  };

  const handleReview = (review: SimulationCloseReview) => {
    if (reviewDecisionId) recordCloseReview(reviewDecisionId, review);
    setStatusMessage('Review your process. The close is recorded; simulated P/L is not the grade.');
    setReviewSymbol(null);
    setReviewDecisionId(null);
  };

  const handleDifficulty = (difficulty: ScenarioDifficulty) => {
    if (!account || account.scenario?.difficulty === difficulty) return;
    const snap = resetSnapshot(account);
    Alert.alert(
      'Archive and open a new path?',
      `Changing practice level archives this paper book and generates a new synthetic path. Equity ${snap.equity.toFixed(0)} ${snap.currency}. Simulated P/L is not the grade.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive and switch',
          style: 'destructive',
          onPress: () => {
            reset(account.mode, account.challengeId, displayCurrency, { difficulty });
            setStatusMessage('New synthetic path opened. Difficulty changes ambiguity, not expected profit.');
          },
        },
      ],
    );
  };

  const handleMode = (mode: SimulationMode) => {
    if (!account || account.mode === mode) return;
    const snap = resetSnapshot(account);
    Alert.alert(
      'Archive this simulation?',
      `Switching mode archives the current paper account. Equity ${snap.equity.toFixed(0)} ${snap.currency} · ${snap.tradeCount} trades · max drawdown ${(snap.maxDrawdown * 100).toFixed(1)}%. History is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive and switch',
          style: 'destructive',
          onPress: () => {
            reset(
              mode,
              mode === 'challenge' ? account.challengeId ?? SELECTABLE_CHALLENGES[0]?.id : undefined,
              displayCurrency,
              scenarioStartOptions(undefined, undefined, account.scenario?.difficulty),
            );
            setStatusMessage('Simulation archived. New paper account opened for the selected mode.');
          },
        },
      ],
    );
  };

  const handleChallenge = (challengeId: string) => {
    if (!account || account.challengeId === challengeId) return;
    Alert.alert(
      'Archive this simulation?',
      'Changing challenge archives the current paper book. Challenges measure process constraints, not return.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive and switch',
          style: 'destructive',
          onPress: () => {
            reset(
              'challenge',
              challengeId,
              displayCurrency,
              scenarioStartOptions(undefined, undefined, account.scenario?.difficulty),
            );
            setStatusMessage('Simulation archived. Challenge measures process constraints, not return.');
          },
        },
      ],
    );
  };

  return (
    <ScreenScaffold
      eyebrow={`${IA_GLOSSARY.simulate} · ${BRAND.simulatedLabel}`}
      title="Practice with paper capital"
      subtitle="Practice managing simulated capital. The goal is process, not maximizing paper profit."
      contentClassName="pb-12"
      testID="simulate-screen"
    >
      <TrainingHandoffBanner />
      <SimulationDisclaimer />

      {isEventPrep(prepParam) ? (
        <Surface tone="accent" emphasis="outlined" className="mb-4" testID="simulate-event-prep">
          <Text variant="label" className="text-accent">
            Event-inspired book
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Fictional simulation inspired by {PREP_LABEL[prepParam] ?? 'an upcoming event type'}. The actual real-world
            outcome is hidden. Possible paths include higher than expected, lower, exactly expected, or mixed
            interpretation. Adaptation is the lesson — not a prediction.
          </Text>
          {account ? (
            <Button
              className="mt-3"
              size="sm"
              onPress={() => {
                Alert.alert(
                  'Archive and start a prepared book?',
                  'This archives the current paper account and opens a new fictional event-adaptation book. Simulated P/L is not the grade.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Archive and start',
                      style: 'destructive',
                      onPress: () => {
                        reset(
                          account.mode,
                          account.challengeId,
                          displayCurrency,
                          scenarioStartOptions(prepParam, undefined, account.scenario?.difficulty),
                        );
                        setStatusMessage('New fictional event book opened. The real-world print is not being forecast.');
                      },
                    },
                  ],
                );
              }}
            >
              Start prepared book
            </Button>
          ) : null}
        </Surface>
      ) : null}

      {!account ? (
        <EmptyState
          title="Start with $100,000 in simulated capital"
          description="This opens a paper book. It is not a brokerage, not real money, and simulated P/L does not grade a decision."
          actionLabel="Start Simulation"
          onAction={() => start(scenarioStartOptions(prepParam, focusParam))}
          iconName="briefcase-outline"
          className="px-4 py-10"
          testID="simulate-empty"
        />
      ) : (
        <>
          <SimulationSummary account={account} />
          <SimulationScenarioPanel
            account={account}
            onAdvance={() => {
              advanceClock();
              setStatusMessage('Clock advanced. Re-check thesis and size — the path is not knowable in advance.');
            }}
            onAdvanceToInformation={() => {
              advanceToNextInformation();
              setStatusMessage('Advanced to the next visible headline or decision. Later sessions stay hidden.');
            }}
            onAnswerDecision={(windowId, option, reasoning) => {
              answerDecision(windowId, option, reasoning);
              setStatusMessage('Decision recorded. Process matters more than the next print.');
            }}
          />

          <View className="mb-4 flex-row flex-wrap gap-2" testID="simulate-loop-actions">
            <Button size="sm" variant="outline" onPress={() => router.push('/review' as never)}>
              Review
            </Button>
            <Button size="sm" variant="ghost" onPress={() => router.push('/learn' as never)}>
              Learn
            </Button>
          </View>

          <SimulationCurrencyPanel
            account={account}
            preferredCurrency={displayCurrency}
            onChangeAccountCurrency={(currency) => {
              reset(
                account.mode,
                account.challengeId,
                currency,
                scenarioStartOptions(undefined, undefined, account.scenario?.difficulty),
              );
              setStatusMessage(`Simulation archived. New paper book opened in ${currency}.`);
            }}
          />

          <SimulationEducationLinks />

          <Text variant="label" className="mb-2">
            Simulation mode
          </Text>
          <SegmentedControl
            className="mb-4"
            options={MODE_OPTIONS}
            value={account.mode}
            onChange={handleMode}
          />

          <Text variant="label" className="mb-2">
            Scenario practice level
          </Text>
          <Text variant="caption" className="mb-2 text-text-tertiary">
            Changes structure, uncertainty, and information — never a setting that forces losses.
          </Text>
          <SegmentedControl
            className="mb-4"
            options={DIFFICULTY_OPTIONS}
            value={account.scenario?.difficulty ?? 'intermediate'}
            onChange={handleDifficulty}
          />

          {account.mode === 'challenge' ? (
            <Surface className="mb-4" testID="simulate-challenges">
              <Text variant="label">Process challenges</Text>
              <Text variant="caption" className="mt-1 text-text-secondary">
                Challenges measure discipline, concentration, and risk. They do not score simulated return.
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {SELECTABLE_CHALLENGES.map((challenge) => (
                  <Button
                    key={challenge.id}
                    size="sm"
                    variant={account.challengeId === challenge.id ? 'primary' : 'ghost'}
                    onPress={() => handleChallenge(challenge.id)}
                  >
                    {challenge.title}
                  </Button>
                ))}
              </View>
              {account.challengeId ? (
                <Text variant="caption" className="mt-3 text-text-secondary">
                  {SELECTABLE_CHALLENGES.find((item) => item.id === account.challengeId)?.description}
                </Text>
              ) : null}
            </Surface>
          ) : null}

          <View testID="simulate-trade">
            <SimulationTradeTicket
              account={account}
              quotes={quotes}
              listedName={listedName}
              onPreview={(side, input) => (side === 'buy' ? previewBuy(input) : previewSell(input))}
              onConfirm={handleConfirm}
              onJournal={openJournal}
            />
          </View>

          {reviewSymbol ? (
            <SimulationCloseReviewCard
              symbol={reviewSymbol}
              onSubmit={handleReview}
              onJournal={() => openJournal(reviewSymbol)}
            />
          ) : null}

          {statusMessage ? (
            <Text variant="body-sm" className="mb-4 text-text-secondary">
              {statusMessage}
            </Text>
          ) : null}

          <SimulationPositionList account={account} />
          <CollapsibleSection
            title="Ledger"
            description="Fills and cash changes. Context only — not a skill score."
            defaultExpanded={false}
          >
            <SimulationTransactionList account={account} />
          </CollapsibleSection>

          <SimulationResetPanel
            snapshot={resetSnapshot(account)}
            archiveCount={archives.length}
            onConfirm={() => {
              reset(
                account.mode,
                account.challengeId,
                displayCurrency,
                scenarioStartOptions(undefined, undefined, account.scenario?.difficulty),
              );
              setStatusMessage('Previous simulation archived. New paper capital is ready.');
            }}
          />

          <LoopCtaRow current="simulate" title="After a simulated fill" />
        </>
      )}
    </ScreenScaffold>
  );
}
