const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(
  currency: string,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): Intl.NumberFormat {
  const key = `${currency}-${minimumFractionDigits}-${maximumFractionDigits}`;
  let formatter = CURRENCY_FORMATTERS.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    });
    CURRENCY_FORMATTERS.set(key, formatter);
  }

  return formatter;
}

export function formatPrice(
  value: number,
  currency = 'USD',
  options?: { compact?: boolean; decimals?: number },
): string {
  if (!Number.isFinite(value)) return '—';

  if (options?.compact && Math.abs(value) >= 1_000_000) {
    return formatCompactNumber(value, { prefix: getCurrencySymbol(currency) });
  }

  const decimals = options?.decimals ?? getPriceDecimals(value);
  return getCurrencyFormatter(currency, decimals, decimals).format(value);
}

export function formatPercent(
  value: number,
  options?: { showSign?: boolean; decimals?: number },
): string {
  if (!Number.isFinite(value)) return '—';

  const decimals = options?.decimals ?? 2;
  const sign = options?.showSign !== false && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatChange(value: number, currency = 'USD'): string {
  if (!Number.isFinite(value)) return '—';

  const sign = value > 0 ? '+' : '';
  const decimals = getPriceDecimals(Math.abs(value));
  const formatted = getCurrencyFormatter(currency, decimals, decimals).format(Math.abs(value));

  return `${sign}${value < 0 ? '-' : ''}${formatted.replace('-', '')}`;
}

export function formatVolume(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return formatCompactNumber(value);
}

export function formatCompactNumber(
  value: number,
  options?: { prefix?: string; suffix?: string; decimals?: number },
): string {
  if (!Number.isFinite(value)) return '—';

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const prefix = options?.prefix ?? '';
  const suffix = options?.suffix ?? '';
  const decimals = options?.decimals ?? 2;

  if (abs >= 1_000_000_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000_000_000).toFixed(decimals)}T${suffix}`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000_000).toFixed(decimals)}B${suffix}`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000).toFixed(decimals)}M${suffix}`;
  }
  if (abs >= 1_000) {
    return `${sign}${prefix}${(abs / 1_000).toFixed(decimals)}K${suffix}`;
  }

  return `${sign}${prefix}${abs.toFixed(decimals)}${suffix}`;
}

export function formatMarketCap(value: number, currency = 'USD'): string {
  return formatCompactNumber(value, { prefix: getCurrencySymbol(currency) });
}

export function getPriceDecimals(price: number): number {
  const abs = Math.abs(price);
  if (abs >= 1000) return 2;
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  return 6;
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    BTC: '₿',
  };
  return symbols[currency] ?? `${currency} `;
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getPriceColorClass(change: number): string {
  if (change > 0) return 'text-bullish';
  if (change < 0) return 'text-bearish';
  return 'text-text-secondary';
}

export function getPriceBgColorClass(change: number): string {
  if (change > 0) return 'bg-bullish-muted';
  if (change < 0) return 'bg-bearish-muted';
  return 'bg-surface';
}
