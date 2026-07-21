import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { fetchFinancialNews } from '@/features/news/services/news.service';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { AiAnalysisCard } from '../components/AiAnalysisCard';
import { AiContextPreview } from '../components/AiContextPreview';
import { AiDisclaimer } from '../components/AiDisclaimer';
import { AiUsageBanner } from '../components/AiUsageBanner';
import { DEFAULT_ANALYSIS_PROMPTS, PromptSuggestions } from '../components/PromptSuggestions';
import { useAiAnalysis } from '../hooks/useAiAnalysis';
import { aiService } from '../services/ai.service';
import { buildSymbolContext, getPrimaryIndicator, getPrimaryPattern } from '../services/ai-context.service';
import type { AiAnalysisType } from '../types/ai.types';

interface AnalysisOption {
  type: AiAnalysisType;
  label: string;
  description: string;
  requiresPremium?: boolean;
  requiresSymbol?: boolean;
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  { type: 'daily_summary', label: 'Daily Summary', description: 'Market overview for today' },
  {
    type: 'trade_suggestion',
    label: 'Research Priority',
    description: 'Research, watch, or skip with cited local evidence',
    requiresPremium: true,
    requiresSymbol: true,
  },
  {
    type: 'risk_analysis',
    label: 'Risk Analysis',
    description: 'ATR-based position sizing',
    requiresSymbol: true,
  },
  {
    type: 'pattern_explanation',
    label: 'Pattern Explain',
    description: 'Detected chart patterns',
    requiresPremium: true,
    requiresSymbol: true,
  },
  {
    type: 'indicator_explanation',
    label: 'Indicator Explain',
    description: 'Live RSI, MACD, ATR readings',
    requiresSymbol: true,
  },
  { type: 'market_recap', label: 'Market Recap', description: 'Daily or weekly recap' },
  { type: 'psychology_coach', label: 'Psychology Coach', description: 'Trading mindset tips' },
  {
    type: 'portfolio_review',
    label: 'Portfolio Review',
    description: 'Diversification analysis',
    requiresPremium: true,
  },
  { type: 'news_summary', label: 'News Summary', description: 'Headlines digest' },
];

interface AiAnalysisScreenProps {
  symbol?: string;
}

