import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AlertCard } from '@/features/alerts/components/AlertCard';
import { CreateAlertForm } from '@/features/alerts/components/CreateAlertForm';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';

export default function AlertsScreen() {
  const router = useRouter();
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

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color="#00D4AA" />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Price Alerts" onBack={() => router.back()} />

      <View className="mt-4 gap-4">
        <Text variant="caption" className="text-text-tertiary">
          {alerts.length}/{alertLimit} alerts used
        </Text>

        <CreateAlertForm
          onSubmit={async (input) => {
            await createAlert(input);
          }}
          isSubmitting={isCreating}
          disabled={!canCreateAlert}
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
