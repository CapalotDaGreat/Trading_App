import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { FundamentalPanel } from '@/features/analysis/components/FundamentalPanel';
import { SentimentPanel } from '@/features/analysis/components/SentimentPanel';
import { TechnicalAnalysisPanel } from '@/features/analysis/components/TechnicalAnalysisPanel';
import { getFundamentalAnalysis } from '@/features/analysis/services/fundamental-analysis.service';
import { getSentimentAnalysis } from '@/features/analysis/services/sentiment-analysis.service';
import { useTechnicalAnalysis } from '@/features/analysis/hooks/useTechnicalAnalysis';
import { AiAnalysisScreen } from '@/features/ai/screens/AiAnalysisScreen';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import type { FundamentalAnalysis } from '@/features/analysis/services/fundamental-analysis.service';
import type { SentimentAnalysis } from '@/features/analysis/services/sentiment-analysis.service';

type Tab = 'technical' | 'fundamental' | 'sentiment' | 'ai';

export default function SymbolAnalysisScreen() {
  const { symbol, tab } = useLocalSearchParams<{ symbol: string; tab?: string }>();
  const decodedSymbol = decodeURIComponent(symbol ?? 'SPY');
  const initialTab = tab === 'ai' ? 'ai' : 'technical';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab as Tab);
  const [fundamental, setFundamental] = useState<FundamentalAnalysis | null>(null);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [loadingFundamental, setLoadingFundamental] = useState(true);
  const [loadingSentiment, setLoadingSentiment] = useState(true);

  const { data: technical, isLoading: loadingTechnical } = useTechnicalAnalysis(decodedSymbol);

  useEffect(() => {
    let cancelled = false;

    void getFundamentalAnalysis(decodedSymbol).then((data) => {
      if (!cancelled) {
        setFundamental(data);
        setLoadingFundamental(false);
      }
    });

    void getSentimentAnalysis(decodedSymbol).then((data) => {
      if (!cancelled) {
        setSentiment(data);
        setLoadingSentiment(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [decodedSymbol]);

  if (activeTab === 'ai') {
    return <AiAnalysisScreen symbol={decodedSymbol} />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'technical', label: 'Technical' },
    { key: 'fundamental', label: 'Fundamental' },
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'ai', label: 'AI' },
  ];

  return (
    <Screen scrollable padded={false}>
      <Header title={decodedSymbol} subtitle="Full Analysis" />

      <View className="flex-row border-b border-border px-4">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className="mr-4 border-b-2 py-3"
            style={{
              borderBottomColor: activeTab === tab.key ? '#00D4AA' : 'transparent',
            }}
          >
            <Text
              variant="label"
              className={activeTab === tab.key ? 'text-accent' : 'text-text-tertiary'}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-4 p-4">
        {activeTab === 'technical' ? (
          <TechnicalAnalysisPanel
            symbol={decodedSymbol}
            data={technical}
            isLoading={loadingTechnical}
          />
        ) : null}
        {activeTab === 'fundamental' ? (
          <FundamentalPanel data={fundamental} isLoading={loadingFundamental} />
        ) : null}
        {activeTab === 'sentiment' ? (
          <SentimentPanel data={sentiment} isLoading={loadingSentiment} />
        ) : null}
      </View>
    </Screen>
  );
}
