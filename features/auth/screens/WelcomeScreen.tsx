import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';

export function WelcomeScreen() {
  const { signInAnonymously, isLoading } = useAuth();

  const handleGuestAccess = async () => {
    await signInAnonymously();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-[#070B14]">
      <View className="absolute inset-0 bg-[#0B1220]" />
      <View className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <View className="absolute bottom-20 -left-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <SafeAreaView className="flex-1 px-6">
        <View className="mt-8 flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20">
            <Ionicons name="trending-up" size={24} color="#34D399" />
          </View>
          <Text className="text-lg font-semibold tracking-wide text-emerald-400">TradeVision AI</Text>
        </View>

        <View className="flex-1 justify-center">
          <Text className="text-4xl font-bold leading-tight text-white">
            Trade smarter with{'\n'}
            <Text className="text-emerald-400">AI-powered</Text> insights
          </Text>
          <Text className="mt-4 text-base leading-6 text-slate-400">
            Research-value briefs, honest source labels, and a decision journal — built to improve
            process, not predict price direction.
          </Text>

          <BlurView intensity={30} tint="dark" className="mt-10 overflow-hidden rounded-3xl border border-slate-700/50">
            <View className="p-5">
              <View className="mb-4 flex-row items-center">
                <Ionicons name="shield-checkmark" size={18} color="#34D399" />
                <Text className="ml-2 text-sm text-slate-300">Bank-grade security with MFA support</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="flash" size={18} color="#60A5FA" />
                <Text className="ml-2 text-sm text-slate-300">Sync watchlists, portfolio & journal</Text>
              </View>
            </View>
          </BlurView>
        </View>

        <View className="pb-4">
          <Pressable
            onPress={() => router.push('/(auth)/register')}
            className="mb-3 items-center rounded-2xl bg-emerald-500 py-4 active:bg-emerald-600"
          >
            <Text className="text-base font-bold text-slate-950">Create Account</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="mb-3 items-center rounded-2xl border border-slate-600 bg-slate-900/50 py-4 active:opacity-80"
          >
            <Text className="text-base font-semibold text-white">Sign In</Text>
          </Pressable>

          <Pressable
            onPress={handleGuestAccess}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Continue as Guest"
            testID="welcome-continue-guest"
            className="items-center py-3 active:opacity-70"
          >
            {isLoading ? (
              <ActivityIndicator color="#94A3B8" />
            ) : (
              <Text className="text-sm font-medium text-slate-400">Continue as Guest</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
