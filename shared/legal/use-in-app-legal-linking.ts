import * as Linking from 'expo-linking';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { parseInAppLegalPath } from '@/shared/legal/in-app-legal-url';

/**
 * When the RevenueCat native paywall opens `tradevision://legal/…` while the app
 * is already running, push the in-app legal screen on top of the current stack.
 */
export function useInAppLegalDeepLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      const href = parseInAppLegalPath(url);
      if (!href) return;
      if (pathname === href) return;
      if (lastUrl.current === url && pathname.startsWith('/legal/')) return;
      lastUrl.current = url;
      router.push(href as never);
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [pathname, router]);
}
