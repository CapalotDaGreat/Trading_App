import { useQuery } from '@tanstack/react-query';

import { getAlertDeliveryCapability } from '../services/alert-capability.service';

export function useAlertDeliveryCapability() {
  return useQuery({
    queryKey: ['alerts', 'delivery-capability'],
    queryFn: getAlertDeliveryCapability,
    staleTime: 5 * 60_000,
  });
}
