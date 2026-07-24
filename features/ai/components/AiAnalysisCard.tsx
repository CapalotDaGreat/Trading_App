import { View } from 'react-native';

import { EducationalInsightFooter } from '@/features/educational/components/EducationalInsightFooter';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice } from '@/shared/utils/format';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiAnalysisResult } from '../types/ai.types';
import { LOCAL_ANALYSIS_LABEL } from '../constants/ai-release';
import { AiDisclaimer } from './AiDisclaimer';

interface AiAnalysisCardProps {
  result: AiAnalysisResult;
}

export function AiAnalysisCard({ result }: AiAnalysisCardProps) {
  const meta = result.metadata;

  return (
    <GlassCard className="p-4" glow>
      <View className="mb-3 flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <EducationalModeBadge className="mb-2" />
          <Text variant="h3">{formatTypeLabel(result.type)}</Text>
          {meta ? (
            <View className="mt-1 flex-row flex-wrap items-center gap-2">
              <Badge
                label={LOCAL_ANALYSIS_LABEL}
                variant="default"
                size="sm"
              />
              <Text variant="caption">{meta.confidence}% output quality</Text>
              <Text variant="caption">· {formatRelativeTime(meta.dataAsOf)}</Text>
            </View>
          ) : null}
        </View>
        {result.sentiment ? (
          <Badge
            label={result.sentiment}
            variant={
              result.sentiment === 'bullish'
                ? 'success'
                : result.sentiment === 'bearish'
                  ? 'danger'
                  : 'default'
            }
            size="sm"
          />
        ) : null}
      </View>

      <Text variant="body-sm" className="mb-4 leading-relaxed">
        {result.content}
      </Text>

      {result.tradeSuggestion ? <TradeSuggestionSection data={result.tradeSuggestion} /> : null}
      {result.riskAnalysis ? <RiskSection data={result.riskAnalysis} /> : null}
      {result.patternExplanation ? <PatternSection data={result.patternExplanation} /> : null}
      {result.indicatorExplanation ? <IndicatorSection data={result.indicatorExplanation} /> : null}
      {result.dailySummary ? <DailySummarySection data={result.dailySummary} /> : null}
      {result.marketRecap ? <MarketRecapSection data={result.marketRecap} /> : null}
      {result.newsSummary ? <NewsSummarySection data={result.newsSummary} /> : null}
      {result.portfolioReview ? <PortfolioSection data={result.portfolioReview} /> : null}
      {result.psychologyCoach ? <PsychologySection data={result.psychologyCoach} /> : null}

      {meta?.citations && meta.citations.length > 0 ? (
        <View className="mt-3 rounded-xl border border-border/60 bg-surface/20 p-3">
          <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide">
            Data Sources
          </Text>
          {meta.citations.slice(0, 6).map((c) => (
            <Text key={`${c.label}-${c.value}`} variant="caption" className="mb-0.5">
              {c.label}: {c.value}
            </Text>
          ))}
        </View>
      ) : null}

      <EducationalInsightFooter />
      <AiDisclaimer compact className="mt-3" />
    </GlassCard>
  );
}

function formatTypeLabel(type: AiAnalysisResult['type']): string {
  if (type === 'trade_suggestion') return 'Research Priority';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function TradeSuggestionSection({
  data,
}: {
  data: NonNullable<AiAnalysisResult['tradeSuggestion']>;
}) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="label">{data.symbol}</Text>
        <Badge label={data.action.toUpperCase()} variant="accent" size="sm" />
      </View>
      <Text variant="body-sm" className="mb-2">
        {data.reasoning}
      </Text>
      <Text variant="caption" className="mb-1 font-semibold uppercase">
        Research evidence (not a prediction)
      </Text>
      {data.why.map((reason, i) => (
        <Text key={i} variant="caption" className="mb-1 leading-relaxed">
          • {reason}
        </Text>
      ))}
      <View className="mt-3 gap-1">
        {data.entryZone ? (
          <LevelRow
            label="Observation zone"
            value={`${formatPrice(data.entryZone.low)} – ${formatPrice(data.entryZone.high)}`}
          />
        ) : null}
        {data.stopLoss !== undefined ? (
          <LevelRow label="Invalidation reference" value={formatPrice(data.stopLoss)} tone="bearish" />
        ) : null}
        {data.takeProfit !== undefined ? (
          <LevelRow label="Next level to research" value={formatPrice(data.takeProfit)} tone="bullish" />
        ) : null}
      </View>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        Evidence quality: {data.confidence}% · Research window: {data.timeframe}
      </Text>
    </View>
  );
}

function LevelRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'bullish' | 'bearish';
}) {
  return (
    <View className="flex-row justify-between">
      <Text variant="caption">{label}</Text>
      <Text
        variant="caption"
        className={tone === 'bullish' ? 'text-bullish' : tone === 'bearish' ? 'text-bearish' : ''}
      >
        {value}
      </Text>
    </View>
  );
}

