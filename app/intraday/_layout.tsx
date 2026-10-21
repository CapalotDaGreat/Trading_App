import { Stack } from 'expo-router';

export default function IntradayLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="replay" />
      <Stack.Screen name="day" />
      <Stack.Screen name="scalp" />
      <Stack.Screen name="drills" />
    </Stack>
  );
}
