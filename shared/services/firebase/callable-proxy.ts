import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';

import { auth, canUseFirestore, DEMO_USER_UID, requireFunctions } from '@/firebase/config';
import { logger } from '@/shared/services/observability/logger';

export class ProxyError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ProxyError';
    this.code = code;
  }

  get isAppCheckFailure(): boolean {
    return (
      this.code === 'failed-precondition' &&
      /verify this app installation/i.test(this.message)
    );
  }

  get isQuota(): boolean {
    return this.code === 'resource-exhausted';
  }
}

/** True when the current Firebase user can call secret-backed vendor proxies. */
export function canUseVendorProxy(): boolean {
  const uid = auth?.currentUser?.uid;
  return canUseFirestore(uid) && uid !== DEMO_USER_UID;
}

/**
 * Dev-only: allow direct vendor keys when explicitly enabled.
 * Production EAS profiles must omit EXPO_PUBLIC vendor keys.
 */
export function allowDevDirectVendors(): boolean {
  return (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    process.env.EXPO_PUBLIC_MARKET_DATA_DIRECT === 'true'
  );
}

export async function callProxy<TData, TResult>(
  name: string,
  data: TData,
): Promise<TResult> {
  if (!canUseVendorProxy()) {
    throw new ProxyError('unauthenticated', 'Sign in required for live market data.');
  }

  try {
    const callable = httpsCallable<TData, TResult>(requireFunctions(), name);
    const result: HttpsCallableResult<TResult> = await callable(data);
    return result.data;
  } catch (error) {
    if (error instanceof FirebaseError) {
      const message =
        error.code === 'functions/failed-precondition' &&
        /app installation/i.test(error.message)
          ? 'Couldn’t verify this app installation. Update the app or try again later.'
          : error.message.replace(/^Firebase:\s*/i, '').replace(/\s*\([^)]*\)\s*$/, '');
      logger.warn('callable_proxy.failed', { name, code: error.code });
      throw new ProxyError(error.code.replace(/^functions\//, ''), message);
    }
    throw error;
  }
}
