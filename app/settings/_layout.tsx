import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="market-data" />
      <Stack.Screen name="mfa" />
      <Stack.Screen name="mfa-enroll" />
      <Stack.Screen name="legal/[doc]" />
      <Stack.Screen name="educational-mode" />
    </Stack>
  );
}
