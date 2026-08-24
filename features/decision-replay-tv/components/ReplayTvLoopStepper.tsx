import { View } from 'react-native';

import {
  REPLAY_TV_LOOP_STEPS,
  replayTvLoopLabel,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import type { ReplayTvPhase } from '@/features/decision-replay-tv/types/replay-tv.types';
import { Text } from '@/shared/components/ui/Text';

export function ReplayTvLoopStepper({ phase }: { phase: ReplayTvPhase }) {
  const current = replayTvLoopLabel(phase);
  const index = Math.max(
    0,
    REPLAY_TV_LOOP_STEPS.findIndex((step) => step.phase === phase),
  );

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Replay TV step ${index + 1} of ${REPLAY_TV_LOOP_STEPS.length}: ${current}`}
      testID="replay-tv-loop-stepper"
    >
      <Text variant="caption" className="text-text-tertiary">
        {index + 1}/{REPLAY_TV_LOOP_STEPS.length} · {current}
      </Text>
    </View>
  );
}
