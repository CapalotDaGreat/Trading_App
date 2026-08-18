export type RecoverableErrorKind =
  | 'offline'
  | 'timeout'
  | 'network'
  | 'auth'
  | 'quota'
  | 'subscription'
  | 'permission'
  | 'unknown';

export interface RecoverableError {
  kind: RecoverableErrorKind;
  /** What happened */
  title: string;
  /** Why it happened */
  why: string;
  /** How to recover */
  recovery: string;
  actionLabel: string;
  secondaryActionLabel?: string;
  secondaryHref?: string;
}

function messageOf(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message ?? '');
  }
  return '';
}

function codeOf(error: unknown): string | number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const e = error as { code?: string | number; status?: number; name?: string };
  return e.code ?? e.status ?? e.name;
}

/**
 * Map thrown errors / failed queries into consistent, recoverable UX copy.
 * Decision-first: never invent market outcomes in recovery messaging.
 */
export function mapRecoverableError(
  error: unknown,
  context?: { offline?: boolean },
): RecoverableError {
  const message = messageOf(error).toLowerCase();
  const code = codeOf(error);

  if (context?.offline) {
    return {
      kind: 'offline',
      title: 'You’re offline',
      why: 'This screen needs a network connection for live or delayed market data.',
      recovery: 'Reconnect, then retry. Demo and local journal data still work offline.',
      actionLabel: 'Retry',
    };
  }

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    code === 'TIMEOUT' ||
    code === 408
  ) {
    return {
      kind: 'timeout',
      title: 'Request timed out',
      why: 'The server took too long to respond — often a slow connection or busy vendor API.',
      recovery: 'Wait a moment and try again. Your decision log and journal stay local.',
      actionLabel: 'Try again',
    };
  }

  if (
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    code === 'NETWORK_ERROR'
  ) {
    return {
      kind: 'network',
      title: 'Network error',
      why: 'We couldn’t reach TradeInsight services or a market-data vendor.',
      recovery: 'Check Wi‑Fi or cellular, then retry. Guest/demo mode can continue with sample data.',
      actionLabel: 'Retry',
    };
  }

  if (
    message.includes('auth') ||
    message.includes('unauthenticated') ||
    message.includes('permission-denied') ||
    code === 401 ||
    code === 403 ||
    code === 'unauthenticated'
  ) {
    return {
      kind: 'auth',
      title: 'Sign-in required',
      why: 'This action needs an authenticated session, or your session expired.',
      recovery: 'Sign in again. Guest mode remains available for local educational use.',
      actionLabel: 'Sign in',
      secondaryActionLabel: 'Continue as guest',
      secondaryHref: '/(auth)/welcome',
    };
  }

  if (
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many') ||
    code === 429
  ) {
    return {
      kind: 'quota',
      title: 'Usage limit reached',
      why: 'AI or market-data quota for this period is exhausted.',
      recovery: 'Wait for the reset window, reduce refresh aggressiveness, or review Premium limits.',
      actionLabel: 'Got it',
      secondaryActionLabel: 'View subscription',
      secondaryHref: '/subscription',
    };
  }

  if (
    message.includes('subscription') ||
    message.includes('entitlement') ||
    message.includes('premium') ||
    code === 'PURCHASES_ERROR'
  ) {
    return {
      kind: 'subscription',
      title: 'Subscription issue',
      why: 'We couldn’t verify Premium entitlement with the store or RevenueCat.',
      recovery: 'Restore purchases, or manage billing in the App Store / Play Store.',
      actionLabel: 'Restore purchases',
      secondaryActionLabel: 'Manage subscription',
      secondaryHref: '/subscription',
    };
  }

  if (message.includes('permission') || code === 'PERMISSION_DENIED') {
    return {
      kind: 'permission',
      title: 'Permission needed',
      why: 'A system permission (notifications, biometrics, or screen capture) is blocked.',
      recovery: 'Open system Settings for TradeInsight and enable the required permission.',
      actionLabel: 'Open settings',
    };
  }

  return {
    kind: 'unknown',
    title: 'Something went wrong',
    why: message
      ? `Details: ${messageOf(error)}`
      : 'An unexpected error interrupted this screen.',
    recovery: 'Retry the action. If it keeps happening, enable crash reporting in Privacy to help us fix it.',
    actionLabel: 'Try again',
  };
}
