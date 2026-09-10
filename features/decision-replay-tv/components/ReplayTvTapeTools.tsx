import { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  measureRange,
  visibleRsi,
  visibleSma,
  type ReplayTapeOverlay,
  type ReplayTapeTimeframe,
} from '@/features/decision-replay-tv/services/replay-tv-chart-tools.service';
import type { ReplayTvAnnotation } from '@/features/decision-replay-tv/types/replay-tv.types';
import { Button } from '@/shared/components/ui/Button';
import { Chip } from '@/shared/components/ui/Chip';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import type { Candle } from '@/shared/types/market';

interface ReplayTvTapeToolsProps {
  candles: Candle[];
  annotations: ReplayTvAnnotation[];
  onAnnotationsChange: (next: ReplayTvAnnotation[]) => void;
  onTimeframeChange: (timeframe: ReplayTapeTimeframe) => void;
}

export function ReplayTvTapeTools({
  candles,
  annotations,
  onAnnotationsChange,
  onTimeframeChange,
}: ReplayTvTapeToolsProps) {
  const [timeframe, setTimeframe] = useState<ReplayTapeTimeframe>('1d');
  const [overlay, setOverlay] = useState<ReplayTapeOverlay>('none');
  const [level, setLevel] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const sma = useMemo(() => (overlay === 'sma10' ? visibleSma(candles, 10) : null), [candles, overlay]);
  const rsi = useMemo(() => (overlay === 'rsi14' ? visibleRsi(candles, 14) : null), [candles, overlay]);

  const applyTimeframe = (next: ReplayTapeTimeframe) => {
    setTimeframe(next);
    onTimeframeChange(next);
  };

  return (
    <View className="mt-3 gap-2" testID="replay-tv-tape-tools">
      <Text variant="caption" className="text-text-tertiary">
        Tools use only the visible freeze. Indicators never see later bars.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Daily" selected={timeframe === '1d'} onPress={() => applyTimeframe('1d')} />
        <Chip label="Weekly (visible only)" selected={timeframe === '1w'} onPress={() => applyTimeframe('1w')} />
        <Chip label="No overlay" selected={overlay === 'none'} onPress={() => setOverlay('none')} />
        <Chip label="SMA 10" selected={overlay === 'sma10'} onPress={() => setOverlay('sma10')} />
        <Chip label="RSI 14" selected={overlay === 'rsi14'} onPress={() => setOverlay('rsi14')} />
      </View>
      {sma != null ? (
        <Text variant="body-sm" className="text-text-secondary">
          SMA 10 at this freeze: {sma.toFixed(2)}
        </Text>
      ) : null}
      {rsi != null ? (
        <Text variant="body-sm" className="text-text-secondary">
          RSI 14 at this freeze: {rsi.toFixed(1)} — a reading, not a signal.
        </Text>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        <Input
          containerClassName="min-w-[120px] flex-1"
          label="Mark level"
          value={level}
          onChangeText={setLevel}
          keyboardType="decimal-pad"
          placeholder="Support / resistance"
        />
        <Button
          size="sm"
          variant="outline"
          className="self-end"
          onPress={() => {
            const price = Number(level);
            if (!Number.isFinite(price) || price <= 0) return;
            onAnnotationsChange([
              ...annotations,
              { id: `lvl_${annotations.length + 1}`, type: 'level', price, label: `Level ${price}` },
            ]);
            setLevel('');
          }}
        >
          Add
        </Button>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Input
          containerClassName="min-w-[90px] flex-1"
          label="Measure from"
          value={from}
          onChangeText={setFrom}
          keyboardType="decimal-pad"
        />
        <Input
          containerClassName="min-w-[90px] flex-1"
          label="to"
          value={to}
          onChangeText={setTo}
          keyboardType="decimal-pad"
        />
        <Button
          size="sm"
          variant="ghost"
          className="self-end"
          onPress={() => {
            const a = Number(from);
            const b = Number(to);
            if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return;
            const measured = measureRange(a, b);
            onAnnotationsChange([
              ...annotations,
              {
                id: `msr_${annotations.length + 1}`,
                type: 'measure',
                price: a,
                secondPrice: b,
                label: `${measured.distance.toFixed(2)} (${measured.percent.toFixed(1)}%)`,
              },
            ]);
          }}
        >
          Measure
        </Button>
      </View>
      {annotations.map((item) => (
        <Text key={item.id} variant="caption" className="text-text-tertiary">
          {item.type === 'level' ? 'Level' : 'Range'} · {item.label}
        </Text>
      ))}
    </View>
  );
}
