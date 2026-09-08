import { useEffect, useState } from 'react';

import { probeOnline, subscribeReachability } from '@/shared/services/network/reachability';

/**
 * Shared connectivity status — uses the same probe as React Query's onlineManager.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  useEffect(() => {
    return subscribeReachability((online) => {
      setIsOnline(online);
      setCheckedAt(Date.now());
    });
  }, []);

  return { isOnline, checkedAt, refresh: probeOnline };
}
