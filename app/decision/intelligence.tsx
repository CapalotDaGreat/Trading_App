import { PersonalIntelligenceScreen } from '@/features/personal-intelligence/screens/PersonalIntelligenceScreen';
import { FeatureFlagBoundary } from '@/features/ops-config/components/FeatureFlagBoundary';

export default function PersonalIntelligenceRoute() {
  return (
    <FeatureFlagBoundary
      flag="personalIntelligenceEnabled"
      title="Personal insights temporarily unavailable"
      description="This analysis is paused. Your journal and decision history remain unchanged."
      testID="personal-intelligence-flag-disabled"
    >
      <PersonalIntelligenceScreen />
    </FeatureFlagBoundary>
  );
}
