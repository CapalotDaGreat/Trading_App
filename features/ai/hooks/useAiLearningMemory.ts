import { useQuery } from '@tanstack/react-query';

import { buildAiLearningMemory } from '../services/ai-memory.service';

export function useAiLearningMemory() {
  return useQuery({
    queryKey: ['ai', 'learning-memory'] as const,
    queryFn: () => buildAiLearningMemory(),
    staleTime: 60_000,
  });
}
