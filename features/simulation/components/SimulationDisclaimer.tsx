import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

export function SimulationDisclaimer() {
  return (
    <Surface tone="subtle" className="mb-4" testID="simulate-disclaimer">
      <Text variant="h3" headingLevel={3} className="text-text-primary" accessibilityRole="header">
        This is a simulation
      </Text>
      <Text variant="label" className="mt-2 text-text-secondary">
        {BRAND.simulatedLabel} · {BRAND.educationalSimulationLabel} · {BRAND.paperSimulationLabel}
      </Text>
      <Text variant="caption" className="mt-2 text-text-secondary">
        Simulated capital (default USD 100,000) — not real money and not a brokerage account. Prices are
        labelled synthetic or sample data. Require thesis, invalidation, and reflection before treating a
        ticket as complete practice. A profitable fill is not automatically a good decision. Process
        quality is the point. Nothing here is live execution.
      </Text>
    </Surface>
  );
}
