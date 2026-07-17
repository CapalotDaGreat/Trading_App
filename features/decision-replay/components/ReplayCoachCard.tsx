import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { DecisionReplayFrame } from '@/features/decision-replay/services/decision-replay.service';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

interface ReplayCoachCardProps {
  frame: DecisionReplayFrame;
}

export function ReplayCoachCard({ frame }: ReplayCoachCardProps) {
  const { colors } = useTheme();
  const [openQ, setOpenQ] = useState<string | null>(frame.coach.questions[0]?.id ?? null);
  const { coach, context } = frame;

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        AI COACH · PROCESS
      </Text>
      <Text variant="h3" className="mb-2">
        {coach.headline}
      </Text>
      <Text variant="body-sm" className="mb-3 leading-relaxed text-text-secondary">
        {coach.processNote}
      </Text>

      <View className="mb-3 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-surface px-2.5 py-1">
          <Text variant="caption" className="text-text-secondary">
            Emotion risk: {coach.emotionRisk}
          </Text>
        </View>
        <View className="rounded-full bg-surface px-2.5 py-1">
          <Text variant="caption" className="text-text-secondary">
            DNA: {coach.dnaFit}
          </Text>
        </View>
        <View className="rounded-full bg-surface px-2.5 py-1">
          <Text variant="caption" className="text-text-secondary">
            Regime: {context.regime.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {context.researchValueScore != null || context.decisionQualityScore != null ? (
        <Text variant="caption" className="mb-3 text-text-tertiary">
          {context.researchValueScore != null ? `RVS ${context.researchValueScore}` : ''}
          {context.researchValueScore != null && context.decisionQualityScore != null
            ? ' · '
            : ''}
          {context.decisionQualityScore != null ? `DQS ${context.decisionQualityScore}` : ''}
          {' · scores grade process, not price'}
        </Text>
      ) : null}

      <Text variant="caption" className="mb-1.5 font-semibold text-text-secondary">
        Evidence
      </Text>
      {coach.evidence.map((e) => (
        <Text key={e} variant="caption" className="mb-0.5 text-text-secondary">
          • {e}
        </Text>
      ))}

      {context.journalSnippet ? (
        <Text variant="caption" className="mt-2 text-text-tertiary">
          Journal: “{context.journalSnippet}”
        </Text>
      ) : null}

      <Text variant="caption" className="mb-2 mt-4 font-semibold text-text-secondary">
        Reflect
      </Text>
      {coach.questions.map((q) => {
        const open = openQ === q.id;
        return (
          <Pressable
            key={q.id}
            onPress={() => setOpenQ(open ? null : q.id)}
            className="mb-2 rounded-xl bg-surface px-3 py-2.5"
            accessibilityRole="button"
          >
            <View className="flex-row items-start justify-between gap-2">
              <Text variant="body-sm" className="flex-1 text-text-primary">
                {q.question}
              </Text>
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.text.tertiary}
              />
            </View>
            {open ? (
              <Text variant="caption" className="mt-2 text-text-tertiary">
                {q.promptHint}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
