import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { LEGAL_COUNSEL_NOTICE } from '@/shared/constants/legal';
import {
  LEGAL_DOCUMENT_META,
  LEGAL_DOCUMENT_TEXT,
  LEGAL_DOCUMENT_URL,
  type LegalDocumentId,
} from '@/shared/legal';
import { openExternalUrl } from '@/shared/utils/open-url';

function isLegalDocumentId(value: string | undefined): value is LegalDocumentId {
  return (
    value === 'privacy' ||
    value === 'terms' ||
    value === 'risk' ||
    value === 'accountDeletion' ||
    value === 'security'
  );
}

export function LegalDocumentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doc?: string }>();
  const docId = isLegalDocumentId(params.doc) ? params.doc : 'privacy';
  const meta = LEGAL_DOCUMENT_META[docId];
  const body = LEGAL_DOCUMENT_TEXT[docId];
  const url = LEGAL_DOCUMENT_URL[docId];

  return (
    <Screen scrollable>
      <Header title={meta.title} onBack={() => router.back()} />

      <Text variant="caption" className="mb-2 text-text-tertiary">
        Version {meta.version} · Updated {meta.lastUpdated}
      </Text>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open ${meta.title} on the website`}
        onPress={() => void openExternalUrl(url)}
        className="mb-4 min-h-11 justify-center rounded-xl bg-surface px-4"
      >
        <Text variant="label" className="text-accent">
          Open hosted copy
        </Text>
      </Pressable>

      <View className="mb-4 rounded-2xl bg-warning-muted/40 p-3">
        <Text variant="caption" className="text-text-secondary">
          {LEGAL_COUNSEL_NOTICE}
        </Text>
      </View>

      <Text variant="body-sm" className="pb-10 leading-6 text-text-primary">
        {body}
      </Text>
    </Screen>
  );
}
