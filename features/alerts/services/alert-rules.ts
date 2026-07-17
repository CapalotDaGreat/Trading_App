import type { PriceAlert } from '@/shared/types/market';

export function shouldTriggerAlert(alert: PriceAlert, currentPrice: number): boolean {
  if (!alert.isActive || alert.triggeredAt) return false;

  if (alert.condition === 'above') {
    return currentPrice >= alert.targetPrice;
  }
  return currentPrice <= alert.targetPrice;
}
