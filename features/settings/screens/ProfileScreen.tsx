import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getUserProfile,
  updateUserProfile,
} from '@/features/profile/services/profile.service';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { EXPERIENCE_LEVEL_LABELS } from '@/shared/types/user';
import { useToast } from '@/shared/components/feedback/Toast';

export function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { sync } = useSettings();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [currency, setCurrency] = useState('USD');
  const [experienceLevel, setExperienceLevel] =
    useState<keyof typeof EXPERIENCE_LEVEL_LABELS>('intermediate');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    void getUserProfile(user.uid)
      .then((profile) => {
        if (!profile) return;
        setDisplayName(profile.displayName);
        setBio(profile.bio);
        setTimezone(profile.timezone);
        setCurrency(profile.currency);
        setExperienceLevel(profile.experienceLevel);
      })
      .catch(() => {
        // Demo / offline — keep auth-derived defaults
      });
  }, [user?.uid]);

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim() || 'Trader',
        bio: bio.trim(),
        timezone,
        currency: currency.toUpperCase(),
        experienceLevel,
      });
      await sync();
      toast.success('Profile saved', 'Your changes have been updated.');
    } catch {
      toast.error('Save failed', 'Could not update your profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scrollable>
      <Header title="Profile" onBack={() => router.back()} />

      <GlassCard className="mb-6 items-center p-6">
        <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-accent-muted">
          <Text variant="h1" className="text-accent">
            {(displayName || user?.email || 'T').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text variant="h3">{displayName || 'Trader'}</Text>
        <Text variant="body-sm" className="mt-1">
          {user?.email ?? 'No email'}
        </Text>
      </GlassCard>

      <View className="gap-4">
        <Input
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          autoCapitalize="words"
        />
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about your trading style"
          multiline
          numberOfLines={3}
        />
        <Input
          label="Timezone"
          value={timezone}
          onChangeText={setTimezone}
          placeholder="America/New_York"
        />
        <Input
          label="Currency"
          value={currency}
          onChangeText={setCurrency}
          placeholder="USD"
          autoCapitalize="characters"
          maxLength={3}
        />
        <Input
          label="Experience Level"
          value={EXPERIENCE_LEVEL_LABELS[experienceLevel]}
          editable={false}
          hint="Change in onboarding preferences"
        />
      </View>

      <Button className="mt-6" loading={saving} onPress={() => void handleSave()}>
        Save Profile
      </Button>
    </Screen>
  );
}
