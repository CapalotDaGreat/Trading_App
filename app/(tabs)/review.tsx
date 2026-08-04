import { IA_GLOSSARY, REVIEW_HUB_SECTIONS } from '@/features/navigation/config/navigation-ia.config';
import { Screen } from '@/shared/components/layout/Screen';
import { ScreenQuestion } from '@/shared/components/layout/ScreenQuestion';
import { HubPathList } from '@/shared/components/patterns/HubPathList';

export default function ReviewScreen() {
  return (
    <Screen scrollable contentClassName="pb-12 pt-2" accessibilityTitle="Review">
      <ScreenQuestion
        eyebrow={IA_GLOSSARY.review}
        question="What should improve next?"
        support="Process first. Practice tools stay one step deeper."
      />
      <HubPathList sections={REVIEW_HUB_SECTIONS} />
    </Screen>
  );
}
