import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        setIsGoogleLoading(true);
        void onGoogleSuccess(idToken).finally(() => setIsGoogleLoading(false));
      }
    }
  }, [onGoogleSuccess, response]);

  const handleGooglePress = () => {
    if (!request || disabled || isGoogleLoading) {
      return;
    }
    void promptAsync();
  };

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
      {showGoogle ? (
        <Button
          fullWidth
          variant="secondary"
          onPress={handleGooglePress}
          disabled={disabled || !request || isGoogleLoading}
          loading={isGoogleLoading}
          leftIcon={<Ionicons name="logo-google" size={20} color={colors.text.primary} />}
        >
          {actionLabel} with Google
        </Button>
      ) : null}

      {showApple && appleAvailable ? (
        <Button
          fullWidth
          variant="secondary"
          onPress={handleApplePress}
          disabled={disabled || isAppleLoading}
          loading={isAppleLoading}
          leftIcon={<Ionicons name="logo-apple" size={22} color={colors.text.primary} />}
        >
          {actionLabel} with Apple
        </Button>
      ) : null}
    </View>
  );
}
