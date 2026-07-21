import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { NON_PREDICTION_COPY, TRUST_LANGUAGE } from '@/shared/constants/trust-language';
import { useTheme } from '@/shared/hooks/useTheme';

import { useDecisionUiStore } from '../stores/decision-ui.store';

/**
 * One-time explainer: RVS (attention worthiness) vs DQS (process quality).
 * Neither is a price prediction.
 */
export function DecisionQualityExplainer() {
  const { colors } = useTheme();
  const dismissed = useDecisionUiStore((s) => s.dqsExplainerDismissed);
  const dismiss = useDecisionUiStore((s) => s.dismissDqsExplainer);

  if (dismissed) return null;

  return (
    <GlassCard className="mb-3 p-4" bordered>
      <View className="mb-2 flex-row items-start justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-2">
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent.primary} />
          <Text variant="label" className="text-text-primary">
            RVS vs Decision Quality
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss explainer"
          hitSlop={8}
          onPress={dismiss}
        >
          <Ionicons name="close" size={18} color={colors.text.tertiary} />
        </Pressable>
      </View>

      <Text variant="body-sm" className="leading-relaxed text-text-secondary">
        <Text variant="body-sm" className="font-semibold text-text-primary">
          {TRUST_LANGUAGE.rvs.name} ({TRUST_LANGUAGE.rvs.short})
        </Text>{' '}
        answers: “Is this worth my research time?” Regime fit, portfolio overlap, catalysts, and
        your Trading DNA all factor in.{' '}
        <Text variant="body-sm" className="font-semibold text-text-primary">
          {TRUST_LANGUAGE.dqs.name} ({TRUST_LANGUAGE.dqs.short})
        </Text>{' '}
        grades your process checklist — trend, risk defined, timeframes, catalyst, confirmation.
        {NON_PREDICTION_COPY} High RVS means “worth a closer look,” not an instruction to trade.
      </Text>

      <Pressable accessibilityRole="button" onPress={dismiss} className="mt-3 self-start">
        <Text variant="caption" className="font-semibold text-accent">
          Got it
        </Text>
      </Pressable>
    </GlassCard>
  );
}
