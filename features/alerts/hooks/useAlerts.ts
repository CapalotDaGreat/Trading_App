import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { getTierLimits, hasReachedLimit } from '@/shared/constants/subscription';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import {
  createAlert,
  deleteAlert,
  getAlerts,
  toggleAlert,
  updateAlert,
  type CreateAlertInput,
  type UpdateAlertInput,
} from '../services/alert.service';

const alertsQueryKey = (uid: string | undefined) => ['alerts', uid] as const;

export function useAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid;
  const tier = useSubscriptionStore((s) => s.tier);
  const alertLimit = getTierLimits(tier).alertsMax;

  const alertsQuery = useQuery({
    queryKey: alertsQueryKey(uid),
    queryFn: () => getAlerts(uid!),
    enabled: Boolean(uid),
  });

  const alerts = alertsQuery.data ?? [];
  const activeCount = alerts.filter((a) => a.isActive).length;
  const canCreateAlert = !hasReachedLimit(alerts.length, alertLimit);

  const createMutation = useMutation({
    mutationFn: (input: CreateAlertInput) => {
      if (!canCreateAlert) {
        throw new Error(`Alert limit reached (${alertLimit}). Upgrade to add more.`);
      }
      return createAlert(uid!, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertsQueryKey(uid) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ alertId, updates }: { alertId: string; updates: UpdateAlertInput }) =>
      updateAlert(uid!, alertId, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertsQueryKey(uid) });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ alertId, isActive }: { alertId: string; isActive: boolean }) =>
      toggleAlert(uid!, alertId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertsQueryKey(uid) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (alertId: string) => deleteAlert(uid!, alertId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertsQueryKey(uid) });
    },
  });

  return {
    alerts,
    activeCount,
    alertLimit,
    canCreateAlert,
    isLoading: alertsQuery.isLoading,
    isError: alertsQuery.isError,
    error: alertsQuery.error,
    refetch: alertsQuery.refetch,
    createAlert: createMutation.mutateAsync,
    updateAlert: updateMutation.mutateAsync,
    toggleAlert: toggleMutation.mutateAsync,
    deleteAlert: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
