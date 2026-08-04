import { View } from 'react-native';

import { REPLAY_TV_DECISION_LABELS } from '@/features/decision-replay-tv/services/replay-tv-session.service';
import type { ReplayTvDecision } from '@/features/decision-replay-tv/types/replay-tv.types';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';

const ORDER: ReplayTvDecision[] = [
  'research_more',
  'write_thesis',
  'wait',
  'skip',
  'protect_attention',
];

interface ReplayTvDecisionChooserProps {
  onChoose: (decision: ReplayTvDecision) => void;
  disabled?: boolean;
}

export function ReplayTvDecisionChooser({
  onChoose,
  disabled,
}: ReplayTvDecisionChooserProps) {
  return (
    <View className="gap-2" testID="replay-tv-decision-chooser">
      <Text variant="caption" className="text-text-tertiary">
        Process decisions only — never a buy/sell instruction.
      </Text>
      {ORDER.map((decision) => (
        <Button
          key={decision}
          variant={decision === 'protect_attention' || decision === 'wait' ? 'secondary' : 'primary'}
          disabled={disabled}
          onPress={() => onChoose(decision)}
          accessibilityLabel={REPLAY_TV_DECISION_LABELS[decision]}
        >
          {REPLAY_TV_DECISION_LABELS[decision]}
        </Button>
      ))}
    </View>
  );
}
