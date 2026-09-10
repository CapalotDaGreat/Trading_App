import { useRouter } from 'expo-router';
import { View } from 'react-native';

import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import type { PracticeDrill } from '@/features/practice/content/practice-drills';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

interface AssetStudyNextStepsProps {
  symbol: string;
  drills: PracticeDrill[];
  replayEpisodes: ReplayTvEpisode[];
  fromSimulation: boolean;
  hasSimulationAccount: boolean;
  onSaveStudyList: () => void;
}

export function AssetStudyNextSteps({
  symbol,
  drills,
  replayEpisodes,
  fromSimulation,
  hasSimulationAccount,
  onSaveStudyList,
}: AssetStudyNextStepsProps) {
  const router = useRouter();
  const primaryDrill = drills[0];
  const namedReplay = replayEpisodes[0];

  return (
    <View className="gap-4">
      <Surface testID="asset-practice-this-concept">
        <Text variant="label" className="text-text-tertiary">
          Practice this concept
        </Text>
        <Text variant="h3" headingLevel={3} className="mt-1">
          {primaryDrill?.title ?? 'Open a chart drill'}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          Use {symbol.toUpperCase()} as context. A correct answer is the reasoning, not a predicted
          tick.
        </Text>
        {primaryDrill ? (
          <Button
            className="mt-3"
            size="sm"
            onPress={() => router.push(`/practice?drill=${primaryDrill.id}` as never)}
          >
            Practice: {primaryDrill.title}
          </Button>
        ) : (
          <Button className="mt-3" size="sm" onPress={() => router.push('/practice' as never)}>
            Open Practice
          </Button>
        )}
      </Surface>

      <Surface testID="asset-historical-scenario">
        <Text variant="label" className="text-text-tertiary">
          Explore a historical scenario
        </Text>
        {namedReplay ? (
          <>
            <Text variant="h3" headingLevel={3} className="mt-1">
              {namedReplay.title}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {namedReplay.teaser} Outcome does not grade the process alone.
            </Text>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onPress={() =>
                router.push(`/decision/replay-tv?episode=${namedReplay.id}` as never)
              }
            >
              Open this room
            </Button>
          </>
        ) : (
          <>
            <Text variant="h3" headingLevel={3} className="mt-1">
              No named room for {symbol.toUpperCase()}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Replay still has historical tapes that teach the same skills — structure, invalidation,
              and waiting.
            </Text>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onPress={() => router.push('/decision/replay-tv' as never)}
            >
              Browse historical rooms
            </Button>
          </>
        )}
      </Surface>

      <Surface testID="asset-practice-in-simulation">
        <Text variant="label" className="text-text-tertiary">
          Practice in Simulation
        </Text>
        <Text variant="h3" headingLevel={3} className="mt-1">
          {fromSimulation ? 'Return to your paper book' : 'Apply the idea on paper'}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          Simulated fills and P/L do not grade the decision. This is not a broker.
        </Text>
        {fromSimulation ? (
          <Button className="mt-3" size="sm" onPress={() => router.back()}>
            Return to simulation
          </Button>
        ) : (
          <Button
            className="mt-3"
            size="sm"
            onPress={() =>
              router.push((hasSimulationAccount ? '/simulate' : '/simulate?start=1') as never)
            }
          >
            {hasSimulationAccount ? 'Continue simulation' : 'Open a paper path'}
          </Button>
        )}
      </Surface>

      <Surface>
        <Text variant="label" className="text-text-tertiary">
          What a trader would study
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          Name the structure, note participation, write what would invalidate a thesis, and check
          whether an event changes the process. That is study. It is not a reason to buy.
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Button size="sm" variant="outline" onPress={() => router.push('/events' as never)}>
            Market Events
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() =>
              router.push(`/journal?symbol=${encodeURIComponent(symbol)}&from=study` as never)
            }
          >
            Journal what you noticed
          </Button>
          <Button size="sm" variant="ghost" onPress={onSaveStudyList}>
            Save to Study List
          </Button>
        </View>
      </Surface>
    </View>
  );
}
