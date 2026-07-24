import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { AuthInput } from '../components/AuthInput';
import { useAuth } from '../hooks/useAuth';
import { useForgotPasswordForm } from '../hooks/useAuthForm';

export function ForgotPasswordScreen() {
  const { colors } = useTheme();
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
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 px-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="mb-6 mt-2 h-11 w-11 items-center justify-center rounded-full active:bg-surface"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>

          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-info-muted">
            <Ionicons name="key-outline" size={28} color={colors.info.primary} />
          </View>

          <Text variant="h1">Reset password</Text>
          <Text variant="body" className="mt-2 text-text-secondary">
            Enter your email and we&apos;ll send you a link to reset your password.
          </Text>

          {emailSent ? (
            <View
              accessibilityLiveRegion="polite"
              className="mt-8 rounded-card bg-bullish-muted px-4 py-4"
            >
              <Text variant="body-sm" className="text-bullish">
                Password reset email sent. Check your inbox and follow the instructions.
              </Text>
            </View>
          ) : (
            <View className="mt-8">
              {error ? (
                <View
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                  className="mb-4 rounded-card bg-bearish-muted px-4 py-3"
                >
                  <Text variant="body-sm" className="text-bearish">
                    {error}
                  </Text>
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

              <Button fullWidth size="lg" onPress={onSubmit} disabled={isBusy} loading={isBusy}>
                Send reset link
              </Button>
            </View>
          )}

          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/(auth)/login')}
            className="mt-8 min-h-11 items-center justify-center"
          >
            <Text variant="label" className="text-accent">
              Back to sign in
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
