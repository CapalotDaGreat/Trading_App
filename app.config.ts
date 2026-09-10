import type { ExpoConfig, ConfigContext } from 'expo/config';

const APP_SCHEME = 'tradevision';
const BUNDLE_IDENTIFIER = 'ai.tradevision.app';
const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
const EAS_OWNER = process.env.EAS_OWNER?.trim();
const EAS_BUILD_PROFILE = process.env.EAS_BUILD_PROFILE?.trim();

if (
  EAS_PROJECT_ID &&
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(EAS_PROJECT_ID)
) {
  throw new Error('EXPO_PUBLIC_EAS_PROJECT_ID must be a valid EAS project UUID.');
}

/** Fail store-like EAS profiles if vendor/debug secrets would be baked into the client. */
function assertStoreLikeClientEnv(): void {
  const storeLike =
    EAS_BUILD_PROFILE === 'production' ||
    EAS_BUILD_PROFILE === 'beta' ||
    EAS_BUILD_PROFILE === 'preview';
  if (!storeLike) return;

  if (!EAS_PROJECT_ID) {
    throw new Error(
      'EXPO_PUBLIC_EAS_PROJECT_ID is required for preview/beta/production EAS builds (OTA + push).',
    );
  }

  const leakedVendorKeys = [
    'EXPO_PUBLIC_FINNHUB_API_KEY',
    'EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY',
    'EXPO_PUBLIC_NEWS_API_KEY',
    'EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN',
    'EXPO_PUBLIC_AI_API_KEY',
    'EXPO_PUBLIC_AI_API_URL',
  ].filter((key) => Boolean(process.env[key]?.trim()));

  if (process.env.EXPO_PUBLIC_MARKET_DATA_DIRECT?.trim() === 'true') {
    leakedVendorKeys.push('EXPO_PUBLIC_MARKET_DATA_DIRECT');
  }

  if (leakedVendorKeys.length > 0) {
    throw new Error(
      `Store-like EAS profile "${EAS_BUILD_PROFILE}" must not bake client-visible vendor/debug secrets: ${leakedVendorKeys.join(', ')}`,
    );
  }
}

const sentryOrg = process.env.SENTRY_ORG?.trim();
const sentryProject = process.env.SENTRY_PROJECT?.trim();

assertStoreLikeClientEnv();

const sentryPlugin: NonNullable<ExpoConfig['plugins']> =
  sentryOrg && sentryProject
    ? [['@sentry/react-native', { organization: sentryOrg, project: sentryProject }]]
    : [];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TradeAcademy',
  slug: 'traders',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: APP_SCHEME,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#151922',
  },
  ios: {
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    buildNumber: '1',
    associatedDomains: ['applinks:tradevision.ai', 'applinks:www.tradevision.ai'],
    infoPlist: {
      // remote-notification = push; processing = expo-background-task (BGTaskScheduler)
      UIBackgroundModes: ['remote-notification', 'processing'],
      BGTaskSchedulerPermittedIdentifiers: ['com.expo.modules.backgroundtask.processing'],
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: [APP_SCHEME],
        },
      ],
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_IDENTIFIER,
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: '#151922',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'tradevision.ai',
            pathPrefix: '/',
          },
          {
            scheme: 'https',
            host: 'www.tradevision.ai',
            pathPrefix: '/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        data: [{ scheme: APP_SCHEME }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    permissions: [
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.WAKE_LOCK',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    ...sentryPlugin,
    'expo-secure-store',
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'TradeAcademy uses Face ID to unlock the app after idle timeout. Biometrics never authorize trades.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#151922',
        dark: {
          image: './assets/images/splash-icon.png',
          backgroundColor: '#151922',
        },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/android-icon-monochrome.png',
        color: '#2DD4BF',
        defaultChannel: 'default',
        sounds: [],
      },
    ],
    'expo-background-task',
    'expo-font',
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
  },
  updates: EAS_PROJECT_ID
    ? {
        url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
        enabled: true,
        checkAutomatically: 'ON_LOAD',
        fallbackToCacheTimeout: 0,
      }
    : {
        enabled: false,
      },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
    router: {
      origin: false,
    },
  },
  ...(EAS_OWNER ? { owner: EAS_OWNER } : {}),
});
