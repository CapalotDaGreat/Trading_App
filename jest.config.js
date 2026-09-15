module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|@sentry/.*|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|react-native-reanimated|react-native-worklets|standard-navigation|firebase|@firebase/.*)',
  ],
  moduleNameMapper: {
    // Prefer the hoisted package; fall back keeps jest-expo able to resolve the module.
    '^expo-modules-core$': '<rootDir>/node_modules/expo-modules-core',
    '^expo-modules-core/(.*)$': '<rootDir>/node_modules/expo-modules-core/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/tests/firestore/',
    '/tests/storage/',
    '/functions/test/',
  ],
  collectCoverageFrom: ['features/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}', '!**/*.d.ts'],
};
