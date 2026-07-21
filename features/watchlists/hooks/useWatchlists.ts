import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import {
  addSymbolToWatchlist,
  createWatchlist,
  deleteWatchlist,
  getWatchlists,
  removeSymbolFromWatchlist,
  updateWatchlist,
  type CreateWatchlistInput,
  type UpdateWatchlistInput,
  type Watchlist,
} from '../services/watchlist.service';

export const watchlistKeys = {
  all: ['watchlists'] as const,
  list: (uid: string) => [...watchlistKeys.all, uid] as const,
};

export function useWatchlists() {
  const { user } = useAuth();
  const uid = user?.uid;
  const tier = useSubscriptionStore((s) => s.tier);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: watchlistKeys.list(uid ?? ''),
    queryFn: () => getWatchlists(uid!),
    enabled: Boolean(uid),
  });

  const invalidate = () => {
    if (uid) {
      void queryClient.invalidateQueries({ queryKey: watchlistKeys.list(uid) });
    }
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateWatchlistInput) => createWatchlist(uid!, input, tier),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateWatchlistInput }) =>
      updateWatchlist(uid!, id, updates, tier),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWatchlist(uid!, id),
    onSuccess: invalidate,
  });

  const addSymbolMutation = useMutation({
    mutationFn: ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) =>
      addSymbolToWatchlist(uid!, watchlistId, symbol, tier),
    onSuccess: invalidate,
  });

  const removeSymbolMutation = useMutation({
    mutationFn: ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) =>
      removeSymbolFromWatchlist(uid!, watchlistId, symbol),
    onSuccess: invalidate,
  });

  return {
    watchlists: query.data ?? ([] as Watchlist[]),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createWatchlist: createMutation.mutateAsync,
    updateWatchlist: updateMutation.mutateAsync,
    deleteWatchlist: deleteMutation.mutateAsync,
    addSymbol: addSymbolMutation.mutateAsync,
    removeSymbol: removeSymbolMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    tier,
  };
}
