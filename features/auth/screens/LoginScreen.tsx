import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { AuthDivider } from '../components/AuthDivider';
import { AuthInput } from '../components/AuthInput';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { useAuth } from '../hooks/useAuth';
import { useLoginForm } from '../hooks/useAuthForm';

export function LoginScreen() {
  const { colors } = useTheme();
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
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            contentContainerClassName="grow pb-8"
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              className="mb-6 mt-2 h-11 w-11 items-center justify-center rounded-full active:bg-surface"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </Pressable>

            <Text variant="h1">Welcome back</Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              Continue your research, decisions, and process review.
            </Text>

            {error ? (
              <View
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                className="mt-4 rounded-card border border-bearish bg-bearish-muted px-4 py-3"
              >
                <Text variant="body-sm" className="text-bearish">
                  {error}
                </Text>
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
                accessibilityRole="link"
                className="mb-4 min-h-11 self-end justify-center"
              >
                <Text variant="label" className="text-accent">
                  Forgot password?
                </Text>
              </Pressable>

              <Button fullWidth size="lg" onPress={onSubmit} disabled={isBusy} loading={isBusy}>
                Sign in
              </Button>
            </View>

            <AuthDivider />

            <SocialAuthButtons
              disabled={isBusy}
              onGoogleSuccess={(idToken) => handleSocialSuccess(() => signInWithGoogle(idToken))}
              onAppleSuccess={() => handleSocialSuccess(signInWithAppleProvider)}
            />

            <View className="mt-8 flex-row items-center justify-center">
              <Text variant="body-sm">Don&apos;t have an account? </Text>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/(auth)/register')}
                className="min-h-11 justify-center"
              >
                <Text variant="label" className="text-accent">
                  Create one
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
