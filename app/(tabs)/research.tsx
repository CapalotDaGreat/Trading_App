import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { FocusAreaList } from '@/features/learning-engine/components/FocusAreaList';
import { TodaysTrainingCard } from '@/features/learning-engine/components/TodaysTrainingCard';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { RESEARCH_HUB_SECTIONS } from '@/features/navigation/config/navigation-ia.config';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { HubPathList } from '@/shared/components/patterns/HubPathList';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

/** Secondary educational context — not a live research terminal. */
export default function ResearchScreen() {
  const router = useRouter();
  const { today, skip, defer, bookmark, openItem, isBookmarked } = useLearningEngine();

  return (
    <ScreenScaffold
      eyebrow="Educational context"
      title="Choose what to study next"
      subtitle="Connect a concept, event, or asset study to your next practice. This is not a scanner."
      contentClassName="pb-12 pt-2"
      testID="research-screen"
    >
      <View className="gap-4">
        <TodaysTrainingCard
          plan={today}
          onSkip={skip}
          onDefer={defer}
          onBookmark={bookmark}
          onOpen={openItem}
          isBookmarked={isBookmarked}
        />

        {today.focusAreas.length > 0 ? <FocusAreaList areas={today.focusAreas} /> : null}

        <Surface>
          <Text variant="label" className="text-text-tertiary">
            Find a name or a concept
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Open a chart to ask what it can teach — then a lesson, a drill, or a paper path.
          </Text>
          <Button className="mt-3" size="sm" onPress={() => router.push('/search' as never)}>
            Search
          </Button>
        </Surface>

        <CollapsibleSection
          title="Explore and context"
          description="Events, names to study, market condition, and paper risk."
          testID="research-context-disclosure"
          defaultExpanded
        >
          <HubPathList sections={RESEARCH_HUB_SECTIONS} />
        </CollapsibleSection>
      </View>
    </ScreenScaffold>
  );
}
