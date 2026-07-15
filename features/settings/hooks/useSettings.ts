import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { settingsService } from '@/features/settings/services/settings.service';
import type {
  NotificationSettings,
  PrivacySettings,
  SettingsUpdatePayload,
} from '@/features/settings/types/settings.types';

const SETTINGS_QUERY_KEY = 'app-settings';

export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: () => settingsService.getSettings(),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: SettingsUpdatePayload) => settingsService.updateSettings(updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
    },
  });

  const notificationMutation = useMutation({
    mutationFn: (updates: Partial<NotificationSettings>) =>
      settingsService.updateNotificationSettings(updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
    },
  });

  const privacyMutation = useMutation({
    mutationFn: (updates: Partial<PrivacySettings>) =>
      settingsService.updatePrivacySettings(updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
    },
  });

  const sync = useCallback(async () => {
    if (!user?.uid) return;
    await settingsService.syncToFirestore(user.uid);
    await queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
  }, [user?.uid, queryClient]);

  return {
    settings: settingsQuery.data ?? settingsService.getSettings(),
    notifications: settingsService.getNotificationSettings(),
    privacy: settingsService.getPrivacySettings(),
    isLoading: settingsQuery.isLoading,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateNotifications: notificationMutation.mutateAsync,
    updatePrivacy: privacyMutation.mutateAsync,
    resetToDefaults: settingsService.resetToDefaults,
    sync,
  };
}
