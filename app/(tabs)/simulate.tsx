import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import { SimulationCurrencyPanel } from '@/features/simulation/components/SimulationCurrencyPanel';
import { SimulationCloseReviewCard } from '@/features/simulation/components/SimulationCloseReviewCard';
import { SimulationDisclaimer } from '@/features/simulation/components/SimulationDisclaimer';
import { SimulationEducationLinks } from '@/features/simulation/components/SimulationEducationLinks';
import { SimulationPositionList } from '@/features/simulation/components/SimulationPositionList';
import { SimulationResetPanel } from '@/features/simulation/components/SimulationResetPanel';
import { SimulationSummary } from '@/features/simulation/components/SimulationSummary';
import { SimulationTradeTicket } from '@/features/simulation/components/SimulationTradeTicket';
import { SimulationTransactionList } from '@/features/simulation/components/SimulationTransactionList';
import { SELECTABLE_CHALLENGES } from '@/features/simulation/constants/simulation.constants';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { resetSnapshot } from '@/features/simulation/services/simulation-engine.service';
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
  { value: 'beginner', label: 'Beginner' },
  { value: 'standard', label: 'Standard' },
  { value: 'challenge', label: 'Challenge' },
];

export default function SimulateScreen() {
  const router = useRouter();
  const { start: startParam } = useLocalSearchParams<{ start?: string }>();
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
    displayCurrency,
    start,
  } = useSimulation();
  const appendDecision = useAppendDecisionRecord();
  const [reviewSymbol, setReviewSymbol] = useState<string | null>(null);
  const [reviewDecisionId, setReviewDecisionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (startParam === '1' && !account) start();
  }, [account, start, startParam]);

  useEffect(() => {
    if (account) refresh();
  }, [account, refresh]);

  const openJournal = (symbol: string) => {
    router.push(`/journal?symbol=${encodeURIComponent(symbol)}&from=simulate` as never);
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
            reset(mode, mode === 'challenge' ? account.challengeId ?? SELECTABLE_CHALLENGES[0]?.id : undefined);
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
            reset('challenge', challengeId);
            setStatusMessage('Simulation archived. Challenge measures process constraints, not return.');
          },
        },
      ],
    );
  };

  return (
    <ScreenScaffold
      eyebrow={`${IA_GLOSSARY.simulate} · ${BRAND.simulatedLabel}`}
      title="SIMULATED PORTFOLIO"
      subtitle="Practice managing simulated capital. The goal is process, not maximizing paper profit."
      contentClassName="pb-12"
      testID="simulate-screen"
    >
      <SimulationDisclaimer />

      {!account ? (
        <EmptyState
          title="Start with $100,000 in simulated capital"
          description="This opens a paper book. It is not a brokerage, not real money, and simulated P/L does not grade a decision."
          actionLabel="Start Simulation"
          onAction={() => start()}
          iconName="briefcase-outline"
          className="px-4 py-10"
          testID="simulate-empty"
        />
      ) : (
        <>
          <SimulationSummary account={account} />

          <View className="mb-4 flex-row flex-wrap gap-2" testID="simulate-loop-actions">
            <Button size="sm" accessibilityLabel="Trade in this simulated book">
              Trade
            </Button>
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
              reset(account.mode, account.challengeId, currency);
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
              reset(account.mode, account.challengeId);
              setStatusMessage('Previous simulation archived. New paper capital is ready.');
            }}
          />

          <LoopCtaRow current="simulate" title="After a simulated fill" />
        </>
      )}
    </ScreenScaffold>
  );
}
