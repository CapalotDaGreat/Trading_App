import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { ReplayTvDecisionChooser } from '@/features/decision-replay-tv/components/ReplayTvDecisionChooser';
import { useReplayTv } from '@/features/decision-replay-tv/hooks/useReplayTv';
import {
  REPLAY_TV_DECISION_LABELS,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import type { ReplayTvDecision } from '@/features/decision-replay-tv/types/replay-tv.types';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { AccessibleChartFrame } from '@/shared/components/charts/AccessibleChartFrame';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';

export function ReplayTvSessionScreen() {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const {
    activeSession,
    episode,
    visibleCandles,
    visibleNews,
    blindView,
    advancePhase,
    restartEpisode,
    updateChecklist,
    submitDecision,
    finishSession,
    isFinishing,
    saveReflectionToJournal,
    isSavingJournal,
    journalSaved,
    clearActive,
  } = useReplayTv();
  const [reasoning, setReasoning] = useState('');

  useEffect(() => {
    if (!activeSession) {
      router.replace('/decision/replay-tv' as never);
    }
  }, [activeSession, router]);

  if (!activeSession || !episode || !blindView) {
    return (
      <Screen className="items-center justify-center">
        <Text variant="body">Loading episode…</Text>
      </Screen>
    );
  }

  const phase = activeSession.phase;
  const checkpoint = episode.checkpoints[activeSession.checkpointIndex];
  const showChart =
    phase === 'watching' ||
    phase === 'decision' ||
    phase === 'mentor' ||
    phase === 'reveal' ||
    phase === 'coaching' ||
    phase === 'complete';
  const blind =
    !activeSession.revealed &&
    phase !== 'reveal' &&
    phase !== 'coaching' &&
    phase !== 'complete';

  const onChoose = (decision: ReplayTvDecision) => {
    submitDecision(decision, reasoning);
    setReasoning('');
  };

  const onFinish = async () => {
    await finishSession();
    advancePhase();
  };

  const onExit = () => {
    clearActive();
    router.replace('/decision/replay-tv' as never);
  };

  const onRestart = () => {
    restartEpisode();
    setReasoning('');
  };

  return (
    <Screen scrollable contentClassName="pb-12">
      <Header
        title={episode.title}
        subtitle={
          blind
            ? 'Future candles hidden · no hindsight'
            : 'Historical path revealed · process scored only'
        }
        onBack={() => {
          router.back();
        }}
      />

      <View className="mt-4 gap-4">
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
          <GlassCard className="p-4" bordered>
            <Text variant="h3" headingLevel={2}>
              Story introduction
            </Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {blindView.subtitle}. {blindView.teaser}
            </Text>
            <Text variant="body-sm" className="mt-3 text-text-tertiary">
              You will pause at decision points. The mentor asks process questions after you decide.
              Outcomes stay spoiler-gated until the end.
            </Text>
            <Text variant="caption" className="mt-3 text-text-tertiary">
              ~{episode.durationMinutes} min · {episode.estimatedDecisionCount} decision pauses ·{' '}
              {episode.difficulty}
            </Text>
            <Button className="mt-4" onPress={advancePhase}>
              Continue
            </Button>
          </GlassCard>
        ) : null}

        {phase === 'context' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3" headingLevel={2}>
              Historical context
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
            <View className="mt-4 rounded-xl bg-surface px-3 py-3">
              <Text variant="label">Data provenance</Text>
              <Text variant="caption" className="mt-1 text-text-tertiary">
                Educational sample reconstruction · {episode.dataKind} · not exchange ticks. Future
                bars and outcome text remain hidden until reveal.
              </Text>
            </View>
            <Button className="mt-4" onPress={advancePhase}>
              Begin blind replay
            </Button>
          </GlassCard>
        ) : null}

        {showChart ? (
          <GlassCard className="overflow-hidden p-2">
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
                    ? `Blind window ends at bar index freeze. Last close ${visibleCandles[visibleCandles.length - 1]?.close?.toFixed?.(2) ?? 'n/a'}.`
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
          </GlassCard>
        ) : null}

        {showChart && visibleNews.length > 0 ? (
          <GlassCard className="p-4" bordered>
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
          </GlassCard>
        ) : null}

        {phase === 'watching' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3" headingLevel={2}>
              Replay paused
            </Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {checkpoint?.prompt ?? 'What would you do?'}
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
            <Button className="mt-4" onPress={advancePhase}>
              Answer: What would you do?
            </Button>
          </GlassCard>
        ) : null}

        {phase === 'decision' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3" headingLevel={2}>
              What would you do?
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {checkpoint?.prompt}
            </Text>
            {checkpoint?.hypothesisPrompt ? (
              <Text variant="caption" className="mt-2 text-text-tertiary">
                {checkpoint.hypothesisPrompt}
              </Text>
            ) : null}

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
                  onPress={() =>
                    updateChecklist({ [key]: !activeSession.checklist[key] })
                  }
                  className="min-h-11 rounded-lg bg-surface px-3 py-3"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: activeSession.checklist[key] }}
                  accessibilityLabel={label}
                >
                  <Text variant="body-sm">
                    {activeSession.checklist[key] ? '☑' : '☐'} {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-4">
              <Input
                label="Reasoning"
                value={reasoning}
                onChangeText={setReasoning}
                multiline
                numberOfLines={3}
                placeholder="Why this process decision? What would invalidate it?"
                accessibilityLabel="Replay TV reasoning note"
              />
            </View>

            <View className="mt-4">
              <ReplayTvDecisionChooser
                onChoose={onChoose}
                choices={checkpoint?.choices}
              />
            </View>
          </GlassCard>
        ) : null}

        {phase === 'mentor' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3" headingLevel={2}>
              AI Mentor
            </Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {activeSession.mentorReply}
            </Text>
            {activeSession.decisions.length > 0 ? (
              <Text variant="caption" className="mt-3 text-text-tertiary">
                You chose{' '}
                {
                  REPLAY_TV_DECISION_LABELS[
                    activeSession.decisions[activeSession.decisions.length - 1]!.decision
                  ]
                }
                . Outcome remains hidden.
              </Text>
            ) : null}
            <Button className="mt-4" onPress={advancePhase}>
              Continue replay
            </Button>
          </GlassCard>
        ) : null}

        {phase === 'reveal' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3" headingLevel={2}>
              Historical outcome
            </Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {blindView.historicalOutcome}
            </Text>
            <View className="mt-3 gap-2">
              {blindView.teachingNotes.map((note) => (
                <Text key={note} variant="body-sm" className="text-text-tertiary">
                  • {note}
                </Text>
              ))}
            </View>
            <Button className="mt-4" onPress={advancePhase}>
              Open coaching review
            </Button>
          </GlassCard>
        ) : null}

        {phase === 'coaching' && activeSession.scores ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3" headingLevel={2}>
              Coaching review
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Process {activeSession.scores.processQuality} · Evidence{' '}
              {activeSession.scores.evidenceQuality} · Risk{' '}
              {activeSession.scores.riskAwareness} · Invalidation{' '}
              {activeSession.scores.invalidationClarity} · Alternatives{' '}
              {activeSession.scores.alternativeConsideration} · Patience{' '}
              {activeSession.scores.patience}
            </Text>
            <View className="mt-3 gap-2">
              {activeSession.scores.coaching.map((line) => (
                <Text key={line} variant="body-sm" className="text-text-secondary">
                  • {line}
                </Text>
              ))}
            </View>
            <Button
              className="mt-4"
              loading={isFinishing}
              disabled={isFinishing}
              onPress={() => void onFinish()}
            >
              Save to Passport & Decision Log
            </Button>
          </GlassCard>
        ) : null}

        {phase === 'complete' && activeSession.scores ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3" headingLevel={2}>
              Episode complete
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Progress saved. Optionally save a process reflection to Journal, then deepen with
              Academy.
            </Text>
            <View className="mt-4 gap-2">
              <Button
                loading={isSavingJournal}
                disabled={isSavingJournal || journalSaved}
                onPress={() => void saveReflectionToJournal()}
                accessibilityLabel="Save reflection to Journal"
              >
                {journalSaved ? 'Reflection saved' : 'Save reflection to Journal'}
              </Button>
              <Button
                variant="secondary"
                onPress={() => router.push('/journal' as never)}
                accessibilityLabel="Open journal"
              >
                Open Journal
              </Button>
              {activeSession.scores.academyHint ? (
                <Button
                  variant="secondary"
                  onPress={() =>
                    router.push(
                      `/academy/lesson/${activeSession.scores!.academyHint!.lessonId}` as never,
                    )
                  }
                >
                  Academy follow-up
                </Button>
              ) : null}
              {episode.educationalLinks
                .filter((link) => link.kind === 'academy')
                .slice(0, 2)
                .map((link) => (
                  <Button
                    key={link.href}
                    variant="outline"
                    onPress={() => router.push(link.href as never)}
                  >
                    {link.label}
                  </Button>
                ))}
              <Button
                variant="outline"
                onPress={() => router.push('/decision/passport' as never)}
              >
                Decision Passport
              </Button>
              <Button variant="ghost" onPress={onExit}>
                Back to Replay TV
              </Button>
            </View>
            <Text variant="caption" className="mt-4 text-text-tertiary">
              Journal prompt: {activeSession.scores.journalPrompt}
            </Text>
          </GlassCard>
        ) : null}
      </View>
    </Screen>
  );
}
