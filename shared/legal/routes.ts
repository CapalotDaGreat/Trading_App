import type { LegalDocumentId } from '@/shared/legal/document-text';

export type LegalRouteId = LegalDocumentId | 'support';

export function legalPath(id: LegalRouteId) {
  return `/legal/${id}` as never;
}
