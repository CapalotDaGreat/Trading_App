import { Redirect, useLocalSearchParams } from 'expo-router';

import { buildLegacyReplayRedirect } from '@/features/navigation/config/review-navigation.config';

export default function LegacyChartReplayRedirect() {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  return <Redirect href={buildLegacyReplayRedirect(params) as never} />;
}
