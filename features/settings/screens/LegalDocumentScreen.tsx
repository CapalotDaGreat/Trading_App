import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  LegalMarkdown,
  LegalSupportBody,
} from '@/features/settings/components/LegalMarkdown';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { LEGAL_URLS, isLegalMailboxConfigured } from '@/shared/constants/legal';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import {
  LEGAL_DOCUMENT_META,
  LEGAL_DOCUMENT_TEXT,
  type LegalDocumentId,
} from '@/shared/legal';
import { openExternalUrl } from '@/shared/utils/open-url';

type LegalRouteId = LegalDocumentId | 'support';

function isLegalRouteId(value: string | undefined): value is LegalRouteId {
  return (
    value === 'privacy' ||
    value === 'terms' ||
    value === 'risk' ||
    value === 'accountDeletion' ||
    value === 'security' ||
    value === 'support'
  );
}

export function LegalDocumentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const params = useLocalSearchParams<{ doc?: string }>();
  const docId = isLegalRouteId(params.doc) ? params.doc : 'privacy';
  const supportMailto = LEGAL_URLS.supportEmail;
  const supportConfigured = isLegalMailboxConfigured(supportMailto);

  const title = docId === 'support' ? 'Support' : LEGAL_DOCUMENT_META[docId].title;
  const subtitle =
    docId === 'support'
      ? 'TradeInsight by Aithera'
      : `Updated ${LEGAL_DOCUMENT_META[docId].lastUpdated}`;

  return (
    <Screen
      scrollable={false}
      padded={false}
      safeTop={false}
      showOfflineBanner={false}
      accessibilityTitle={title}
      className="bg-background"
    >
      <Header title={title} subtitle={subtitle} onBack={() => router.back()} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: layout.gutter,
          paddingBottom: insets.bottom + 32,
          maxWidth: layout.isTablet ? layout.contentMaxWidth : undefined,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {docId === 'support' ? (
          <LegalSupportBody
            onEmail={
              supportConfigured
                ? () => void openExternalUrl(supportMailto)
                : undefined
            }
          />
        ) : (
          <>
            <Text variant="caption" className="mb-5 text-text-tertiary">
              Version {LEGAL_DOCUMENT_META[docId].version}
            </Text>
            <LegalMarkdown
              markdown={LEGAL_DOCUMENT_TEXT[docId]}
              skipTitle={LEGAL_DOCUMENT_META[docId].title}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
