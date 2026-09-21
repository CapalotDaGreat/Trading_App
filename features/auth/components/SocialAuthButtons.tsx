import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { useTheme } from '@/shared/hooks/useTheme';

interface SocialAuthButtonsProps {
  onGoogleSuccess: (idToken: string) => Promise<void>;
  onAppleSuccess: () => Promise<void>;
  disabled?: boolean;
  showGoogle?: boolean;
  showApple?: boolean;
  actionLabel?: string;
}

function googleClientIds() {
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined,
  };
}

/** Google.useAuthRequest throws if the platform client id is missing — gate before mounting. */
export function isGoogleAuthConfigured(): boolean {
  const ids = googleClientIds();
  if (!ids.webClientId) return false;
  if (Platform.OS === 'ios') return Boolean(ids.iosClientId);
  if (Platform.OS === 'android') return Boolean(ids.androidClientId);
  return true;
}

function GoogleSignInButton({
  onGoogleSuccess,
  disabled,
  actionLabel,
}: {
  onGoogleSuccess: (idToken: string) => Promise<void>;
  disabled: boolean;
  actionLabel: string;
}) {
  const { colors } = useTheme();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const onGoogleSuccessRef = useRef(onGoogleSuccess);
  const handledResponseKeyRef = useRef<string | null>(null);
  const ids = googleClientIds();

  useEffect(() => {
    onGoogleSuccessRef.current = onGoogleSuccess;
  }, [onGoogleSuccess]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: ids.webClientId,
    iosClientId: ids.iosClientId,
    androidClientId: ids.androidClientId,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken;
    if (!idToken) return;

    const responseKey = `${response.type}:${idToken.slice(0, 24)}:${response.authentication?.accessToken?.slice(0, 12) ?? ''}`;
    if (handledResponseKeyRef.current === responseKey) return;
    handledResponseKeyRef.current = responseKey;

    setIsGoogleLoading(true);
    void onGoogleSuccessRef.current(idToken).finally(() => setIsGoogleLoading(false));
  }, [response]);

  return (
    <Button
      fullWidth
      variant="secondary"
      onPress={() => {
        if (!request || disabled || isGoogleLoading) return;
        handledResponseKeyRef.current = null;
        void promptAsync();
      }}
      disabled={disabled || !request || isGoogleLoading}
      loading={isGoogleLoading}
      leftIcon={<Ionicons name="logo-google" size={20} color={colors.text.primary} />}
      accessibilityLabel={`${actionLabel} with Google`}
    >
      {actionLabel} with Google
    </Button>
  );
}

export function SocialAuthButtons({
  onGoogleSuccess,
  onAppleSuccess,
  disabled = false,
  showGoogle = true,
  showApple = true,
  actionLabel = 'Continue',
}: SocialAuthButtonsProps) {
  const { colors } = useTheme();
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const googleReady = showGoogle && isGoogleAuthConfigured();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleApplePress = async () => {
    if (disabled || isAppleLoading) {
      return;
    }
    setIsAppleLoading(true);
    try {
      await onAppleSuccess();
    } finally {
      setIsAppleLoading(false);
    }
  };

  return (
    <View className="gap-3">
      {googleReady ? (
        <GoogleSignInButton
          onGoogleSuccess={onGoogleSuccess}
          disabled={disabled}
          actionLabel={actionLabel}
        />
      ) : null}

      {showApple && appleAvailable ? (
        <Button
          fullWidth
          variant="secondary"
          onPress={handleApplePress}
          disabled={disabled || isAppleLoading}
          loading={isAppleLoading}
          leftIcon={<Ionicons name="logo-apple" size={22} color={colors.text.primary} />}
          accessibilityLabel={`${actionLabel} with Apple`}
        >
          {actionLabel} with Apple
        </Button>
      ) : null}
    </View>
  );
}
