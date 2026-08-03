import { useLocalSearchParams } from 'expo-router';

import { AiChatScreen } from '@/features/ai/screens/AiChatScreen';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';

export default function AiTab() {
  const { symbol } = useLocalSearchParams<{ symbol?: string }>();
  const resolvedSymbol = typeof symbol === 'string' ? symbol : undefined;
  return (
    <ErrorBoundary>
      <AiChatScreen symbol={resolvedSymbol} />
    </ErrorBoundary>
  );
}
