import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { PlannerNextCard } from '@/features/training-planner/components/PlannerNextCard';
import { ReviewProcessBrief } from '@/features/training-planner/components/ReviewProcessBrief';
import { composeReviewBrief } from '@/features/training-planner/services/review-brief.service';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { TrainingHandoffBanner } from '@/features/learning-engine/components/TrainingHandoffBanner';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EMPTY_REPLAY_TV_PROGRESS, useReplayTvStore } from '@/features/decision-replay-tv/stores/replay-tv.store';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import {
  IA_GLOSSARY,
  REVIEW_HUB_SECTIONS,
  type NavigationHubSection,
} from '@/features/navigation/config/navigation-ia.config';
import { MistakeLibraryCard } from '@/features/mistake-library';
import { DevelopmentHistoryCard } from '@/features/learner-model';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { scoreSimulationProcess } from '@/features/simulation/services/scenario-process.service';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { HubPathList } from '@/shared/components/patterns/HubPathList';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { DEMO_USER_UID } from '@/firebase/config';
import { formatPrice } from '@/shared/utils/format';

const WORK = REVIEW_HUB_SECTIONS.filter((section) => section.title === 'Your work');
const PATTERNS = REVIEW_HUB_SECTIONS.filter((section) => section.title === 'Patterns');
const REPLAY = REVIEW_HUB_SECTIONS.filter((section) => section.title === 'Replay');

function usableNote(text?: string | null): boolean {
  return Boolean(text && text.trim().length >= 12);
}

