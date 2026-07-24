import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { SimulatorSession } from '@/features/decision-simulator/types/simulator.types';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

interface SimulatorRevealCardProps {
  session: SimulatorSession;
}

export function SimulatorRevealCard({ session }: SimulatorRevealCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const scores = session.scores;
  if (!scores) return null;

  return (
    <View className="gap-4" testID="simulator-reveal-card">
      <Animated.View entering={FadeInDown.springify()}>
        <GlassCard className="p-4" bordered>
          <Text variant="caption" className="font-semibold uppercase tracking-wide text-info">
            Reveal · process scoring only
          </Text>
          <Text variant="h3" className="mt-2">
            What happened
          </Text>
          <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
            {scores.whatHappened}
          </Text>
          <Text variant="body-sm" className="mt-3 leading-relaxed text-text-secondary">
            {scores.whyItMatters}
          </Text>
        </GlassCard>
      </Animated.View>

      <GlassCard className="p-4">
        <Text variant="caption" className="mb-3 font-semibold uppercase tracking-wide text-text-tertiary">
          Process scores · never P&L
        </Text>
        <ScoreRow label="Decision Quality" value={scores.decisionQualityScore} />
        <ScoreRow label="Checklist" value={scores.checklistScore} />
        <ScoreRow label="Risk" value={scores.riskScore} />
        <ScoreRow label="Discipline" value={scores.disciplineScore} />
        <ScoreRow label="Reasoning" value={scores.reasoningScore} />
        <View className="mt-2 border-t border-border pt-3">
          <ScoreRow label="Process Score" value={scores.processScore} emphasize />
        </View>
      </GlassCard>

      <GlassCard className="p-4">
        <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
          What the AI noticed
        </Text>
        {scores.aiNoticed.map((line) => (
          <Text key={line} variant="caption" className="mb-1.5 leading-relaxed text-text-secondary">
            · {line}
          </Text>
        ))}
      </GlassCard>

      <GlassCard className="p-4">
        <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
          What was missed
        </Text>
        {scores.whatWasMissed.map((line) => (
          <Text key={line} variant="caption" className="mb-1.5 leading-relaxed text-text-secondary">
            · {line}
          </Text>
        ))}
      </GlassCard>

      <EducationalPanel variant="practice" title="Learning summary" body={scores.learningSummary} />

      <View className="gap-2">
        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-row items-center rounded-2xl bg-accent-muted px-4"
          onPress={() => router.push('/journal' as never)}
        >
          <Ionicons name="book-outline" size={18} color={colors.accent.primary} />
          <View className="ml-3 flex-1">
            <Text variant="label" className="text-accent">
              Journal this lesson
            </Text>
            <Text variant="caption" className="text-text-secondary" numberOfLines={2}>
              {scores.journalPrompt}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-row items-center rounded-2xl bg-surface px-4"
          onPress={() => router.push(scores.replayHref as never)}
        >
          <Ionicons name="play-back-outline" size={18} color={colors.info.primary} />
          <Text variant="label" className="ml-3 text-info">
            Continue in Decision Replay
          </Text>
        </Pressable>

        {scores.academyHint ? (
          <Pressable
            accessibilityRole="button"
            className="min-h-12 flex-row items-center rounded-2xl bg-surface px-4"
            onPress={() =>
              router.push(`/academy/lesson/${scores.academyHint!.lessonId}` as never)
            }
          >
            <Ionicons name="school-outline" size={18} color={colors.info.primary} />
            <View className="ml-3 flex-1">
              <Text variant="label" className="text-info">
                Academy · {scores.academyHint.title}
              </Text>
              <Text variant="caption" className="text-text-secondary">
                {scores.academyHint.reason}
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-row items-center rounded-2xl bg-surface px-4"
          onPress={() => router.push('/decision/mentor' as never)}
        >
          <Ionicons name="compass-outline" size={18} color={colors.accent.primary} />
          <Text variant="label" className="ml-3 text-accent">
            Ask Trading Mentor what to improve
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="min-h-12 flex-row items-center rounded-2xl bg-surface px-4"
          onPress={() => router.push('/decision/passport' as never)}
        >
          <Ionicons name="ribbon-outline" size={18} color={colors.info.primary} />
          <Text variant="label" className="ml-3 text-info">
            View Decision Passport
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ScoreRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text variant={emphasize ? 'label' : 'body-sm'} className="text-text-primary">
        {label}
      </Text>
      <Text variant={emphasize ? 'h3' : 'label'} className={emphasize ? 'text-accent' : 'text-text-secondary'}>
        {value}
      </Text>
    </View>
  );
}
