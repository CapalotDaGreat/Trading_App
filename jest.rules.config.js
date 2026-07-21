module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/firestore/**/*.test.js', '<rootDir>/tests/storage/**/*.test.js'],
  transformIgnorePatterns: ['node_modules/(?!(@firebase|firebase)/)'],
};
