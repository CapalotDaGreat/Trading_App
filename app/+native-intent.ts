import { rewriteIncomingLegalPath } from '@/shared/legal/in-app-legal-url';

/**
 * RevenueCat Paywall / Customer Center open Terms & Privacy as URLs.
 * Rewrite custom-scheme and hosted legal URLs onto the in-app `/legal/[doc]` stack
 * so the reader sits on top of the paywall instead of Safari.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    return rewriteIncomingLegalPath(path) ?? path;
  } catch {
    return path;
  }
}
