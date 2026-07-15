import { useLocalSearchParams } from 'expo-router';

import { AiChatScreen } from '@/features/ai/screens/AiChatScreen';

export default function AiTab() {
  const { symbol } = useLocalSearchParams<{ symbol?: string }>();
  const resolvedSymbol = typeof symbol === 'string' ? symbol : undefined;
  return <AiChatScreen symbol={resolvedSymbol} />;
}
