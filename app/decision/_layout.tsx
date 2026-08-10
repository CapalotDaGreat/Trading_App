import { Stack } from 'expo-router';

import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';

export default function DecisionLayout() {
  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#151922' },
        }}
      />
    </ErrorBoundary>
  );
}
