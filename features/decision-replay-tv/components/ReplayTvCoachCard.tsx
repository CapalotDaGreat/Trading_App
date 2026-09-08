import { View } from 'react-native';

import type { ReplayTvCoachNote } from '@/features/decision-replay-tv/types/replay-tv.types';
import { REINFORCEMENT_TRAIT_LABELS } from '@/features/decision/types/decision-reinforcement.types';
import type { ReinforcementTraitId } from '@/features/decision/types/decision-reinforcement.types';
import { useFeatureFlag } from '@/features/ops-config/hooks/useOpsConfig';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

export function ReplayTvCoachCard({ note }: { note: ReplayTvCoachNote }) {
  const reinforcementEnabled = useFeatureFlag('decisionReinforcementEnabled');
  const connection =
    reinforcementEnabled && note.practiceConnection ? note.practiceConnection : null;
  const traitId = connection?.traitId;
  const traitLabel =
    traitId && traitId in REINFORCEMENT_TRAIT_LABELS
      ? REINFORCEMENT_TRAIT_LABELS[traitId as ReinforcementTraitId]
      : traitId;

  return (
    <View className="gap-3" testID="replay-tv-coach-card">
      <CoachBlock title="What you knew" body={note.knew} />
      <CoachBlock title="What you decided" body={note.decided} />
      {note.changed ? <CoachBlock title="What changed" body={note.changed} /> : null}
      <CoachBlock title="What you missed" body={note.missed} />
      <CoachBlock title="What you did well" body={note.didWell} />
      <CoachBlock title="What to practice next" body={note.practiceNext} />
      {connection ? (
        <View
          accessibilityRole="text"
          accessibilityLabel={`Practice connection. Trait: ${traitLabel}. Evidence quality: ${connection.evidenceQuality}. ${connection.workingOn} ${connection.nextPractice}`}
          testID="replay-tv-practice-connection"
        >
          <CoachBlock
            title="Practice connection"
            body={`${connection.workingOn}\n\n${connection.nextPractice}`}
          />
        </View>
      ) : null}
    </View>
  );
}

function CoachBlock({ title, body }: { title: string; body: string }) {
  return (
    <Surface padding="sm" tone="subtle" accessibilityLabel={`${title}. ${body}`}>
      <Text variant="label" headingLevel={3}>
        {title}
      </Text>
      <Text variant="body-sm" className="mt-1 leading-6 text-text-secondary">
        {body}
      </Text>
    </Surface>
  );
}
