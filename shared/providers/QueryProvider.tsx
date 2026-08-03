import { AppState, type AppStateStatus, Platform } from 'react-native';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

import { MARKET_DATA_POLICY } from '@/features/markets/constants/freshness';

const GC_TIME = 5 * 60 * 1000;

async function probeOnline(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: MARKET_DATA_POLICY.quoteStaleMs,
        gcTime: GC_TIME,
        retry: (failureCount, error) => {
          const message = String((error as { message?: string })?.message ?? '').toLowerCase();
          if (message.includes('401') || message.includes('403') || message.includes('quota')) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        // Reconnect refetch is gated by onlineManager; market hooks keep their own staleTime.
        refetchOnReconnect: true,
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
    onlineManager.setEventListener((setOnline) => {
      let cancelled = false;
      const push = async () => {
        const online = await probeOnline();
        if (!cancelled) setOnline(online);
      };
      void push();
      const interval = setInterval(() => void push(), 30_000);
      const appSub = AppState.addEventListener('change', (status) => {
        if (status === 'active') void push();
      });

      const onWebOnline = () => setOnline(true);
      const onWebOffline = () => setOnline(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.addEventListener('online', onWebOnline);
        window.addEventListener('offline', onWebOffline);
      }

      return () => {
        cancelled = true;
        clearInterval(interval);
        appSub.remove();
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.removeEventListener('online', onWebOnline);
          window.removeEventListener('offline', onWebOffline);
        }
      };
    });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { QueryClient };
