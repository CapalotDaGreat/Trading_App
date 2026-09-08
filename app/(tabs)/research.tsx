import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';

import { ResearchQueueCard } from '@/features/decision/components/ResearchQueueCard';
import { useDecisionBrief } from '@/features/decision/hooks/useDecision';
import { selectTodayTimeBudget } from '@/features/decision/services/today-sections.service';
import type { ResearchQueueItem } from '@/features/decision/types/decision.types';
import { RESEARCH_HUB_SECTIONS } from '@/features/navigation/config/navigation-ia.config';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { HubPathList } from '@/shared/components/patterns/HubPathList';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useTheme } from '@/shared/hooks/useTheme';
import { CALM_ATTENTION } from '@/shared/constants/trust-language';
import { useSettingsStore } from '@/shared/stores/settings.store';

type ResearchGroup = {
  key: 'now' | 'watch' | 'low';
  eyebrow: string;
  title: string;
  description: string;
  items: ResearchQueueItem[];
  freeItemLimit: number;
};

export default function ResearchScreen() {
  const { colors } = useTheme();
  const timeBudgetMinutes = useSettingsStore(selectTodayTimeBudget);
  const briefQuery = useDecisionBrief(timeBudgetMinutes);
  const brief = briefQuery.data;

  const groups = useMemo<ResearchGroup[]>(() => {
    const queue = brief?.researchQueue ?? [];
    const definitions = [
      {
        key: 'now' as const,
        eyebrow: 'Your focus',
        title: 'Best fit for this session',
        description: `Fits your ${timeBudgetMinutes}-minute research budget and current context.`,
        accepts: (item: ResearchQueueItem) => item.priority === 'high',
      },
      {
        key: 'watch' as const,
        eyebrow: 'Worth watching',
        title: 'Keep context, spend time later',
        description: 'Useful evidence is present, but the case is not the strongest use of this session.',
        accepts: (item: ResearchQueueItem) => item.priority === 'medium' || !item.priority,
      },
      {
        key: 'low' as const,
        eyebrow: 'Low priority',
        title: 'Safe to defer',
        description: 'Lower research value or weaker fit with your available time and context.',
        accepts: (item: ResearchQueueItem) => item.priority === 'low',
      },
    ];

    return definitions
      .map((definition) => {
        const indexed = queue
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => definition.accepts(item));
        return {
          ...definition,
          items: indexed.map(({ item }) => item),
          freeItemLimit: indexed.filter(({ index }) => index < 3).length,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [brief?.researchQueue, timeBudgetMinutes]);

  return (
    <ScreenScaffold
      eyebrow="Educational research"
      title="Study a name, not a live terminal"
      subtitle="Charts and queues here are for learning. They are not brokerage quotes or buy/sell signals."
      contentClassName="pb-12 pt-2"
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={briefQuery.isRefetching}
            onRefresh={() => void briefQuery.refetch()}
            tintColor={colors.accent.primary}
          />
        ),
      }}
      testID="research-screen"
    >
      <View className="gap-4">
        {briefQuery.isLoading && !brief ? (
          <>
            <Skeleton height={150} rounded="lg" />
            <Skeleton height={120} rounded="lg" />
          </>
        ) : null}

        {!briefQuery.isLoading && briefQuery.isError && !brief ? (
          <StatusState
            status="error"
            title="Research queue unavailable"
            description="The ranked list could not load. Nothing was invented in its place."
            actionLabel="Retry"
            onAction={() => void briefQuery.refetch()}
          />
        ) : null}

        {brief && groups.length === 0 ? (
          <StatusState
            status="empty"
            title={CALM_ATTENTION.nothingRequiresAttention}
            description={CALM_ATTENTION.nothingRequiresAttentionDetail}
            actionLabel="Refresh"
            onAction={() => void briefQuery.refetch()}
          />
        ) : null}

        {groups.map((group, index) => {
          const isPrimary = index === 0;
          const card = (
            <ResearchQueueCard
              queue={group.items}
              regime={brief?.regimeLabel ?? 'Unknown'}
              freeItemLimit={group.freeItemLimit}
              eyebrow={isPrimary ? group.eyebrow : ''}
              title={isPrimary ? group.title : ''}
              description={isPrimary ? group.description : ''}
            />
          );
          if (isPrimary) {
            return <View key={group.key}>{card}</View>;
          }
          return (
            <CollapsibleSection
              key={group.key}
              title={`${group.eyebrow} · ${group.items.length}`}
              description={group.description}
              defaultExpanded={false}
            >
              {card}
            </CollapsibleSection>
          );
        })}

        <CollapsibleSection
          title="Explore and context"
          description="Markets, regime, risk, and supporting research routes."
          testID="research-context-disclosure"
        >
          <HubPathList sections={RESEARCH_HUB_SECTIONS} />
        </CollapsibleSection>
      </View>
    </ScreenScaffold>
  );
}
