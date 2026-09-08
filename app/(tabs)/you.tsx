import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { useAcademy } from '@/features/academy/hooks/useAcademy';
import { IA_GLOSSARY, YOU_HUB_SECTIONS } from '@/features/navigation/config/navigation-ia.config';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { HubPathList } from '@/shared/components/patterns/HubPathList';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

const PROFILE = YOU_HUB_SECTIONS.filter((section) => section.title === 'Profile');
const PROGRESS = YOU_HUB_SECTIONS.filter((section) => section.title === 'Progress');
const ACCOUNT = YOU_HUB_SECTIONS.filter((section) => section.title === 'Account');

export default function YouScreen() {
  const router = useRouter();
  const { completedCount, practicedCount } = useAcademy();
  const { mentorSetupCompleted, profile } = useCoachProfile();

  return (
    <ScreenScaffold
      eyebrow={IA_GLOSSARY.you}
      title="Profile, progress, account"
      subtitle={`${BRAND.product} is education and simulated practice — not a brokerage.`}
      contentClassName="pb-12"
      testID="you-screen"
    >
      <View className="gap-4">
        <Surface tone="accent" emphasis="outlined" testID="you-progress-snapshot">
          <Text variant="label" className="text-text-tertiary">
            Progress
          </Text>
          <Text variant="h2" headingLevel={2} className="mt-2">
            {completedCount === 0 && practicedCount === 0
              ? 'Start with the Foundations path'
              : `${completedCount} lessons read · ${practicedCount} practised`}
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {profile?.learningProfileLabel
              ? `${profile.learningProfileLabel}. Ask is the educational mentor — it does not give buy/sell calls.`
              : 'Set a learning profile so Academy and Practice can start in the right place.'}
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button
              size="sm"
              onPress={() =>
                router.push(
                  completedCount === 0
                    ? ('/academy/path/path-foundations' as never)
                    : ('/learn' as never),
                )
              }
            >
              {completedCount === 0 ? 'Start Learning' : 'Continue learning'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => router.push('/onboarding' as never)}
            >
              {mentorSetupCompleted ? 'Edit learning profile' : 'Set learning profile'}
            </Button>
          </View>
        </Surface>

        <CollapsibleSection title="Profile" description="Who you are in this app — not KYC." defaultExpanded>
          <HubPathList sections={PROFILE} emphasizeFirst />
        </CollapsibleSection>
        <CollapsibleSection title="Progress" description="Academy, passport, and Trading DNA.">
          <HubPathList sections={PROGRESS} emphasizeFirst={false} />
        </CollapsibleSection>
        <CollapsibleSection
          title="Account"
          description="Settings, subscription, privacy, and data management."
        >
          <HubPathList sections={ACCOUNT} emphasizeFirst={false} />
        </CollapsibleSection>

        <LoopCtaRow title="Back to the loop" />
      </View>
    </ScreenScaffold>
  );
}
