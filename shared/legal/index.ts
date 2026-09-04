import type { LegalDocumentId } from '@/shared/legal/document-text';
import { LEGAL_URLS } from '@/shared/constants/legal';

export type { LegalDocumentId } from '@/shared/legal/document-text';
export { LEGAL_DOCUMENT_META, LEGAL_DOCUMENT_TEXT } from '@/shared/legal/document-text';
export type { LegalRouteId } from '@/shared/legal/routes';
export { legalPath } from '@/shared/legal/routes';
export {
  IN_APP_LEGAL_URLS,
  inAppLegalUrl,
  parseInAppLegalPath,
  rewriteIncomingLegalPath,
} from '@/shared/legal/in-app-legal-url';

export const LEGAL_DOCUMENT_URL: Record<LegalDocumentId, string> = {
  privacy: LEGAL_URLS.privacy,
  terms: LEGAL_URLS.terms,
  risk: LEGAL_URLS.risk,
  accountDeletion: LEGAL_URLS.accountDeletion,
  security: LEGAL_URLS.security,
};

export const LEGAL_DOCUMENTS: LegalDocumentId[] = [
  'terms',
  'privacy',
  'risk',
  'accountDeletion',
  'security',
];
