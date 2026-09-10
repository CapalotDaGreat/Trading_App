import { Linking, View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';

import type { MarketEventArticle } from '../types/events.types';

export function EventArticleRow({ article }: { article: MarketEventArticle }) {
  const dated = article.sourceTimestamp
    ? new Date(article.sourceTimestamp).toISOString().slice(0, 10)
    : null;
  return (
    <View className="mt-3 border-t border-border pt-3" testID="event-article">
      <Text variant="caption" className="text-text-tertiary">
        External source · {article.source} · {article.date}
        {dated ? ` · ${dated}` : ''}
      </Text>
      <Text variant="body-sm" className="mt-1">
        {article.headline}
      </Text>
      <Text variant="caption" className="mt-1 text-text-secondary">
        {article.summary}
      </Text>
      <Text variant="caption" className="mt-1 text-text-tertiary">
        Why it matters (TradeAcademy educational note): {article.whyItMatters}
      </Text>
      <Text variant="caption" className="mt-1 text-text-tertiary">
        We link to the source. We do not copy the article. The headline and summary are a paraphrase of
        third-party material — not TradeAcademy original reporting.
      </Text>
      <Button size="sm" variant="ghost" className="mt-2" onPress={() => void Linking.openURL(article.url)}>
        Open source
      </Button>
    </View>
  );
}
