import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { FilterChip } from '@/shared/components/ui/FilterChip';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import {
  generateIntradayDrills,
  scoreIntradayDrillAttempt,
  type IntradayDrill,
} from '../services/intraday-drills.service';
import { recommendIntradayNext } from '../services/recommendations.service';
import { useIntradaySessionStore } from '../stores/intraday-session.store';

export function IntradayDrillsScreen() {
  const router = useRouter();
  const recordAttempt = usePracticeProgressStore((s) => s.recordAttempt);
  const records = useIntradaySessionStore((s) => s.records);
  const [seed, setSeed] = useState(() => Math.floor(Date.now() % 100_000) + 7);
  const [index, setIndex] = useState(0);
  const [timed, setTimed] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<{ correct: boolean; timedOut: boolean } | null>(null);
  const [missedKinds, setMissedKinds] = useState<IntradayDrill['kind'][]>([]);

  const drills = useMemo(() => generateIntradayDrills(seed, 10), [seed]);
  const drill = drills[index % drills.length]!;
  const recommendations = useMemo(
    () =>
      recommendIntradayNext({
        missedDrillKinds: missedKinds,
        breakerSessions: records.filter((r) => r.breakerHit).length,
        flatSessions: records.filter((r) => r.flat).length,
        costHeavySessions: 0,
        completedSessions: records.length,
      }),
    [missedKinds, records],
  );

  // Instructional timer only — ticks while a drill is unanswered.
  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => setElapsedMs((e) => e + 250), 250);
    return () => clearInterval(timer);
  }, [drill, result]);

  const choose = (selectedIndex: number) => {
    if (result) return;
    const score = scoreIntradayDrillAttempt({
      drill,
      selectedIndex,
      elapsedMs,
      timed,
    });
    setResult(score);
    recordAttempt({ drillId: drill.id, correct: score.correct, selectedIndex });
    if (!score.correct) setMissedKinds((prev) => [...prev, drill.kind]);
  };

  const next = () => {
    if (index + 1 >= drills.length) {
      setSeed((s) => s + 1000);
      setIndex(0);
    } else {
      setIndex((i) => i + 1);
    }
    setResult(null);
    setElapsedMs(0);
  };

  return (
    <Screen scrollable contentClassName="pb-10">
      <Header
        title="Advanced intraday drills"
        subtitle="Generated scenarios, advanced and expert. Timed mode is optional — untimed is always available and never penalised differently in your history."
        onBack={() => router.back()}
      />

      <View className="mt-3 flex-row gap-2">
        <FilterChip label="Untimed (learning)" selected={!timed} onPress={() => setTimed(false)} />
        <FilterChip label="Timed (instructional)" selected={timed} onPress={() => setTimed(true)} />
      </View>

      <Surface className="mt-4" testID={`intraday-drill-${drill.kind}`}>
        <Text variant="caption" className="text-text-tertiary">
          {drill.difficulty} · {timed ? `${drill.timeLimitSeconds}s window` : 'untimed'} · Drill{' '}
          {index + 1} of {drills.length}
        </Text>
        <Text variant="h3" headingLevel={3} className="mt-1">
          {drill.title}
        </Text>
        <Text variant="body-sm" className="mt-2">
          {drill.prompt}
        </Text>
        <View className="mt-4 gap-2">
          {drill.choices.map((choice, i) => (
            <Button
              key={`${drill.id}-${i}`}
              variant={result && i === drill.correctIndex ? 'primary' : 'outline'}
              onPress={() => choose(i)}
            >
              {choice}
            </Button>
          ))}
        </View>
        {result ? (
          <View className="mt-4">
            <Text variant="label" className={result.correct ? 'text-bullish' : 'text-bearish'}>
              {result.timedOut
                ? 'Timed out — recorded honestly as a timeout'
                : result.correct
                  ? 'Correct reasoning'
                  : 'Not the planned reasoning'}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {drill.explanation}
            </Text>
            <Button className="mt-3" onPress={next}>
              Next generated drill
            </Button>
          </View>
        ) : null}
      </Surface>

      {recommendations.length ? (
        <Surface className="mt-4">
          <Text variant="label" className="text-text-tertiary">
            RECOMMENDED NEXT (FROM YOUR ACTUAL ATTEMPTS)
          </Text>
          {recommendations.map((rec) => (
            <View key={rec.id} className="mt-2">
              <Text variant="body-sm">{rec.reason}</Text>
              <Button size="sm" variant="ghost" onPress={() => router.push(rec.href as never)}>
                {rec.label}
              </Button>
            </View>
          ))}
        </Surface>
      ) : null}
    </Screen>
  );
}
