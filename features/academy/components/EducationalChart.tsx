import { memo, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { Badge } from '@/shared/components/ui/Badge';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { composeChartSpokenSummary } from '@/shared/utils/accessibility';

import { ChartExercise } from './ChartExercise';
import {
  buildEducationalChart,
  educationalPriceRange,
} from '../services/educational-chart.service';
import type { EducationalChartSpec, EducationalTone } from '../types/educational-chart.types';

const PAD = { top: 18, right: 10, bottom: 22, left: 8 };

interface EducationalChartProps {
  spec: EducationalChartSpec;
  height?: number;
}

function toneColor(
  tone: EducationalTone,
  colors: {
    bullish: { primary: string };
    bearish: { primary: string };
    accent: { primary: string };
    warning: { primary: string };
    text: { tertiary: string };
  },
): string {
  if (tone === 'bullish') return colors.bullish.primary;
  if (tone === 'bearish') return colors.bearish.primary;
  if (tone === 'warning') return colors.warning.primary;
  if (tone === 'accent') return colors.accent.primary;
  return colors.text.tertiary;
}

function EducationalChartComponent({ spec, height = 220 }: EducationalChartProps) {
  const { colors } = useTheme();
  const model = useMemo(() => buildEducationalChart(spec.kind), [spec.kind]);
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const oscillatorHeight = model.oscillator ? Math.round(height * 0.32) : 0;
  const volumeHeight = model.showVolume ? 28 : 0;
  const priceHeight = height - oscillatorHeight - volumeHeight;
  const { min, max } = educationalPriceRange(model.candles);
  const range = max - min || 1;

  const chartWidth = Math.max(0, width - PAD.left - PAD.right);
  const candleCount = model.candles.length;
  const step = candleCount > 0 ? chartWidth / candleCount : 0;
  const barWidth = Math.max(3, step * 0.62);

  const priceToY = (price: number) =>
    PAD.top + ((max - price) / range) * (priceHeight - PAD.top - 8);

  const maxVolume = Math.max(...model.candles.map((item) => item.volume), 1);
  const spoken = composeChartSpokenSummary({
    symbol: 'EDU',
    candles: model.candles,
    intervalLabel: 'educational daily example',
    extraNote: model.spokenSummary,
  });

  return (
    <View
      className="overflow-hidden rounded-2xl border border-border bg-background-elevated"
      testID={`educational-chart-${spec.id}`}
    >
      <View className="flex-row items-start justify-between gap-3 px-3 pt-3">
        <View className="min-w-0 flex-1">
          <Text variant="label">{spec.title}</Text>
          <Text variant="caption" className="mt-1 leading-5 text-text-secondary">
            {spec.caption}
          </Text>
        </View>
        <Badge label="Educational example" variant="outline" size="sm" />
      </View>

      <View
        className="mt-2"
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={spoken}
        style={{ height }}
      >
        {width > 0 ? (
          <Svg width={width} height={height}>
            {model.annotations
              .filter((item) => item.type === 'zone')
              .map((zone) => {
                if (zone.type !== 'zone') return null;
                const y1 = priceToY(zone.toPrice);
                const y2 = priceToY(zone.fromPrice);
                return (
                  <Rect
                    key={`zone-${zone.label}`}
                    x={PAD.left}
                    y={Math.min(y1, y2)}
                    width={chartWidth}
                    height={Math.max(4, Math.abs(y2 - y1))}
                    fill={toneColor(zone.tone, colors)}
                    opacity={0.12}
                  />
                );
              })}

            {model.annotations
              .filter((item) => item.type === 'hline')
              .map((line) => {
                if (line.type !== 'hline') return null;
                const y = priceToY(line.price);
                return (
                  <G key={`hline-${line.label}`}>
                    <Line
                      x1={PAD.left}
                      x2={width - PAD.right}
                      y1={y}
                      y2={y}
                      stroke={toneColor(line.tone, colors)}
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                    <SvgText
                      x={width - PAD.right}
                      y={y - 4}
                      fill={toneColor(line.tone, colors)}
                      fontSize={9}
                      textAnchor="end"
                    >
                      {line.label}
                    </SvgText>
                  </G>
                );
              })}

            {model.candles.map((item, index) => {
              const x = PAD.left + index * step + step / 2;
              const bullish = item.close >= item.open;
              const color = bullish ? colors.bullish.primary : colors.bearish.primary;
              const bodyTop = priceToY(Math.max(item.open, item.close));
              const bodyBottom = priceToY(Math.min(item.open, item.close));
              return (
                <G key={item.timestamp}>
                  <Line
                    x1={x}
                    x2={x}
                    y1={priceToY(item.high)}
                    y2={priceToY(item.low)}
                    stroke={color}
                    strokeWidth={1.25}
                  />
                  <Rect
                    x={x - barWidth / 2}
                    y={bodyTop}
                    width={barWidth}
                    height={Math.max(2, bodyBottom - bodyTop)}
                    fill={color}
                  />
                </G>
              );
            })}

            {model.overlay
              ? model.overlay.values.map((value, index) => {
                  const next = model.overlay?.values[index + 1];
                  if (value == null || next == null) return null;
                  const x1 = PAD.left + index * step + step / 2;
                  const x2 = PAD.left + (index + 1) * step + step / 2;
                  return (
                    <Line
                      key={`overlay-${index}`}
                      x1={x1}
                      y1={priceToY(value)}
                      x2={x2}
                      y2={priceToY(next)}
                      stroke={colors.accent.primary}
                      strokeWidth={1.5}
                    />
                  );
                })
              : null}

            {model.annotations
              .filter((item) => item.type === 'marker' || item.type === 'label')
              .map((mark) => {
                const index = mark.type === 'marker' || mark.type === 'label' ? mark.index : 0;
                const x = PAD.left + index * step + step / 2;
                const candle = model.candles[index];
                if (!candle) return null;
                const text = mark.type === 'marker' ? mark.label : mark.text;
                const y =
                  mark.type === 'label' ? priceToY(mark.price) : priceToY(candle.high) - 10;
                return (
                  <SvgText
                    key={`${mark.type}-${text}-${index}`}
                    x={x}
                    y={Math.max(12, y)}
                    fill={toneColor(mark.tone, colors)}
                    fontSize={9}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {text}
                  </SvgText>
                );
              })}

            {model.showVolume
              ? model.candles.map((item, index) => {
                  const x = PAD.left + index * step + step / 2;
                  const h = (item.volume / maxVolume) * (volumeHeight - 4);
                  const bullish = item.close >= item.open;
                  return (
                    <Rect
                      key={`vol-${item.timestamp}`}
                      x={x - barWidth / 2}
                      y={priceHeight + volumeHeight - h}
                      width={barWidth}
                      height={h}
                      fill={bullish ? colors.bullish.primary : colors.bearish.primary}
                      opacity={0.35}
                    />
                  );
                })
              : null}

            {model.oscillator
              ? model.oscillator.bands.map((band) => {
                  const y =
                    priceHeight +
                    volumeHeight +
                    ((model.oscillator!.max - band.value) /
                      (model.oscillator!.max - model.oscillator!.min)) *
                      oscillatorHeight;
                  return (
                    <G key={`band-${band.label}`}>
                      <Line
                        x1={PAD.left}
                        x2={width - PAD.right}
                        y1={y}
                        y2={y}
                        stroke={colors.text.tertiary}
                        strokeDasharray="3 4"
                        strokeWidth={1}
                      />
                      <SvgText
                        x={PAD.left + 2}
                        y={y - 3}
                        fill={colors.text.tertiary}
                        fontSize={8}
                      >
                        {band.label}
                      </SvgText>
                    </G>
                  );
                })
              : null}

            {model.oscillator
              ? model.oscillator.values.map((value, index) => {
                  const next = model.oscillator?.values[index + 1];
                  if (value == null || next == null || !model.oscillator) return null;
                  const yOf = (osc: number) =>
                    priceHeight +
                    volumeHeight +
                    ((model.oscillator!.max - osc) /
                      (model.oscillator!.max - model.oscillator!.min)) *
                      oscillatorHeight;
                  const x1 = PAD.left + index * step + step / 2;
                  const x2 = PAD.left + (index + 1) * step + step / 2;
                  return (
                    <Line
                      key={`osc-${index}`}
                      x1={x1}
                      y1={yOf(value)}
                      x2={x2}
                      y2={yOf(next)}
                      stroke={colors.accent.primary}
                      strokeWidth={1.5}
                    />
                  );
                })
              : null}

            {model.overlay ? (
              <SvgText
                x={PAD.left}
                y={14}
                fill={colors.accent.primary}
                fontSize={9}
              >
                {model.overlay.label}
              </SvgText>
            ) : null}
            {model.oscillator ? (
              <SvgText
                x={PAD.left}
                y={priceHeight + volumeHeight + 12}
                fill={colors.accent.primary}
                fontSize={9}
              >
                {model.oscillator.label}
              </SvgText>
            ) : null}
          </Svg>
        ) : null}
      </View>

      <Text
        variant="caption"
        className="px-3 pb-3 pt-2 leading-5 text-text-secondary"
        testID={`educational-chart-spoken-${spec.id}`}
      >
        {spoken}
      </Text>

      {spec.exercise ? <ChartExercise exercise={spec.exercise} kind={spec.kind} /> : null}
    </View>
  );
}

export const EducationalChart = memo(EducationalChartComponent);
EducationalChart.displayName = 'EducationalChart';
