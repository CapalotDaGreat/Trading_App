import { useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AlertCard } from '@/features/alerts/components/AlertCard';
import { CreateAlertForm } from '@/features/alerts/components/CreateAlertForm';
import { useAlertDeliveryCapability } from '@/features/alerts/hooks/useAlertDeliveryCapability';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { EVALUATION_INTERVAL_MS } from '@/features/alerts/services/alert-evaluator.service';
import { notificationService } from '@/features/notifications/services/notification.service';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

const EVAL_SECONDS = Math.round(EVALUATION_INTERVAL_MS / 1000);

export default function AlertsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const primedRef = useRef(false);
  const capabilityQuery = useAlertDeliveryCapability();
  const {
    alerts,
    alertLimit,
    canCreateAlert,
    isLoading,
    createAlert,
    toggleAlert,
    deleteAlert,
    isCreating,
  } = useAlerts();

  const capability = capabilityQuery.data;
  const summary =
    capability?.summary ??
    `Alerts are checked about every ${EVAL_SECONDS}s while the app is open. Background delivery depends on your build.`;

  // Permission priming: ask at the moment the user creates their first alert,
  // not on app launch, to improve opt-in rates.
  const primeNotificationPermission = async () => {
    if (primedRef.current) return;
    primedRef.current = true;
    try {
      const status = await notificationService.getPermissionStatus();
      if (status === 'undetermined') {
        await notificationService.requestPermissions();
      }
    } catch {
      // non-blocking — alert is still created and evaluated in-app
    }
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Price Alerts" onBack={() => router.back()} />

      <View className="mt-2 gap-7">
        <View
          className="flex-row gap-3 rounded-panel bg-accent-muted p-4"
          accessibilityRole="text"
          accessibilityLabel={summary}
        >
          <Ionicons
            name={
              capability?.backgroundEvaluation
                ? 'notifications-outline'
                : 'information-circle-outline'
            }
            size={18}
            color={colors.accent.primary}
          />
          <Text variant="caption" className="flex-1 leading-relaxed text-text-secondary">
            {summary}
          </Text>
        </View>

        <Text variant="caption" className="text-text-tertiary">
          {alerts.length}/{alertLimit} alerts used
        </Text>

        <CreateAlertForm
          onSubmit={async (input) => {
            await primeNotificationPermission();
            await createAlert(input);
          }}
          isSubmitting={isCreating}
          disabled={!canCreateAlert}
          deliveryHint={
            capability && !capability.backgroundEvaluation
              ? 'This build only notifies while TradeVision is open.'
              : capability?.backgroundEvaluation
                ? 'Background checks are OS-scheduled (often 15+ minutes) — not instant.'
                : undefined
          }
        />

        {!canCreateAlert ? (
          <Text variant="caption" className="text-center text-bearish">
            Alert limit reached. Upgrade for more alerts.
          </Text>
        ) : null}

        <View>
          <Text variant="h3" className="mb-2">
            Active Alerts
          </Text>
          {alerts.length === 0 ? (
            <EmptyState title="No alerts" description="Create a price alert above." />
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={(id, isActive) => void toggleAlert({ alertId: id, isActive })}
                onDelete={(id) => void deleteAlert(id)}
              />
            ))
          )}
        </View>
      </View>
    </Screen>
  );
}
