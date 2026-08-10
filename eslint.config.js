const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  ...expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      'node_modules/',
      '.expo/',
      '.expo-export-test/',
      '.expo-export-p1-validation/',
      '.expo-export-ci/',
      'dist/',
      'build/',
      'coverage/',
      'functions/lib/',
      // Ops admin is a separate Vite app; install deps under ops/admin before linting it.
      'ops/admin/',
    ],
  },
  {
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react/react-in-jsx-scope': 'off',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        test: 'readonly',
      },
    },
  },
]);
