import { useMutation, useQuery } from '@tanstack/react-query';

import { useTraderMemory, useRegime } from '@/features/decision/hooks/useDecision';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { useDecisionPassportStore } from '@/features/decision-passport/stores/passport.store';
import { createSimulatorSession } from '@/features/decision-simulator/services/simulator-session.service';
import { useSimulatorStore } from '@/features/decision-simulator/stores/simulator.store';
import type { SimulatorAction } from '@/features/decision-simulator/types/simulator.types';
import { buildAssetFromSymbol, fetchCandlesWithMetadata } from '@/features/markets/services/market-data.service';
import { fetchFinancialNews } from '@/features/news/services/news.service';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { useSettingsStore } from '@/shared/stores/settings.store';
import type { CandleInterval } from '@/shared/types/market';
import { selectTodayTimeBudget } from '@/features/decision/services/today-sections.service';

export function useDecisionSimulator() {
  const activeSession = useSimulatorStore((s) => s.activeSession);
  const history = useSimulatorStore((s) => s.history);
  const setActiveSession = useSimulatorStore((s) => s.setActiveSession);
  const updateChecklist = useSimulatorStore((s) => s.updateChecklist);
  const setReasoningNote = useSimulatorStore((s) => s.setReasoningNote);
  const submitDecision = useSimulatorStore((s) => s.submitDecision);
  const clearActive = useSimulatorStore((s) => s.clearActive);
  const recordPassport = useDecisionPassportStore((s) => s.recordSimulatorResult);
  const passport = useDecisionPassportStore((s) => s.getSnapshot());

  const regimeQuery = useRegime();
  const memoryQuery = useTraderMemory();
  const { holdings } = usePortfolio();
  const researchTimeMinutes = useSettingsStore(selectTodayTimeBudget);
  const appendDecision = useAppendDecisionRecord();

  const startMutation = useMutation({
    mutationFn: async (input: { symbol: string; interval?: CandleInterval }) => {
      const interval = input.interval ?? '1d';
      const asset = buildAssetFromSymbol(input.symbol);
      const [candlePack, news] = await Promise.all([
        fetchCandlesWithMetadata({
          symbol: input.symbol,
          interval,
          marketType: asset.marketType,
          limit: 120,
        }),
        fetchFinancialNews({ query: input.symbol, pageSize: 4 }).catch(() => ({
          articles: [] as { id: string; title: string; source: string }[],
        })),
      ]);

      const session = createSimulatorSession({
        symbol: input.symbol,
        interval,
        candles: candlePack.candles,
        regimeLabel: regimeQuery.data?.label,
        regime: regimeQuery.data?.regime,
        newsHeadlines: news.articles.map((a) => ({
          id: a.id,
          title: a.title,
          source: a.source,
        })),
        portfolioSymbols: holdings.map((h) => h.symbol),
        memory: memoryQuery.data,
        researchTimeMinutes,
      });

      setActiveSession(session);
      return session;
    },
  });

  const decideMutation = useMutation({
    mutationFn: async (action: SimulatorAction) => {
      const revealed = submitDecision(action);
      if (!revealed?.scores) {
        throw new Error('No active simulator session to score.');
      }

      recordPassport({
        symbol: revealed.symbol,
        action,
        scores: revealed.scores,
      });

      const logAction =
        action === 'research' || action === 'create_thesis'
          ? 'researched'
          : action === 'ignore'
            ? 'ignored'
            : 'skipped';

      await appendDecision.mutateAsync({
        symbol: revealed.symbol,
        regime: revealed.context.regimeLabel,
        action: logAction,
        bias: revealed.context.bias,
        decisionQualityScore: revealed.scores.decisionQualityScore,
        note: `Decision Simulator · ${action} · process ${revealed.scores.processScore}`,
        eventKey: `simulator:${revealed.id}`,
      });

      return revealed;
    },
  });

  const historyQuery = useQuery({
    queryKey: ['decision-simulator', 'history', history.length],
    queryFn: async () => history,
    initialData: history,
  });

  return {
    activeSession,
    history: historyQuery.data,
    passport,
    startSession: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    startError: startMutation.error,
    updateChecklist,
    setReasoningNote,
    submitDecision: decideMutation.mutateAsync,
    isSubmitting: decideMutation.isPending,
    clearActive,
  };
}
