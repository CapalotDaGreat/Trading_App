import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

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
        <Pressable
          onPress={handleGooglePress}
          disabled={disabled || !request || isGoogleLoading}
          className="flex-row items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/60 px-4 py-4 active:opacity-80"
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#E2E8F0" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#E2E8F0" />
              <Text className="ml-3 text-base font-semibold text-slate-100">
                {actionLabel} with Google
              </Text>
            </>
          )}
        </Pressable>
      ) : null}

      {showApple && appleAvailable ? (
        <Pressable
          onPress={handleApplePress}
          disabled={disabled || isAppleLoading}
          className="flex-row items-center justify-center rounded-2xl border border-slate-700/80 bg-black px-4 py-4 active:opacity-80"
        >
          {isAppleLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
              <Text className="ml-3 text-base font-semibold text-white">
                {actionLabel} with Apple
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
