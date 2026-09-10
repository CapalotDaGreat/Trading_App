import { View } from 'react-native';

import { emptyReplayTvReasoning } from '@/features/decision-replay-tv/services/replay-tv-coach.service';
import type { ReplayTvReasoning } from '@/features/decision-replay-tv/types/replay-tv.types';
import { Chip } from '@/shared/components/ui/Chip';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';

interface ReplayTvReasoningFormProps {
  value: ReplayTvReasoning;
  onChange: (next: ReplayTvReasoning) => void;
  section?: 'thesis' | 'risk' | 'sizing';
}

export function ReplayTvReasoningForm({ value, onChange, section = 'thesis' }: ReplayTvReasoningFormProps) {
  const patch = (partial: Partial<ReplayTvReasoning>) => onChange({ ...value, ...partial });

  return (
    <View className="gap-3" testID="replay-tv-reasoning-form">
      <Text variant="caption" className="text-text-tertiary">
        Structured process notes stay on-device. They are never sent to analytics.
      </Text>
      {section === 'thesis' ? (
        <>
          <Input
            label="What do you believe?"
            value={value.thesis}
            onChangeText={(thesis) => patch({ thesis })}
            placeholder="The working case — or that there is not one yet."
            accessibilityLabel="Replay TV thesis"
          />
          <Input
            label="Why?"
            value={value.why ?? ''}
            onChangeText={(why) => patch({ why })}
            placeholder="Why this reading of the freeze?"
            accessibilityLabel="Replay TV why"
          />
          <Input
            label="What evidence supports it?"
            value={value.evidence}
            onChangeText={(evidence) => patch({ evidence })}
            placeholder="Only what is visible at this cutoff."
            accessibilityLabel="Replay TV evidence"
          />
          <Input
            label="What could invalidate it?"
            value={value.invalidation}
            onChangeText={(invalidation) => patch({ invalidation })}
            placeholder="What would kill this research case?"
            accessibilityLabel="Replay TV invalidation"
          />
          <Input
            label="What is uncertain?"
            value={value.mainUncertainty}
            onChangeText={(mainUncertainty) => patch({ mainUncertainty })}
            placeholder="What is still unknown?"
            accessibilityLabel="Replay TV main uncertainty"
          />
          <Input
            label="What would change your mind?"
            value={value.whatWouldChangeMind ?? ''}
            onChangeText={(whatWouldChangeMind) => patch({ whatWouldChangeMind })}
            placeholder="A print, a level, a time budget — be specific."
            accessibilityLabel="Replay TV change of mind"
          />
        </>
      ) : null}
      {section === 'risk' ? (
        <Input
          label="Risk assessment"
          value={value.riskAssessment ?? ''}
          onChangeText={(riskAssessment) => patch({ riskAssessment })}
          placeholder="What can go wrong from here? Gap, liquidity, narrative?"
          multiline
          accessibilityLabel="Replay TV risk assessment"
        />
      ) : null}
      {section === 'sizing' ? (
        <>
          <Input
            label="Intended position size"
            value={value.intendedSize ?? ''}
            onChangeText={(intendedSize) => patch({ intendedSize })}
            placeholder="e.g. 0.5% of equity to invalidation — or no size."
            accessibilityLabel="Replay TV intended size"
          />
          <Input
            label="Expected risk"
            value={value.expectedRisk ?? ''}
            onChangeText={(expectedRisk) => patch({ expectedRisk })}
            placeholder="What are you actually risking if you are wrong?"
            accessibilityLabel="Replay TV expected risk"
          />
        </>
      ) : null}
      {section === 'thesis' ? (
        <>
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
        </>
      ) : null}
    </View>
  );
}

export { emptyReplayTvReasoning };
