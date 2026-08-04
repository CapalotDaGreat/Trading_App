import { IA_GLOSSARY, YOU_HUB_SECTIONS } from '@/features/navigation/config/navigation-ia.config';
import { Screen } from '@/shared/components/layout/Screen';
import { ScreenQuestion } from '@/shared/components/layout/ScreenQuestion';
import { HubPathList } from '@/shared/components/patterns/HubPathList';

export default function YouScreen() {
  return (
    <Screen scrollable contentClassName="pb-12 pt-2" accessibilityTitle="You">
      <ScreenQuestion
        eyebrow={IA_GLOSSARY.you}
        question="Who are you becoming?"
        support="Growth first. Desk and account stay quiet until you need them."
      />
      <HubPathList sections={YOU_HUB_SECTIONS} emphasizeFirst />
    </Screen>
  );
}
