import { useCallback, useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { inferScenarioContext, ingestSimulationCheckpoint, ingestSimulationDecision } from '@/features/competency';
import { DEMO_USER_UID } from '@/firebase/config';
import { useDisplayCurrency } from '@/shared/hooks/useDisplayCurrency';
import { feedbackHaptic } from '@/shared/utils/feedback-haptics';
import { queueEducationalReminder } from '@/features/notifications/services/queue-educational-reminder';

import { SYNTHETIC_UNIVERSE } from '../constants/simulation.constants';
import { getSyntheticQuote, listedSyntheticName } from '../services/synthetic-market.service';
import { quotesForScenario } from '../services/scenario-path.service';
import { resetSnapshot } from '../services/simulation-engine.service';
import { scoreSimulationProcess } from '../services/scenario-process.service';
import { useSimulationStore } from '../stores/simulation.store';
import type { ScenarioDecisionOption, ScenarioStartOptions } from '../types/scenario.types';
import type {
  SimulationAccount,
  SimulationCloseReview,
  SimulationMode,
  SimulationQuote,
  SimulationTradeInput,
} from '../types/simulation.types';

const EMPTY_ARCHIVES: NonNullable<
  ReturnType<typeof useSimulationStore.getState>['archivesByUser'][string]
> = [];

export function useSimulation(options?: { autoStart?: boolean }) {
  const autoStart = options?.autoStart ?? false;
  const { user } = useAuth();
  const userId = user?.uid ?? DEMO_USER_UID;
  const displayCurrency = useDisplayCurrency();
  const ensureAccount = useSimulationStore((state) => state.ensureAccount);
  const account = useSimulationStore((state) => state.accountsByUser[userId]);
  const archives = useSimulationStore((state) => state.archivesByUser[userId] ?? EMPTY_ARCHIVES);
  const buyStore = useSimulationStore((state) => state.buy);
  const sellStore = useSimulationStore((state) => state.sell);
  const previewBuyStore = useSimulationStore((state) => state.previewBuy);
  const previewSellStore = useSimulationStore((state) => state.previewSell);
  const recordCloseReviewStore = useSimulationStore((state) => state.recordCloseReview);
  const refreshPrices = useSimulationStore((state) => state.refreshPrices);
  const resetStore = useSimulationStore((state) => state.reset);
  const advanceClockStore = useSimulationStore((state) => state.advanceClock);
  const advanceToNextInformationStore = useSimulationStore((state) => state.advanceToNextInformation);
  const answerDecisionStore = useSimulationStore((state) => state.answerDecision);

  useEffect(() => {
    if (!autoStart) return;
    ensureAccount(userId, undefined, undefined, displayCurrency);
  }, [autoStart, ensureAccount, userId, displayCurrency]);

  const start = useCallback(
    (startOptions?: ScenarioStartOptions) =>
      ensureAccount(userId, undefined, undefined, displayCurrency, startOptions),
    [displayCurrency, ensureAccount, userId],
  );

  const publishProcessEvidence = useCallback(
    (nextAccount: SimulationAccount) => {
      const decision = nextAccount.decisions.at(-1);
      if (!decision) return;
      const process = scoreSimulationProcess(nextAccount);
      const violation = nextAccount.lastChallengeViolation?.toLowerCase() ?? '';
      ingestSimulationDecision({
        uid: userId,
        sourceId: decision.id,
        occurredAt: Date.parse(nextAccount.updatedAt) || Date.now(),
        processQuality: process.composite,
        thesis: process.thesis,
        evidence: process.evidence,
        invalidation: process.invalidation,
        risk: process.risk,
        discipline: process.discipline,
        positionSizing: process.positionSizing,
        uncertainty: process.uncertainty,
        eventAwareness: process.informationResponse,
        emotionalDiscipline: process.behavioral,
        reflection: process.reflection,
        simulatedPnl: nextAccount.realizedPnL + nextAccount.unrealizedPnL,
        simulatedProfitable: nextAccount.totalReturn > 0,
        flags: {
          missingInvalidation: !decision.invalidation?.trim(),
          missingThesis: !decision.thesis?.trim() || decision.thesis === 'Simulated entry',
          missingEvidence: !decision.evidence?.trim(),
          exceededRiskLimit:
            violation.includes('risk') || violation.includes('weight') || violation.includes('drawdown'),
          fomoEntry: decision.confidence === 'high' && !decision.evidence?.trim(),
          movedInvalidation: decision.closeReview?.wouldChange?.toLowerCase().includes('invalidation'),
        },
        scenarioContext: inferScenarioContext({
          totalReturn: nextAccount.totalReturn,
          maxWeight: Math.max(0, ...nextAccount.positions.map((item) => item.portfolioWeight)),
          highVolatility: (nextAccount.scenario?.complexity?.volatility ?? 0) >= 0.6,
          earningsEvent: nextAccount.scenario?.events.some((item) => item.kind === 'earnings') ?? false,
          eventWindow: (nextAccount.scenario?.events.length ?? 0) > 0,
        }),
      });
    },
    [userId],
  );

  const symbols = SYNTHETIC_UNIVERSE.map((item) => item.symbol);
  const scenarioSymbols = account?.scenario?.assets.map((item) => item.symbol) ?? symbols;
  const quotes: SimulationQuote[] = account?.scenario
    ? quotesForScenario(account.scenario, scenarioSymbols)
    : symbols
        .map((symbol) => getSyntheticQuote(symbol))
        .filter((quote): quote is SimulationQuote => quote != null);

  const listedName = useCallback(
    (symbol: string) =>
      account?.scenario?.assets.find((item) => item.symbol === symbol.toUpperCase())?.name ??
      listedSyntheticName(symbol),
    [account?.scenario?.assets],
  );

  const previewBuy = useCallback(
    (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => previewBuyStore(userId, input),
    [previewBuyStore, userId],
  );
  const previewSell = useCallback(
    (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => previewSellStore(userId, input),
    [previewSellStore, userId],
  );
  const buy = useCallback(
    (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => {
      const result = buyStore(userId, input);
      if (result.ok) {
        publishProcessEvidence(result.value);
        feedbackHaptic('success');
        queueEducationalReminder('journal', 60 * 60 * 4);
      } else {
        feedbackHaptic('warning');
      }
      return result;
    },
    [buyStore, publishProcessEvidence, userId],
  );
  const sell = useCallback(
    (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => {
      const result = sellStore(userId, input);
      if (result.ok) {
        feedbackHaptic('selection');
        queueEducationalReminder('journal', 60 * 60 * 4);
      } else {
        feedbackHaptic('warning');
      }
      return result;
    },
    [sellStore, userId],
  );
  const recordCloseReview = useCallback(
    (decisionId: string, review: SimulationCloseReview) => {
      const next = recordCloseReviewStore(userId, decisionId, review);
      publishProcessEvidence(next);
      return next;
    },
    [publishProcessEvidence, recordCloseReviewStore, userId],
  );
  const refresh = useCallback(() => refreshPrices(userId), [refreshPrices, userId]);
  const advanceClock = useCallback(() => advanceClockStore(userId), [advanceClockStore, userId]);
  const advanceToNextInformation = useCallback(
    () => advanceToNextInformationStore(userId),
    [advanceToNextInformationStore, userId],
  );
  const answerDecision = useCallback(
    (windowId: string, option: ScenarioDecisionOption, reasoning?: string) => {
      const next = answerDecisionStore(userId, windowId, option, reasoning);
      const window = next.scenario?.decisionWindows.find((item) => item.id === windowId);
      ingestSimulationCheckpoint({
        uid: userId,
        sourceId: windowId,
        option,
        reasoningPresent: Boolean(reasoning?.trim() && reasoning.trim().length >= 8),
        windowKind: window?.kind,
        occurredAt: Date.parse(next.updatedAt) || Date.now(),
        scenarioContext: inferScenarioContext({
          totalReturn: next.totalReturn,
          maxWeight: Math.max(0, ...next.positions.map((item) => item.portfolioWeight)),
          highVolatility: (next.scenario?.complexity?.volatility ?? 0) >= 0.6,
          earningsEvent: next.scenario?.events.some((item) => item.kind === 'earnings') ?? false,
          eventWindow: (next.scenario?.events.length ?? 0) > 0,
        }),
        simulatedPnl: next.realizedPnL + next.unrealizedPnL,
        simulatedProfitable: next.totalReturn > 0,
      });
      return next;
    },
    [answerDecisionStore, userId],
  );
  const reset = useCallback(
    (mode?: SimulationMode, challengeId?: string, currency?: string, startOptions?: ScenarioStartOptions) =>
      resetStore(userId, mode, challengeId, currency ?? displayCurrency, startOptions),
    [displayCurrency, resetStore, userId],
  );

  return {
    userId,
    account,
    archives,
    quotes,
    universe: account?.scenario?.assets ?? SYNTHETIC_UNIVERSE,
    listedName,
    snapshot: account ? resetSnapshot(account) : undefined,
    start,
    previewBuy,
    previewSell,
    buy,
    sell,
    recordCloseReview,
    refresh,
    advanceClock,
    advanceToNextInformation,
    answerDecision,
    reset,
    displayCurrency,
  };
}
