import { recordDailyCounter } from './aggregates';

export type SubOpsEvent =
  | 'trial_start'
  | 'trial_convert'
  | 'renew'
  | 'cancel'
  | 'expire'
  | 'refund'
  | 'initial_purchase';

/** Subscription funnel counters — product class only, never receipts or PII. */
export async function recordSubscriptionOps(
  event: SubOpsEvent,
  planId: 'monthly' | 'yearly' | 'lifetime' | null,
): Promise<void> {
  const fields: Record<string, number> = {
    events: 1,
    [`evt_${event}`]: 1,
  };
  if (planId) fields[`plan_${planId}`] = 1;
  await recordDailyCounter('subs', fields);
}

export function mapWebhookTypeToSubOps(type: string): SubOpsEvent | null {
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'NON_RENEWING_PURCHASE':
      return 'initial_purchase';
    case 'RENEWAL':
      return 'renew';
    case 'CANCELLATION':
      return 'cancel';
    case 'EXPIRATION':
      return 'expire';
    case 'REFUND':
      return 'refund';
    default:
      return null;
  }
}
