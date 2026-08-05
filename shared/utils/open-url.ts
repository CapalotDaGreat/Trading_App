import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { logger } from '@/shared/services/observability/logger';

/**
 * Open an https/http URL without throwing. Expo Go / simulators often reject
 * App Store deep links via Linking.openURL — fall back to an in-app browser.
 */
export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
  } catch (error) {
    logger.debug('linking.open_url_unsupported', {
      url,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }

  try {
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch (error) {
    logger.warn('linking.open_browser_failed', {
      url,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return false;
  }
}
