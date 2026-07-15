import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { aiService } from '../services/ai.service';
import type { AiAnalysisType, AiRequestContext } from '../types/ai.types';

export const AI_USAGE_QUERY_KEY = ['ai', 'usage'] as const;

export function useAiAnalysis() {
  const tier = useSubscriptionStore((s) => s.tier);
  const queryClient = useQueryClient();

  const usageQuery = useQuery({
    queryKey: AI_USAGE_QUERY_KEY,
    queryFn: () => aiService.getUsage(tier),
    staleTime: 30_000,
  });

  const invalidateUsage = () => {
    void queryClient.invalidateQueries({ queryKey: AI_USAGE_QUERY_KEY });
  };

  const analyzeMutation = useMutation({
    mutationFn: ({
      type,
      context,
      requiresPremium,
    }: {
      type: AiAnalysisType;
      context?: AiRequestContext;
      requiresPremium?: boolean;
    }) => {
      const accessError = aiService.checkAccess(
        tier,
        usageQuery.data?.usedToday ?? 0,
        requiresPremium,
      );
      if (accessError) throw accessError;
      return aiService.analyze(type, context ?? {}, tier);
    },
    onSuccess: invalidateUsage,
  });

  const dailySummaryMutation = useMutation({
    mutationFn: () => aiService.getDailySummary(tier),
    onSuccess: invalidateUsage,
  });

  const tradeSuggestionMutation = useMutation({
    mutationFn: ({ symbol, timeframe }: { symbol: string; timeframe?: string }) =>
      aiService.getTradeSuggestions(symbol, tier, timeframe),
    onSuccess: invalidateUsage,
  });

  const riskAnalysisMutation = useMutation({
    mutationFn: (symbol: string) => aiService.getRiskAnalysis(symbol, tier),
    onSuccess: invalidateUsage,
  });

  const patternMutation = useMutation({
    mutationFn: ({ symbol, pattern }: { symbol: string; pattern: string }) =>
      aiService.explainPattern(symbol, pattern, tier),
    onSuccess: invalidateUsage,
  });

  const indicatorMutation = useMutation({
    mutationFn: ({ symbol, indicator }: { symbol: string; indicator: string }) =>
      aiService.explainIndicator(symbol, indicator, tier),
    onSuccess: invalidateUsage,
  });

  const marketRecapMutation = useMutation({
    mutationFn: (period: 'daily' | 'weekly' = 'daily') =>
      aiService.getMarketRecap(tier, period),
    onSuccess: invalidateUsage,
  });

  const psychologyMutation = useMutation({
    mutationFn: (topic: string) => aiService.getPsychologyCoach(topic, tier),
    onSuccess: invalidateUsage,
  });

  const portfolioReviewMutation = useMutation({
    mutationFn: (portfolio: AiRequestContext['portfolio']) =>
      aiService.getPortfolioReview(portfolio, tier),
    onSuccess: invalidateUsage,
  });

  const newsSummaryMutation = useMutation({
    mutationFn: ({ newsIds, symbol }: { newsIds: string[]; symbol?: string }) =>
      aiService.getNewsSummary(newsIds, tier, symbol),
    onSuccess: invalidateUsage,
  });

  return {
    usage: usageQuery.data ?? null,
    isLoadingUsage: usageQuery.isLoading,
    analyze: analyzeMutation.mutateAsync,
    getDailySummary: dailySummaryMutation.mutateAsync,
    getTradeSuggestions: tradeSuggestionMutation.mutateAsync,
    getRiskAnalysis: riskAnalysisMutation.mutateAsync,
    explainPattern: patternMutation.mutateAsync,
    explainIndicator: indicatorMutation.mutateAsync,
    getMarketRecap: marketRecapMutation.mutateAsync,
    getPsychologyCoach: psychologyMutation.mutateAsync,
    getPortfolioReview: portfolioReviewMutation.mutateAsync,
    getNewsSummary: newsSummaryMutation.mutateAsync,
    isAnalyzing:
      analyzeMutation.isPending ||
      dailySummaryMutation.isPending ||
      tradeSuggestionMutation.isPending ||
      riskAnalysisMutation.isPending ||
      patternMutation.isPending ||
      indicatorMutation.isPending ||
      marketRecapMutation.isPending ||
      psychologyMutation.isPending ||
      portfolioReviewMutation.isPending ||
      newsSummaryMutation.isPending,
    result:
      analyzeMutation.data ??
      dailySummaryMutation.data ??
      tradeSuggestionMutation.data ??
      riskAnalysisMutation.data ??
      patternMutation.data ??
      indicatorMutation.data ??
      marketRecapMutation.data ??
      psychologyMutation.data ??
      portfolioReviewMutation.data ??
      newsSummaryMutation.data ??
      null,
    error:
      analyzeMutation.error ??
      dailySummaryMutation.error ??
      tradeSuggestionMutation.error ??
      riskAnalysisMutation.error ??
      patternMutation.error ??
      indicatorMutation.error ??
      marketRecapMutation.error ??
      psychologyMutation.error ??
      portfolioReviewMutation.error ??
      newsSummaryMutation.error ??
      null,
    reset: () => {
      analyzeMutation.reset();
      dailySummaryMutation.reset();
      tradeSuggestionMutation.reset();
      riskAnalysisMutation.reset();
      patternMutation.reset();
      indicatorMutation.reset();
      marketRecapMutation.reset();
      psychologyMutation.reset();
      portfolioReviewMutation.reset();
      newsSummaryMutation.reset();
    },
  };
}
