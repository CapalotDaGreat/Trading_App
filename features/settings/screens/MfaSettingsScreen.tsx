import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { SocialAuthButtons } from '@/features/auth/components/SocialAuthButtons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

export function MfaSettingsScreen() {
  const router = useRouter();
  const {
    user,
    error,
    clearError,
    enrolledMfaFactors,
    reauthenticatePassword,
    reauthenticateGoogle,
    reauthenticateApple,
    removeMfaFactor,
    hasRecentSensitiveAuthorization,
  } = useAuth();
  const [password, setPassword] = useState('');
  const [reauthenticated, setReauthenticated] = useState(hasRecentSensitiveAuthorization);
  const [busy, setBusy] = useState(false);

  const hasPassword = user?.providerIds.includes('password') ?? false;
  const hasGoogle = user?.providerIds.includes('google.com') ?? false;
  const hasApple = user?.providerIds.includes('apple.com') ?? false;
  const canManageMfa = Boolean(user && !user.isAnonymous && user.emailVerified);

  const runReauthentication = async (action: () => Promise<'success' | 'mfa_required'>) => {
    setBusy(true);
    clearError();
    try {
      const result = await action();
      if (result === 'mfa_required') {
        router.push('/(auth)/mfa');
        return;
      }
      setPassword('');
      setReauthenticated(true);
    } catch {
      // The auth context exposes a safe user-facing error.
    } finally {
      setBusy(false);
    }
  };

  const removeFactor = async (factorUid: string) => {
    setBusy(true);
    clearError();
    try {
      await removeMfaFactor(factorUid);
      setReauthenticated(false);
    } catch {
      // The auth context exposes a safe user-facing error.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scrollable>
      <Header title="Multi-factor authentication" onBack={() => router.back()} />

      <Text variant="body-sm" className="mb-4">
        Reauthenticate with a provider already linked to this account before changing your
        authenticator factors.
      </Text>

      {!canManageMfa ? (
        <GlassCard className="p-4">
          <Text variant="body-sm">MFA management requires a verified, non-guest account.</Text>
        </GlassCard>
      ) : !reauthenticated ? (
        <GlassCard className="gap-3 p-4">
          {hasPassword ? (
            <>
              <Text variant="label">Confirm your password</Text>
              <TextInput
                accessibilityLabel="Password for reauthentication"
                autoComplete="password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#64748B"
                className="rounded-xl border border-border px-4 py-3 text-text-primary"
              />
              <Button
                disabled={password.trim().length < 8 || busy}
                loading={busy}
                onPress={() => {
                  const next = password.trim();
                  if (next.length < 8 || next.length > 128) return;
                  void runReauthentication(() => reauthenticatePassword(next));
                }}
              >
                Reauthenticate
              </Button>
            </>
          ) : null}

          {hasPassword && (hasGoogle || hasApple) ? (
            <Text variant="caption" className="text-center">
              Or use another linked provider
            </Text>
          ) : null}

          <SocialAuthButtons
            disabled={busy}
            showGoogle={hasGoogle}
            showApple={hasApple}
            actionLabel="Reauthenticate"
            onGoogleSuccess={(idToken) => runReauthentication(() => reauthenticateGoogle(idToken))}
            onAppleSuccess={() => runReauthentication(reauthenticateApple)}
          />

          {!hasPassword && !hasGoogle && !hasApple ? (
            <Text variant="body-sm" className="text-bearish">
              No supported reauthentication provider is linked. Sign out and contact support before
              changing MFA.
            </Text>
          ) : null}
        </GlassCard>
      ) : (
        <GlassCard className="gap-4 p-4">
          <Text variant="body-sm">
            Reauthentication succeeded. This authorization expires after five minutes.
          </Text>
          {enrolledMfaFactors.length === 0 ? (
            <Button onPress={() => router.push('/settings/mfa-enroll' as never)}>
              Enable authenticator MFA
            </Button>
          ) : (
            enrolledMfaFactors.map((factor) => (
              <View key={factor.uid} className="rounded-xl border border-border p-3">
                <Text variant="body">{factor.displayName ?? 'Authenticator app'}</Text>
                <Button
                  variant="danger"
                  className="mt-3"
                  loading={busy}
                  onPress={() => void removeFactor(factor.uid)}
                >
                  Remove factor
                </Button>
              </View>
            ))
          )}
        </GlassCard>
      )}

      {error ? (
        <Text variant="body-sm" className="mt-3 text-bearish">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}
