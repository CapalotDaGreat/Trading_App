import { Redirect, useLocalSearchParams } from 'expo-router';

import { buildLegacyAnalysisRedirect } from '@/features/navigation/config/review-navigation.config';

export default function LegacyAnalysisRedirect() {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const symbolParam = params.symbol;
  const symbol = decodeURIComponent(
    Array.isArray(symbolParam) ? (symbolParam[0] ?? 'SPY') : (symbolParam ?? 'SPY'),
  );

  return <Redirect href={buildLegacyAnalysisRedirect(symbol, params) as never} />;
}
