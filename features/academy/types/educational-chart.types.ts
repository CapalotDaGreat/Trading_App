import type { Candle } from '@/shared/types/market';

/** Synthetic educational scenes — never live market data. */
export type EducationalChartKind =
  | 'candles'
  | 'support_resistance'
  | 'trend'
  | 'volume'
  | 'rsi'
  | 'moving_average'
  | 'breakout'
  | 'macd'
  | 'risk_reward';

export type EducationalTone = 'bullish' | 'bearish' | 'accent' | 'neutral' | 'warning';

export interface EducationalChartExercise {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface EducationalChartSpec {
  id: string;
  kind: EducationalChartKind;
  title: string;
  caption: string;
  exercise?: EducationalChartExercise;
}

export type EducationalAnnotation =
  | {
      type: 'hline';
      price: number;
      label: string;
      tone: EducationalTone;
    }
  | {
      type: 'zone';
      fromPrice: number;
      toPrice: number;
      label: string;
      tone: EducationalTone;
    }
  | {
      type: 'marker';
      index: number;
      label: string;
      tone: EducationalTone;
    }
  | {
      type: 'label';
      index: number;
      price: number;
      text: string;
      tone: EducationalTone;
    };

export interface EducationalOscillatorBand {
  value: number;
  label: string;
}

export interface EducationalChartModel {
  kind: EducationalChartKind;
  candles: Candle[];
  /** Volume shown as a labelled histogram under price. */
  showVolume: boolean;
  overlay: { values: Array<number | null>; label: string } | null;
  oscillator: {
    values: Array<number | null>;
    label: string;
    min: number;
    max: number;
    bands: EducationalOscillatorBand[];
  } | null;
  annotations: EducationalAnnotation[];
  spokenSummary: string;
}
