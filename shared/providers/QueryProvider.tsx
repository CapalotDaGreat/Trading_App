import { AppState, type AppStateStatus, Platform } from 'react-native';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

import { MARKET_DATA_POLICY } from '@/features/markets/constants/freshness';

const GC_TIME = 5 * 60 * 1000;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: MARKET_DATA_POLICY.quoteStaleMs,
        gcTime: GC_TIME,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  // Silence unused onlineManager when NetInfo isn't wired — keep default.
  void onlineManager;

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { QueryClient };
