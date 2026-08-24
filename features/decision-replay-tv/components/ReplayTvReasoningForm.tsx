import { View } from 'react-native';

import { emptyReplayTvReasoning } from '@/features/decision-replay-tv/services/replay-tv-coach.service';
import type { ReplayTvReasoning } from '@/features/decision-replay-tv/types/replay-tv.types';
import { Chip } from '@/shared/components/ui/Chip';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';

interface ReplayTvReasoningFormProps {
  value: ReplayTvReasoning;
  onChange: (next: ReplayTvReasoning) => void;
}

export function ReplayTvReasoningForm({ value, onChange }: ReplayTvReasoningFormProps) {
  const patch = (partial: Partial<ReplayTvReasoning>) => onChange({ ...value, ...partial });

  return (
    <View className="gap-3" testID="replay-tv-reasoning-form">
      <Text variant="label">What makes you choose this?</Text>
      <Text variant="caption" className="text-text-tertiary">
        Structured process notes stay on-device. They are never sent to analytics.
      </Text>
      <Input
        label="Thesis"
        value={value.thesis}
        onChangeText={(thesis) => patch({ thesis })}
        placeholder="What is the research case, if any?"
        accessibilityLabel="Replay TV thesis"
      />
      <Input
        label="Evidence"
        value={value.evidence}
        onChangeText={(evidence) => patch({ evidence })}
        placeholder="What can you see at this freeze?"
        accessibilityLabel="Replay TV evidence"
      />
      <Input
        label="Invalidation"
        value={value.invalidation}
        onChangeText={(invalidation) => patch({ invalidation })}
        placeholder="What would kill this research case?"
        accessibilityLabel="Replay TV invalidation"
      />
      <Input
        label="Main uncertainty"
        value={value.mainUncertainty}
        onChangeText={(mainUncertainty) => patch({ mainUncertainty })}
        placeholder="What is still unknown?"
        accessibilityLabel="Replay TV main uncertainty"
      />
      <Text variant="caption" className="text-text-tertiary">
        Process confidence — not a forecast of price direction
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Chip
            key={n}
            label={`${n}`}
            selected={value.confidence === n}
            onPress={() => patch({ confidence: n })}
            accessibilityLabel={`Process confidence ${n} of 5`}
          />
        ))}
      </View>
      <Input
        label="Optional note"
        value={value.freeText ?? ''}
        onChangeText={(freeText) => patch({ freeText })}
        multiline
        numberOfLines={3}
        placeholder="Anything else about the process — not a trade order."
        accessibilityLabel="Replay TV optional reasoning"
      />
    </View>
  );
}

export { emptyReplayTvReasoning };
