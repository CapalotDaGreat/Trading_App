import {
  IA_GLOSSARY,
  RESEARCH_HUB_SECTIONS,
} from '@/features/navigation/config/navigation-ia.config';
import { Screen } from '@/shared/components/layout/Screen';
import { ScreenQuestion } from '@/shared/components/layout/ScreenQuestion';
import { HubPathList } from '@/shared/components/patterns/HubPathList';

export default function ResearchScreen() {
  return (
    <Screen scrollable contentClassName="pb-12 pt-2" accessibilityTitle="Research">
      <ScreenQuestion
        eyebrow={IA_GLOSSARY.research}
        question="What deserves your attention?"
        support="Start with the queue. Context tools wait until you need them."
      />
      <HubPathList sections={RESEARCH_HUB_SECTIONS} />
    </Screen>
  );
}
