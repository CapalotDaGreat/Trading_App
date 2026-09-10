import { View } from 'react-native';

import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { ReviewBrief } from '../types/home-review.types';

export function ReviewProcessBrief({ brief }: { brief: ReviewBrief }) {
  return (
    <View className="gap-4">
      <Surface tone="accent" emphasis="outlined" testID="review-insight-hero">
        <Text variant="label" className="text-accent">
          What did I learn about my decision process?
        </Text>
        <Text variant="h2" headingLevel={2} className="mt-2">
          {brief.headline}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {brief.processInsight}
        </Text>
      </Surface>

      {brief.empty ? null : (
        <>
          {brief.improvements.length > 0 ? (
            <Surface testID="review-improvements">
              <Text variant="label" className="text-text-tertiary">
                Improvements
              </Text>
              {brief.improvements.map((item) => (
                <View key={item.title} className="mt-3">
                  <Text variant="body-sm">{item.title}</Text>
                  <Text variant="caption" className="mt-1 text-text-tertiary">
                    {item.note}
                  </Text>
                </View>
              ))}
            </Surface>
          ) : null}

          {brief.unresolved.length > 0 ? (
            <Surface testID="review-unresolved">
              <Text variant="label" className="text-text-tertiary">
                Unresolved weaknesses
              </Text>
              {brief.unresolved.map((item) => (
                <View key={item.title} className="mt-3">
                  <Text variant="body-sm">{item.title}</Text>
                  <Text variant="caption" className="mt-1 text-text-tertiary">
                    {item.note}
                  </Text>
                </View>
              ))}
            </Surface>
          ) : null}

          <Surface testID="review-evidence-quality">
            <Text variant="label" className="text-text-tertiary">
              Evidence quality
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {brief.evidenceQualityNote}
            </Text>
          </Surface>

          <Surface testID="review-journal-quality">
            <Text variant="label" className="text-text-tertiary">
              Journal quality
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {brief.journalQualityNote}
            </Text>
          </Surface>

          {brief.simulationReflection ? (
            <Surface testID="review-sim-reflection">
              <Text variant="label" className="text-text-tertiary">
                Simulation reflection
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                {brief.simulationReflection}
              </Text>
            </Surface>
          ) : null}

          {brief.replayReflection ? (
            <Surface testID="review-replay-reflection">
              <Text variant="label" className="text-text-tertiary">
                Replay reflection
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                {brief.replayReflection}
              </Text>
            </Surface>
          ) : null}
        </>
      )}
    </View>
  );
}
