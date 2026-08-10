export type DataSourceKind = 'live' | 'delayed' | 'approximate' | 'sample' | 'mock';

export type MarketDataProvider =
  'coingecko' | 'exchange-rate-api' | 'finnhub' | 'alpha-vantage' | 'sample';

export interface MarketDataProvenance {
  provider: MarketDataProvider;
  fetchedAt: number;
  kind: DataSourceKind;
}

export const DATA_SOURCE_LABEL: Record<DataSourceKind, string> = {
  live: 'Live',
  delayed: 'Delayed',
  approximate: 'Approx. chart',
  sample: 'Sample data',
  mock: 'Demo data',
};
