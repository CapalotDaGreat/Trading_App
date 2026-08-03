import type { ExpoConfig, ConfigContext } from 'expo/config';

const APP_SCHEME = 'tradevision';
const BUNDLE_IDENTIFIER = 'ai.tradevision.app';
const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
const EAS_OWNER = process.env.EAS_OWNER?.trim();

if (
  EAS_PROJECT_ID &&
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(EAS_PROJECT_ID)
) {
  throw new Error('EXPO_PUBLIC_EAS_PROJECT_ID must be a valid EAS project UUID.');
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TradeVision AI',
  slug: 'tradevision-ai',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: APP_SCHEME,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#070B12',
  },
  ios: {
    supportsTablet: true,
    usesAppleSignIn: true,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    buildNumber: '1',
    associatedDomains: ['applinks:tradevision.ai', 'applinks:www.tradevision.ai'],
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
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
      backgroundColor: '#070B12',
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
    permissions: ['android.permission.VIBRATE'],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    '@sentry/react-native',
    'expo-secure-store',
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'TradeVision AI uses Face ID to unlock the app after idle timeout. Biometrics never authorize trades.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#070B12',
        dark: {
          image: './assets/images/splash-icon.png',
          backgroundColor: '#070B12',
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
