import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiConfidenceHistoryPoint } from '../types/ai-trust.types';

interface ConfidenceHistoryPanelProps {
  history: AiConfidenceHistoryPoint[];
}

export function ConfidenceHistoryPanel({ history }: ConfidenceHistoryPanelProps) {
  if (!history.length) return null;

  return (
    <View className="gap-2" testID="ai-confidence-history">
      <Text variant="caption" className="font-medium text-text-tertiary">
        Why confidence / priority changed (history)
      </Text>
      <Text variant="caption" className="leading-5 text-text-tertiary">
        Evidence-quality scores over recent analyses — not price accuracy.
      </Text>
      {history.slice(0, 6).map((point) => (
        <View
          key={`${point.at}-${point.overallConfidence}`}
          className="rounded-xl bg-background/50 px-3 py-2"
        >
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="caption" className="font-medium text-text-primary">
              {point.overallConfidence}% evidence quality
            </Text>
            <Text variant="caption" className="text-text-tertiary">
              {formatRelativeTime(point.at)}
            </Text>
          </View>
          <Text variant="caption" className="mt-0.5 text-text-secondary">
            {point.summary}
          </Text>
        </View>
      ))}
    </View>
  );
}
