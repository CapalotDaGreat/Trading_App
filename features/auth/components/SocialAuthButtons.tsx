import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

interface SocialAuthButtonsProps {
  onGoogleSuccess: (idToken: string) => Promise<void>;
  onAppleSuccess: () => Promise<void>;
  disabled?: boolean;
}

export function SocialAuthButtons({
  onGoogleSuccess,
  onAppleSuccess,
  disabled = false,
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
            <Text className="ml-3 text-base font-semibold text-slate-100">Continue with Google</Text>
          </>
        )}
      </Pressable>

      {appleAvailable ? (
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
              <Text className="ml-3 text-base font-semibold text-white">Continue with Apple</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
