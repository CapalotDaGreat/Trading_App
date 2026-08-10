import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { useTradingMentor } from '@/features/decision/hooks/useTradingMentor';
import { IA_GLOSSARY, YOU_HUB_SECTIONS } from '@/features/navigation/config/navigation-ia.config';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { HubPathList } from '@/shared/components/patterns/HubPathList';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

const GROWTH = YOU_HUB_SECTIONS.filter((section) => section.title === 'Growth');
const DESK = YOU_HUB_SECTIONS.filter((section) => section.title === 'Desk');
const ACCOUNT = YOU_HUB_SECTIONS.filter((section) => section.title === 'Account');

export default function YouScreen() {
  const router = useRouter();
  const mentorQuery = useTradingMentor();
  const { mentorSetupCompleted } = useCoachProfile();
  const priority = mentorQuery.data?.daily.todaysFocus ?? mentorQuery.data?.daily.headline;
  const pattern = mentorQuery.data?.daily.repeatingMistake;
  const exercise =
    mentorQuery.data?.weekly.academyRecommendation?.title ??
    mentorQuery.data?.weekly.replayRecommendation.label;

  return (
    <ScreenScaffold
      eyebrow={IA_GLOSSARY.you}
      title="Who are you becoming?"
      subtitle="Growth first. Desk and account stay quiet until you need them."
      contentClassName="pb-12"
      testID="you-screen"
    >
      <View className="gap-4">
        <Surface tone="accent" emphasis="outlined" testID="you-growth-priority">
          <Text variant="label" className="text-accent">
            GROWTH PRIORITY
          </Text>
          <Text variant="h2" headingLevel={2} className="mt-2">
            {priority ?? 'Open Mentor to set one coaching priority'}
          </Text>
          {pattern ? (
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Repeated pattern: {pattern}
            </Text>
          ) : null}
          {exercise ? (
            <Text variant="caption" className="mt-2 text-text-tertiary">
              Practice next: {exercise}
            </Text>
          ) : null}
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button size="sm" onPress={() => router.push('/decision/mentor' as never)}>
              Open Mentor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => router.push('/onboarding' as never)}
            >
              {mentorSetupCompleted ? 'Edit Coach Profile' : 'Set up Coach Profile'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => router.push('/ai?source=you' as never)}
            >
              Ask
            </Button>
          </View>
        </Surface>

        <CollapsibleSection title="Growth" description="Mentor, DNA, passport, and lessons." defaultExpanded>
          <HubPathList sections={GROWTH} emphasizeFirst />
        </CollapsibleSection>
        <CollapsibleSection title="Desk" description="Portfolio, alerts, and calendar.">
          <HubPathList sections={DESK} emphasizeFirst={false} />
        </CollapsibleSection>
        <CollapsibleSection title="Account" description="Settings and subscription.">
          <HubPathList sections={ACCOUNT} emphasizeFirst={false} />
        </CollapsibleSection>
      </View>
    </ScreenScaffold>
  );
}
