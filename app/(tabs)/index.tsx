import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { useAcademy } from '@/features/academy/hooks/useAcademy';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { DevelopmentHistoryCard } from '@/features/learner-model';
import { TodaysTrainingCard } from '@/features/learning-engine/components/TodaysTrainingCard';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { HomePersonalizationSections } from '@/features/training-planner/components/HomePersonalizationSections';
import { composeHomePersonalization } from '@/features/training-planner/services/home-personalization.service';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { FilterChip } from '@/shared/components/ui/FilterChip';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

const BEGINNER = new Set(['completely_new', 'beginner']);

export default function HomeScreen() {
  const router = useRouter();
  const { completedCount, practicedCount } = useAcademy();
  const { profile } = useCoachProfile();
  const { today, plan, learner, snapshot, skip, defer, bookmark, openItem, isBookmarked, sessionLength, setSessionLength } =
    useLearningEngine();
  const home = useMemo(
    () => composeHomePersonalization({ plan, learner, snapshot }),
    [learner, plan, snapshot],
  );
  const noAcademyProgress = completedCount === 0 && practicedCount === 0;
  const beginner = !profile.experience || BEGINNER.has(profile.experience);

  return (
    <ScreenScaffold
      eyebrow={BRAND.product}
      title="Your training center"
      subtitle="What to train now, why, and what to revisit. Not a market terminal."
      contentClassName="pb-12"
      testID="home-screen"
    >
      <View className="gap-4">
        <EducationalModeBadge />

        {noAcademyProgress && today.emptyState !== 'new_user' ? (
          <Surface testID="home-continue-learning">
            <Text variant="label" className="text-text-tertiary">
              Where to start
            </Text>
            <Text variant="h3" headingLevel={3} className="mt-2">
              Start with the Foundations path
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Literacy, risk, and simple charts first. Events stay a small learning calendar, not a news feed.
            </Text>
            <Button
              className="mt-3"
              size="sm"
              onPress={() => router.push('/academy/path/path-foundations' as never)}
            >
              Start Learning
            </Button>
          </Surface>
        ) : null}

        <View className="flex-row flex-wrap gap-2" testID="home-session-length">
          {(['quick', 'normal', 'deep'] as const).map((length) => (
            <FilterChip
              key={length}
              label={length === 'quick' ? 'Quick session' : length === 'deep' ? 'Deep session' : 'Normal session'}
              selected={sessionLength === length}
              onPress={() => setSessionLength(length)}
              accessibilityLabel={`${length} training session`}
            />
          ))}
        </View>

        <TodaysTrainingCard
          plan={today}
          primary={home.primary}
          whyThis={home.whyThis}
          nextStepCaption={home.nextStep && home.nextStep.title !== home.todayTitle ? home.nextStep.title : undefined}
          onSkip={skip}
          onDefer={defer}
          onBookmark={bookmark}
          onOpen={openItem}
          isBookmarked={isBookmarked}
        />

        <HomePersonalizationSections home={home} />

        <DevelopmentHistoryCard history={learner.developmentHistory} />

        <CollapsibleSection
          title="More training"
          description="Review and readiness — after the next practice."
          defaultExpanded={false}
        >
          <Surface testID="home-recent-decision">
            <Text variant="label" className="text-text-tertiary">
              Review
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Grade the reasoning, not the paper result.
            </Text>
            <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push('/review' as never)}>
              Open Review
            </Button>
          </Surface>
          {!beginner ? (
            <Surface className="mt-3" testID="home-simulation-link">
              <Text variant="label" className="text-text-tertiary">
                Simulation
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Paper decisions for process practice. Simulated P/L does not grade a decision.
              </Text>
              <Button className="mt-3" size="sm" variant="ghost" onPress={() => router.push('/simulate' as never)}>
                Open simulation
              </Button>
            </Surface>
          ) : null}
          <Surface tone="subtle" className="mt-3" testID="home-progress">
            <View className="flex-row flex-wrap gap-2">
              <Button size="sm" variant="ghost" onPress={() => router.push('/readiness' as never)}>
                Training readiness
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push('/you' as never)}>
                You
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push('/ai' as never)}>
                Ask
              </Button>
            </View>
          </Surface>
        </CollapsibleSection>
      </View>
    </ScreenScaffold>
  );
}
