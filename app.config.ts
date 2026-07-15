import type { ExpoConfig, ConfigContext } from 'expo/config';

const APP_SCHEME = 'tradevision';
const BUNDLE_IDENTIFIER = 'ai.tradevision.app';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TradeVision AI',
  slug: 'tradevision-ai',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: APP_SCHEME,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0E17',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    buildNumber: '1',
    associatedDomains: ['applinks:tradevision.ai', 'applinks:www.tradevision.ai'],
    infoPlist: {
      UIBackgroundModes: ['remote-notification', 'fetch'],
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
      backgroundColor: '#0A0E17',
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
      'android.permission.INTERNET',
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0A0E17',
        dark: {
          image: './assets/images/splash-icon.png',
          backgroundColor: '#0A0E17',
        },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#00D4AA',
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
  updates: {
    url: 'https://u.expo.dev/your-eas-project-id',
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
    },
    router: {
      origin: false,
    },
  },
  owner: 'tradevision',
});
