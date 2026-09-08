import { AppState, type AppStateStatus, Platform } from 'react-native';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

import { subscribeReachability } from '@/shared/services/network/reachability';

const GC_TIME = 15 * 60 * 1000;
/** Coaching / journal / settings default. Market hooks keep quoteStaleMs. */
const DEFAULT_STALE_MS = 30_000;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_MS,
        gcTime: GC_TIME,
        retry: (failureCount, error) => {
          const message = String((error as { message?: string })?.message ?? '').toLowerCase();
          if (message.includes('401') || message.includes('403') || message.includes('quota')) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        placeholderData: (previousData: unknown) => previousData,
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

  useEffect(() => {
    onlineManager.setEventListener((setOnline) => subscribeReachability(setOnline));
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { QueryClient };
