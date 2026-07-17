import { fetchQuote } from '@/features/markets/services/market-data.service';
import { notificationService } from '@/features/notifications/services/notification.service';

import { getAlerts, markAlertTriggered } from './alert.service';
import { shouldTriggerAlert } from './alert-rules';

const EVALUATION_INTERVAL_MS = 45_000;

export { shouldTriggerAlert } from './alert-rules';

export async function evaluateAlertsForUser(uid: string): Promise<number> {
  const alerts = await getAlerts(uid);
  const active = alerts.filter((a) => a.isActive && !a.triggeredAt);
  if (!active.length) return 0;

  const symbols = [...new Set(active.map((a) => a.symbol))];
  const priceMap = new Map<string, number>();

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await fetchQuote(symbol);
        priceMap.set(symbol.toUpperCase(), quote.price);
      } catch {
        // skip symbol if quote unavailable
      }
    }),
  );

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
    if (cancelled) return;
    try {
      const count = await evaluateAlertsForUser(uid);
      onTick?.(count);
    } catch {
      // silent — will retry next interval
    }
  };

  void run();
  const timer = setInterval(() => void run(), EVALUATION_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}

export { EVALUATION_INTERVAL_MS };
