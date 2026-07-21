import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useEffect, useRef, useState } from 'react';
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

import { AuthInput } from '../components/AuthInput';
import { useAuth } from '../hooks/useAuth';
import { useMfaForm } from '../hooks/useAuthForm';

type MfaMode = 'verify' | 'enroll';

interface MfaScreenProps {
  mode?: MfaMode;
}

export function MfaScreen({ mode = 'verify' }: MfaScreenProps) {
  usePreventScreenCapture('tradevision-mfa');
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
            {!isEnrollMode ? (
              <Pressable onPress={() => router.back()} className="mt-2 mb-6 w-10 py-2">
                <Ionicons name="arrow-back" size={24} color="#E2E8F0" />
              </Pressable>
            ) : null}

            <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15">
              <Ionicons name="shield-checkmark-outline" size={32} color="#A78BFA" />
            </View>

            <Text className="text-3xl font-bold text-white">
              {isEnrollMode ? 'Enable MFA' : 'Two-factor authentication'}
            </Text>
            <Text className="mt-3 text-base leading-6 text-slate-400">
              {isEnrollMode
                ? 'Scan the setup key in your authenticator app, then enter the 6-digit code.'
                : `Enter the code from ${factorLabel} to complete sign in.`}
            </Text>

            {isEnrollMode && enrollmentSecret ? (
              <View className="mt-6 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
                <Text className="text-sm leading-5 text-amber-300">
                  The setup key grants access to your second factor. Do not screenshot, share, or
                  store it in plain text.
                </Text>
                {!showSetupSecret ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reveal authenticator setup secret"
                    onPress={() => setShowSetupSecret(true)}
                    className="mt-4 items-center rounded-xl border border-amber-400/40 px-4 py-3"
                  >
                    <Text className="font-semibold text-amber-200">Reveal setup details</Text>
                  </Pressable>
                ) : (
                  <View className="mt-4">
                    <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Manual setup key
                    </Text>
                    <Text className="font-mono text-sm text-emerald-300">{enrollmentSecret}</Text>
                    {qrCodeUrl ? (
                      <Text className="mt-3 text-xs text-slate-500">QR URL: {qrCodeUrl}</Text>
                    ) : null}
                    <Pressable onPress={() => setShowSetupSecret(false)} className="mt-3 py-2">
                      <Text className="text-sm font-semibold text-slate-300">
                        Hide setup details
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : null}

            {error ? (
              <View className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3">
                <Text className="text-sm text-red-300">{error}</Text>
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

              <Pressable
                onPress={onSubmit}
                disabled={isBusy}
                className="items-center rounded-2xl bg-emerald-500 py-4 active:bg-emerald-600 disabled:opacity-60"
              >
                {isBusy ? (
                  <ActivityIndicator color="#022C22" />
                ) : (
                  <Text className="text-base font-bold text-slate-950">
                    {isEnrollMode ? 'Enable MFA' : 'Verify & Continue'}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
