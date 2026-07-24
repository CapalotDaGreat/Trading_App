import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { AuthInput } from '../components/AuthInput';
import { useAuth } from '../hooks/useAuth';
import { useMfaForm } from '../hooks/useAuthForm';

type MfaMode = 'verify' | 'enroll';

interface MfaScreenProps {
  mode?: MfaMode;
}

export function MfaScreen({ mode = 'verify' }: MfaScreenProps) {
  usePreventScreenCapture('tradevision-mfa');
  const { colors } = useTheme();
  const {
    mfaChallenge,
    startMfaEnrollment,
    completeMfaEnrollment,
    verifyMfa,
    isLoading,
    error,
    clearError,
    mfaIsReauthentication,
  } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [enrollmentSecret, setEnrollmentSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showSetupSecret, setShowSetupSecret] = useState(false);
  const hasStartedEnrollment = useRef(false);
  const isEnrollMode = mode === 'enroll';

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useMfaForm({
    verificationCode: '',
  });

  const verificationCode = watch('verificationCode');

  useEffect(() => {
    if (!isEnrollMode || hasStartedEnrollment.current) {
      return;
    }
    hasStartedEnrollment.current = true;

    void startMfaEnrollment()
      .then((result) => {
        setEnrollmentSecret(result.secret);
        setQrCodeUrl(result.qrCodeUrl);
      })
      .catch(() => {
        // Error handled by auth context
      });
  }, [isEnrollMode, startMfaEnrollment]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    clearError();
    try {
      if (isEnrollMode) {
        await completeMfaEnrollment(values.verificationCode);
        router.back();
        return;
      }

      const result = await verifyMfa({ verificationCode: values.verificationCode });
      if (result === 'success') {
        router.replace((mfaIsReauthentication ? '/settings/mfa' : '/(tabs)') as never);
      }
    } catch {
      // Error handled by auth context
    } finally {
      setSubmitting(false);
    }
  });

  const isBusy = isLoading || submitting;
  const factorLabel = mfaChallenge?.hints[0]?.displayName ?? 'Authenticator App';

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
            {!isEnrollMode ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => router.back()}
                className="mb-6 mt-2 h-11 w-11 items-center justify-center rounded-full active:bg-surface"
              >
                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
              </Pressable>
            ) : null}

            <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted">
              <Ionicons name="shield-checkmark-outline" size={32} color={colors.accent.primary} />
            </View>

            <Text variant="h1">{isEnrollMode ? 'Enable MFA' : 'Two-factor authentication'}</Text>
            <Text variant="body" className="mt-3 text-text-secondary">
              {isEnrollMode
                ? 'Scan the setup key in your authenticator app, then enter the 6-digit code.'
                : `Enter the code from ${factorLabel} to complete sign in.`}
            </Text>

            {isEnrollMode && enrollmentSecret ? (
              <View className="mt-6 rounded-card border border-border-strong bg-background-elevated p-4">
                <Text variant="body-sm" className="text-warning">
                  The setup key grants access to your second factor. Do not screenshot, share, or
                  store it in plain text.
                </Text>
                {!showSetupSecret ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reveal authenticator setup secret"
                    onPress={() => setShowSetupSecret(true)}
                    className="mt-4 min-h-11 items-center justify-center rounded-control border border-warning px-4"
                  >
                    <Text variant="label" className="text-warning">
                      Reveal setup details
                    </Text>
                  </Pressable>
                ) : (
                  <View className="mt-4">
                    <Text
                      variant="caption"
                      className="mb-2 font-semibold uppercase tracking-widest"
                    >
                      Manual setup key
                    </Text>
                    <Text variant="mono" className="text-accent">
                      {enrollmentSecret}
                    </Text>
                    {qrCodeUrl ? (
                      <Text variant="caption" className="mt-3">
                        QR URL: {qrCodeUrl}
                      </Text>
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowSetupSecret(false)}
                      className="mt-3 min-h-11 justify-center"
                    >
                      <Text variant="label">Hide setup details</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : null}

            {error ? (
              <View
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                className="mt-6 rounded-card bg-bearish-muted px-4 py-3"
              >
                <Text variant="body-sm" className="text-bearish">
                  {error}
                </Text>
              </View>
            ) : null}

            <View className="mt-8">
              <AuthInput
                label="Verification Code"
                value={verificationCode}
                onChangeText={(text) =>
                  setValue('verificationCode', text, { shouldValidate: true })
                }
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={8}
                error={errors.verificationCode?.message}
              />

              <Button fullWidth size="lg" onPress={onSubmit} disabled={isBusy} loading={isBusy}>
                {isEnrollMode ? 'Enable MFA' : 'Verify and continue'}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
