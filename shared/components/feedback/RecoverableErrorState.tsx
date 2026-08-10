import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { mapRecoverableError } from '@/shared/utils/error-recovery';

interface RecoverableErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

/** What / why / how-to-recover wrapper around ErrorState. */
export function RecoverableErrorState({ error, onRetry, className }: RecoverableErrorStateProps) {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();
  const mapped = mapRecoverableError(error, { offline: !isOnline });

  return (
    <View className={className}>
      <ErrorState
        title={mapped.title}
        description="This content could not be refreshed."
        why={mapped.why}
        recovery={mapped.recovery}
        actionLabel={mapped.actionLabel}
        onAction={onRetry}
        testID={`recoverable-error-${mapped.kind}`}
      />
      {mapped.secondaryActionLabel && mapped.secondaryHref ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 self-center"
          onPress={() => router.push(mapped.secondaryHref as never)}
        >
          {mapped.secondaryActionLabel}
        </Button>
      ) : null}
      <Text variant="caption" className="mt-2 text-center text-text-tertiary">
        Process data stays on-device unless you signed in for cloud sync.
      </Text>
    </View>
  );
}
