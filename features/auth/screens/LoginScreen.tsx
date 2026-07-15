import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthDivider } from '../components/AuthDivider';
import { AuthInput } from '../components/AuthInput';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { useAuth } from '../hooks/useAuth';
import { useLoginForm } from '../hooks/useAuthForm';

export function LoginScreen() {
  const { signIn, signInWithGoogle, signInWithAppleProvider, isLoading, error, clearError } =
    useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useLoginForm({
    email: '',
    password: '',
  });

  const email = watch('email');
  const password = watch('password');

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    clearError();
    try {
      const result = await signIn(values);
      if (result === 'mfa_required') {
        router.push('/(auth)/mfa');
        return;
      }
      router.replace('/(tabs)');
    } catch {
      // Error handled by auth context
    } finally {
      setSubmitting(false);
    }
  });

  const handleSocialSuccess = async (action: () => Promise<'success' | 'mfa_required'>) => {
    clearError();
    try {
      const result = await action();
      if (result === 'mfa_required') {
        router.push('/(auth)/mfa');
        return;
      }
      router.replace('/(tabs)');
    } catch {
      // Error handled by auth context
    }
  };

  const isBusy = isLoading || submitting;

  return (
    <View className="flex-1 bg-[#070B14]">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            contentContainerClassName="grow pb-8"
            keyboardShouldPersistTaps="handled"
          >
            <Pressable onPress={() => router.back()} className="mt-2 mb-6 w-10 py-2">
              <Ionicons name="arrow-back" size={24} color="#E2E8F0" />
            </Pressable>

            <Text className="text-3xl font-bold text-white">Welcome back</Text>
            <Text className="mt-2 text-base text-slate-400">
              Sign in to access your portfolio and AI insights.
            </Text>

            {error ? (
              <View className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
                <Text className="text-sm text-red-300">{error}</Text>
              </View>
            ) : null}

            <View className="mt-8">
              <AuthInput
                label="Email"
                value={email}
                onChangeText={(text) => setValue('email', text, { shouldValidate: true })}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                error={errors.email?.message}
              />
              <AuthInput
                label="Password"
                value={password}
                onChangeText={(text) => setValue('password', text, { shouldValidate: true })}
                placeholder="Enter your password"
                isPassword
                autoComplete="password"
                error={errors.password?.message}
              />

              <Pressable
                onPress={() => router.push('/(auth)/forgot-password')}
                className="mb-6 self-end"
              >
                <Text className="text-sm font-medium text-emerald-400">Forgot password?</Text>
              </Pressable>

              <Pressable
                onPress={onSubmit}
                disabled={isBusy}
                className="items-center rounded-2xl bg-emerald-500 py-4 active:bg-emerald-600 disabled:opacity-60"
              >
                {isBusy ? (
                  <ActivityIndicator color="#022C22" />
                ) : (
                  <Text className="text-base font-bold text-slate-950">Sign In</Text>
                )}
              </Pressable>
            </View>

            <AuthDivider />

            <SocialAuthButtons
              disabled={isBusy}
              onGoogleSuccess={(idToken) => handleSocialSuccess(() => signInWithGoogle(idToken))}
              onAppleSuccess={() => handleSocialSuccess(signInWithAppleProvider)}
            />

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-sm text-slate-400">Don&apos;t have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text className="text-sm font-semibold text-emerald-400">Create one</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
