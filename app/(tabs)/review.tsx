import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { NextLessonCard } from '@/features/academy/components/CurriculumCards';
import { useNextAcademyLesson } from '@/features/academy/hooks/useAcademy';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { TrainingHandoffBanner } from '@/features/learning-engine/components/TrainingHandoffBanner';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { useReplayTvStore } from '@/features/decision-replay-tv/stores/replay-tv.store';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import {
  IA_GLOSSARY,
  REVIEW_HUB_SECTIONS,
  type NavigationHubSection,
} from '@/features/navigation/config/navigation-ia.config';
import { usePersonalIntelligence } from '@/features/personal-intelligence/hooks/usePersonalIntelligence';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { HubPathList } from '@/shared/components/patterns/HubPathList';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatPrice } from '@/shared/utils/format';

const WORK = REVIEW_HUB_SECTIONS.filter((section) => section.title === 'Your work');
const PATTERNS = REVIEW_HUB_SECTIONS.filter((section) => section.title === 'Patterns');
const REPLAY = REVIEW_HUB_SECTIONS.filter((section) => section.title === 'Replay');

export default function ReviewScreen() {
  const router = useRouter();
  const { recommendation } = useNextAcademyLesson();
  const { today } = useLearningEngine();
  const focus = today.focusAreas[0];
  const { entries } = useJournal();
  const { records, summary } = useDecisionLog();
  const { account, archives } = useSimulation();
  const intelligence = usePersonalIntelligence();
  const replayProgress = useReplayTvStore((state) => state.progress);
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const recentJournal = entries[0];
  const recentDecision = records?.length ? records[records.length - 1] : undefined;
  const lastSimClose = account?.decisions?.slice().reverse().find((item) => item.closedAt);
  const dnaHeadline =
    intelligence.data?.today.headline ?? intelligence.data?.mentorSummary?.becomingLabel;
  const missId = attempts.filter((item) => !item.correct).at(-1)?.drillId;
  const missTitle = PRACTICE_DRILLS.find((drill) => drill.id === missId)?.title;
  const hasAnyReviewWork =
    entries.length > 0 || (records?.length ?? 0) > 0 || Boolean(account) || replayProgress.completedEpisodeIds.length > 0;

  return (
    <ScreenScaffold
      eyebrow={IA_GLOSSARY.review}
      title="What am I learning about my own decision-making?"
      subtitle="Grade reasoning, risk, and plan adherence — not simulated profit."
      contentClassName="pb-12"
      testID="review-screen"
    >
      <TrainingHandoffBanner />
      <Surface tone="accent" emphasis="outlined" testID="review-insight-hero">
        <Text variant="label" className="text-accent">
          Your evidence
        </Text>
        <Text variant="h2" headingLevel={2} className="mt-2">
          {hasAnyReviewWork
            ? dnaHeadline ??
              summary?.insight ??
              'Review the last decision, then name what you would repeat.'
            : 'Your decisions will appear here'}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {hasAnyReviewWork
            ? `${entries.length} journal note${entries.length === 1 ? '' : 's'} · ${summary?.journaled ?? 0} logged as journaled · ${replayProgress.completedEpisodeIds.length} replay${replayProgress.completedEpisodeIds.length === 1 ? '' : 's'} completed.`
            : 'Journal, simulation history, and replay results become coaching only after you record a decision.'}
        </Text>
        {!hasAnyReviewWork ? (
          <Button className="mt-3" size="sm" onPress={() => router.push('/journal' as never)}>
            Make Your First Decision
          </Button>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Button size="sm" onPress={() => router.push('/journal' as never)}>
              Journal
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => router.push((focus?.href ?? '/learn') as never)}
            >
              {focus ? 'Practice the area to improve' : 'Improve with a lesson'}
            </Button>
          </View>
        )}
      </Surface>

      {focus ? (
        <Surface className="mt-4" testID="review-learn-next">
          <Text variant="label" className="text-text-tertiary">
            From your recent work
          </Text>
          <Text variant="h3" headingLevel={3} className="mt-2">
            {focus.title}
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {focus.explanation}
          </Text>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Evidence: {focus.evidence[0]}
          </Text>
          <Button className="mt-3" size="sm" onPress={() => router.push(focus.href as never)}>
            Practice this next
          </Button>
          {recommendation ? (
            <Button className="mt-2" size="sm" variant="ghost" onPress={() => router.push('/learn' as never)}>
              Or continue the curriculum
            </Button>
          ) : null}
        </Surface>
      ) : recommendation ? (
        <Surface className="mt-4" testID="review-learn-next">
          <Text variant="label" className="text-text-tertiary">
            Recommended next lesson
          </Text>
          <View className="mt-3">
            <NextLessonCard recommendation={recommendation} />
          </View>
        </Surface>
      ) : null}

      <Surface className="mt-4" testID="review-questions">
        <Text variant="label" className="text-text-tertiary">
          Review questions
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          What happened? What did you believe? What evidence did you have? What risk did you take?
          What could you improve?
        </Text>
        <Text variant="caption" className="mt-2 text-text-tertiary">
          Simulated P/L is context for those answers — not the grade.
        </Text>
      </Surface>

      <Surface className="mt-4" testID="review-journal">
        <Text variant="label" className="text-text-tertiary">
          Journal
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
            title="Your decisions will appear here"
            description="A short note on thesis, invalidation, and what you would change is enough."
            actionLabel="Make Your First Decision"
            onAction={() => router.push('/journal' as never)}
            className="px-2 py-6"
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

      <Surface className="mt-4" testID="review-simulation-history">
        <Text variant="label" className="text-text-tertiary">
          Simulation history
        </Text>
        {account ? (
          <>
            <Text variant="h3" headingLevel={3} className="mt-2">
              {formatPrice(account.equity, account.currency)} equity
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {lastSimClose
                ? `Last close: ${lastSimClose.symbol}. Simulated P/L is context, not a grade.`
                : `${archives.length} archived book${archives.length === 1 ? '' : 's'}. Open Simulate to size the next paper position.`}
            </Text>
            <Button className="mt-3" size="sm" variant="ghost" onPress={() => router.push('/simulate' as never)}>
              Open simulation
            </Button>
          </>
        ) : (
          <EmptyState
            title="Start with $100,000 in simulated capital"
            description="Paper trading gives you something to review. It is not a brokerage."
            actionLabel="Start Simulation"
            onAction={() => router.push('/simulate' as never)}
            className="px-2 py-6"
          />
        )}
      </Surface>

      <Surface className="mt-4" testID="review-replay-results">
        <Text variant="label" className="text-text-tertiary">
          Replay results
        </Text>
        {replayProgress.completedEpisodeIds.length > 0 ? (
          <>
            <Text variant="h3" headingLevel={3} className="mt-2">
              {replayProgress.completedEpisodeIds.length} session
              {replayProgress.completedEpisodeIds.length === 1 ? '' : 's'} completed
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Streak {replayProgress.streakDays}d. Outcome is one chapter, not the grade.
            </Text>
            <Button
              className="mt-3"
              size="sm"
              variant="ghost"
              onPress={() => router.push('/decision/replay-tv' as never)}
            >
              Continue replay
            </Button>
          </>
        ) : (
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Historical rooms live under Practice. Completing one adds a process note here.
          </Text>
        )}
        {missTitle ? (
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Latest practice miss: {missTitle}
          </Text>
        ) : null}
      </Surface>

      <CollapsibleSection
        title="Trading DNA & Personal Intelligence"
        description="Patterns only from records you kept."
        defaultExpanded={Boolean(dnaHeadline)}
        className="mt-4"
      >
        <HubPathList sections={PATTERNS as readonly NavigationHubSection[]} emphasizeFirst={false} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Your work"
        description="Journal, simulated ledger, and process tape."
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

      <LoopCtaRow current="review" title="Improve next" />
    </ScreenScaffold>
  );
}
