import type { ChipProps } from '@/shared/components/ui/Chip';
import { Chip } from '@/shared/components/ui/Chip';

export interface FilterChipProps extends Omit<ChipProps, 'onPress' | 'selected'> {
  selected: boolean;
  onPress: () => void;
}

/** Named interactive filter control; use Tag for non-interactive metadata. */
export function FilterChip({ selected, tone, ...props }: FilterChipProps) {
  return <Chip selected={selected} tone={tone ?? (selected ? 'accent' : 'neutral')} {...props} />;
}
