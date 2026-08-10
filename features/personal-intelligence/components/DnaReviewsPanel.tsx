import { View } from 'react-native';

import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type {
  DnaBehaviourPattern,
  DnaChangeInsight,
  DnaCoachingAction,
  DnaMonthlyReview,
  DnaWeeklyReview,
} from '../types/personal-intelligence.types';

interface DnaReviewsPanelProps {
  whatsChanging: DnaChangeInsight[];
  weeklyReview: DnaWeeklyReview;
  monthlyReview: DnaMonthlyReview;
  patterns: DnaBehaviourPattern[];
  coachingActions: DnaCoachingAction[];
  isPremium: boolean;
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return (
      <Text variant="caption" className="text-text-tertiary">
        Not enough evidence yet.
      </Text>
    );
  }
  return (
    <View className="gap-1">
      {items.map((item) => (
        <Text key={item} variant="body-sm" className="text-text-secondary">
          · {item}
        </Text>
      ))}
    </View>
  );
}

export function DnaReviewsPanel({
  whatsChanging,
  weeklyReview,
  monthlyReview,
  patterns,
  coachingActions,
  isPremium,
}: DnaReviewsPanelProps) {
  return (
    <View className="gap-4" testID="dna-reviews-panel">
      <Surface>
        <Text variant="label" className="text-accent">
          WHAT&apos;S CHANGING
        </Text>
        <View className="mt-3 gap-3">
          {whatsChanging.map((insight) => (
            <View key={insight.id}>
              <Text variant="body-sm" className="text-text-primary">
                {insight.title}
              </Text>
              <Text variant="caption" className="mt-1 text-text-tertiary">
                {insight.detail}
              </Text>
            </View>
          ))}
        </View>
      </Surface>

      <Surface>
        <Text variant="label" className="text-accent">
          WEEKLY REVIEW
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {weeklyReview.summary}
        </Text>
        <View className="mt-3 gap-2">
          <Text variant="caption" className="text-text-tertiary">
            Improved
          </Text>
          <BulletList items={weeklyReview.improved} />
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Practise
          </Text>
          <BulletList items={weeklyReview.practise} />
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Stop doing
          </Text>
          <BulletList items={weeklyReview.stopDoing} />
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Learn
          </Text>
          <BulletList items={weeklyReview.learn} />
        </View>
      </Surface>

      {isPremium ? (
        <>
          <CollapsibleSection title="Monthly review" description="Compare yourself across 30 / 60 / 90 days.">
            <Text variant="body-sm" className="mb-3 text-text-secondary">
              {monthlyReview.comparison}
            </Text>
            {monthlyReview.windows.map((window) => (
              <View key={window.days} className="mb-3">
                <Text variant="label">{window.label}</Text>
                <Text variant="caption" className="mt-1 text-text-secondary">
                  {window.insight}
                </Text>
              </View>
            ))}
          </CollapsibleSection>

          <CollapsibleSection title="Patterns" description="Neutral coaching observations from your process.">
            {patterns.length ? (
              patterns.map((pattern) => (
                <View key={pattern.id} className="mb-3">
                  <Text variant="body-sm">{pattern.title}</Text>
                  <Text variant="caption" className="mt-1 text-text-secondary">
                    {pattern.detail}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="caption" className="text-text-tertiary">
                Not enough evidence yet.
              </Text>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Practice this next" description="Replay, Academy, Journal, Mentor, checklist.">
            {coachingActions.map((action) => (
              <View key={action.id} className="mb-3">
                <Text variant="body-sm">{action.title}</Text>
                <Text variant="caption" className="mt-1 text-text-secondary">
                  {action.detail}
                </Text>
              </View>
            ))}
          </CollapsibleSection>
        </>
      ) : (
        <PremiumOsGate feature="tradingDnaInsights">
          <Text variant="body-sm" className="text-text-secondary">
            Premium unlocks monthly and 90-day self-comparison, advanced patterns, and personalised
            practice prescriptions.
          </Text>
        </PremiumOsGate>
      )}
    </View>
  );
}
