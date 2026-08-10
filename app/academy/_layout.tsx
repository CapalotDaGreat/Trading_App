import { Stack } from 'expo-router';

import { FeatureFlagBoundary } from '@/features/ops-config/components/FeatureFlagBoundary';

export default function AcademyLayout() {
  return (
    <FeatureFlagBoundary
      flag="academyEnabled"
      title="Academy temporarily unavailable"
      description="Learning content is paused. Your saved progress remains available when Academy returns."
      testID="academy-flag-disabled"
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="path/[pathId]" />
        <Stack.Screen name="lesson/[lessonId]" />
        <Stack.Screen name="checklist/[checklistId]" />
      </Stack>
    </FeatureFlagBoundary>
  );
}
