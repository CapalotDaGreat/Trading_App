import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '@/features/profile/hooks/useProfile';

import { useAuth } from '../hooks/useAuth';

export function VerifyEmailScreen() {
  const { user, resendVerificationEmail, refreshUser, signOut, isLoading, error, clearError } =
    useAuth();
  const { upsertProfile } = useProfile();
  const [checking, setChecking] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    clearError();
    try {
      await resendVerificationEmail();
      setResent(true);
    } catch {
      // Error handled by auth context
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser?.emailVerified && refreshedUser.email) {
        await upsertProfile({
          uid: refreshedUser.uid,
          email: refreshedUser.email,
          displayName: refreshedUser.displayName ?? 'Trader',
        });
        router.replace('/(tabs)');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <View className="flex-1 bg-[#070B14]">
      <SafeAreaView className="flex-1 px-6">
        <View className="mt-8 flex-1">
          <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15">
            <Ionicons name="mail-unread-outline" size={32} color="#FBBF24" />
          </View>

          <Text className="text-3xl font-bold text-white">Verify your email</Text>
          <Text className="mt-3 text-base leading-6 text-slate-400">
            We sent a verification link to{' '}
            <Text className="font-semibold text-slate-200">{user?.email ?? 'your email'}</Text>.
            Please verify to access all trading features.
          </Text>

          {error ? (
            <View className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
              <Text className="text-sm text-red-300">{error}</Text>
            </View>
          ) : null}

          {resent ? (
            <View className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <Text className="text-sm text-emerald-300">
                Verification email resent successfully.
              </Text>
            </View>
          ) : null}

          <View className="mt-10 gap-3">
            <Pressable
              onPress={handleRefresh}
              disabled={checking}
              className="items-center rounded-2xl bg-emerald-500 py-4 active:bg-emerald-600 disabled:opacity-60"
            >
              {checking ? (
                <ActivityIndicator color="#022C22" />
              ) : (
                <Text className="text-base font-bold text-slate-950">
                  I&apos;ve Verified My Email
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleResend}
              disabled={isLoading}
              className="items-center rounded-2xl border border-slate-600 bg-slate-900/50 py-4 active:opacity-80 disabled:opacity-60"
            >
              {isLoading ? (
                <ActivityIndicator color="#E2E8F0" />
              ) : (
                <Text className="text-base font-semibold text-white">Resend Email</Text>
              )}
            </Pressable>

            <Pressable onPress={handleSignOut} className="items-center py-4">
              <Text className="text-sm font-medium text-slate-400">Sign out</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
