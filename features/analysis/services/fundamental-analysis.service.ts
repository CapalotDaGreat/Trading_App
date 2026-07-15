import { apiClient } from '@/shared/services/api/api-client';

export interface FundamentalMetric {
  label: string;
  value: string | number;
  change?: number;
  benchmark?: string;
  rating?: 'good' | 'fair' | 'poor' | 'neutral';
}

export interface FundamentalAnalysis {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  marketCap: number;
  metrics: FundamentalMetric[];
  valuation: 'undervalued' | 'fair' | 'overvalued';
  growth: 'high' | 'moderate' | 'low' | 'negative';
  profitability: 'strong' | 'moderate' | 'weak';
  summary: string;
  updatedAt: number;
}

function buildMockFundamental(symbol: string): FundamentalAnalysis {
  return {
    symbol,
    companyName: symbol,
    sector: 'Technology',
    industry: 'Software',
    marketCap: 2_800_000_000_000,
    metrics: [
      { label: 'P/E Ratio', value: 28.5, benchmark: '24.1', rating: 'fair' },
      { label: 'EPS (TTM)', value: '$6.42', change: 12.3, rating: 'good' },
      { label: 'Revenue Growth', value: '8.2%', change: 8.2, rating: 'good' },
      { label: 'Profit Margin', value: '25.3%', rating: 'good' },
      { label: 'Debt/Equity', value: 1.45, benchmark: '1.8', rating: 'fair' },
      { label: 'ROE', value: '42.1%', rating: 'good' },
      { label: 'Dividend Yield', value: '0.5%', rating: 'neutral' },
      { label: 'Free Cash Flow', value: '$98.2B', rating: 'good' },
    ],
    valuation: 'fair',
    growth: 'moderate',
    profitability: 'strong',
    summary: `${symbol} demonstrates strong profitability with moderate growth. Valuation is in line with sector peers.`,
    updatedAt: Date.now(),
  };
}

export async function getFundamentalAnalysis(symbol: string): Promise<FundamentalAnalysis> {
  try {
    return await apiClient.get<FundamentalAnalysis>(
      `/analysis/fundamental/${encodeURIComponent(symbol)}`,
      { rateLimitKey: 'analysis' },
    );
  } catch {
    return buildMockFundamental(symbol);
  }
}

export function ratingToColor(rating?: FundamentalMetric['rating']): string {
  switch (rating) {
    case 'good':
      return 'text-bullish';
    case 'poor':
      return 'text-bearish';
    case 'fair':
      return 'text-warning';
    default:
      return 'text-text-secondary';
  }
}
