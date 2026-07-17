import { Stack } from 'expo-router';

export default function AcademyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="path/[pathId]" />
      <Stack.Screen name="lesson/[lessonId]" />
      <Stack.Screen name="checklist/[checklistId]" />
    </Stack>
  );
}
