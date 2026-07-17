import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { TradingChecklist } from '@/features/academy/components/TradingChecklist';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';

export default function AcademyChecklistScreen() {
  const router = useRouter();
  const { checklistId } = useLocalSearchParams<{ checklistId: string }>();
  const id = checklistId || 'pre-trade-checklist';

  return (
    <Screen scrollable contentClassName="pb-10">
      <Header title="Checklist" onBack={() => router.back()} />
      <View className="mt-4">
        <Text variant="body-sm" className="mb-4">
          Use these as living desk tools — reset after each session or trade.
        </Text>
        <TradingChecklist checklistId={id} />
      </View>
    </Screen>
  );
}
