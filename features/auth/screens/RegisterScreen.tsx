import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { LEGAL_ACCEPTANCE_VERSION, LEGAL_URLS } from '@/shared/constants/legal';
import { useTheme } from '@/shared/hooks/useTheme';

import { AuthDivider } from '../components/AuthDivider';
import { AuthInput } from '../components/AuthInput';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { useAuth } from '../hooks/useAuth';
import { useRegisterForm } from '../hooks/useAuthForm';

export function RegisterScreen() {
  const { colors } = useTheme();
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

            <Text variant="h1">Create your account</Text>
            <Text variant="body" className="mt-2 text-text-secondary">
              Cloud sync, journals, and subscriptions require an eligible account. You must be at
              least 18, or the age of majority where you live.
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
                  accessibilityLabel="Confirm age eligibility and accept Terms of Service, Privacy Policy, and Risk Disclaimer"
                  onPress={() => setAcceptedLegal((value) => !value)}
                  className="mr-3 mt-0.5 min-h-11 min-w-11 items-center justify-center"
                >
                  <Ionicons
                    name={acceptedLegal ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={acceptedLegal ? colors.accent.primary : colors.text.tertiary}
                  />
                </Pressable>
                <View className="flex-1">
                  <Text variant="body-sm">
                    I am at least 18 years old, or the age of majority in my jurisdiction, and I have
                    read and agree to the Terms of Service, Privacy Policy, and Risk & Investment
                    Disclaimer (v{LEGAL_ACCEPTANCE_VERSION}). TradeVision is not a broker and does not
                    provide investment advice or buy/sell signals.
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-x-2 gap-y-1">
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => void Linking.openURL(LEGAL_URLS.terms)}
                    >
                      <Text variant="label" className="text-accent">
                        Terms
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}
                    >
                      <Text variant="label" className="text-accent">
                        Privacy
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => void Linking.openURL(LEGAL_URLS.risk)}
                    >
                      <Text variant="label" className="text-accent">
                        Risk disclaimer
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <Button
                fullWidth
                size="lg"
                className="mt-2"
                onPress={onSubmit}
                disabled={isBusy || !acceptedLegal}
                loading={isBusy}
              >
                Create account
              </Button>
            </View>

            <AuthDivider />

            <SocialAuthButtons
              disabled={isBusy || !acceptedLegal}
              onGoogleSuccess={(idToken) => handleSocialSuccess(() => signInWithGoogle(idToken))}
              onAppleSuccess={() => handleSocialSuccess(signInWithAppleProvider)}
            />

            <View className="mt-8 flex-row items-center justify-center">
              <Text variant="body-sm">Already have an account? </Text>
              <Pressable accessibilityRole="link" onPress={() => router.push('/(auth)/login')}>
                <Text variant="label" className="text-accent">
                  Sign in
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
