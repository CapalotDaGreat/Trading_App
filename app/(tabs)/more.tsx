import { Redirect, useLocalSearchParams } from 'expo-router';

import { buildLegacyRouteRedirect } from '@/features/navigation/config/review-navigation.config';

/** Hidden More hub retired — preserve deep links by sending people to You. */
export default function LegacyMoreRedirect() {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  return <Redirect href={buildLegacyRouteRedirect('/you', params) as never} />;
}
