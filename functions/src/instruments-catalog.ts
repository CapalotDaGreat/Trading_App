/** Server-side curated instruments for resolve / create validation (no client secrets). */

export interface ServerInstrument {
  id: string;
  symbol: string;
  canonicalSymbol: string;
  name: string;
  marketType: string;
  assetClass: string;
  currency: string;
  exchange?: string;
  provider: string;
  providerSymbol: string;
  aliases: string[];
}

export const SERVER_CANONICAL_INSTRUMENTS: ServerInstrument[] = [
  {
    id: 'equity:AAPL',
    symbol: 'AAPL',
    canonicalSymbol: 'AAPL',
    name: 'Apple Inc.',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    exchange: 'NASDAQ',
    provider: 'finnhub',
    providerSymbol: 'AAPL',
    aliases: ['APPLE', 'APPLE INC', 'APPLE INC.'],
  },
  {
    id: 'equity:MSFT',
    symbol: 'MSFT',
    canonicalSymbol: 'MSFT',
    name: 'Microsoft Corporation',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'MSFT',
    aliases: ['MICROSOFT'],
  },
  {
    id: 'equity:NVDA',
    symbol: 'NVDA',
    canonicalSymbol: 'NVDA',
    name: 'NVIDIA Corporation',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'NVDA',
    aliases: ['NVIDIA', 'NVIDIA CORPORATION'],
  },
  {
    id: 'equity:TSLA',
    symbol: 'TSLA',
    canonicalSymbol: 'TSLA',
    name: 'Tesla Inc.',
    marketType: 'stocks',
    assetClass: 'equity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'TSLA',
    aliases: ['TESLA'],
  },
  {
    id: 'etf:SPY',
    symbol: 'SPY',
    canonicalSymbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    marketType: 'indices',
    assetClass: 'etf',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'SPY',
    aliases: ['S&P 500', 'S&P500', 'SPX'],
  },
  {
    id: 'crypto:BTC-USD',
    symbol: 'BTC/USD',
    canonicalSymbol: 'BTC/USD',
    name: 'Bitcoin',
    marketType: 'crypto',
    assetClass: 'crypto',
    currency: 'USD',
    provider: 'coingecko',
    providerSymbol: 'bitcoin',
    aliases: ['BTC', 'BITCOIN', 'BTCUSD'],
  },
  {
    id: 'crypto:ETH-USD',
    symbol: 'ETH/USD',
    canonicalSymbol: 'ETH/USD',
    name: 'Ethereum',
    marketType: 'crypto',
    assetClass: 'crypto',
    currency: 'USD',
    provider: 'coingecko',
    providerSymbol: 'ethereum',
    aliases: ['ETH', 'ETHEREUM'],
  },
  {
    id: 'forex:EUR-USD',
    symbol: 'EUR/USD',
    canonicalSymbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    marketType: 'forex',
    assetClass: 'forex',
    currency: 'USD',
    provider: 'exchange-rate-api',
    providerSymbol: 'EUR/USD',
    aliases: ['EURUSD', 'EURO'],
  },
  {
    id: 'commodity:XAU-USD',
    symbol: 'XAU/USD',
    canonicalSymbol: 'XAU/USD',
    name: 'Gold',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'GC=F',
    aliases: ['GOLD', 'XAUUSD', 'XAU'],
  },
  {
    id: 'commodity:XAG-USD',
    symbol: 'XAG/USD',
    canonicalSymbol: 'XAG/USD',
    name: 'Silver',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'SI=F',
    aliases: ['SILVER', 'XAGUSD'],
  },
  {
    id: 'commodity:CL-F',
    symbol: 'CL=F',
    canonicalSymbol: 'CL=F',
    name: 'WTI Crude Oil',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'CL=F',
    aliases: ['OIL', 'WTI', 'CRUDE'],
  },
  {
    id: 'commodity:BZ-F',
    symbol: 'BZ=F',
    canonicalSymbol: 'BZ=F',
    name: 'Brent Crude Oil',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'BZ=F',
    aliases: ['BRENT', 'BRENT CRUDE'],
  },
  {
    id: 'commodity:HG-F',
    symbol: 'HG=F',
    canonicalSymbol: 'HG=F',
    name: 'Copper',
    marketType: 'commodities',
    assetClass: 'commodity',
    currency: 'USD',
    provider: 'finnhub',
    providerSymbol: 'HG=F',
    aliases: ['COPPER'],
  },
];

function key(value: string): string {
  return value.toUpperCase().replace(/\s+/g, ' ').trim();
}

export function findServerCanonical(query: string): ServerInstrument | undefined {
  const q = key(query);
  for (const item of SERVER_CANONICAL_INSTRUMENTS) {
    const keys = [item.canonicalSymbol, item.symbol, item.name, ...item.aliases].map(key);
    if (keys.includes(q)) return item;
  }
  return undefined;
}

export function getServerInstrumentById(id: string): ServerInstrument | undefined {
  return SERVER_CANONICAL_INSTRUMENTS.find((item) => item.id === id);
}

export function sanitizeInstrumentDto(item: ServerInstrument) {
  return {
    id: item.id,
    symbol: item.symbol,
    canonicalSymbol: item.canonicalSymbol,
    name: item.name,
    marketType: item.marketType,
    assetClass: item.assetClass,
    currency: item.currency,
    exchange: item.exchange ?? null,
    provider: item.provider,
    providerSymbol: item.providerSymbol,
  };
}
