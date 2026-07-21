import type { LegalDocumentId } from '@/shared/legal/document-text';
import { LEGAL_URLS } from '@/shared/constants/legal';

export type { LegalDocumentId } from '@/shared/legal/document-text';
export { LEGAL_DOCUMENT_META, LEGAL_DOCUMENT_TEXT } from '@/shared/legal/document-text';

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
