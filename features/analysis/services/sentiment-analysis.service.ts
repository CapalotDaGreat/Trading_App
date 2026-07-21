import { apiClient } from '@/shared/services/api/api-client';

export type SentimentLevel = 'very_bearish' | 'bearish' | 'neutral' | 'bullish' | 'very_bullish';

export interface SentimentSource {
  name: string;
  score: number;
  level: SentimentLevel;
  volume?: number;
}

export interface SentimentAnalysis {
  symbol: string;
  overallScore: number;
  overallLevel: SentimentLevel;
  sources: SentimentSource[];
  newsSentiment: SentimentLevel;
  socialSentiment: SentimentLevel;
  analystSentiment: SentimentLevel;
  fearGreedContribution: number;
  summary: string;
  updatedAt: number;
  source: 'remote' | 'mock';
}

function scoreToLevel(score: number): SentimentLevel {
  if (score >= 80) return 'very_bullish';
  if (score >= 60) return 'bullish';
  if (score >= 40) return 'neutral';
  if (score >= 20) return 'bearish';
  return 'very_bearish';
}

function buildMockSentiment(symbol: string): SentimentAnalysis {
  const overallScore = 58;
  return {
    symbol,
    overallScore,
    overallLevel: scoreToLevel(overallScore),
    sources: [
      { name: 'News', score: 55, level: 'neutral', volume: 142 },
      { name: 'Social Media', score: 62, level: 'bullish', volume: 8_400 },
      { name: 'Analyst Ratings', score: 68, level: 'bullish' },
      { name: 'Options Flow', score: 48, level: 'neutral' },
    ],
    newsSentiment: 'neutral',
    socialSentiment: 'bullish',
    analystSentiment: 'bullish',
    fearGreedContribution: 52,
    summary: `Demo sentiment for ${symbol} is moderately bullish. Sample social and analyst inputs lean positive while sample news is neutral.`,
    updatedAt: Date.now(),
    source: 'mock',
  };
}

export async function getSentimentAnalysis(symbol: string): Promise<SentimentAnalysis> {
  try {
    const analysis = await apiClient.get<SentimentAnalysis>(
      `/analysis/sentiment/${encodeURIComponent(symbol)}`,
      { rateLimitKey: 'analysis' },
    );
    return { ...analysis, source: 'remote' };
  } catch {
    return buildMockSentiment(symbol);
  }
}

export function levelToColor(level: SentimentLevel): string {
  switch (level) {
    case 'very_bullish':
    case 'bullish':
      return 'text-bullish';
    case 'very_bearish':
    case 'bearish':
      return 'text-bearish';
    default:
      return 'text-text-secondary';
  }
}

export function levelToLabel(level: SentimentLevel): string {
  return level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
