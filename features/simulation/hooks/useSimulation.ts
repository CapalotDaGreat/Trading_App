import { useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEMO_USER_UID } from '@/firebase/config';
import { useDisplayCurrency } from '@/shared/hooks/useDisplayCurrency';

import { SYNTHETIC_UNIVERSE } from '../constants/simulation.constants';
import { getSyntheticQuote, listedSyntheticName } from '../services/synthetic-market.service';
import { resetSnapshot } from '../services/simulation-engine.service';
import { useSimulationStore } from '../stores/simulation.store';
import type {
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

  useEffect(() => {
    if (!autoStart) return;
    ensureAccount(userId, undefined, undefined, displayCurrency);
  }, [autoStart, ensureAccount, userId, displayCurrency]);

  const start = () => ensureAccount(userId, undefined, undefined, displayCurrency);

  const quotes: SimulationQuote[] = SYNTHETIC_UNIVERSE.map((item) => getSyntheticQuote(item.symbol)).filter(
    (quote): quote is SimulationQuote => quote != null,
  );

  return {
    userId,
    account,
    archives,
    quotes,
    universe: SYNTHETIC_UNIVERSE,
    listedName: listedSyntheticName,
    snapshot: account ? resetSnapshot(account) : undefined,
    start,
    previewBuy: (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => previewBuy(userId, input),
    previewSell: (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => previewSell(userId, input),
    buy: (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => buy(userId, input),
    sell: (input: Omit<SimulationTradeInput, 'price'> & { price?: number }) => sell(userId, input),
    recordCloseReview: (decisionId: string, review: SimulationCloseReview) =>
      recordCloseReview(userId, decisionId, review),
    refresh: () => refreshPrices(userId),
    reset: (mode?: SimulationMode, challengeId?: string, currency?: string) =>
      reset(userId, mode, challengeId, currency ?? displayCurrency),
    displayCurrency,
  };
}
