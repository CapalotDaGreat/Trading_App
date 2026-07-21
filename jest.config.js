module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|@sentry/.*|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|nativewind|firebase|@firebase/.*)',
  ],
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
