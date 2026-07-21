import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LEGAL_ACCEPTANCE_VERSION, LEGAL_URLS } from '@/shared/constants/legal';

import { AuthDivider } from '../components/AuthDivider';
import { AuthInput } from '../components/AuthInput';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { useAuth } from '../hooks/useAuth';
import { useRegisterForm } from '../hooks/useAuthForm';

export function RegisterScreen() {
  const { signUp, signInWithGoogle, signInWithAppleProvider, isLoading, error, clearError } =
    useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useRegisterForm({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const displayName = watch('displayName');
  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = handleSubmit(async (values) => {
    if (!acceptedLegal) {
      return;
    }
    setSubmitting(true);
    clearError();
    try {
      await signUp({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      });

      router.replace('/(auth)/verify-email');
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

            <Text className="text-3xl font-bold text-white">Create your account</Text>
            <Text className="mt-2 text-base text-slate-400">
              Build a more consistent research and decision process.
            </Text>

            {error ? (
              <View className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
                <Text className="text-sm text-red-300">{error}</Text>
              </View>
            ) : null}

            <View className="mt-8">
              <AuthInput
                label="Full Name"
                value={displayName}
                onChangeText={(text) => setValue('displayName', text, { shouldValidate: true })}
                placeholder="Alex Trader"
                autoComplete="name"
                error={errors.displayName?.message}
              />
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
                placeholder="Create a strong password"
                isPassword
                autoComplete="new-password"
                error={errors.password?.message}
              />
              <AuthInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => setValue('confirmPassword', text, { shouldValidate: true })}
                placeholder="Repeat your password"
                isPassword
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
              />

              <View className="mb-4 mt-2 flex-row items-start">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedLegal }}
                  accessibilityLabel="Accept Terms of Service, Privacy Policy, and Risk Disclaimer"
                  onPress={() => setAcceptedLegal((value) => !value)}
                  className="mr-3 mt-0.5 min-h-11 min-w-11 items-center justify-center"
                >
                  <Ionicons
                    name={acceptedLegal ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={acceptedLegal ? '#34D399' : '#94A3B8'}
                  />
                </Pressable>
                <View className="flex-1">
                  <Text className="text-sm text-slate-400">
                    I am 18+, and I have read and agree to the Terms of Service, Privacy Policy, and
                    Risk & Investment Disclaimer (v{LEGAL_ACCEPTANCE_VERSION}). TradeVision is not a
                    broker and does not provide investment advice or buy/sell signals.
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-x-2 gap-y-1">
                    <Pressable onPress={() => void Linking.openURL(LEGAL_URLS.terms)}>
                      <Text className="text-sm font-semibold text-emerald-400">Terms</Text>
                    </Pressable>
                    <Pressable onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}>
                      <Text className="text-sm font-semibold text-emerald-400">Privacy</Text>
                    </Pressable>
                    <Pressable onPress={() => void Linking.openURL(LEGAL_URLS.risk)}>
                      <Text className="text-sm font-semibold text-emerald-400">Risk disclaimer</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={onSubmit}
                disabled={isBusy || !acceptedLegal}
                className="mt-2 items-center rounded-2xl bg-emerald-500 py-4 active:bg-emerald-600 disabled:opacity-60"
              >
                {isBusy ? (
                  <ActivityIndicator color="#022C22" />
                ) : (
                  <Text className="text-base font-bold text-slate-950">Create Account</Text>
                )}
              </Pressable>
            </View>

            <AuthDivider />

            <SocialAuthButtons
              disabled={isBusy || !acceptedLegal}
              onGoogleSuccess={(idToken) => handleSocialSuccess(() => signInWithGoogle(idToken))}
              onAppleSuccess={() => handleSocialSuccess(signInWithAppleProvider)}
            />

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-sm text-slate-400">Already have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/login')}>
                <Text className="text-sm font-semibold text-emerald-400">Sign in</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
