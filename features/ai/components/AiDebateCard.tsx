import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DebateCaseCard } from '@/features/ai/components/DebateCaseCard';
import { EducationalInsightFooter } from '@/features/educational/components/EducationalInsightFooter';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import type { AiDebateResult } from '@/features/ai/types/ai-debate.types';
import { TRUST_LANGUAGE } from '@/shared/constants/trust-language';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

interface AiDebateCardProps {
  debate: AiDebateResult;
}

export function AiDebateCard({ debate }: AiDebateCardProps) {
  const { colors } = useTheme();

  return (
    <View className="gap-4" testID="ai-debate-card">
      <GlassCard className="p-4" bordered>
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="mb-2 flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-info-muted">
                <Ionicons name="git-compare-outline" size={18} color={colors.info.primary} />
              </View>
              <View className="flex-1">
                <Text variant="h3">AI Debate</Text>
                <Text variant="caption" className="text-text-secondary">
                  {debate.symbol} · {debate.timeframe} · balanced research cases
                </Text>
              </View>
            </View>
            <EducationalModeBadge />
          </View>
        </View>
        <Text variant="body-sm" className="leading-relaxed text-text-secondary">
          Every asset gets bull, bear, and neutral views. Evidence is cited from indicators, news,
          regime, portfolio, memory, and timeframe — never fabricated.
        </Text>
      </GlassCard>

      <DebateCaseCard debateCase={debate.bullCase} defaultExpanded index={0} />
      <DebateCaseCard debateCase={debate.bearCase} defaultExpanded index={1} />
      <DebateCaseCard debateCase={debate.neutralCase} defaultExpanded index={2} />

      <Animated.View entering={FadeInDown.delay(180).springify()}>
        <GlassCard className="p-4">
          <Text variant="caption" className="mb-3 font-semibold uppercase tracking-wide text-text-tertiary">
            Research scores
          </Text>
          <ScoreRow
            label="Research Priority"
            value={debate.scores.researchPriority.toUpperCase()}
            detail={debate.scores.researchPriorityLabel}
          />
          <ScoreRow
            label={TRUST_LANGUAGE.rvs.name}
            value={`${debate.scores.researchValueScore}`}
            detail={debate.scores.researchValueExplanation}
          />
          <ScoreRow
            label={TRUST_LANGUAGE.dqs.name}
            value={`${debate.scores.decisionQualityScore}`}
            detail={debate.scores.decisionQualityExplanation}
          />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <GlassCard className="p-4" bordered>
          <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-info">
            Questions to answer before researching
          </Text>
          {debate.questionsBeforeResearch.map((question) => (
            <View key={question} className="mb-2.5 flex-row items-start gap-2">
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={colors.info.primary}
                style={{ marginTop: 2 }}
              />
              <Text variant="body-sm" className="flex-1 leading-relaxed text-text-primary">
                {question}
              </Text>
            </View>
          ))}
        </GlassCard>
      </Animated.View>

      {debate.citations.length > 0 ? (
        <GlassCard className="p-4">
          <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
            Evidence cited
          </Text>
          {debate.citations.slice(0, 8).map((citation) => (
            <Text
              key={`${citation.label}-${citation.value}`}
              variant="caption"
              className="mb-1 text-text-secondary"
            >
              {citation.label}: {citation.value}
            </Text>
          ))}
          {debate.evidenceNotes.map((note) => (
            <Text key={note} variant="caption" className="mt-1 text-text-tertiary">
              {note}
            </Text>
          ))}
          <EducationalInsightFooter className="mt-3" />
        </GlassCard>
      ) : null}
    </View>
  );
}

function ScoreRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View className="mb-3 border-b border-border/50 pb-3 last:mb-0 last:border-0 last:pb-0">
      <View className="mb-1 flex-row items-center justify-between gap-3">
        <Text variant="label" className="text-text-primary">
          {label}
        </Text>
        <Text variant="label" className="text-accent">
          {value}
        </Text>
      </View>
      <Text variant="caption" className="leading-relaxed text-text-secondary">
        {detail}
      </Text>
    </View>
  );
}
