import { getMarketDataRuntimeMode } from '@/features/markets/constants/market-data-mode';
import { MARKET_DATA_POLICY } from '@/features/markets/constants/freshness';
import {
  allowDevDirectVendors,
  canUseVendorProxy,
} from '@/shared/services/firebase/callable-proxy';

export type MarketDataPathStatus =
  | 'active'
  | 'available'
  | 'optional_idle'
  | 'not_configured'
  | 'not_applicable';

export interface MarketDataHealthRow {
  id: string;
  title: string;
  detail: string;
  status: MarketDataPathStatus;
  statusLabel: string;
}

export interface MarketDataHealthSnapshot {
  runtimeMode: 'synthetic' | 'vendor';
  requiresClientVendorKeys: false;
  signedInProxyAvailable: boolean;
  refreshPolicy: {
    quoteRefetchMs: number;
    candleRefetchMs: number;
  };
  rows: MarketDataHealthRow[];
}

const STATUS_LABEL: Record<MarketDataPathStatus, string> = {
  active: 'Active',
  available: 'Available',
  optional_idle: 'Optional',
  not_configured: 'Not configured',
  not_applicable: 'N/A',
};

/**
 * Honesty surface for Settings → Market data health.
 * Learning / Practice / Simulation do not require Finnhub, Alpha Vantage, or News keys.
 */
export function getMarketDataHealthSnapshot(options?: {
  proxyAvailable?: boolean;
  runtimeMode?: 'synthetic' | 'vendor';
  allowDevDirect?: boolean;
  finnhubDevKeyPresent?: boolean;
  alphaDevKeyPresent?: boolean;
}): MarketDataHealthSnapshot {
  const runtimeMode = options?.runtimeMode ?? getMarketDataRuntimeMode();
  const signedInProxyAvailable = options?.proxyAvailable ?? canUseVendorProxy();
  const allowDevDirect = options?.allowDevDirect ?? allowDevDirectVendors();
  const finnhubDev =
    options?.finnhubDevKeyPresent ??
    (allowDevDirect && Boolean(process.env.EXPO_PUBLIC_FINNHUB_API_KEY));
  const alphaDev =
    options?.alphaDevKeyPresent ??
    (allowDevDirect && Boolean(process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY));

  const syntheticActive = runtimeMode === 'synthetic';

  const rows: MarketDataHealthRow[] = [
    {
      id: 'synthetic',
      title: 'Labelled synthetic / sample data',
      detail:
        'Default product path. Academy, Practice, Simulation, and guest Markets use sample or synthetic series — no vendor API key required.',
      status: syntheticActive ? 'active' : 'optional_idle',
      statusLabel: STATUS_LABEL[syntheticActive ? 'active' : 'optional_idle'],
    },
    {
      id: 'functions-proxy',
      title: 'Cloud Functions market proxy',
      detail: signedInProxyAvailable
        ? 'Signed-in verified account can request server-side quotes when vendor mode or Markets live paths are used.'
        : 'Requires a verified signed-in account. Guest / demo never call secret-backed vendors.',
      status: signedInProxyAvailable ? 'available' : 'not_configured',
      statusLabel: STATUS_LABEL[signedInProxyAvailable ? 'available' : 'not_configured'],
    },
    {
      id: 'server-finnhub',
      title: 'Finnhub (server secret only)',
      detail:
        'Optional Cloud Functions secret for equity/FX when live vendor mode is enabled. Never shipped as an Expo public client key.',
      status: signedInProxyAvailable ? 'optional_idle' : 'not_applicable',
      statusLabel: STATUS_LABEL[signedInProxyAvailable ? 'optional_idle' : 'not_applicable'],
    },
    {
      id: 'server-alpha',
      title: 'Alpha Vantage (server secret only)',
      detail:
        'Optional Cloud Functions fallback for some equity quotes. Not required for educational core.',
      status: signedInProxyAvailable ? 'optional_idle' : 'not_applicable',
      statusLabel: STATUS_LABEL[signedInProxyAvailable ? 'optional_idle' : 'not_applicable'],
    },
    {
      id: 'public-crypto-fx',
      title: 'CoinGecko & ExchangeRate API',
      detail:
        'Public no-key endpoints used only for optional crypto/FX quote paths. You do not configure an API key in the app.',
      status: runtimeMode === 'vendor' ? 'available' : 'optional_idle',
      statusLabel: STATUS_LABEL[runtimeMode === 'vendor' ? 'available' : 'optional_idle'],
    },
    {
      id: 'dev-direct',
      title: 'Dev-direct Finnhub / Alpha keys',
      detail: allowDevDirect
        ? `Local __DEV__ bypass only (MARKET_DATA_DIRECT). Finnhub key: ${
            finnhubDev ? 'present' : 'absent'
          }; Alpha key: ${alphaDev ? 'present' : 'absent'}. Forbidden on store builds.`
        : 'Disabled. Client vendor keys are not part of production Expo Go or store builds.',
      status: allowDevDirect
        ? finnhubDev || alphaDev
          ? 'available'
          : 'not_configured'
        : 'not_applicable',
      statusLabel: STATUS_LABEL[
        allowDevDirect
          ? finnhubDev || alphaDev
            ? 'available'
            : 'not_configured'
          : 'not_applicable'
      ],
    },
  ];

  return {
    runtimeMode,
    requiresClientVendorKeys: false,
    signedInProxyAvailable,
    refreshPolicy: {
      quoteRefetchMs: MARKET_DATA_POLICY.quoteRefetchMs,
      candleRefetchMs: MARKET_DATA_POLICY.candleRefetchMs,
    },
    rows,
  };
}
