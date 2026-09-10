import { useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { inferScenarioContext, ingestSimulationDecision } from '@/features/competency';
import { DEMO_USER_UID } from '@/firebase/config';
import { useDisplayCurrency } from '@/shared/hooks/useDisplayCurrency';

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

export function useSimulation(options?: { autoStart?: boolean }) {
  const autoStart = options?.autoStart ?? false;
  const { user } = useAuth();
  const userId = user?.uid ?? DEMO_USER_UID;
  const displayCurrency = useDisplayCurrency();
  const ensureAccount = useSimulationStore((state) => state.ensureAccount);
  const account = useSimulationStore((state) => state.accountsByUser[userId]);
  const archives = useSimulationStore((state) => state.archivesByUser[userId] ?? []);
  const buy = useSimulationStore((state) => state.buy);
  const sell = useSimulationStore((state) => state.sell);
  const previewBuy = useSimulationStore((state) => state.previewBuy);
  const previewSell = useSimulationStore((state) => state.previewSell);
  const recordCloseReview = useSimulationStore((state) => state.recordCloseReview);
  const refreshPrices = useSimulationStore((state) => state.refreshPrices);
  const reset = useSimulationStore((state) => state.reset);
  const advanceClock = useSimulationStore((state) => state.advanceClock);
  const advanceToNextInformation = useSimulationStore((state) => state.advanceToNextInformation);
  const answerDecision = useSimulationStore((state) => state.answerDecision);

  useEffect(() => {
    if (!autoStart) return;
    ensureAccount(userId, undefined, undefined, displayCurrency);
  }, [autoStart, ensureAccount, userId, displayCurrency]);

  const start = (options?: ScenarioStartOptions) =>
    ensureAccount(userId, undefined, undefined, displayCurrency, options);

  const publishProcessEvidence = (account: SimulationAccount) => {
    const decision = account.decisions.at(-1);
    if (!decision) return;
    const process = scoreSimulationProcess(account);
    const violation = account.lastChallengeViolation?.toLowerCase() ?? '';
    ingestSimulationDecision({
      uid: userId,
      sourceId: decision.id,
      occurredAt: Date.parse(account.updatedAt) || Date.now(),
      processQuality: process.composite,
      thesis: process.thesis,
      evidence: process.evidence,
      invalidation: process.uncertainty,
      risk: process.risk,
      discipline: process.discipline,
      positionSizing: process.positionSizing,
      simulatedPnl: account.realizedPnL + account.unrealizedPnL,
      simulatedProfitable: account.totalReturn > 0,
      flags: {
        missingInvalidation: !decision.invalidation?.trim(),
        missingThesis: !decision.thesis?.trim() || decision.thesis === 'Simulated entry',
        missingEvidence: !decision.evidence?.trim(),
        exceededRiskLimit: violation.includes('risk') || violation.includes('weight') || violation.includes('drawdown'),
        fomoEntry: decision.confidence === 'high' && !decision.evidence?.trim(),
        movedInvalidation: decision.closeReview?.wouldChange?.toLowerCase().includes('invalidation'),
      },
      scenarioContext: inferScenarioContext({
        totalReturn: account.totalReturn,
        maxWeight: Math.max(0, ...account.positions.map((item) => item.portfolioWeight)),
        highVolatility: (account.scenario?.complexity?.volatility ?? 0) >= 0.6,
        earningsEvent: account.scenario?.events.some((item) => item.kind === 'earnings') ?? false,
        eventWindow: (account.scenario?.events.length ?? 0) > 0,
      }),
    });
  };

  const symbols = SYNTHETIC_UNIVERSE.map((item) => item.symbol);
  const scenarioSymbols = account?.scenario?.assets.map((item) => item.symbol) ?? symbols;
  const quotes: SimulationQuote[] = account?.scenario
    ? quotesForScenario(account.scenario, scenarioSymbols)
    : symbols
        .map((symbol) => getSyntheticQuote(symbol))
        .filter((quote): quote is SimulationQuote => quote != null);

  const listedName = (symbol: string) =>
    account?.scenario?.assets.find((item) => item.symbol === symbol.toUpperCase())?.name ??
    listedSyntheticName(symbol);

  return {
    userId,
    account,
    archives,
    quotes,
    universe: account?.scenario?.assets ?? SYNTHETIC_UNIVERSE,
    listedName,
    snapshot: account ? resetSnapshot(account) : undefined,
    start,
    previewBuy: (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => previewBuy(userId, input),
    previewSell: (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => previewSell(userId, input),
    buy: (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => {
      const result = buy(userId, input);
      if (result.ok) publishProcessEvidence(result.value);
      return result;
    },
    sell: (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => sell(userId, input),
    recordCloseReview: (decisionId: string, review: SimulationCloseReview) => {
      const account = recordCloseReview(userId, decisionId, review);
      publishProcessEvidence(account);
      return account;
    },
    refresh: () => refreshPrices(userId),
    advanceClock: () => advanceClock(userId),
    advanceToNextInformation: () => advanceToNextInformation(userId),
    answerDecision: (windowId: string, option: ScenarioDecisionOption, reasoning?: string) =>
      answerDecision(userId, windowId, option, reasoning),
    reset: (mode?: SimulationMode, challengeId?: string, currency?: string, options?: ScenarioStartOptions) =>
      reset(userId, mode, challengeId, currency ?? displayCurrency, options),
    displayCurrency,
  };
}
