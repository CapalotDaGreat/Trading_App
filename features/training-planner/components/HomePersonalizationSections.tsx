import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { HomeInsightItem, HomePersonalization } from '../types/home-review.types';

function InsightCard({
  testID,
  eyebrow,
  item,
  actionLabel = 'Open',
}: {
  testID: string;
  eyebrow: string;
  item: HomeInsightItem;
  actionLabel?: string;
}) {
  const router = useRouter();
  return (
    <Surface testID={testID}>
      <Text variant="label" className="text-text-tertiary">
        {eyebrow}
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-2">
        {item.title}
      </Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        {item.note}
      </Text>
      {item.href ? (
        <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push(item.href as never)}>
          {actionLabel}
        </Button>
      ) : null}
    </Surface>
  );
}

export function HomePersonalizationSections({ home }: { home: HomePersonalization }) {
  return (
    <View className="gap-4">
      {home.improving.length > 0 ? (
        <Surface testID="home-improving">
          <Text variant="label" className="text-text-tertiary">
            You&apos;re improving
          </Text>
          {home.improving.map((item) => (
            <View key={item.title} className="mt-3">
              <Text variant="body-sm">{item.title}</Text>
              <Text variant="caption" className="mt-1 text-text-tertiary">
                {item.note}
              </Text>
            </View>
          ))}
        </Surface>
      ) : null}

      {home.keepAnEyeOn ? (
        <InsightCard
          testID="home-keep-an-eye"
          eyebrow="Keep an eye on"
          item={home.keepAnEyeOn}
          actionLabel="Open this practice"
        />
      ) : null}

      {home.continueWork ? (
        <InsightCard testID="home-continue" eyebrow="Continue" item={home.continueWork} actionLabel="Resume" />
      ) : null}

      {home.emptyPersonalization ? (
        <Surface testID="home-empty-personalization">
          <Text variant="body-sm" className="text-text-secondary">
            After a few exercises, this page will show what you are improving and what to revisit. Reading alone does
            not fill it.
          </Text>
        </Surface>
      ) : null}
    </View>
  );
}
