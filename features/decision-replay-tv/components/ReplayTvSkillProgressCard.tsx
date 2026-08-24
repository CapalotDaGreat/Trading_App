import { View } from 'react-native';

import type { ReplayTvSkillProgress } from '@/features/decision-replay-tv/services/replay-tv-skills.service';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Text } from '@/shared/components/ui/Text';

export function ReplayTvSkillProgressCard({
  skills,
}: {
  skills: ReplayTvSkillProgress[];
}) {
  const started = skills.filter((s) => s.reps > 0).length;
  return (
    <CollapsibleSection
      title="Skill development"
      description="Process skills from completed rooms — never P&L."
      defaultExpanded={started > 0}
      testID="replay-tv-skill-progress"
    >
      <View className="gap-3">
        {skills.map((skill) => (
          <View key={skill.id} accessibilityLabel={`${skill.label}. ${skill.detail}. ${skill.reps} rooms practiced.`}>
            <Text variant="label">{skill.label}</Text>
            <Text variant="caption" className="mt-0.5 text-text-tertiary">
              {skill.detail}
            </Text>
            <Text variant="caption" className="mt-1 text-text-secondary">
              {skill.reps === 0
                ? 'Not started'
                : `${skill.reps} room${skill.reps === 1 ? '' : 's'} · ${
                    skill.bestProcess != null ? `best DQS ${skill.bestProcess}` : 'practicing'
                  }`}
            </Text>
          </View>
        ))}
      </View>
    </CollapsibleSection>
  );
}
