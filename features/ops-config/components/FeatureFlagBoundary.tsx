import type { ReactNode } from 'react';

import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Screen } from '@/shared/components/layout/Screen';

import { useFeatureFlag } from '../hooks/useOpsConfig';
import type { OpsFeatureFlags } from '../types/ops-config.types';

interface FeatureFlagBoundaryProps {
  flag: keyof OpsFeatureFlags;
  title: string;
  description: string;
  children: ReactNode;
  testID?: string;
}

/** Route-level fail-closed boundary for remotely disabled surfaces. */
export function FeatureFlagBoundary({
  flag,
  title,
  description,
  children,
  testID,
}: FeatureFlagBoundaryProps) {
  const enabled = useFeatureFlag(flag);

  if (enabled) return children;

  return (
    <Screen className="items-center justify-center">
      <EmptyState
        title={title}
        description={description}
        iconName="cloud-offline-outline"
        testID={testID ?? `feature-disabled-${flag}`}
      />
    </Screen>
  );
}
