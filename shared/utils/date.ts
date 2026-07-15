const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp;

  if (diff < 0) return 'just now';
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes}m ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours}h ago`;
  }
  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return `${days}d ago`;
  }

  return formatDate(timestamp, { month: 'short', day: 'numeric' });
}

export function formatDate(
  timestamp: number,
  options?: Intl.DateTimeFormatOptions,
  locale = 'en-US',
): string {
  return new Date(timestamp).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatTime(
  timestamp: number,
  options?: Intl.DateTimeFormatOptions,
  locale = 'en-US',
): string {
  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

export function formatDateTime(timestamp: number, locale = 'en-US'): string {
  return `${formatDate(timestamp, undefined, locale)} ${formatTime(timestamp, undefined, locale)}`;
}

export function formatMarketTime(timestamp: number, timezone = 'America/New_York'): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short',
  });
}

export function isToday(timestamp: number, now: number = Date.now()): boolean {
  const date = new Date(timestamp);
  const today = new Date(now);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function endOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function daysAgo(days: number, from: number = Date.now()): number {
  return from - days * DAY;
}

export function toISODate(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0] ?? '';
}

export function parseTimestamp(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}
