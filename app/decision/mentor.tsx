import { TradingMentorScreen } from '@/features/decision/screens/TradingMentorScreen';
import { FeatureFlagBoundary } from '@/features/ops-config/components/FeatureFlagBoundary';

export default function TradingMentorRoute() {
  return (
    <FeatureFlagBoundary
      flag="mentorEnabled"
      title="Mentor temporarily unavailable"
      description="Coaching is paused. Today, Research, Journal, and your saved profile still work."
      testID="mentor-flag-disabled"
    >
      <TradingMentorScreen />
    </FeatureFlagBoundary>
  );
}
