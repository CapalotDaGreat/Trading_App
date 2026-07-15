import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const MEMORY_FALLBACK = new Map<string, string>();

function canUseSecureStore(): boolean {
  return Platform.OS !== 'web';
}

export const secureStorageService = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (canUseSecureStore()) {
        return await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
      }
      return MEMORY_FALLBACK.get(key) ?? null;
    } catch {
      return MEMORY_FALLBACK.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (canUseSecureStore()) {
        await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
        return;
      }
      MEMORY_FALLBACK.set(key, value);
    } catch {
      MEMORY_FALLBACK.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (canUseSecureStore()) {
        await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
      }
      MEMORY_FALLBACK.delete(key);
    } catch {
      MEMORY_FALLBACK.delete(key);
    }
  },

  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  },

  async clear(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.removeItem(key)));
  },
};

export const SecureStorageKeys = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  USER_SESSION: 'user_session',
} as const;

export type SecureStorageKey = (typeof SecureStorageKeys)[keyof typeof SecureStorageKeys];
