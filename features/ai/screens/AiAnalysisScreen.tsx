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
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Surface } from '@/shared/components/ui/Surface';
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

type ToolGroup = 'market' | 'symbol' | 'personal';

interface GroupedAnalysisOption extends AnalysisOption {
  group: ToolGroup;
}

const ANALYSIS_OPTIONS: GroupedAnalysisOption[] = [
  {
    type: 'daily_summary',
    label: 'Daily Summary',
    description: 'Market overview for today',
    group: 'market',
  },
  { type: 'market_recap', label: 'Market Recap', description: 'Daily or weekly recap', group: 'market' },
  { type: 'news_summary', label: 'News Summary', description: 'Headlines digest', group: 'market' },
  {
    type: 'trade_suggestion',
    label: 'Research Priority',
    description: 'Research, watch, or skip with cited local evidence',
    requiresPremium: true,
    requiresSymbol: true,
    group: 'symbol',
  },
  {
    type: 'risk_analysis',
    label: 'Risk Analysis',
    description: 'ATR-based position sizing',
    requiresSymbol: true,
    group: 'symbol',
  },
  {
    type: 'pattern_explanation',
    label: 'Pattern Explain',
    description: 'Detected chart patterns',
    requiresPremium: true,
    requiresSymbol: true,
    group: 'symbol',
  },
  {
    type: 'indicator_explanation',
    label: 'Indicator Explain',
    description: 'Live RSI, MACD, ATR readings',
    requiresSymbol: true,
    group: 'symbol',
  },
  {
    type: 'psychology_coach',
    label: 'Psychology Coach',
    description: 'Trading mindset tips',
    group: 'personal',
  },
  {
    type: 'portfolio_review',
    label: 'Portfolio Review',
    description: 'Diversification analysis',
    requiresPremium: true,
    group: 'personal',
  },
];

const RECOMMENDED_TYPES: AiAnalysisType[] = ['daily_summary', 'trade_suggestion', 'risk_analysis'];

interface AiAnalysisScreenProps {
  symbol?: string;
  embedded?: boolean;
}

export function AiAnalysisScreen({ symbol = 'SPY', embedded = false }: AiAnalysisScreenProps) {
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

  const content = (
      <View className={embedded ? 'pb-6' : 'py-4'}>
        <Surface className="mb-4" padding="md">
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
        </Surface>

        <AiContextPreview context={enrichedContext} isLoading={contextQuery.isLoading} />

        {enrichedContext?.detectedPatterns?.length ? (
          <Surface className="mb-4" padding="sm">
            <Text variant="caption" className="mb-1 text-text-secondary">
              Detected: {detectedPattern} · Primary indicator: {primaryIndicator}
            </Text>
            {!user ? (
              <Text variant="caption" className="text-text-tertiary">
                Sign in to sync portfolio for personalized reviews
              </Text>
            ) : null}
          </Surface>
        ) : null}

        <AiDisclaimer className="mb-4" />

        <Text variant="h3" headingLevel={3} className="mb-3">
          Recommended tools
        </Text>
        <View className="mb-4 gap-2">
          {ANALYSIS_OPTIONS.filter((option) => RECOMMENDED_TYPES.includes(option.type)).map(
            (option) => {
              const locked = option.requiresPremium && !isPremium;
              return (
                <Pressable
                  key={option.type}
                  onPress={() => !locked && void runAnalysis(option.type)}
                  disabled={isAnalyzing || locked}
                  className="opacity-100 disabled:opacity-50"
                >
                  <Surface padding="sm">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text variant="label">
                          {option.label}
                          {locked ? ' · Premium' : ''}
                        </Text>
                        <Text variant="caption">{option.description}</Text>
                      </View>
                      {selectedType === option.type && isAnalyzing ? (
                        <Text variant="caption" className="text-accent">
                          Analyzing...
                        </Text>
                      ) : null}
                    </View>
                  </Surface>
                </Pressable>
              );
            },
          )}
        </View>

        <CollapsibleSection
          title="All tools"
          description="Market, symbol, and personal analysis tools."
        >
          {(['market', 'symbol', 'personal'] as const).map((group) => (
            <View key={group} className="mb-3 gap-2">
              <Text variant="label" className="text-text-tertiary">
                {group === 'market' ? 'Market' : group === 'symbol' ? 'Symbol' : 'Personal'}
              </Text>
              {ANALYSIS_OPTIONS.filter((option) => option.group === group).map((option) => {
                const locked = option.requiresPremium && !isPremium;
                return (
                  <Pressable
                    key={option.type}
                    onPress={() => !locked && void runAnalysis(option.type)}
                    disabled={isAnalyzing || locked}
                    className="opacity-100 disabled:opacity-50"
                  >
                    <Surface padding="sm" tone="subtle">
                      <Text variant="label">
                        {option.label}
                        {locked ? ' · Premium' : ''}
                      </Text>
                      <Text variant="caption">{option.description}</Text>
                    </Surface>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </CollapsibleSection>

        <PromptSuggestions
          suggestions={DEFAULT_ANALYSIS_PROMPTS}
          onSelect={(prompt) => void runAnalysis('psychology_coach', prompt)}
          disabled={isAnalyzing}
          className="mb-4 mt-4"
        />

        {errorMessage ? (
          <Surface className="mb-4" tone="danger" padding="sm">
            <Text variant="body-sm" className="text-bearish">
              {errorMessage}
            </Text>
          </Surface>
        ) : null}

        {result ? <AiAnalysisCard result={result} /> : null}

        {!embedded ? (
          <Button
            variant="outline"
            className="mt-4"
            onPress={() => router.push({ pathname: '/ai', params: { symbol } } as never)}
            fullWidth
          >
            Ask the local research coach about {symbol}
          </Button>
        ) : null}
      </View>
  );

  if (embedded) return content;

  return (
    <Screen scrollable scrollViewProps={{ refreshControl: undefined }}>
      <Header title="Local Analysis" subtitle={`${symbol} · rules-based`} onBack={() => router.back()} />
      {content}
    </Screen>
  );
}
