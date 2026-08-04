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
    advancePhase,
    updateChecklist,
    submitDecision,
    finishSession,
    isFinishing,
    clearActive,
  } = useReplayTv();
  const [reasoning, setReasoning] = useState('');

  useEffect(() => {
    if (!activeSession) {
      router.replace('/decision/replay-tv' as never);
    }
  }, [activeSession, router]);

  if (!activeSession || !episode) {
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
          clearActive();
          router.back();
        }}
      />

      <View className="mt-4 gap-4">
        <View className="flex-row items-center gap-2">
          <DataSourceBadge kind={episode.dataKind} />
          <Text variant="caption" className="flex-1 text-text-tertiary">
            {episode.provenanceNote}
          </Text>
        </View>

        {phase === 'intro' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3">Introduction</Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {episode.subtitle}. {episode.teaser}
            </Text>
            <Text variant="body-sm" className="mt-3 text-text-tertiary">
              You will pause at decision points. The mentor will ask for reasoning. Outcomes stay
              spoiler-gated until the end.
            </Text>
            <Button className="mt-4" onPress={advancePhase}>
              Continue
            </Button>
          </GlassCard>
        ) : null}

        {phase === 'context' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3">Historical context</Text>
            <Text variant="caption" className="mt-1 text-text-tertiary">
              Spoiler-safe · {episode.eraLabel}
            </Text>
            <View className="mt-3 gap-2">
              {episode.contextBullets.map((bullet) => (
                <Text key={bullet} variant="body-sm" className="text-text-secondary">
                  • {bullet}
                </Text>
              ))}
            </View>
            <Button className="mt-4" onPress={advancePhase}>
              Begin blind replay
            </Button>
          </GlassCard>
        ) : null}

        {showChart ? (
          <GlassCard className="overflow-hidden p-2">
            <View className="mb-2 px-2 pt-1">
              <Text variant="caption" className="text-text-tertiary">
                {blind
                  ? `Visible window · ${visibleCandles.length} bars · pause ${activeSession.checkpointIndex + 1}/${episode.checkpoints.length}`
                  : `Full educational path · ${activeSession.fullCandles.length} bars`}
              </Text>
            </View>
            <CandlestickChart
              candles={visibleCandles}
              height={layout.isLandscape ? 320 : 260}
              symbol={episode.symbol}
            />
          </GlassCard>
        ) : null}

        {phase === 'watching' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3">Replay paused</Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {checkpoint?.prompt ?? 'What would you do?'}
            </Text>
            <Button className="mt-4" onPress={advancePhase}>
              Answer: What would you do?
            </Button>
          </GlassCard>
        ) : null}

        {phase === 'decision' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3">What would you do?</Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {checkpoint?.prompt}
            </Text>

            <View className="mt-4 gap-2">
              {(
                [
                  ['namedInvalidation', 'Named invalidation'],
                  ['notedRegime', 'Noted regime'],
                  ['consideredTimeBudget', 'Considered time budget'],
                ] as const
              ).map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() =>
                    updateChecklist({ [key]: !activeSession.checklist[key] })
                  }
                  className="rounded-lg bg-surface px-3 py-3"
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
              <ReplayTvDecisionChooser onChoose={onChoose} />
            </View>
          </GlassCard>
        ) : null}

        {phase === 'mentor' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3">AI Mentor</Text>
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
                .
              </Text>
            ) : null}
            <Button className="mt-4" onPress={advancePhase}>
              Continue replay
            </Button>
          </GlassCard>
        ) : null}

        {phase === 'reveal' ? (
          <GlassCard className="p-4" bordered>
            <Text variant="h3">Historical outcome</Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              {episode.historicalOutcome}
            </Text>
            <View className="mt-3 gap-2">
              {episode.checkpoints.map((cp) => (
                <Text key={cp.id} variant="body-sm" className="text-text-tertiary">
                  • {cp.teachingNote}
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
            <Text variant="h3">Coaching review</Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Process {activeSession.scores.processQuality} · Reasoning{' '}
              {activeSession.scores.reasoningQuality} · Checklist{' '}
              {activeSession.scores.checklistIntegrity} · Patience{' '}
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
            <Text variant="h3">Episode complete</Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Progress saved. Next: journal the process lesson, then deepen with Academy.
            </Text>
            <View className="mt-4 gap-2">
              <Button
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
              <Button
                variant="outline"
                onPress={() => router.push('/decision/passport' as never)}
              >
                Decision Passport
              </Button>
              <Button
                variant="ghost"
                onPress={() => {
                  clearActive();
                  router.replace('/decision/replay-tv' as never);
                }}
              >
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