function RiskSection({ data }: { data: NonNullable<AiAnalysisResult['riskAnalysis']> }) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="label">Risk Score: {data.riskScore}/100</Text>
        <Badge label={data.riskLevel} variant="warning" size="sm" />
      </View>
      <Text variant="body-sm" className="mb-2">
        {data.summary}
      </Text>
      {data.factors.map((factor) => (
        <View key={factor.label} className="mb-1.5">
          <Text variant="caption" className="font-medium">
            {factor.label}
          </Text>
          <Text variant="caption" className="text-text-secondary">
            {factor.detail}
          </Text>
        </View>
      ))}
      {data.positionSizing ? (
        <Text variant="caption" className="mt-2 text-accent">
          {data.positionSizing}
        </Text>
      ) : null}
    </View>
  );
}

function PatternSection({
  data,
}: {
  data: NonNullable<AiAnalysisResult['patternExplanation']>;
}) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <View className="mb-1 flex-row items-center justify-between">
        <Text variant="label">{data.pattern}</Text>
        <Badge label={`${data.reliability}%`} variant="default" size="sm" />
      </View>
      <Text variant="body-sm" className="mb-2">
        {data.explanation}
      </Text>
      {data.keyLevels.map((level) => (
        <LevelRow key={level.label} label={level.label} value={formatPrice(level.price)} />
      ))}
    </View>
  );
}

function IndicatorSection({
  data,
}: {
  data: NonNullable<AiAnalysisResult['indicatorExplanation']>;
}) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <View className="mb-1 flex-row items-center justify-between">
        <Text variant="label">
          {data.indicator}: {data.value}
        </Text>
        <Badge label={data.signal} size="sm" />
      </View>
      <Text variant="body-sm" className="mb-1">
        {data.explanation}
      </Text>
      <Text variant="caption" className="leading-relaxed">
        {data.interpretation}
      </Text>
    </View>
  );
}

function DailySummarySection({
  data,
}: {
  data: NonNullable<AiAnalysisResult['dailySummary']>;
}) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <Text variant="body-sm" className="mb-2">
        {data.summary}
      </Text>
      {data.highlights.map((h, i) => (
        <Text key={i} variant="caption" className="mb-0.5">
          • {h}
        </Text>
      ))}
    </View>
  );
}

function MarketRecapSection({
  data,
}: {
  data: NonNullable<AiAnalysisResult['marketRecap']>;
}) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <Text variant="body-sm" className="mb-2">
        {data.summary}
      </Text>
      <Text variant="caption" className="mb-1 font-semibold">
        Top movers
      </Text>
      {data.topMovers.map((m) => (
        <LevelRow
          key={m.symbol}
          label={m.symbol}
          value={formatPercent(m.changePercent)}
          tone={m.changePercent >= 0 ? 'bullish' : 'bearish'}
        />
      ))}
      <Text variant="caption" className="mb-1 mt-2 font-semibold">
        Key events
      </Text>
      {data.keyEvents.map((e, i) => (
        <Text key={i} variant="caption" className="mb-0.5">
          • {e}
        </Text>
      ))}
    </View>
  );
}

function NewsSummarySection({
  data,
}: {
  data: NonNullable<AiAnalysisResult['newsSummary']>;
}) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <Text variant="label" className="mb-1">
        {data.headline}
      </Text>
      <Text variant="body-sm" className="mb-2">
        {data.summary}
      </Text>
      {data.keyTakeaways.map((t, i) => (
        <Text key={i} variant="caption" className="mb-1 leading-relaxed">
          • {t}
        </Text>
      ))}
    </View>
  );
}

function PortfolioSection({
  data,
}: {
  data: NonNullable<AiAnalysisResult['portfolioReview']>;
}) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <Text variant="label" className="mb-1">
        Health: {data.overallHealth} · Diversification: {data.diversificationScore}%
      </Text>
      <Text variant="body-sm" className="mb-2">
        {data.summary}
      </Text>
      {data.strengths.length > 0 ? (
        <>
          <Text variant="caption" className="mb-1 font-semibold">
            Strengths
          </Text>
          {data.strengths.map((s, i) => (
            <Text key={i} variant="caption" className="mb-0.5 text-bullish">
              + {s}
            </Text>
          ))}
        </>
      ) : null}
      {data.weaknesses.length > 0 ? (
        <>
          <Text variant="caption" className="mb-1 mt-2 font-semibold">
            Weaknesses
          </Text>
          {data.weaknesses.map((w, i) => (
            <Text key={i} variant="caption" className="mb-0.5 text-bearish">
              − {w}
            </Text>
          ))}
        </>
      ) : null}
      {data.suggestions.map((s, i) => (
        <Text key={i} variant="caption" className="mb-0.5">
          → {s}
        </Text>
      ))}
    </View>
  );
}

function PsychologySection({
  data,
}: {
  data: NonNullable<AiAnalysisResult['psychologyCoach']>;
}) {
  return (
    <View className="mb-3 rounded-xl border border-border bg-surface/30 p-3">
      <Text variant="label" className="mb-1">
        {data.topic}
      </Text>
      <Text variant="body-sm" className="mb-2">
        {data.advice}
      </Text>
      {data.exercises.map((e, i) => (
        <Text key={i} variant="caption" className="mb-0.5">
          ✓ {e}
        </Text>
      ))}
    </View>
  );
}
