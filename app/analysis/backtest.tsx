import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  DEFAULT_BACKTEST_CONFIG,
  generateSampleCandles,
  rsiStrategy,
  runBacktest,
  smaStrategy,
  type BacktestResult,
} from '@/features/analysis/services/backtesting.service';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';
import { formatNumber, formatPercent } from '@/shared/utils/format';

type StrategyType = 'sma' | 'rsi';

export default function BacktestScreen() {
  const router = useRouter();
  const [strategyType, setStrategyType] = useState<StrategyType>('sma');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const candles = useMemo(() => generateSampleCandles(252, 150), []);

  const run = () => {
    setIsRunning(true);
    try {
      const strategy = strategyType === 'sma' ? smaStrategy(20) : rsiStrategy(14);
      const backtestResult = runBacktest(candles, strategy, DEFAULT_BACKTEST_CONFIG);
      setResult(backtestResult);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Backtest" subtitle="Strategy simulation" onBack={() => router.back()} />

      <View className="mt-4 gap-4">
        <View className="flex-row items-center justify-between">
          <DataSourceBadge kind="sample" />
          <Text variant="caption" className="text-text-secondary">
            Research practice only — not live symbol data
          </Text>
        </View>

        <GlassCard className="p-4">
          <Text variant="h3" className="mb-3">
            Strategy
          </Text>
          <View className="mb-4 flex-row gap-2">
            {(['sma', 'rsi'] as const).map((type) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                onPress={() => setStrategyType(type)}
                className={cn(
                  'flex-1 rounded-full py-2.5',
                  strategyType === type ? 'bg-accent-muted' : 'bg-surface',
                )}
              >
                <Text
                  variant="body-sm"
                  className={cn(
                    'text-center font-medium',
                    strategyType === type ? 'text-accent' : 'text-text-secondary',
                  )}
                >
                  {type === 'sma' ? 'SMA Crossover' : 'RSI Reversion'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text variant="caption" className="mb-3 text-text-tertiary">
            {candles.length} daily candles · ${formatNumber(DEFAULT_BACKTEST_CONFIG.initialCapital, 0)} initial capital
          </Text>

          <Button loading={isRunning} onPress={run} fullWidth>
            Run Backtest
          </Button>
        </GlassCard>

        {isRunning ? (
          <ActivityIndicator size="large" color="#00D4AA" />
        ) : result ? (
          <BacktestResults result={result} />
        ) : null}
      </View>
    </Screen>
  );
}

function BacktestResults({ result }: { result: BacktestResult }) {
  const isPositive = result.totalReturn >= 0;

  return (
    <GlassCard className="p-4">
      <Text variant="h3" className="mb-1">
        {result.strategy}
      </Text>
      <Text variant="caption" className="mb-4 text-text-tertiary">
        {result.trades.length} trades executed
      </Text>

      <View className="mb-4 flex-row flex-wrap gap-3">
        <Metric
          label="Total Return"
          value={formatPercent(result.totalReturnPercent)}
          positive={isPositive}
        />
        <Metric label="Win Rate" value={formatPercent(result.winRate, { showSign: false })} />
        <Metric label="Max Drawdown" value={formatPercent(-result.maxDrawdown, { showSign: false })} />
        <Metric label="Sharpe Ratio" value={formatNumber(result.sharpeRatio, 2)} />
        <Metric label="Profit Factor" value={formatNumber(result.profitFactor, 2)} />
        <Metric label="Final Capital" value={`$${formatNumber(result.finalCapital, 2)}`} positive={isPositive} />
      </View>

      {result.trades.length > 0 ? (
        <View>
          <Text variant="label" className="mb-2">
            Recent Trades
          </Text>
          {result.trades.slice(-5).reverse().map((trade, index) => (
            <View
              key={`${trade.entryIndex}-${trade.exitIndex}-${index}`}
              className="mb-2 flex-row items-center justify-between rounded-lg bg-surface p-2"
            >
              <Text variant="caption">
                #{result.trades.length - index} · {formatNumber(trade.entryPrice, 2)} → {formatNumber(trade.exitPrice, 2)}
              </Text>
              <Text
                variant="caption"
                className={trade.pnl >= 0 ? 'text-bullish' : 'text-bearish'}
              >
                {formatPercent(trade.pnlPercent)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </GlassCard>
  );
}

function Metric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <View className="min-w-[45%] flex-1 rounded-xl bg-surface p-3">
      <Text variant="caption" className="text-text-tertiary">
        {label}
      </Text>
      <Text
        variant="mono"
        className={positive !== undefined ? (positive ? 'text-bullish' : 'text-bearish') : undefined}
      >
        {value}
      </Text>
    </View>
  );
}
