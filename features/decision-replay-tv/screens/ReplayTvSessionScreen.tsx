import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { ReplayTvCoachCard } from '@/features/decision-replay-tv/components/ReplayTvCoachCard';
import { ReplayTvDecisionChooser } from '@/features/decision-replay-tv/components/ReplayTvDecisionChooser';
import { ReplayTvLoopStepper } from '@/features/decision-replay-tv/components/ReplayTvLoopStepper';
import { ReplayTvReasoningForm, emptyReplayTvReasoning } from '@/features/decision-replay-tv/components/ReplayTvReasoningForm';
import { ReplayTvReportCard } from '@/features/decision-replay-tv/components/ReplayTvReportCard';
import { ReplayTvSkillProgressCard } from '@/features/decision-replay-tv/components/ReplayTvSkillProgressCard';
import { useReplayTv } from '@/features/decision-replay-tv/hooks/useReplayTv';
import { deriveReplayTvSkillProgress } from '@/features/decision-replay-tv/services/replay-tv-skills.service';
import {
  REPLAY_TV_DECISION_LABELS,
  replayTvLoopLabel,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import type { ReplayTvDecision, ReplayTvReasoning } from '@/features/decision-replay-tv/types/replay-tv.types';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { RecoverableErrorState } from '@/shared/components/feedback/RecoverableErrorState';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { AccessibleChartFrame } from '@/shared/components/charts/AccessibleChartFrame';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { announceForAccessibility } from '@/shared/utils/accessibility';

export function ReplayTvSessionScreen() {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const { isOnline } = useOnlineStatus();
  const {
    activeSession,
    episode,
    visibleCandles,
    visibleNews,
    blindView,
    progress,
    advancePhase,
    restartEpisode,
    updateChecklist,
    submitDecision,
    updateDraftReasoning,
    finishSession,
    isFinishing,
    finishError,
    saveReflectionToJournal,
    isSavingJournal,
    journalSaved,
    journalError,
    nextPractice,
    clearActive,
  } = useReplayTv();
  const [reasoning, setReasoning] = useState<ReplayTvReasoning>(() => emptyReplayTvReasoning());

  useEffect(() => {
    if (!activeSession) {
      router.replace('/decision/replay-tv' as never);
    }
  }, [activeSession, router]);

  useEffect(() => {
    if (activeSession?.draftReasoning) {
      setReasoning(activeSession.draftReasoning);
    }
  }, [activeSession?.id, activeSession?.checkpointIndex]);

  useEffect(() => {
    if (!activeSession) return;
    announceForAccessibility(
      `${replayTvLoopLabel(activeSession.phase)}. Future market information stays hidden until you commit.`,
    );
  }, [activeSession?.phase]);

  if (!activeSession) {
    return (
      <ScreenScaffold title="Decision Replay TV" scrollable={false} contentClassName="justify-center">
        <StatusState
          status="loading"
          title="Restoring episode"
          description="Reloading the freeze. Future bars stay hidden."
        />
      </ScreenScaffold>
    );
  }

  if (!episode || !blindView) {
    return (
      <ScreenScaffold title="Decision Replay TV" showBack contentClassName="pb-12">
        <StatusState
          status="error"
          title="This room is unavailable"
          description="The episode could not be restored. Nothing from a hidden path was shown."
          actionLabel="Back to Replay TV"
          onAction={() => {
            clearActive();
            router.replace('/decision/replay-tv' as never);
          }}
        />
      </ScreenScaffold>
    );
  }

  const phase = activeSession.phase;
  const checkpoint = episode.checkpoints[activeSession.checkpointIndex];
  const showChart =
    phase === 'watching' ||
    phase === 'reasoning' ||
    phase === 'decision' ||
    phase === 'mentor' ||
    phase === 'reveal' ||
    phase === 'coaching' ||
    phase === 'complete' ||
    phase === 'skill';
  const blind =
    !activeSession.revealed &&
    phase !== 'reveal' &&
    phase !== 'coaching' &&
    phase !== 'complete' &&
    phase !== 'skill';
  const resumed = phase !== 'intro' && activeSession.fullCandles.length > 0;
  const skills = deriveReplayTvSkillProgress(progress);

  const persistReasoning = (next: ReplayTvReasoning) => {
    setReasoning(next);
    updateDraftReasoning(next);
  };

  const onChoose = (decision: ReplayTvDecision) => {
    submitDecision(decision, '', reasoning);
    setReasoning(emptyReplayTvReasoning());
  };

  const onFinish = async () => {
    try {
      await finishSession();
      advancePhase();
    } catch {
      // finishError renders below
    }
  };

  const onExit = () => {
    clearActive();
    router.replace('/decision/replay-tv' as never);
  };

  const onRestart = () => {
    restartEpisode();
    setReasoning(emptyReplayTvReasoning());
  };

  return (
    <ScreenScaffold
      eyebrow="Decision Replay TV"
      title={episode.title}
      subtitle={
        blind
          ? 'Future candles hidden · no hindsight'
          : 'Historical path revealed · process scored only'
      }
      showBack
      contentClassName="pb-12"
      testID="replay-tv-session"
    >
      <View className="gap-4">
        <ReplayTvLoopStepper phase={phase} />

        {!isOnline ? (
          <Text variant="caption" className="text-text-tertiary">
            This room works offline. Educational sample data is already on the device.
          </Text>
        ) : null}

        {resumed ? (
          <Text variant="caption" className="text-text-tertiary" testID="replay-tv-resume-banner">
            Resumed at freeze {activeSession.checkpointIndex + 1} of {episode.checkpoints.length}.
            The remaining future stays hidden.
          </Text>
        ) : null}

        <View className="flex-row items-center gap-2">
          <DataSourceBadge kind={episode.dataKind} />
          <Text variant="caption" className="flex-1 text-text-tertiary">
            {blindView.provenanceNote}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Button variant="outline" onPress={onRestart} accessibilityLabel="Restart episode">
            Restart
          </Button>
          <Button variant="ghost" onPress={onExit} accessibilityLabel="Exit episode">
            Exit
          </Button>
        </View>

        {phase === 'intro' ? (
          <Surface emphasis="outlined">
            <Text variant="caption" className="font-medium text-text-tertiary">
              Episode
            </Text>
            <Text variant="h3" headingLevel={2} className="mt-2">
              Can you make a good decision without knowing what happens next?
            </Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {blindView.subtitle}. {blindView.teaser}
            </Text>
            <Text variant="caption" className="mt-3 text-text-tertiary">
              {episode.symbolLabel} · {blindView.eraLabel} · {episode.difficulty} · ~
              {episode.durationMinutes} min · {episode.estimatedDecisionCount} pauses
            </Text>
            <Text variant="body-sm" className="mt-3 text-text-tertiary">
              Waiting or skipping is a legitimate expert decision. You will only see information
              that would have been available at each freeze.
            </Text>
            <Button className="mt-4" onPress={advancePhase} accessibilityLabel="Continue to blind context">
              Begin with context
            </Button>
          </Surface>
        ) : null}

        {phase === 'context' ? (
          <Surface emphasis="outlined">
            <Text variant="h3" headingLevel={2}>
              Blind context
            </Text>
            <Text variant="caption" className="mt-1 text-text-tertiary">
              Spoiler-safe · {blindView.eraLabel}
            </Text>
            <View className="mt-3 gap-2">
              {blindView.contextBullets.map((bullet) => (
                <Text key={bullet} variant="body-sm" className="text-text-secondary">
                  • {bullet}
                </Text>
              ))}
            </View>
            <Text variant="caption" className="mt-4 text-text-tertiary">
              Educational sample reconstruction · {episode.dataKind} · not exchange ticks.
            </Text>
            <Button className="mt-4" onPress={advancePhase} accessibilityLabel="Begin research on the blind tape">
              Open the freeze
            </Button>
          </Surface>
        ) : null}

        {showChart ? (
          <Surface padding="none" className="overflow-hidden p-2">
            <AccessibleChartFrame
              title={`${episode.symbol} educational tape`}
              timeRange={
                blind
                  ? `Freeze ${activeSession.checkpointIndex + 1}/${episode.checkpoints.length}`
                  : 'Full educational path'
              }
              source="sample reconstruction"
              freshness="educational · not live"
              summary={
                blind
                  ? `${visibleCandles.length} visible bars. Future path hidden.`
                  : `${activeSession.fullCandles.length} educational bars revealed for review.`
              }
              textualAlternative={
                <Text variant="body-sm" className="text-text-secondary">
                  {blind
                    ? `Blind window. Last close ${visibleCandles[visibleCandles.length - 1]?.close?.toFixed?.(2) ?? 'n/a'}.`
                    : 'Full path visible for teaching review only — scores remain process-only.'}
                </Text>
              }
            >
              <CandlestickChart
                candles={visibleCandles}
                height={layout.isLandscape ? 320 : 260}
                symbol={episode.symbol}
              />
            </AccessibleChartFrame>
          </Surface>
        ) : null}

        {showChart && visibleNews.length > 0 ? (
          <Surface emphasis="outlined">
            <Text variant="label">Available at this freeze</Text>
            <View className="mt-2 gap-2">
              {visibleNews.map((item) => (
                <View key={item.id}>
                  <Text variant="body-sm">{item.headline}</Text>
                  <Text variant="caption" className="text-text-tertiary">
                    {item.detail}
                  </Text>
                </View>
              ))}
            </View>
          </Surface>
        ) : null}

        {phase === 'watching' ? (
          <Surface emphasis="outlined">
            <Text variant="h3" headingLevel={2}>
              Research
            </Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {checkpoint?.prompt ?? 'What would you do with your research time?'}
            </Text>
            {checkpoint?.availableDataNotes?.length ? (
              <View className="mt-3 gap-1">
                {checkpoint.availableDataNotes.map((note) => (
                  <Text key={note} variant="caption" className="text-text-tertiary">
                    • {note}
                  </Text>
                ))}
              </View>
            ) : null}
            <Button className="mt-4" onPress={advancePhase} accessibilityLabel="Continue to reasoning">
              Write your reasoning
            </Button>
          </Surface>
        ) : null}

        {phase === 'reasoning' ? (
          <Surface emphasis="outlined">
            <Text variant="h3" headingLevel={2}>
              Reasoning
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Capture thesis, evidence, invalidation, and uncertainty. Notes stay on-device. Empty
              fields are allowed — doing nothing is a valid decision.
            </Text>
            {checkpoint?.hypothesisPrompt ? (
              <Text variant="caption" className="mt-2 text-text-tertiary">
                {checkpoint.hypothesisPrompt}
              </Text>
            ) : null}
            <View className="mt-4">
              <ReplayTvReasoningForm value={reasoning} onChange={persistReasoning} />
            </View>
            <Button className="mt-4" onPress={advancePhase} accessibilityLabel="Continue to commit a process decision">
              Continue to commit
            </Button>
          </Surface>
        ) : null}

        {phase === 'decision' ? (
          <Surface emphasis="outlined">
            <Text variant="h3" headingLevel={2}>
              Commit
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {checkpoint?.prompt}
            </Text>
            <View className="mt-4 gap-2">
              {(
                [
                  ['namedInvalidation', 'Named invalidation'],
                  ['notedRegime', 'Noted regime'],
                  ['consideredTimeBudget', 'Considered time budget'],
                  ['consideredAlternative', 'Considered an alternative'],
                ] as const
              ).map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => updateChecklist({ [key]: !activeSession.checklist[key] })}
                  className="min-h-11 rounded-lg bg-surface px-3 py-3"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: activeSession.checklist[key] }}
                  accessibilityLabel={label}
                >
                  <Text variant="body-sm">
                    {activeSession.checklist[key] ? 'Checked' : 'Not checked'} · {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-4">
              <ReplayTvDecisionChooser onChoose={onChoose} choices={checkpoint?.choices} />
            </View>
          </Surface>
        ) : null}

        {phase === 'mentor' ? (
          <Surface emphasis="outlined">
            <Text variant="h3" headingLevel={2}>
              Next state
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              The tape moved to the next freeze. Remaining future bars stay hidden. Coaching below
              grades the process you just committed — not the path still unseen.
            </Text>
            {activeSession.lastCoach ? (
              <View className="mt-3">
                <ReplayTvCoachCard note={activeSession.lastCoach} />
              </View>
            ) : (
              <Text variant="body" className="mt-2 text-text-secondary">
                {activeSession.mentorReply}
              </Text>
            )}
            {activeSession.decisions.length > 0 ? (
              <Text variant="caption" className="mt-3 text-text-tertiary">
                You chose{' '}
                {
                  REPLAY_TV_DECISION_LABELS[
                    activeSession.decisions[activeSession.decisions.length - 1]!.decision
                  ]
                }
                .
              </Text>
            ) : null}
            <Button
              className="mt-4"
              onPress={advancePhase}
              accessibilityLabel="Continue the blind replay"
            >
              {activeSession.decisions.length >= episode.checkpoints.length
                ? 'Reveal the historical path'
                : 'Continue research'}
            </Button>
          </Surface>
        ) : null}

        {phase === 'reveal' ? (
          <Surface emphasis="outlined">
            <Text variant="h3" headingLevel={2}>
              Outcome
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              What became visible after you committed. This is not a grade, and it is not proof that
              the process was good or bad.
            </Text>
            <Text variant="body" className="mt-3 text-text-secondary">
              {blindView.historicalOutcome}
            </Text>
            <View className="mt-3 gap-2">
              {blindView.teachingNotes.map((note) => (
                <Text key={note} variant="body-sm" className="text-text-tertiary">
                  • {note}
                </Text>
              ))}
            </View>
            <Button className="mt-4" onPress={advancePhase} accessibilityLabel="Open process coaching">
              Compare the process
            </Button>
          </Surface>
        ) : null}

        {phase === 'coaching' && activeSession.scores ? (
          <View className="gap-4">
            <ReplayTvReportCard scores={activeSession.scores} />
            <Surface emphasis="outlined">
              <Text variant="h3" headingLevel={2}>
                Coaching
              </Text>
              <View className="mt-3">
                <ReplayTvCoachCard
                  note={{
                    noticed: activeSession.scores.processComparison.decided,
                    missed: activeSession.scores.processComparison.missed,
                    changed: activeSession.scores.processComparison.changed,
                    consistency: activeSession.scores.coaching[0] ?? '',
                    invalidationQuestion: activeSession.scores.processComparison.practiceNext,
                    knew: activeSession.scores.processComparison.knew,
                    believed: activeSession.scores.processComparison.decided,
                    ignored: activeSession.scores.processComparison.missed,
                    considered: activeSession.scores.processComparison.didWell,
                    decided: activeSession.scores.processComparison.decided,
                    didWell: activeSession.scores.processComparison.didWell,
                    practiceNext: activeSession.scores.processComparison.practiceNext,
                  }}
                />
              </View>
              {finishError ? (
                <View className="mt-3">
                  <RecoverableErrorState error={finishError} onRetry={() => void onFinish()} />
                </View>
              ) : null}
              <Button
                className="mt-4"
                loading={isFinishing}
                disabled={isFinishing}
                onPress={() => void onFinish()}
              >
                Save process to Decision Log
              </Button>
            </Surface>
          </View>
        ) : null}

        {phase === 'complete' && activeSession.scores ? (
          <Surface emphasis="outlined">
            <Text variant="h3" headingLevel={2}>
              Reflection
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Optional. A process note helps Mentor, DNA, and Academy reuse this room. You can skip
              it.
            </Text>
            <Text variant="caption" className="mt-3 text-text-tertiary">
              {activeSession.scores.journalPrompt}
            </Text>
            {journalError ? (
              <View className="mt-3">
                <RecoverableErrorState
                  error={journalError}
                  onRetry={() => void saveReflectionToJournal()}
                />
              </View>
            ) : null}
            <View className="mt-4 gap-2">
              <Button
                loading={isSavingJournal}
                disabled={isSavingJournal || journalSaved}
                onPress={() => void saveReflectionToJournal()}
                accessibilityLabel="Save reflection to Journal"
              >
                {journalSaved ? 'Reflection saved' : 'Save reflection to Journal'}
              </Button>
              {activeSession.scores.academyHint ? (
                <Button
                  variant="outline"
                  onPress={() =>
                    router.push(
                      `/academy/lesson/${activeSession.scores!.academyHint!.lessonId}` as never,
                    )
                  }
                >
                  Academy follow-up
                </Button>
              ) : null}
              <Button onPress={advancePhase} accessibilityLabel="See skill progression">
                See skill progression
              </Button>
            </View>
          </Surface>
        ) : null}

        {phase === 'skill' ? (
          <Surface emphasis="outlined">
            <Text variant="h3" headingLevel={2}>
              Skill progression
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Process skills from completed rooms — never whether the tape paid. Progress is stored
              on the existing Replay TV record and Decision Log.
            </Text>
            <View className="mt-4">
              <ReplayTvSkillProgressCard skills={skills} />
            </View>
            {nextPractice.episode ? (
              <Text variant="caption" className="mt-3 text-text-tertiary">
                Next practice: {nextPractice.skill.label} · {nextPractice.episode.title}
              </Text>
            ) : (
              <Text variant="caption" className="mt-3 text-text-tertiary">
                Next practice: {nextPractice.skill.label}
              </Text>
            )}
            <View className="mt-4 gap-2">
              <Button variant="outline" onPress={() => router.push('/decision/passport' as never)}>
                Decision Passport
              </Button>
              <Button variant="ghost" onPress={onExit}>
                Back to Replay TV
              </Button>
            </View>
          </Surface>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}
