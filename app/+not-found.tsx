import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <Screen>
        <View className="flex-1 items-center justify-center px-6">
          <Text variant="h2" className="mb-2 text-center">
            Page not found
          </Text>
          <Text variant="body-sm" className="mb-8 text-center">
            The screen you are looking for does not exist or has been moved.
          </Text>
          <Link href="/" asChild>
            <Button variant="primary">Go to Today</Button>
          </Link>
        </View>
      </Screen>
    </>
  );
}
