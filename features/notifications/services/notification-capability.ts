import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Expo Go (StoreClient) cannot use remote push on recent SDKs — skip the module entirely. */
export function isExpoGoRuntime(): boolean {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo'
  );
}

export function isNotificationRuntimeSupported(): boolean {
  return Platform.OS !== 'web' && !isExpoGoRuntime();
}
