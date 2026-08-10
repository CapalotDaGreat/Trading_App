import { View } from 'react-native';

import {
  REPLAY_TV_DECISION_LABELS,
  REPLAY_TV_DECISION_ORDER,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import type { ReplayTvDecision } from '@/features/decision-replay-tv/types/replay-tv.types';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';

interface ReplayTvDecisionChooserProps {
  onChoose: (decision: ReplayTvDecision) => void;
  disabled?: boolean;
  choices?: ReplayTvDecision[];
}

export function ReplayTvDecisionChooser({
  onChoose,
  disabled,
  choices,
}: ReplayTvDecisionChooserProps) {
  const order = choices?.length
    ? REPLAY_TV_DECISION_ORDER.filter((d) => choices.includes(d))
    : REPLAY_TV_DECISION_ORDER;

  return (
    <View className="gap-2" testID="replay-tv-decision-chooser">
      <Text variant="caption" className="text-text-tertiary">
        Process decisions only — never a buy/sell instruction.
      </Text>
      {order.map((decision) => (
        <Button
          key={decision}
          variant={
            decision === 'protect_attention' || decision === 'wait' || decision === 'skip'
              ? 'secondary'
              : 'primary'
          }
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
