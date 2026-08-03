import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus, Platform, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEMO_USER_UID } from '@/firebase/config';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useSettingsStore } from '@/shared/stores/settings.store';

/**
 * When biometric unlock is enabled, require a successful local auth after
 * cold start / returning from background before revealing the app.
 */
export function BiometricGate({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const biometricEnabled = useSettingsStore((s) => s.preferences.biometricAuthEnabled);
  const [unlocked, setUnlocked] = useState(!biometricEnabled);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const needsGate =
    biometricEnabled &&
    status === 'authenticated' &&
    Boolean(user) &&
    user?.uid !== DEMO_USER_UID &&
    Platform.OS !== 'web';

  const authenticate = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        setUnlocked(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock TradeVision AI',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setUnlocked(true);
      } else {
        setError('Authentication required to continue.');
        setUnlocked(false);
      }
    } catch {
      setError('Biometric unlock failed. Try again.');
      setUnlocked(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!needsGate) {
      setUnlocked(true);
      return;
    }
    setUnlocked(false);
    void authenticate();
  }, [needsGate, authenticate, user?.uid]);

  useEffect(() => {
    if (!needsGate) return;
    const onChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        setUnlocked(false);
      } else if (next === 'active') {
        void authenticate();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [needsGate, authenticate]);

  if (!needsGate || unlocked) {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text variant="h3" className="mb-2 text-center">
        Unlock TradeVision AI
      </Text>
      <Text variant="body-sm" className="mb-6 text-center text-text-secondary">
        Biometric unlock is enabled for this account on this device.
      </Text>
      {error ? (
        <Text variant="caption" className="mb-4 text-center text-danger">
          {error}
        </Text>
      ) : null}
      <Button onPress={() => void authenticate()} loading={checking} fullWidth>
        Unlock
      </Button>
    </View>
  );
}
