import { View } from 'react-native';

import type { ReplayTvCoachNote } from '@/features/decision-replay-tv/types/replay-tv.types';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

export function ReplayTvCoachCard({ note }: { note: ReplayTvCoachNote }) {
  return (
    <View className="gap-3" testID="replay-tv-coach-card">
      <CoachBlock title="What you noticed" body={note.noticed} />
      <CoachBlock title="What you missed" body={note.missed} />
      {note.changed ? <CoachBlock title="What changed" body={note.changed} /> : null}
      <CoachBlock title="Was your reasoning internally consistent?" body={note.consistency} />
      <CoachBlock title="What would have invalidated your thesis?" body={note.invalidationQuestion} />
    </View>
  );
}

function CoachBlock({ title, body }: { title: string; body: string }) {
  return (
    <Surface padding="sm" tone="subtle">
      <Text variant="label">{title}</Text>
      <Text variant="body-sm" className="mt-1 leading-6 text-text-secondary">
        {body}
      </Text>
    </Surface>
  );
}
