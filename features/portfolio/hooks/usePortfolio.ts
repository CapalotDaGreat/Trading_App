import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { MARKET_DATA_POLICY } from '@/features/markets/constants/freshness';
import { quotesToPriceMap, useLiveQuotes } from '@/features/markets/hooks/useLiveQuotes';
import { canUseFirestore } from '@/firebase/config';

import {
  buildPerformanceHistory,
  calculateHoldingPnL,
  calculatePortfolioSummary,
  createHolding,
  deleteHolding,
  getHoldings,
  updateHolding,
  updateHoldingPrices,
} from '../services/portfolio.service';
import type {
  CreateHoldingInput,
  Holding,
  PortfolioPerformance,
  UpdateHoldingInput,
} from '../types/portfolio.types';

const portfolioQueryKey = (uid: string | undefined) => ['portfolio', uid] as const;
const performanceQueryKey = (uid: string | undefined, period: PortfolioPerformance['period']) =>
  ['portfolio-performance', uid, period] as const;

interface PortfolioUiState {
  performancePeriod: PortfolioPerformance['period'];
  setPerformancePeriod: (period: PortfolioPerformance['period']) => void;
}

export const usePortfolioStore = create<PortfolioUiState>((set) => ({
  performancePeriod: '1M',
  setPerformancePeriod: (period) => set({ performancePeriod: period }),
}));

export function usePortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid;
  const firestoreReady = canUseFirestore(uid);
  const performancePeriod = usePortfolioStore((s) => s.performancePeriod);
  const setPerformancePeriod = usePortfolioStore((s) => s.setPerformancePeriod);

  const holdingsQuery = useQuery({
    queryKey: portfolioQueryKey(uid),
    queryFn: () => getHoldings(uid!),
    enabled: firestoreReady,
    staleTime: MARKET_DATA_POLICY.quoteStaleMs,
  });

  const storedHoldings = holdingsQuery.data ?? [];
  const symbols = storedHoldings.map((h) => h.symbol);
  const liveQuotes = useLiveQuotes(symbols, symbols.length > 0);
  const priceMap = useMemo(() => quotesToPriceMap(liveQuotes.data), [liveQuotes.data]);
  const priceMapKey = useMemo(() => JSON.stringify(priceMap), [priceMap]);

  const holdings: Holding[] = useMemo(
    () =>
      storedHoldings.map((h) => {
        const live = priceMap[h.symbol.toUpperCase()];
        return live !== undefined ? { ...h, currentPrice: live } : h;
      }),
    [storedHoldings, priceMap],
  );

  useEffect(() => {
    if (!firestoreReady || !uid || !priceMapKey || priceMapKey === '{}') return;
    const prices = JSON.parse(priceMapKey) as Record<string, number>;
    const timer = setTimeout(() => {
      void updateHoldingPrices(uid, prices).catch(() => undefined);
    }, 2500);
    return () => clearTimeout(timer);
  }, [firestoreReady, uid, priceMapKey]);

  const performanceQuery = useQuery({
    queryKey: performanceQueryKey(uid, performancePeriod),
    queryFn: () => buildPerformanceHistory(holdings, performancePeriod),
    enabled: firestoreReady && holdingsQuery.isSuccess,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateHoldingInput) => createHolding(uid!, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portfolioQueryKey(uid) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      holdingId,
      updates,
    }: {
      holdingId: string;
      updates: UpdateHoldingInput;
    }) => updateHolding(uid!, holdingId, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portfolioQueryKey(uid) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (holdingId: string) => deleteHolding(uid!, holdingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portfolioQueryKey(uid) });
    },
  });

  const summary = calculatePortfolioSummary(holdings);
  const holdingPnLs = holdings.map((h) => calculateHoldingPnL(h));

  return {
    holdings,
    summary,
    holdingPnLs,
    performance: performanceQuery.data ?? null,
    performancePeriod,
    setPerformancePeriod,
    isLoading: holdingsQuery.isLoading,
    isError: holdingsQuery.isError,
    error: holdingsQuery.error,
    refetch: async () => {
      await Promise.all([holdingsQuery.refetch(), liveQuotes.refetch()]);
    },
    quotesFetchedAt: liveQuotes.dataUpdatedAt,
    createHolding: createMutation.mutateAsync,
    updateHolding: updateMutation.mutateAsync,
    deleteHolding: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
