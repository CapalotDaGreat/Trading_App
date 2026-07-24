import { Pressable, View } from 'react-native';

import type {
  SimulatorChecklist,
  SimulatorContextPack,
} from '@/features/decision-simulator/types/simulator.types';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface SimulatorContextPanelProps {
  context: SimulatorContextPack;
  checklist: SimulatorChecklist;
  onToggleChecklist: (key: keyof SimulatorChecklist) => void;
}

const CHECKS: { key: keyof SimulatorChecklist; label: string }[] = [
  { key: 'reviewedIndicators', label: 'Reviewed indicators on the visible window' },
  { key: 'notedRegime', label: 'Noted market regime' },
  { key: 'consideredPortfolio', label: 'Considered portfolio overlap' },
  { key: 'setInvalidationThought', label: 'Wrote an invalidation thought' },
  { key: 'respectedTimeBudget', label: 'Respected research time budget' },
];

export function SimulatorContextPanel({
  context,
  checklist,
  onToggleChecklist,
}: SimulatorContextPanelProps) {
  return (
    <View className="gap-3">
      <EducationalModeBadge />
      <GlassCard className="p-4" bordered>
        <Text variant="caption" className="font-semibold uppercase tracking-wide text-info">
          Decision brief · future candles hidden
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Badge
            label={context.bias}
            variant={
              context.bias === 'bullish' ? 'success' : context.bias === 'bearish' ? 'danger' : 'default'
            }
            size="sm"
          />
          <Badge label={`${context.evidenceQuality}% evidence`} variant="outline" size="sm" />
          <Badge label={`${context.researchTimeMinutes}m budget`} variant="accent" size="sm" />
        </View>
        <Text variant="body-sm" className="mt-3 leading-relaxed text-text-secondary">
          Indicators: {context.indicatorsNote}
        </Text>
        <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
          Regime: {context.regimeLabel}
        </Text>
        <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
          Portfolio: {context.portfolioNote}
        </Text>
        {context.memoryNote ? (
          <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
            Memory: {context.memoryNote}
          </Text>
        ) : null}
      </GlassCard>

      {context.newsHeadlines.length > 0 ? (
        <GlassCard className="p-4">
          <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
            News context
          </Text>
          {context.newsHeadlines.map((item) => (
            <Text key={item.id} variant="caption" className="mb-1.5 leading-relaxed text-text-secondary">
              · {item.title} ({item.source})
            </Text>
          ))}
        </GlassCard>
      ) : (
        <GlassCard className="p-4">
          <Text variant="caption" className="text-text-secondary">
            No headlines loaded for this symbol — do not invent catalysts.
          </Text>
        </GlassCard>
      )}

      <GlassCard className="p-4">
        <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
          Process checklist
        </Text>
        {CHECKS.map((item) => {
          const done = checklist[item.key];
          return (
            <Pressable
              key={item.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() => onToggleChecklist(item.key)}
              className="mb-2 min-h-11 flex-row items-center"
            >
              <View
                className={cn(
                  'mr-3 h-5 w-5 items-center justify-center rounded-md border',
                  done ? 'border-accent bg-accent' : 'border-border',
                )}
              >
                {done ? (
                  <Text variant="caption" className="text-text-inverse">
                    ✓
                  </Text>
                ) : null}
              </View>
              <Text variant="body-sm" className="flex-1 text-text-primary">
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </GlassCard>
    </View>
  );
}
