import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { DEFAULT_BRIEF_SYMBOLS, MARKET_DATA_POLICY } from '@/features/markets/constants/freshness';
import { useRemoteConfig } from '@/features/ops-config/hooks/useOpsConfig';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { getLimit } from '@/features/subscription/services/entitlement.service';
import { useWatchlists } from '@/features/watchlists/hooks/useWatchlists';

import {
  buildDecisionBrief,
  buildMtfConsensus,
  buildSetupRadar,
  detectRegime,
} from '../services/decision-engine.service';
import {
  buildJournalCoach,
  buildRiskCenter,
  loadTraderMemory,
} from '../services/trader-intelligence.service';
import type {
  DecisionBrief,
  JournalCoachInsight,
  MtfConsensus,
  RegimeSnapshot,
  RiskCenterSnapshot,
  SetupCardData,
  TraderMemory,
} from '../types/decision.types';

export const decisionKeys = {
  brief: ['decision', 'brief'] as const,
  radar: (symbols: string[]) => ['decision', 'radar', ...symbols] as const,
  regime: ['decision', 'regime'] as const,
  mtf: (symbol: string) => ['decision', 'mtf', symbol] as const,
  memory: ['decision', 'memory'] as const,
  risk: ['decision', 'risk'] as const,
  journalCoach: ['decision', 'journal-coach'] as const,
};

function resolveSymbols(
  preferred: string[] | undefined,
  watchlistSymbols: string[] | undefined,
): string[] {
  if (preferred?.length) return preferred;
  if (watchlistSymbols?.length) return watchlistSymbols;
  return [...DEFAULT_BRIEF_SYMBOLS];
}

export function useDecisionBrief(timeBudgetMinutes = 20, preferredSymbols?: string[]) {
  const { user } = useAuth();
  const { watchlists } = useWatchlists();
  const { summary, holdings } = usePortfolio();
  const remote = useRemoteConfig();
  const symbols = resolveSymbols(preferredSymbols, watchlists?.[0]?.symbols);
  const key = symbols.slice(0, 8).join(',');
  const queueDepth = getLimit('researchQueueDepth');

  const query = useQuery({
    queryKey: [
      'decision',
      'brief',
      key,
      timeBudgetMinutes,
      user?.uid,
      remote.decisionBriefMaxSetups,
      queueDepth,
    ] as const,
    queryFn: async (): Promise<DecisionBrief> =>
      buildDecisionBrief({
        watchlistSymbols: symbols,
        portfolioChangePercent: summary?.dayChangePercent ?? summary?.totalPnLPercent,
        portfolioSymbols: holdings.map((h) => h.symbol),
        uid: user?.uid,
        timeBudgetMinutes,
        decisionBriefMaxSetups: remote.decisionBriefMaxSetups,
        researchQueueDepth: queueDepth < 0 ? undefined : queueDepth,
      }),
    staleTime: MARKET_DATA_POLICY.briefStaleMs,
    refetchInterval: MARKET_DATA_POLICY.briefRefetchMs,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    ...query,
    data: query.data as DecisionBrief | undefined,
  };
}

export function useSetupRadar(symbols?: string[]) {
  const { watchlists } = useWatchlists();
  const list = resolveSymbols(symbols, watchlists?.[0]?.symbols);
  const key = list.join(',');

  const query = useQuery({
    queryKey: ['decision', 'radar', key] as const,
    queryFn: async (): Promise<SetupCardData[]> => buildSetupRadar(list),
    staleTime: MARKET_DATA_POLICY.briefStaleMs,
    refetchInterval: MARKET_DATA_POLICY.briefRefetchMs,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    ...query,
    data: query.data as SetupCardData[] | undefined,
  };
}

export function useRegime(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['decision', 'regime'] as const,
    queryFn: async (): Promise<RegimeSnapshot> => detectRegime(),
    enabled: options?.enabled ?? true,
    staleTime: MARKET_DATA_POLICY.dashboardStaleMs,
    refetchInterval: MARKET_DATA_POLICY.dashboardRefetchMs,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useMtfConsensus(symbol: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['decision', 'mtf', symbol] as const,
    queryFn: async (): Promise<MtfConsensus> => buildMtfConsensus(symbol),
    enabled: Boolean(symbol) && (options?.enabled ?? true),
    staleTime: MARKET_DATA_POLICY.candleStaleMs,
    refetchInterval: MARKET_DATA_POLICY.candleRefetchMs,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useTraderMemory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['decision', 'memory', user?.uid ?? 'guest'] as const,
    queryFn: async (): Promise<TraderMemory> => loadTraderMemory(user?.uid),
    staleTime: 60_000,
  });
}

export function useRiskCenter() {
  const { holdings } = usePortfolio();
  const key = holdings.map((h) => h.id).join(',');
  return useQuery({
    queryKey: ['decision', 'risk', key] as const,
    queryFn: async (): Promise<RiskCenterSnapshot> => buildRiskCenter(holdings),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useJournalCoach() {
  const { entries } = useJournal();
  // Include content fingerprint so edits (notes/tags/emotion) invalidate coach cache.
  const contentKey = entries
    .map(
      (e) =>
        `${e.id}:${e.updatedAt}:${e.outcome}:${e.emotion ?? ''}:${e.tags.join(',')}:${(e.notes ?? '').length}`,
    )
    .join('|');
  return useQuery({
    queryKey: ['decision', 'journal-coach', entries.length, contentKey] as const,
    queryFn: async (): Promise<JournalCoachInsight> => buildJournalCoach(entries),
    staleTime: 30_000,
  });
}
