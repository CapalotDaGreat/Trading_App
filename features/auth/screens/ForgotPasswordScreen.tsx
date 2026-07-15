import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput } from '../components/AuthInput';
import { useAuth } from '../hooks/useAuth';
import { useForgotPasswordForm } from '../hooks/useAuthForm';

export function ForgotPasswordScreen() {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForgotPasswordForm({
    email: '',
  });

  const email = watch('email');

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    clearError();
    try {
      await resetPassword(values.email);
      setEmailSent(true);
    } catch {
      // Error handled by auth context
    } finally {
      setSubmitting(false);
    }
  });

  const isBusy = isLoading || submitting;

  return (
    <View className="flex-1 bg-[#070B14]">
      <SafeAreaView className="flex-1 px-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <Pressable onPress={() => router.back()} className="mt-2 mb-6 w-10 py-2">
            <Ionicons name="arrow-back" size={24} color="#E2E8F0" />
          </Pressable>

          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15">
            <Ionicons name="key-outline" size={28} color="#60A5FA" />
          </View>

          <Text className="text-3xl font-bold text-white">Reset password</Text>
          <Text className="mt-2 text-base leading-6 text-slate-400">
            Enter your email and we&apos;ll send you a link to reset your password.
          </Text>

          {emailSent ? (
            <View className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
              <Text className="text-sm leading-6 text-emerald-300">
                Password reset email sent. Check your inbox and follow the instructions.
              </Text>
            </View>
          ) : (
            <View className="mt-8">
              {error ? (
                <View className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
                  <Text className="text-sm text-red-300">{error}</Text>
                </View>
              ) : null}

              <AuthInput
                label="Email"
                value={email}
                onChangeText={(text) => setValue('email', text, { shouldValidate: true })}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                error={errors.email?.message}
              />

              <Pressable
                onPress={onSubmit}
                disabled={isBusy}
                className="items-center rounded-2xl bg-emerald-500 py-4 active:bg-emerald-600 disabled:opacity-60"
              >
                {isBusy ? (
                  <ActivityIndicator color="#022C22" />
                ) : (
                  <Text className="text-base font-bold text-slate-950">Send Reset Link</Text>
                )}
              </Pressable>
            </View>
          )}

          <Pressable onPress={() => router.push('/(auth)/login')} className="mt-8 items-center py-2">
            <Text className="text-sm font-semibold text-emerald-400">Back to Sign In</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
