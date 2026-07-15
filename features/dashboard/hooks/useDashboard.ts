import { useQuery } from '@tanstack/react-query';

import { MARKET_DATA_POLICY } from '@/features/markets/constants/freshness';

import { getDashboard } from '../services/dashboard.service';

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

export function useDashboard() {
  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: getDashboard,
    staleTime: MARKET_DATA_POLICY.dashboardStaleMs,
    refetchInterval: MARKET_DATA_POLICY.dashboardRefetchMs,
    refetchOnReconnect: true,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
