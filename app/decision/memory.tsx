import { Redirect, useLocalSearchParams } from 'expo-router';

import { buildLegacyRouteRedirect } from '@/features/navigation/config/review-navigation.config';

export default function LegacyMemoryRedirect() {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  return <Redirect href={buildLegacyRouteRedirect('/decision/intelligence', params) as never} />;
}
