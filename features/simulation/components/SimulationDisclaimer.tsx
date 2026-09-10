import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

export function SimulationDisclaimer() {
  return (
    <Surface tone="subtle" className="mb-4" testID="simulate-disclaimer">
      <Text variant="label" className="text-text-secondary">
        {BRAND.simulatedLabel} · {BRAND.educationalSimulationLabel} · {BRAND.paperSimulationLabel}
      </Text>
      <Text variant="caption" className="mt-2 text-text-secondary">
        This is simulated capital, not real money and not a brokerage account. Prices are synthetic sample
        data. A profitable fill is not automatically a good decision. Process quality is the point of
        practice. Nothing here is live execution.
      </Text>
    </Surface>
  );
}
