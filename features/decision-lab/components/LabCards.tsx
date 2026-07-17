import { View } from 'react-native';

import type { LabAiCritique, LabPosition, LabStats } from '@/features/decision-lab/types/lab.types';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

export function LabAccountCard({
  currency,
  cash,
  size,
  openCount,
}: {
  currency: string;
  cash: number;
  size: number;
  openCount: number;
}) {
  return (
    <GlassCard className="p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        VIRTUAL ACCOUNT · NOT A BROKER
      </Text>
      <Text variant="h2" className="text-accent">
        {currency} {cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </Text>
      <Text variant="caption" className="mt-1 text-text-secondary">
        Starting size {currency} {size.toLocaleString()} · {openCount} open Lab position
        {openCount === 1 ? '' : 's'}
      </Text>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        Practice structured decisions. Simulated cash only — never live orders.
      </Text>
    </GlassCard>
  );
}

export function LabCritiqueCard({ critique }: { critique: LabAiCritique }) {
  const tone =
    critique.overall === 'ready'
      ? 'text-bullish'
      : critique.overall === 'caution'
        ? 'text-warning'
        : 'text-bearish';

  return (
    <GlassCard className="p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        AI COACH · PROCESS CRITIQUE
      </Text>
      <Text variant="h3" className={`mb-2 ${tone}`}>
        {critique.overall === 'ready'
          ? 'Ready for Lab practice'
          : critique.overall === 'caution'
            ? 'Caution'
            : 'Blocked'}
      </Text>
      <Text variant="body-sm" className="mb-3 text-text-secondary">
        {critique.summary}
      </Text>
      {(
        [
          ['Risk', critique.risk],
          ['Confirmation', critique.confirmation],
          ['Regime', critique.regime],
          ['Concentration', critique.concentration],
          ['Checklist', critique.checklist],
          ['Psychology', critique.psychology],
          ['Trading DNA', critique.dna],
        ] as const
      ).map(([label, body]) => (
        <View key={label} className="mb-2">
          <Text variant="caption" className="font-semibold text-text-tertiary">
            {label}
          </Text>
          <Text variant="caption" className="text-text-secondary">
            {body}
          </Text>
        </View>
      ))}
      <Text variant="caption" className="mb-1 mt-2 font-semibold text-text-tertiary">
        Suggestions
      </Text>
      {critique.suggestions.map((s) => (
        <Text key={s} variant="caption" className="mb-0.5 text-accent">
          • {s}
        </Text>
      ))}
      <Text variant="caption" className="mt-3 text-text-tertiary">
        {critique.disclaimer}
      </Text>
    </GlassCard>
  );
}

export function LabScoresCard({
  scores,
}: {
  scores: NonNullable<LabPosition['scores']>;
}) {
  return (
    <GlassCard className="p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        AFTER-TRADE PROCESS SCORES
      </Text>
      <Text variant="h3" className="mb-3">
        Process {scores.processScore}
      </Text>
      <ScoreRow label="Discipline" value={scores.disciplineScore} />
      <ScoreRow label="Risk" value={scores.riskScore} />
      <ScoreRow label="Checklist" value={scores.checklistScore} />
      <Text variant="caption" className="mb-1 mt-3 font-semibold text-text-tertiary">
        Journal prompt
      </Text>
      <Text variant="body-sm" className="mb-2 text-text-secondary">
        {scores.journalPrompt}
      </Text>
      <Text variant="caption" className="font-semibold text-text-tertiary">
        Learning summary
      </Text>
      <Text variant="body-sm" className="text-text-primary">
        {scores.learningSummary}
      </Text>
    </GlassCard>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="mb-2">
      <View className="mb-1 flex-row justify-between">
        <Text variant="caption" className="text-text-secondary">
          {label}
        </Text>
        <Text variant="caption">{value}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface-active">
        <View className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </View>
    </View>
  );
}

export function LabStatsCard({ stats }: { stats: LabStats }) {
  return (
    <GlassCard className="p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        LAB STATISTICS · PROCESS FIRST
      </Text>
      <Text variant="h3" className="mb-2">
        Avg process {stats.avgProcessScore}
      </Text>
      <Text variant="caption" className="mb-1 text-text-secondary">
        Rule adherence {stats.ruleAdherencePercent}% · Avg R:R {stats.avgRiskReward}:1 · Closed{' '}
        {stats.tradesClosed}
      </Text>
      <Text variant="caption" className="mb-2 text-text-tertiary">
        Win rate {stats.winRate}% (secondary) · Discipline {stats.avgDisciplineScore} · Risk{' '}
        {stats.avgRiskScore}
      </Text>
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        Common mistakes
      </Text>
      {stats.commonMistakes.map((m) => (
        <Text key={m} variant="caption" className="mb-0.5 text-text-secondary">
          • {m}
        </Text>
      ))}
      <Text variant="body-sm" className="mt-3 text-accent">
        {stats.improvementNote}
      </Text>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        {stats.simulatedPnlNote}
      </Text>
    </GlassCard>
  );
}
