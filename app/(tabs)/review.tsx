import { useRouter } from 'expo-router';

import {
  IA_GLOSSARY,
  REVIEW_HUB_SECTIONS,
  type NavigationHubSection,
} from '@/features/navigation/config/navigation-ia.config';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { HubPathList } from '@/shared/components/patterns/HubPathList';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

const CONTINUE_SECTION = REVIEW_HUB_SECTIONS.find((section) => section.title === 'Continue')!;
const REFLECT_SECTION = REVIEW_HUB_SECTIONS.find((section) => section.title === 'Reflect')!;
const PRACTICE_SECTION = REVIEW_HUB_SECTIONS.find((section) => section.title === 'Practice')!;
const LEARN_SECTION = REVIEW_HUB_SECTIONS.find((section) => section.title === 'Learn')!;

const CONTINUE: readonly NavigationHubSection[] = [CONTINUE_SECTION];
const REFLECT: readonly NavigationHubSection[] = [REFLECT_SECTION];
const PRACTICE: readonly NavigationHubSection[] = [PRACTICE_SECTION];
const LEARNING: readonly NavigationHubSection[] = [LEARN_SECTION];

export default function ReviewScreen() {
  const router = useRouter();
  const continueItem = CONTINUE_SECTION.items[0];

  return (
    <ScreenScaffold
      eyebrow={IA_GLOSSARY.review}
      title="What should improve next?"
      subtitle="Continue with process first, then choose reflection, practice, or learning."
      contentClassName="pb-12"
      testID="review-screen"
    >
      {continueItem ? (
        <Surface
          tone="accent"
          emphasis="outlined"
          interactive
          accessibilityLabel={continueItem.accessibilityLabel}
          onPress={() => router.push(continueItem.href as never)}
          testID="review-continue-hero"
        >
          <Text variant="label" className="text-accent">
            CONTINUE
          </Text>
          <Text variant="h2" headingLevel={2} className="mt-2">
            {continueItem.title}
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {continueItem.description}
          </Text>
        </Surface>
      ) : null}

      <CollapsibleSection
        title="Continue"
        description="Return to your current process review or Replay TV session."
        defaultExpanded
        className="mt-4"
      >
        <HubPathList sections={CONTINUE} emphasizeFirst={false} />
      </CollapsibleSection>
      <CollapsibleSection title="Reflect" description="Turn one decision into an authored lesson.">
        <HubPathList sections={REFLECT} emphasizeFirst={false} />
      </CollapsibleSection>
      <CollapsibleSection
        title="Practice"
        description="Simulator, Chart Replay, Decision Lab, and related drills."
        testID="review-practice-disclosure"
      >
        <HubPathList sections={PRACTICE} emphasizeFirst={false} />
      </CollapsibleSection>
      <CollapsibleSection title="Learn" description="Lessons and deeper process patterns.">
        <HubPathList sections={LEARNING} emphasizeFirst={false} />
      </CollapsibleSection>
    </ScreenScaffold>
  );
}