export default function ReviewScreen() {
  const router = useRouter();
  const { plan, learner, primary, openItem, defer } = useLearningEngine();
  const { entries, isError: journalError, refetch: refetchJournal } = useJournal();
  const { records, isError: logError, refetch: refetchLog } = useDecisionLog();
  const { isOnline } = useOnlineStatus();
  const { account, archives } = useSimulation();
  const { user } = useAuth();
  const uid = user?.uid ?? DEMO_USER_UID;
  const replayProgress = useReplayTvStore((state) => state.progressByUser[uid] ?? EMPTY_REPLAY_TV_PROGRESS);
  const recentJournal = entries[0];
  const recentDecision = records?.length ? records[records.length - 1] : undefined;
  const lastSimClose = account?.decisions?.slice().reverse().find((item) => item.closedAt);
  const process = account ? scoreSimulationProcess(account) : undefined;
  const hasAnyReviewWork =
    entries.length > 0 || (records?.length ?? 0) > 0 || Boolean(account) || replayProgress.completedEpisodeIds.length > 0;

  const brief = useMemo(
    () =>
      composeReviewBrief({
        plan,
        learner,
        activity: {
          journal: {
            count: entries.length,
            withUsableNotes: entries.filter((entry) => usableNote(entry.notes) || usableNote(entry.strategy)).length,
            withReflection: entries.filter(
              (entry) => usableNote(entry.lessonsLearned) || usableNote(entry.improvementCommitment),
            ).length,
            withProcessTag: entries.filter((entry) => Boolean(entry.mistakeCategory) && entry.mistakeCategory !== 'other')
              .length,
          },
          simulation: account
            ? {
                decisionCount: account.decisions.length,
                thesisBackedCount: account.decisions.filter((item) => item.thesis.trim().length >= 8).length,
                closeReviewCount: account.decisions.filter((item) => item.closeReview).length,
                processGaps: process?.gaps ?? [],
                processStrengths: process?.strengths ?? [],
                equityLabel: formatPrice(account.equity, account.currency),
              }
            : undefined,
          replayCompletedCount: replayProgress.completedEpisodeIds.length,
        },
      }),
    [account, entries, learner, plan, process?.gaps, process?.strengths, replayProgress.completedEpisodeIds.length],
  );

  return (
    <ScreenScaffold
      eyebrow={IA_GLOSSARY.review}
      title="What did I learn about my decision process?"
      subtitle="Recurring patterns, evidence quality, and the next training step. Simulated P/L is context, not the grade."
      contentClassName="pb-12"
      testID="review-screen"
    >
      <TrainingHandoffBanner />
      {!isOnline ? (
        <Text variant="caption" className="mb-3 text-text-tertiary" testID="review-offline-caption">
          Review uses on-device journal, simulation, and replay. Simulated P/L is not the grade.
        </Text>
      ) : null}
      {(journalError || logError) && hasAnyReviewWork ? (
        <Surface padding="sm" tone="warning" className="mb-3" testID="review-stale-banner">
          <Text variant="label">Some cloud history did not refresh</Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            Showing saved process notes. Retry does not invent live market data.
          </Text>
          <Button
            size="sm"
            className="mt-2 self-start"
            onPress={() => {
              void refetchJournal();
              void refetchLog();
            }}
          >
            Retry
          </Button>
        </Surface>
      ) : null}
      <ReviewProcessBrief brief={brief} />

      {!hasAnyReviewWork ? (
        <Button
          className="mt-4"
          size="sm"
          onPress={() => router.push('/practice' as never)}
          testID="review-empty-cta"
        >
          Complete first practice
        </Button>
      ) : (
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Button size="sm" onPress={() => router.push('/journal' as never)}>
            Journal
          </Button>
        </View>
      )}

      {primary ? (
        <View className="mt-4" testID="review-learn-next">
          <PlannerNextCard
            recommendation={primary}
            onOpen={() => openItem(primary)}
            onDefer={defer}
            eyebrow="Next training"
          />
        </View>
      ) : null}

      <DevelopmentHistoryCard history={learner.developmentHistory} />

      <MistakeLibraryCard library={learner.mistakePatterns} />

      <Surface className="mt-4" testID="review-journal">
        <Text variant="label" className="text-text-tertiary">
          Latest journal
        </Text>
        {recentJournal ? (
          <>
            <Text variant="h3" headingLevel={3} className="mt-2">
              {recentJournal.symbol}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary" numberOfLines={3}>
              {recentJournal.notes}
            </Text>
            <Button className="mt-3" size="sm" variant="ghost" onPress={() => router.push('/journal' as never)}>
              Open journal
            </Button>
          </>
        ) : (
          <EmptyState
            title="No review history yet"
            description="Complete a practice drill or a simulation decision first. Then journal what you noticed."
            actionLabel="Open Practice"
            onAction={() => router.push('/practice' as never)}
            className="px-2 py-6"
            testID="review-empty-history"
          />
        )}
      </Surface>

      <Surface className="mt-4" testID="review-decision-history">
        <Text variant="label" className="text-text-tertiary">
          Decision history
        </Text>
        {recentDecision ? (
          <>
            <Text variant="h3" headingLevel={3} className="mt-2">
              {recentDecision.symbol} · {recentDecision.action.replace(/_/g, ' ')}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {recentDecision.note ?? 'Recorded process event.'}
            </Text>
            <Button
              className="mt-3"
              size="sm"
              variant="ghost"
              onPress={() => router.push('/decision/decision-replay?segment=process' as never)}
            >
              Open process tape
            </Button>
          </>
        ) : (
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Logged, skipped, and simulated actions collect here after you use Learn, Practice, or Simulate.
          </Text>
        )}
      </Surface>

      <CollapsibleSection
        title="Simulated P/L context"
        description="Paper equity is available here. It does not grade the decision."
        defaultExpanded={false}
        className="mt-4"
        testID="review-simulation-history"
      >
        {account ? (
          <Surface>
            <Text variant="body-sm" className="text-text-secondary">
              {formatPrice(account.equity, account.currency)} simulated equity
              {lastSimClose ? ` · last close ${lastSimClose.symbol}` : ` · ${archives.length} archived books`}. Simulated
              P/L is context, not a grade.
            </Text>
            <Button className="mt-3" size="sm" variant="ghost" onPress={() => router.push('/simulate' as never)}>
              Open simulation
            </Button>
          </Surface>
        ) : (
          <EmptyState
            title="Start with $100,000 in simulated capital"
            description="Paper trading gives you something to review. It is not a brokerage."
            actionLabel="Start Simulation"
            onAction={() => router.push('/simulate' as never)}
            iconName="play-circle-outline"
            className="px-2 py-6"
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Process patterns"
        description="Observed decision tendencies from records you kept — not a personality diagnosis."
        defaultExpanded={false}
        className="mt-4"
      >
        <HubPathList sections={PATTERNS as readonly NavigationHubSection[]} emphasizeFirst={false} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Your work"
        description="Journal, simulation history, and process tape."
        defaultExpanded={false}
      >
        <HubPathList sections={WORK as readonly NavigationHubSection[]} emphasizeFirst={false} />
      </CollapsibleSection>
      <CollapsibleSection
        title="Replay rooms"
        description="Historical sessions. Outcome is one chapter, not the grade."
        defaultExpanded={false}
      >
        <HubPathList sections={REPLAY} emphasizeFirst={false} />
      </CollapsibleSection>

      <LoopCtaRow
        current="review"
        title="Improve next"
        plannerNext={
          primary
            ? { label: 'Start next training', href: primary.href }
            : { label: 'Train next', href: '/' }
        }
      />
    </ScreenScaffold>
  );
}