export function AiAnalysisScreen({ symbol = 'SPY' }: AiAnalysisScreenProps) {
  const router = useRouter();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const { user } = useAuth();
  const { holdings } = usePortfolio();
  const [selectedType, setSelectedType] = useState<AiAnalysisType | null>(null);

  const contextQuery = useQuery({
    queryKey: ['ai-context', symbol],
    queryFn: () => buildSymbolContext(symbol),
    staleTime: 60_000,
  });

  const newsQuery = useQuery({
    queryKey: ['ai-news-ids'],
    queryFn: () => fetchFinancialNews({ pageSize: 8 }),
    staleTime: 120_000,
  });

  const enrichedContext = contextQuery.data;
  const detectedPattern = useMemo(
    () => getPrimaryPattern(enrichedContext ?? { assembledAt: 0 }) ?? 'Chart pattern',
    [enrichedContext],
  );
  const primaryIndicator = useMemo(
    () => getPrimaryIndicator(enrichedContext ?? { assembledAt: 0 }),
    [enrichedContext],
  );

  const portfolioPayload = useMemo(
    () =>
      holdings?.map((h) => ({
        symbol: h.symbol,
        quantity: h.quantity,
        avgCost: h.averageCost,
      })) ?? [],
    [holdings],
  );

  const {
    usage,
    isAnalyzing,
    result,
    error,
    getDailySummary,
    getTradeSuggestions,
    getRiskAnalysis,
    explainPattern,
    explainIndicator,
    getMarketRecap,
    getPsychologyCoach,
    getPortfolioReview,
    getNewsSummary,
    reset,
  } = useAiAnalysis();

  const runAnalysis = useCallback(
    async (type: AiAnalysisType, customTopic?: string) => {
      setSelectedType(type);
      reset();

      switch (type) {
        case 'daily_summary':
          await getDailySummary();
          break;
        case 'trade_suggestion':
          await getTradeSuggestions({ symbol });
          break;
        case 'risk_analysis':
          await getRiskAnalysis(symbol);
          break;
        case 'pattern_explanation':
          await explainPattern({ symbol, pattern: detectedPattern });
          break;
        case 'indicator_explanation':
          await explainIndicator({ symbol, indicator: primaryIndicator });
          break;
        case 'market_recap':
          await getMarketRecap('daily');
          break;
        case 'psychology_coach':
          await getPsychologyCoach(customTopic ?? 'Managing trading emotions');
          break;
        case 'portfolio_review':
          await getPortfolioReview(portfolioPayload);
          break;
        case 'news_summary':
          await getNewsSummary({
            newsIds: newsQuery.data?.articles.map((a: { id: string }) => a.id) ?? [],
            symbol,
          });
          break;
        default:
          break;
      }
    },
    [
      detectedPattern,
      explainIndicator,
      explainPattern,
      getDailySummary,
      getMarketRecap,
      getNewsSummary,
      getPortfolioReview,
      getPsychologyCoach,
      getRiskAnalysis,
      getTradeSuggestions,
      newsQuery.data?.articles,
      portfolioPayload,
      primaryIndicator,
      reset,
      symbol,
    ],
  );

  const errorMessage =
    error && aiService.isServiceError(error) ? error.message : error?.message;

  return (
    <Screen scrollable scrollViewProps={{ refreshControl: undefined }}>
      <Header title="Local Analysis" subtitle={`${symbol} · rules-based`} onBack={() => router.back()} />

      <View className="py-4">
        <GlassCard className="mb-4 p-4">
          <Text variant="label" className="mb-1">
            Usage Today
          </Text>
          <Text variant="h2" className="text-accent">
            {usage && usage.limit !== -1
              ? `${usage.usedToday} / ${usage.limit}`
              : `${usage?.usedToday ?? 0}`}
          </Text>
          <AiUsageBanner usage={usage} isPremium={isPremium} className="mt-2" />
          <Text variant="caption" className="mt-1 text-text-tertiary">
            Runs on-device from available market context. Cloud AI is not used in this release.
          </Text>
        </GlassCard>

        <AiContextPreview context={enrichedContext} isLoading={contextQuery.isLoading} />

        {enrichedContext?.detectedPatterns?.length ? (
          <GlassCard className="mb-4 p-3">
            <Text variant="caption" className="mb-1 text-text-secondary">
              Detected: {detectedPattern} · Primary indicator: {primaryIndicator}
            </Text>
            {!user ? (
              <Text variant="caption" className="text-text-tertiary">
                Sign in to sync portfolio for personalized reviews
              </Text>
            ) : null}
          </GlassCard>
        ) : null}

        <AiDisclaimer className="mb-4" />

        <Text variant="h3" className="mb-3">
          Local Research Tools
        </Text>

        <View className="mb-4 gap-2">
          {ANALYSIS_OPTIONS.map((option) => {
            const locked = option.requiresPremium && !isPremium;
            return (
              <Pressable
                key={option.type}
                onPress={() => !locked && void runAnalysis(option.type)}
                disabled={isAnalyzing || locked}
                className="opacity-100 disabled:opacity-50"
              >
                <GlassCard className="p-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text variant="label">
                        {option.label}
                        {locked ? ' 🔒' : ''}
                      </Text>
                      <Text variant="caption">{option.description}</Text>
                    </View>
                    {selectedType === option.type && isAnalyzing ? (
                      <Text variant="caption" className="text-accent">
                        Analyzing...
                      </Text>
                    ) : null}
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <PromptSuggestions
          suggestions={DEFAULT_ANALYSIS_PROMPTS}
          onSelect={(prompt) => void runAnalysis('psychology_coach', prompt)}
          disabled={isAnalyzing}
          className="mb-4"
        />

        {errorMessage ? (
          <GlassCard className="mb-4 border-bearish/30 p-3">
            <Text variant="body-sm" className="text-bearish">
              {errorMessage}
            </Text>
          </GlassCard>
        ) : null}

        {result ? <AiAnalysisCard result={result} /> : null}

        <Button
          variant="outline"
          className="mt-4"
          onPress={() => router.push({ pathname: '/ai', params: { symbol } } as never)}
          fullWidth
        >
          Ask the local research coach about {symbol}
        </Button>
      </View>
    </Screen>
  );
}
