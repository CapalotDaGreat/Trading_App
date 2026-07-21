import { AppState } from 'react-native';

import { fetchQuotes } from '@/features/markets/services/market-data.service';
import { notificationService } from '@/features/notifications/services/notification.service';
import { logger } from '@/shared/services/observability/logger';

import { shouldTriggerAlert } from './alert-rules';
import { getAlerts, markAlertTriggered } from './alert.service';

const EVALUATION_INTERVAL_MS = 45_000;

export { shouldTriggerAlert } from './alert-rules';

function isAppActive(): boolean {
  if (process.env.NODE_ENV === 'test') return true;
  return AppState.currentState === 'active';
}

export async function evaluateAlertsForUser(uid: string): Promise<number> {
  if (!isAppActive()) return 0;

  const alerts = await getAlerts(uid);
  const active = alerts.filter((a) => a.isActive && !a.triggeredAt);
  if (!active.length) return 0;

  const symbols = [...new Set(active.map((a) => a.symbol))];
  const priceMap = new Map<string, number>();

  try {
    const quotes = await fetchQuotes(symbols);
    for (const quote of quotes) {
      priceMap.set(quote.symbol.toUpperCase(), quote.price);
    }
  } catch (error) {
    logger.warn('alerts.batch_quote_unavailable', { error, symbolCount: symbols.length });
  }

  let triggered = 0;
  for (const alert of active) {
    const price = priceMap.get(alert.symbol.toUpperCase());
    if (price === undefined) continue;
    if (!shouldTriggerAlert(alert, price)) continue;

    await markAlertTriggered(uid, alert.id);
    await notificationService.scheduleLocalNotification(
      `${alert.symbol} alert`,
      `Price ${alert.condition === 'above' ? 'reached' : 'fell to'} ${price.toFixed(2)} (target ${alert.targetPrice})`,
      { screen: 'markets', symbol: alert.symbol, type: 'price_alert' },
      1,
    );
    triggered += 1;
  }

  return triggered;
}

export function startAlertEvaluationLoop(
  uid: string | null | undefined,
  onTick?: (triggered: number) => void,
): () => void {
  if (!uid) return () => undefined;

  let cancelled = false;

  const run = async () => {
    if (cancelled || !isAppActive()) return;
    try {
      const count = await evaluateAlertsForUser(uid);
      onTick?.(count);
    } catch (error) {
      logger.error('alerts.evaluation_failed', error);
    }
  };

  void run();
  const timer = setInterval(() => void run(), EVALUATION_INTERVAL_MS);

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active' && !cancelled) {
      void run();
    }
  });

  return () => {
    cancelled = true;
    clearInterval(timer);
    subscription.remove();
  };
}

export { EVALUATION_INTERVAL_MS };
