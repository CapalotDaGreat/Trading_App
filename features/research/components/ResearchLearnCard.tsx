import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { getLocalLessonById } from '@/features/academy/content';
import { glossaryForTags } from '@/features/academy/content/glossary';
import type { IndicatorType } from '@/features/charts/utils/indicators';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

type AssetLearnTab = 'decision' | 'chart' | 'indicators' | 'advanced';

const INDICATOR_LESSONS: Partial<Record<IndicatorType, string>> = {
  rsi: 'ta-rsi',
  ema: 'ta-moving-averages',
  sma: 'ta-moving-averages',
  macd: 'ta-macd',
  atr: 'risk-position-sizing',
};

const TAB_LESSONS: Record<AssetLearnTab, string[]> = {
  decision: ['dec-research-filter', 'ta-structure'],
  chart: ['ta-candles', 'ta-trend-range'],
  indicators: ['ta-rsi', 'ta-moving-averages', 'ta-macd'],
  advanced: ['ta-structure', 'ta-volume'],
};

interface ResearchLearnCardProps {
  tab: AssetLearnTab;
  indicators?: IndicatorType[];
  symbol: string;
}

export function ResearchLearnCard({ tab, indicators = [], symbol }: ResearchLearnCardProps) {
  const router = useRouter();
  const lessonIds = [
    ...indicators.map((item) => INDICATOR_LESSONS[item]).filter(Boolean),
    ...TAB_LESSONS[tab],
  ].filter((id, index, all): id is string => Boolean(id) && all.indexOf(id) === index);

  const lessons = lessonIds
    .map((id) => getLocalLessonById(id))
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson))
    .slice(0, 2);

  if (lessons.length === 0) return null;

  const terms = glossaryForTags(lessons.flatMap((lesson) => lesson.tags)).slice(0, 2);
  const primary = lessons[0];

  return (
    <Surface tone="subtle" padding="sm" testID="research-learn-card">
      <Text variant="caption" className="text-text-tertiary">
        Contextual coaching
      </Text>
      <Text variant="label" className="mt-1">
        Studying {symbol.toUpperCase()}
      </Text>
      <Text variant="body-sm" className="mt-1 leading-5 text-text-secondary">
        {tab === 'indicators'
          ? `Want to understand ${primary.tags[0]?.toUpperCase() ?? 'this indicator'} before continuing?`
          : tab === 'chart'
            ? 'Learn how to identify trend structure and candle context while you read this chart.'
            : 'If a term is unclear, open a short Academy lesson — then return to this chart.'}
      </Text>
      <View className="mt-3 gap-2">
        {lessons.map((lesson) => (
          <Pressable
            key={lesson.id}
            accessibilityRole="button"
            accessibilityLabel={`Learn about ${lesson.title}`}
            onPress={() => router.push(`/academy/lesson/${lesson.id}` as never)}
            className="min-h-11 justify-center rounded-xl bg-background px-3 py-2"
          >
            <Text variant="label" className="text-accent">
              Learn about {lesson.title}
            </Text>
          </Pressable>
        ))}
        {terms.map((term) => (
          <Text key={term.id} variant="caption" className="text-text-tertiary">
            {term.term}: {term.short}
          </Text>
        ))}
      </View>
    </Surface>
  );
}
