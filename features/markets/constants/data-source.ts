export type DataSourceKind = 'live' | 'delayed' | 'approximate' | 'sample' | 'mock';

export const DATA_SOURCE_LABEL: Record<DataSourceKind, string> = {
  live: 'Live',
  delayed: 'Delayed',
  approximate: 'Approx. chart',
  sample: 'Sample data',
  mock: 'Demo data',
};
