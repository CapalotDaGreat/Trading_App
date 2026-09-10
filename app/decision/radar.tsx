import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { FocusAreaList } from '@/features/learning-engine/components/FocusAreaList';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { useMarketEvents } from '@/features/events/hooks/useMarketEvents';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

/** Training recommendations — ranked by skill gaps, not potential profit. */
export default function TrainingRadarScreen() {
  const router = useRouter();
  const { today } = useLearningEngine();
  const { briefing } = useMarketEvents();
  const primary = today.items[0];

  return (
    <ScreenScaffold
      title="Training recommendations"
      subtitle="What your record says to practice next. Not a list of trades."
      showBack
      contentClassName="pb-12"
      testID="training-radar-screen"
    >
      <View className="gap-4">
        {primary ? (
          <Surface tone="accent" emphasis="outlined">
            <Text variant="label" className="text-accent">
              Next practice
            </Text>
            <Text variant="h3" headingLevel={3} className="mt-2">
              {primary.title}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {primary.reason}
            </Text>
            <Button className="mt-3" size="sm" onPress={() => router.push(primary.href as never)}>
              Open
            </Button>
          </Surface>
        ) : (
          <Surface>
            <Text variant="h3" headingLevel={3}>
              Start with Foundations
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              There is not enough demonstrated work yet to rank a training need.
            </Text>
            <Button className="mt-3" size="sm" onPress={() => router.push('/learn' as never)}>
              Open Learn
            </Button>
          </Surface>
        )}

        {today.focusAreas.length > 0 ? <FocusAreaList areas={today.focusAreas} /> : null}

        {briefing ? (
          <Surface>
            <Text variant="label" className="text-text-tertiary">
              Event context
            </Text>
            <Text variant="h3" headingLevel={3} className="mt-2">
              {briefing.title}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {briefing.whyMarketsMayCare} Preparation, not a trade instruction.
            </Text>
            <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push('/events' as never)}>
              Open Events
            </Button>
          </Surface>
        ) : null}

        <Surface>
          <Text variant="label" className="text-text-tertiary">
            Historical room
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Replay a bounded tape. Outcome is not the grade.
          </Text>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onPress={() => router.push('/decision/replay-tv' as never)}
          >
            Open Replay
          </Button>
        </Surface>

        <Surface>
          <Text variant="label" className="text-text-tertiary">
            Uncertain paper path
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Simulated P/L is context, not a score.
          </Text>
          <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push('/simulate?start=1' as never)}>
            Open Simulation
          </Button>
        </Surface>
      </View>
    </ScreenScaffold>
  );
}
